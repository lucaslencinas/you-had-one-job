export const runtime = 'edge';

export async function GET() {
  return Response.json({ 
    timestamp: Date.now(),
    message: 'pong'
  });
}
