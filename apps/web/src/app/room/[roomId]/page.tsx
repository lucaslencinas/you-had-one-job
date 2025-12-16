import { ClientRoom } from './client-room';

export const runtime = 'edge';

interface PageProps {
  params: Promise<{
    roomId: string; // Next.js 15 treats params as a Promise
  }>;
}

export default async function RoomPage({ params }: PageProps) {
  const { roomId } = await params;

  return <ClientRoom roomId={roomId} />;
}
