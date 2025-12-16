export default {
  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');
    
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    server.accept();

    // Get location info from Cloudflare
    const cf = (request as any).cf;
    const colo = cf?.colo || 'UNKNOWN';
    const country = cf?.country || 'UNKNOWN';

    server.send(JSON.stringify({
      type: 'welcome',
      message: 'Connected to Cloudflare Worker (no Durable Objects)',
      serverLocation: `${colo}, ${country}`
    }));

    server.addEventListener('message', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string);
        
        if (data.type === 'ping') {
          const receivedAt = Date.now();
          server.send(JSON.stringify({
            type: 'pong',
            timestamp: data.timestamp,
            serverReceivedAt: receivedAt,
            serverSentAt: Date.now()
          }));
        }
      } catch (e) {
        console.error('Error parsing message:', e);
      }
    });

    server.addEventListener('close', () => {
      console.log('WebSocket closed');
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  },
};
