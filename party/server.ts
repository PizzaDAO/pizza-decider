import type * as Party from "partykit/server";

export default class Server implements Party.Server {
  count = 0;
  messages: any[] = [];

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(
      `Connected: id: ${conn.id}, room: ${this.room.id}, url: ${
        new URL(ctx.request.url).pathname
      }`
    );
    conn.send(JSON.stringify({ type: "count", count: this.count }));
    this.messages.forEach((message) =>
      conn.send(JSON.stringify({ type: "chat", message }))
    );
  }

  onMessage(message: string, sender: Party.Connection) {
    try {
      const data = JSON.parse(message);
      if (data.type === "increment") {
        this.increment();
      } else if (data.type === "chat") {
        this.messages.push(data.message);
        this.room.broadcast(
          JSON.stringify({ type: "chat", message: data.message }),
          []
        );
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  }

  onRequest(req: Party.Request) {
    if (req.method === "POST") {
      this.increment();
    }
    return new Response(
      JSON.stringify({ count: this.count, messages: this.messages })
    );
  }

  increment() {
    this.count = (this.count + 1) % 100;
    this.room.broadcast(
      JSON.stringify({ type: "count", count: this.count }),
      []
    );
  }
}

Server satisfies Party.Worker;
