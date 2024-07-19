import React, { useState, useEffect } from "react";
import usePartySocket from "partysocket/react";

const pizzaToppings = [
  "pepperoni",
  "mushroom",
  "onion",
  "sausage",
  "bacon",
  "extra-cheese",
  "black-olives",
  "green-peppers",
  "pineapple",
  "spinach",
];

interface Message {
  id: string;
  user: string;
  text: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [userId] = useState(
    () =>
      `pizza-topping-${
        pizzaToppings[Math.floor(Math.random() * pizzaToppings.length)]
      }`
  );

  const socket = usePartySocket({
    room: "chat-room",
    onMessage(event) {
      const data = JSON.parse(event.data);
      if (data.type === "chat") {
        setMessages((prevMessages) => [...prevMessages, data.message]);
      }
    },
  });

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        user: userId,
        text: inputMessage.trim(),
      };
      socket.send(JSON.stringify({ type: "chat", message: newMessage }));
      setInputMessage("");
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <h2>Pizza Chat</h2>
      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "4px",
          height: "300px",
          overflowY: "auto",
          padding: "10px",
          marginBottom: "10px",
        }}
      >
        {messages.map((message) => (
          <div key={message.id} style={{ marginBottom: "10px" }}>
            <strong>{message.user}:</strong> {message.text}
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          style={{ width: "calc(100% - 80px)", padding: "5px" }}
          placeholder="Type your message..."
        />
        <button
          type="submit"
          style={{ width: "70px", marginLeft: "10px", padding: "5px" }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
