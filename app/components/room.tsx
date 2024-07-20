"use client";
import { FormEventHandler, useState } from "react";
import usePartySocket from "partysocket/react";

import type { Message, ChatMessage } from "@/party/utils/message";

import RoomMessage from "./room-message";
import ConnectionStatus from "./connection-status";

export const Room: React.FC<{
  room: string;
  host: string;

  party: string;
  messages: Message[];
}> = ({ room, host, party, messages: initialMessages }) => {
  // render with initial data, update from websocket as messages arrive
  const [messages, setMessages] = useState(initialMessages);

  const socket = usePartySocket({
    host,
    party,
    room,

    onMessage(event: MessageEvent<string>) {
      const message = JSON.parse(event.data) as ChatMessage;
      // upon connection, the server will send all messages in the room
      if (message.type === "sync") setMessages(message.messages);
      // after that, the server will send updates as they arrive
      if (message.type === "new") setMessages((prev) => [...prev, message]);
      if (message.type === "clear") setMessages([]);
      if (message.type === "edit") {
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? message : m))
        );
      }
      scrollToBottom();
    },
  });

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const text = event.currentTarget.message.value;
    if (text?.trim()) {
      socket.send(JSON.stringify({ type: "new", text }));
      event.currentTarget.message.value = "";
      scrollToBottom();
    }
  };

  function scrollToBottom() {
    window.scrollTo({
      top: document.body.scrollHeight,
      left: 0,
      behavior: "smooth",
    });
  }

  return (
    <>
      <div className="h-full w-full flex flex-col gap-6">
        {messages.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {messages.map((message) => (
              <RoomMessage key={message.id} message={message} isMe={false} />
            ))}
          </ul>
        ) : (
          <p className="italic">No messages yet</p>
        )}
        <form onSubmit={handleSubmit} className="sticky bottom-4 sm:bottom-6">
          <input
            placeholder="Send message..."
            className="border border-stone-400 p-3 bg-stone-100 min-w-full rounded"
            type="text"
            name="message"
          ></input>
        </form>
      </div>
      <ConnectionStatus socket={socket} />
    </>
  );
};
