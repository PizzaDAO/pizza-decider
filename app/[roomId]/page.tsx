import Link from "next/link";
import { Room } from "@/app/components/room";

import { PARTYKIT_HOST, PARTYKIT_URL } from "@/app/env";
import ClearRoomButton from "@/app/components/clear-room-button";

const party = "chatroom";

export const revalidate = 0;

export default async function ChatRoomPage({
  params,
}: {
  params: { roomId: string };
}) {
  // fetch initial data for server rendering
  const url = `${PARTYKIT_URL}/parties/${party}/${params.roomId}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  const room = res.status === 404 ? null : await res.json();

  return (
    <div className="w-full flex flex-col gap-4 justify-between items-start">
      <div className="flex flex-wrap justify-start items-center gap-x-4 gap-y-2">
        <Link href="/" className="text-stone-400 whitespace-nowrap">
          &lt;- All Rooms
        </Link>
        <ClearRoomButton roomId={params.roomId} />
      </div>
      {room ? (
        <>
          <div className="w-full flex flex-row justify-between items-start pb-6">
            <div>
              <h1 className="text-4xl font-medium">{params.roomId}</h1>
            </div>
          </div>

          <Room
            host={PARTYKIT_HOST}
            party={party}
            room={params.roomId}
            messages={room.messages ?? []}
          />
        </>
      ) : (
        <h1 className="text-4xl font-medium">Room not found</h1>
      )}
    </div>
  );
}
