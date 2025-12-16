import { Redis } from '@upstash/redis/cloudflare';
import { DurableObject } from 'cloudflare:workers';
import { GameRoom } from './game-room';

export { GameRoom };

type Env = {
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  BENCHMARK_KV: KVNamespace;
  BENCHMARK_DB: D1Database;
  BENCHMARK_DO: DurableObjectNamespace;
  GAME_ROOM: DurableObjectNamespace;
};

// Durable Object for Benchmarking
export class BenchmarkDO extends DurableObject {
  async fetch(request: Request) {
    return new Response("pong");
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    };

    // --- 1. ROOM MANAGEMENT (D1) ---
    if (url.pathname === '/api/rooms/create') {
        const roomId = crypto.randomUUID().slice(0, 8);
        
        await env.BENCHMARK_DB.prepare(
            "INSERT INTO rooms (id, created_at, status, config) VALUES (?, ?, ?, ?)"
        ).bind(roomId, Date.now(), 'waiting', '{}').run();

        return new Response(JSON.stringify({ roomId }), { headers: corsHeaders });
    }

    if (url.pathname.startsWith('/api/rooms/')) {
        const id = url.pathname.split('/').pop();
        const room = await env.BENCHMARK_DB.prepare("SELECT * FROM rooms WHERE id = ?").bind(id).first();
        if (!room) return new Response('Room not found', { status: 404, headers: corsHeaders });
        return new Response(JSON.stringify(room), { headers: corsHeaders });
    }

    // --- 2. GAME PLAY (Durable Objects) ---
    // URL format: /game/:roomId
    if (url.pathname.startsWith('/game/')) {
        const upgradeHeader = request.headers.get('Upgrade');
        if (!upgradeHeader || upgradeHeader !== 'websocket') {
            return new Response('Expected WebSocket upgrade', { status: 426 });
        }

        const roomId = url.pathname.split('/').pop();
        if (!roomId) return new Response('Missing Room ID', { status: 400 });

        // Route to the specific Durable Object instance for this room
        const id = env.GAME_ROOM.idFromName(roomId);
        const stub = env.GAME_ROOM.get(id);

        return stub.fetch(request);
    }

    // --- 3. BENCHMARKS (Backwards Compatibility) ---
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader === 'websocket') {
        const webSocketPair = new WebSocketPair();
        const [client, server] = Object.values(webSocketPair);

        server.accept();

        const redis = new Redis({
            url: env.UPSTASH_REDIS_REST_URL,
            token: env.UPSTASH_REDIS_REST_TOKEN,
        });

        server.send(JSON.stringify({
            type: 'welcome',
            message: 'Connected to Worker (Redis + KV + D1 + DO)',
        }));

        server.addEventListener('message', async (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data as string);
                
                // ... (Existing Benchmark Logic) ...
                const start = Date.now();
                if (data.type === 'ping') {
                    server.send(JSON.stringify({
                        type: 'pong',
                        timestamp: data.timestamp,
                        serverReceivedAt: Date.now(),
                        serverSentAt: Date.now()
                    }));
                }
                if (data.type === 'ping-kv') {
                    const key = `ping:${data.timestamp}`;
                    await env.BENCHMARK_KV.put(key, 'pong');
                    await env.BENCHMARK_KV.get(key);
                    server.send(JSON.stringify({ type: 'pong-kv', timestamp: data.timestamp, serverProcessingTime: Date.now() - start }));
                }
                if (data.type === 'ping-d1') {
                    await env.BENCHMARK_DB.prepare("INSERT INTO pings (timestamp) VALUES (?)").bind(data.timestamp).run();
                    await env.BENCHMARK_DB.prepare("SELECT 1").first();
                    server.send(JSON.stringify({ type: 'pong-d1', timestamp: data.timestamp, serverProcessingTime: Date.now() - start }));
                }
                if (data.type === 'ping-do') {
                    const id = env.BENCHMARK_DO.idFromName('benchmark-shard-1');
                    const stub = env.BENCHMARK_DO.get(id);
                    await stub.fetch("http://do/ping");
                    server.send(JSON.stringify({ type: 'pong-do', timestamp: data.timestamp, serverProcessingTime: Date.now() - start }));
                }
                if (data.type === 'ping-redis') {
                    const key = `ping:${data.timestamp}`;
                    await redis.set(key, 'pong');
                    await redis.get(key);
                    server.send(JSON.stringify({ type: 'pong-redis', timestamp: data.timestamp, serverProcessingTime: Date.now() - start }));
                }

            } catch (e) { console.error(e); }
        });

        return new Response(null, { status: 101, webSocket: client });
    }

    return new Response("Not found", { status: 404 });
  },
};
