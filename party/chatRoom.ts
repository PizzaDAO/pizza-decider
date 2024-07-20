import type * as Party from "partykit/server";
import { nanoid } from "nanoid";
import { SINGLETON_ROOM_ID } from "./chatRooms";
import type { Message, UserMessage } from "./utils/message";
import { newMessage, editMessage, syncMessage } from "./utils/message";
import { json, notFound, ok } from "./utils/response";

const DELETE_MESSAGES_AFTER_INACTIVITY_PERIOD = 1000 * 60 * 60 * 24; // 24 hours

export default class ChatRoomServer implements Party.Server {
  messages: Message[] = [];

  constructor(public party: Party.Party) {}

  async onStart() {
    this.messages = (await this.party.storage.get<Message[]>("messages")) || [];
  }

  async onRequest(request: Party.Request) {
    if (request.method === "POST") {
      await this.party.storage.put("id", this.party.id);
      return ok();
    }

    if (request.method === "GET") {
      if (await this.party.storage.get("id")) {
        return json({ type: "sync", messages: this.messages });
      }
      return notFound();
    }

    if (request.method === "DELETE") {
      await this.party.storage.delete("messages");
      this.messages = [];
      this.party.broadcast(JSON.stringify({ type: "clear" }));
      return ok();
    }

    if (request.method === "OPTIONS") {
      return ok();
    }

    return notFound();
  }

  async onConnect(connection: Party.Connection) {
    connection.send(syncMessage(this.messages));
    this.updateRoomList("enter");
  }

  async onMessage(messageString: string, connection: Party.Connection) {
    const message = JSON.parse(messageString) as UserMessage;
    if (message.type === "new" || message.type === "edit") {
      if (message.text.length > 1000) {
        return connection.send(
          JSON.stringify({ type: "error", text: "Message too long" })
        );
      }

      const payload: Message = {
        id: message.id ?? nanoid(),
        from: { id: connection.id },
        text: message.text,
        at: Date.now(),
      };

      if (message.type === "new") {
        this.party.broadcast(newMessage(payload));
        this.messages.push(payload);
      } else if (message.type === "edit") {
        this.party.broadcast(editMessage(payload));
        this.messages = this.messages.map((m) =>
          m.id === message.id ? payload : m
        );
      }

      await this.party.storage.put("messages", this.messages);
      await this.party.storage.deleteAlarm();
      await this.party.storage.setAlarm(
        Date.now() + DELETE_MESSAGES_AFTER_INACTIVITY_PERIOD
      );
    }
  }

  async onClose(connection: Party.Connection) {
    this.updateRoomList("leave");
  }

  async updateRoomList(action: "enter" | "leave") {
    return this.party.context.parties.chatrooms.get(SINGLETON_ROOM_ID).fetch({
      method: "POST",
      body: JSON.stringify({
        id: this.party.id,
        connections: Array.from(this.party.getConnections()).length,
        action,
      }),
    });
  }
}
