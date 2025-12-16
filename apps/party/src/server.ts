import type * as Party from "partykit/server";

export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(
      `Connected:
  id: ${conn.id}
  room: ${this.room.id}
  url: ${new URL(ctx.request.url).pathname}`
    );

    const location = ctx.request.cf?.colo || 'UNKNOWN';
    const country = ctx.request.cf?.country || 'UNKNOWN';
    
    // Send a welcome message with location info
    conn.send(JSON.stringify({ 
      type: "welcome", 
      message: "Welcome to the party!",
      serverLocation: `${location}, ${country}`
    }));
  }

  onMessage(message: string, sender: Party.Connection) {
    const data = JSON.parse(message);

    if (data.type === "ping") {
      const receivedAt = Date.now();
      sender.send(JSON.stringify({ 
        type: "pong", 
        timestamp: data.timestamp,
        serverReceivedAt: receivedAt,
        serverSentAt: Date.now()
      }));
      return;
    }

    // Broadcast the message to everyone else in the room
    this.room.broadcast(message, [sender.id]);
  }
}

Server satisfies Party.Worker;
