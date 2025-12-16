import { DurableObject } from 'cloudflare:workers';
import { GameState, GameAction, PlayerState } from './interfaces';

export class GameRoom extends DurableObject {
  private state: GameState;
  private sessions: Map<WebSocket, string> = new Map(); // ws -> playerId

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
    ws.accept();

    ws.addEventListener('message', async (event) => {
      try {
        const data = JSON.parse(event.data as string);
        
        if (data.type === 'ping') {
            ws.send(JSON.stringify({
                type: 'pong',
                timestamp: data.timestamp,
                serverReceivedAt: Date.now(),
                serverSentAt: Date.now()
            }));
            return;
        }

        // Handle Connect/Join
        if (data.type === 'join') {
            const playerId = data.payload?.id || crypto.randomUUID();
            const username = data.payload?.username || `Player ${playerId.substr(0, 4)}`;
            
            this.sessions.set(ws, playerId);
            
            this.state.players[playerId] = {
                id: playerId,
                username,
                isReady: false,
                x: 0, 
                y: 0 
            };
            
            this.broadcastState();
            return;
        }

        // Game Actions
        const playerId = this.sessions.get(ws);
        if (playerId) {
            this.handleAction(playerId, data);
        }

      } catch (e) {
        console.error(e);
      }
    });

    ws.addEventListener('close', () => {
      const playerId = this.sessions.get(ws);
      if (playerId) {
          delete this.state.players[playerId];
          this.sessions.delete(ws);
          this.broadcastState();
      }
    });
  }

  private handleAction(playerId: string, action: any) {
    const player = this.state.players[playerId];
    if (!player) return;

    switch (action.type) {
        case 'set-team':
            player.team = action.payload.team; // 'A' or 'B'
            this.broadcastState();
            break;
            
        case 'move':
            if (this.state.status === 'playing') {
                player.x += action.payload.dx;
                player.y += action.payload.dy;
                this.broadcastState();
            }
            break;
    }
  }

  private broadcastState() {
    const msg = JSON.stringify({
        type: 'state-update',
        state: this.state
    });
    
    for (const ws of this.sessions.keys()) {
        try {
            ws.send(msg);
        } catch (e) {
            this.sessions.delete(ws);
        }
    }
  }
}
