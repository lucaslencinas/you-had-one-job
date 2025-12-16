import { Redis } from '@upstash/redis/cloudflare';
import { DurableObject } from 'cloudflare:workers';

type Env = {
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  BENCHMARK_KV: KVNamespace;
  BENCHMARK_DB: D1Database;
  BENCHMARK_DO: DurableObjectNamespace;
};

// Durable Object for Benchmarking
export class BenchmarkDO extends DurableObject {
  async fetch(request: Request) {
    return new Response("pong");
  }
}

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
      message: 'Connected to Worker (Redis + KV + D1 + DO)',
    }));

    server.addEventListener('message', async (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string);
        const start = Date.now();
        
        // 1. Standard Ping (Worker Only)
        if (data.type === 'ping') {
          server.send(JSON.stringify({
            type: 'pong',
            timestamp: data.timestamp,
            serverReceivedAt: Date.now(),
            serverSentAt: Date.now()
          }));
          return;
        }

        // 2. KV Benchmark
        if (data.type === 'ping-kv') {
          const key = `ping:${data.timestamp}`;
          // Write
          await env.BENCHMARK_KV.put(key, 'pong');
          // Read
          await env.BENCHMARK_KV.get(key);
          
          server.send(JSON.stringify({
            type: 'pong-kv',
            timestamp: data.timestamp,
            serverProcessingTime: Date.now() - start
          }));
        }

        // 3. D1 Benchmark
        if (data.type === 'ping-d1') {
          // Write
          await env.BENCHMARK_DB.prepare(
            "INSERT INTO pings (timestamp) VALUES (?)"
          ).bind(data.timestamp).run();
          
          // Read (simple select 1)
          await env.BENCHMARK_DB.prepare("SELECT 1").first();
          
          server.send(JSON.stringify({
            type: 'pong-d1',
            timestamp: data.timestamp,
            serverProcessingTime: Date.now() - start
          }));
        }

        // 4. Durable Object Benchmark
        if (data.type === 'ping-do') {
          // Generate a stable ID for testing (e.g., "benchmark-shard-1")
          const id = env.BENCHMARK_DO.idFromName('benchmark-shard-1');
          const stub = env.BENCHMARK_DO.get(id);
          
          await stub.fetch("http://do/ping");
          
          server.send(JSON.stringify({
            type: 'pong-do',
            timestamp: data.timestamp,
            serverProcessingTime: Date.now() - start
          }));
        }

        // 5. Upstash Redis Benchmark
        if (data.type === 'ping-redis') {
           const key = `ping:${data.timestamp}`;
           await redis.set(key, 'pong');
           await redis.get(key);
           
           server.send(JSON.stringify({
             type: 'pong-redis',
             timestamp: data.timestamp,
             serverProcessingTime: Date.now() - start
           }));
        }

      } catch (e) {
        console.error('Error parsing message:', e);
      }
    });

    server.addEventListener('close', () => {
      // Cleanup
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  },
};
