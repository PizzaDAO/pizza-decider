import type * as Party from "partykit/server";
import { json, notFound } from "./utils/response";

export const SINGLETON_ROOM_ID = "list";

export type RoomInfoUpdateRequest = {
  id: string;
  connections: number;
  action: "enter" | "leave" | "delete";
};

export type RoomInfo = {
  id: string;
  connections: number;
};

export default class ChatRoomsServer implements Party.Server {
  options: Party.ServerOptions = {
    hibernate: true,
  };

  constructor(public party: Party.Party) {}

  async onConnect(connection: Party.Connection) {
    connection.send(JSON.stringify(await this.getActiveRooms()));
  }

  async onRequest(req: Party.Request) {
    if (this.party.id !== SINGLETON_ROOM_ID) return notFound();

    if (req.method === "GET") return json(await this.getActiveRooms());

    if (req.method === "POST") {
      const roomList = await this.updateRoomInfo(req);
      this.party.broadcast(JSON.stringify(roomList));
      return json(roomList);
    }

    if (req.method === "DELETE") {
      await this.party.storage.deleteAll();
      return json({ message: "All room history cleared" });
    }

    return notFound();
  }

  async getActiveRooms(): Promise<RoomInfo[]> {
    const rooms = await this.party.storage.list<RoomInfo>();
    return Array.from(rooms.values());
  }

  async updateRoomInfo(req: Party.Request) {
    const update = (await req.json()) as RoomInfoUpdateRequest;

    if (update.action === "delete") {
      await this.party.storage.delete(update.id);
    } else {
      const info: RoomInfo = {
        id: update.id,
        connections: update.connections,
      };
      await this.party.storage.put(update.id, info);
    }

    return this.getActiveRooms();
  }
}
