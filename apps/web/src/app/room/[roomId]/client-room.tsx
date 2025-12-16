"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WORKER_WS_URL } from '../../../config';

interface ClientRoomProps {
  roomId: string;
}

export function ClientRoom({ roomId }: ClientRoomProps) {
  const [messages, setMessages] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const router = useRouter();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to Game Room DO
    const ws = new WebSocket(`${WORKER_WS_URL}/game/${roomId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to Game Room');
      setIsConnected(true);
      setMessages(prev => [...prev, 'System: Connected to room ' + roomId]);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received:', data);
        
        if (data.type === 'pong') {
            const latency = Date.now() - data.timestamp;
            setMessages(prev => [...prev, `Pong: ${latency}ms`]);
        } else {
            setMessages(prev => [...prev, `Received: ${JSON.stringify(data)}`]);
        }
      } catch (e) {
        setMessages(prev => [...prev, `Received: ${event.data}`]);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setMessages(prev => [...prev, 'System: Disconnected']);
    };

    return () => {
      ws.close();
    };
  }, [roomId]);

  const leaveRoom = () => {
    router.push('/');
  };

  const ping = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
    }
  };

  return (
    <div className="container">
      <main className="main" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '2rem' }}>Room: <span style={{ color: '#66FCF1' }}>{roomId}</span></h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    background: isConnected ? '#4CAF50' : '#F44336',
                    boxShadow: isConnected ? '0 0 10px #4CAF50' : 'none'
                }}></div>
                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
            <button onClick={leaveRoom} className="button" style={{ background: '#333' }}>
                ← Leave Room
            </button>
            <button onClick={ping} className="button" disabled={!isConnected} style={{ background: '#FFD700', color: '#000' }}>
                Ping Server
            </button>
        </div>

        <div style={{ 
            background: 'rgba(0,0,0,0.5)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: '12px', 
            padding: '20px', 
            height: '400px', 
            overflowY: 'auto' 
        }}>
            {messages.map((msg, i) => (
                <div key={i} style={{ marginBottom: '8px', fontFamily: 'monospace', fontSize: '0.9rem', opacity: 0.8, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                    {msg}
                </div>
            ))}
        </div>
      </main>
    </div>
  );
}
