"use client";

import React, { useState, useEffect, useRef } from "react";
import usePartySocket from "partysocket/react";

type Message = {
  id: string;
  username: string;
  text: string;
  timestamp: number;
};

type RoomInfo = {
  id: string;
  name: string;
  createdAt: number;
  lastActivityAt: number;
};

export default function ChatRoom({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [username, setUsername] = useState("");
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const socket = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST!,
    room: roomId,
    onMessage(event) {
      const data = JSON.parse(event.data);
      if (data.type === "roomInfo") {
        setRoomInfo(data.data);
      } else if (data.type === "messages") {
        setMessages(data.data);
      } else if (data.type === "newMessage") {
        setMessages((prev) => [...prev, data.data]);
      }
    },
  });

  useEffect(() => {
    const fetchRoomInfo = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_PARTYKIT_HOST}/parties/room/${roomId}`
        );
        if (response.ok) {
          const data = await response.json();
          setRoomInfo(data.roomInfo);
          setMessages(data.messages);
        } else {
          console.error("Failed to fetch room info");
        }
      } catch (error) {
        console.error("Error fetching room info:", error);
      }
    };

    if (!roomInfo) {
      fetchRoomInfo();
    }
  }, [roomId, roomInfo]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && username.trim()) {
      socket.send(
        JSON.stringify({
          type: "chat",
          data: { username, text: inputMessage.trim() },
        })
      );
      setInputMessage("");
    }
  };

  if (!roomInfo) return <div>Loading...</div>;

  return (
    <div>
      <h1>{roomInfo.name}</h1>
      <div
        style={{
          height: "400px",
          overflowY: "scroll",
          border: "1px solid #ccc",
          padding: "10px",
        }}
      >
        {messages.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.username}:</strong> {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Your name"
          required
        />
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message"
          required
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
