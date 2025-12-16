import { DurableObject } from 'cloudflare:workers';
import { GameState, GameAction } from './interfaces';

export class GameRoom extends DurableObject {
  private state: GameState;
  private sessions: WebSocket[] = [];

  constructor(ctx: any, env: any) {
    super(ctx, env);
    this.state = {
      players: {},
      status: 'waiting',
      score: 0
    };
  }

  async fetch(request: Request) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response("Expected WebSocket", { status: 426 });
    }

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    // Accept the socket
    this.handleSession(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  private handleSession(ws: WebSocket) {
    this.sessions.push(ws);
    ws.accept();

    ws.addEventListener('message', async (event) => {
      try {
        const data = JSON.parse(event.data as string);
        
        // PING Handler (for latency testing this specific game architecture)
        if (data.type === 'ping') {
            ws.send(JSON.stringify({
                type: 'pong',
                timestamp: data.timestamp,
                serverReceivedAt: Date.now(),
                serverSentAt: Date.now()
            }));
            return;
        }

        // Game Actions
        if (data.type) {
            this.handleAction(ws, data);
        }

      } catch (e) {
        console.error(e);
      }
    });

    ws.addEventListener('close', () => {
      this.sessions = this.sessions.filter(s => s !== ws);
    });
  }

  private handleAction(sender: WebSocket, action: any) {
    // This is where your GAME LOGIC goes
    // Since it's a Durable Object, this is single-threaded and safe!
    
    if (action.type === 'move') {
        const playerId = action.payload.playerId;
        if (this.state.players[playerId]) {
            // Update state
            this.state.players[playerId].x += action.payload.dx;
            this.state.players[playerId].y += action.payload.dy;
        }
        
        // Broadcast new state
        this.broadcast({
            type: 'state-update',
            state: this.state
        });
    }
  }

  private broadcast(message: any) {
    const msg = JSON.stringify(message);
    this.sessions.forEach(ws => {
        try {
            ws.send(msg);
        } catch (e) {
            // socket likely dead
        }
    });
  }
}
