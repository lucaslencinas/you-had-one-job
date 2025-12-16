import { Redis } from '@upstash/redis/cloudflare';

type Env = {
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');
    
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    server.accept();

    const redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });

    server.send(JSON.stringify({
      type: 'welcome',
      message: 'Connected to Worker + Redis Game Server'
    }));

    server.addEventListener('message', async (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string);
        
        // PING (Latency Test)
        if (data.type === 'ping') {
          server.send(JSON.stringify({
            type: 'pong',
            timestamp: data.timestamp,
            serverReceivedAt: Date.now(),
            serverSentAt: Date.now()
          }));
          return;
        }

        // JOIN ROOM
        if (data.type === 'join-room' && data.roomId && data.playerId) {
          const roomKey = `room:${data.roomId}`;
          
          // Add player to room set
          await redis.sadd(`${roomKey}:players`, data.playerId);
          await redis.expire(`${roomKey}:players`, 3600); // 1 hour TTL

          // Get current players
          const players = await redis.smembers(`${roomKey}:players`);
          
          // Broadcast to THIS client (in a real app, we'd broadcast to all via PubSub)
          server.send(JSON.stringify({
            type: 'room-state',
            roomId: data.roomId,
            players: players
          }));
        }

        // GAME ACTION (Example)
        if (data.type === 'action' && data.roomId) {
          // Process game logic here...
          // For now just echo back confirmed
          server.send(JSON.stringify({
            type: 'action-confirmed',
            action: data.action,
            timestamp: Date.now()
          }));
        }

      } catch (e) {
        console.error('Error parsing message:', e);
      }
    });

    server.addEventListener('close', () => {
      // Cleanup logic could go here
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  },
};
