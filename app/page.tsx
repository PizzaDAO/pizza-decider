import { generateSlug, RandomWordOptions } from "random-word-slugs";
import { RoomInfo, SINGLETON_ROOM_ID } from "@/party/chatRooms";
import { RoomList } from "./components/room-list";
import { PARTYKIT_URL } from "@/app/env";

import NewRoom from "./components/new-room";

const randomWords: RandomWordOptions<3> = {
  format: "kebab",
  categories: { noun: ["food"], adjective: ["taste"] },
  partsOfSpeech: ["adjective", "adjective", "noun"],
};

const partyUrl = `${PARTYKIT_URL}/parties/chatrooms/${SINGLETON_ROOM_ID}`;

export const revalidate = 0;

export default async function RoomListPage() {
  // fetch rooms for server rendering with a GET request to the server
  const res = await fetch(partyUrl, { next: { revalidate: 0 } });
  const rooms = ((await res.json()) ?? []) as RoomInfo[];

  return (
    <div className="w-full flex flex-col gap-6">
      <h1 className="text-4xl font-medium">Chat Rooms</h1>
      <RoomList initialRooms={rooms} />
      <NewRoom slug={generateSlug(3, randomWords)} />
    </div>
  );
}
