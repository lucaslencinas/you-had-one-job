"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WORKER_WS_URL } from '../../../config';
import { generateUsername } from '../../../utils/username-generator';

interface ClientRoomProps {
  roomId: string;
}

interface Player {
  id: string;
  username: string;
  team?: 'A' | 'B';
  isReady: boolean;
}

export function ClientRoom({ roomId }: ClientRoomProps) {
  const [messages, setMessages] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [myId, setMyId] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  
  const router = useRouter();
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize username
  useEffect(() => {
    let stored = localStorage.getItem('tetris-username');
    if (!stored) {
        stored = generateUsername();
        localStorage.setItem('tetris-username', stored);
    }
    setUsername(stored);
  }, []);

  useEffect(() => {
    if (!username) return; // Wait for username

    // Connect to Game Room DO
    const ws = new WebSocket(`${WORKER_WS_URL}/game/${roomId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to Game Room');
      setIsConnected(true);
      setMessages(prev => [...prev, 'System: Connected to room ' + roomId]);
      
      // JOIN
      ws.send(JSON.stringify({
        type: 'join',
        payload: { username }
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'pong') {
            const latency = Date.now() - data.timestamp;
            setMessages(prev => [...prev, `Pong: ${latency}ms`]);
        } 
        else if (data.type === 'welcome') {
            setMessages(prev => [...prev, `System: Joined as ${data.id}`]);
            setMyId(data.id);
        }
        else if (data.type === 'state-update') {
            setPlayers(data.state.players);
        }
        else {
            // console.log('Received:', data);
        }
      } catch (e) {
        console.error("Parse error", e);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setMessages(prev => [...prev, 'System: Disconnected']);
    };

    return () => {
      ws.close();
    };
  }, [roomId, username, myId]);

  const leaveRoom = () => {
    router.push('/');
  };

  const ping = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
    }
  };

  const joinTeam = (team: 'A' | 'B') => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ 
            type: 'set-team', 
            payload: { team } 
        }));
    }
  }

  const teamAPlayers = Object.values(players).filter(p => p.team === 'A');
  const teamBPlayers = Object.values(players).filter(p => p.team === 'B');
  const noTeamPlayers = Object.values(players).filter(p => !p.team);

  return (
    <div className="container">
      <main className="main" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <div>
                <h1 style={{ fontSize: '2rem', margin: 0 }}>Room: <span style={{ color: '#66FCF1' }}>{roomId}</span></h1>
                <p style={{ opacity: 0.7, margin: '5px 0 0 0' }}>Playing as: <strong>{username}</strong></p>
            </div>
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

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
            <button onClick={leaveRoom} className="button" style={{ background: '#333' }}>
                ← Leave Room
            </button>
            <button onClick={ping} className="button" disabled={!isConnected} style={{ background: '#FFD700', color: '#000' }}>
                Ping Server
            </button>
        </div>

        {/* Teams Display */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px' }}>
            
            {/* Team A */}
            <div className="team-box" style={{ border: '1px solid #FF6B6B', padding: '20px', borderRadius: '12px', background: 'rgba(255, 107, 107, 0.05)' }}>
                <h2 style={{ color: '#FF6B6B', marginTop: 0 }}>Team A</h2>
                <button 
                    onClick={() => joinTeam('A')}
                    className="button" 
                    style={{ width: '100%', marginBottom: '15px', background: '#FF6B6B', color: '#fff', opacity: 0.8 }}
                >
                    Join Team A
                </button>
                <div className="player-list">
                    {teamAPlayers.map(p => (
                        <div key={p.id} style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            {p.username} {p.id === myId && '(You)'}
                        </div>
                    ))}
                    {teamAPlayers.length === 0 && <span style={{ opacity: 0.5 }}>No players yet</span>}
                </div>
            </div>

            {/* Undecided */}
            <div className="team-box" style={{ border: '1px solid #888', padding: '20px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)' }}>
                <h2 style={{ color: '#ccc', marginTop: 0 }}>Lobby</h2>
                <div className="player-list">
                    {noTeamPlayers.map(p => (
                        <div key={p.id} style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            {p.username} {p.id === myId && '(You)'}
                        </div>
                    ))}
                    {noTeamPlayers.length === 0 && <span style={{ opacity: 0.5 }}>Empty</span>}
                </div>
            </div>

            {/* Team B */}
            <div className="team-box" style={{ border: '1px solid #66FCF1', padding: '20px', borderRadius: '12px', background: 'rgba(102, 252, 241, 0.05)' }}>
                <h2 style={{ color: '#66FCF1', marginTop: 0 }}>Team B</h2>
                <button 
                    onClick={() => joinTeam('B')}
                    className="button" 
                    style={{ width: '100%', marginBottom: '15px', background: '#66FCF1', color: '#000', opacity: 0.8 }}
                >
                    Join Team B
                </button>
                <div className="player-list">
                    {teamBPlayers.map(p => (
                        <div key={p.id} style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            {p.username} {p.id === myId && '(You)'}
                        </div>
                    ))}
                    {teamBPlayers.length === 0 && <span style={{ opacity: 0.5 }}>No players yet</span>}
                </div>
            </div>

        </div>

        {/* Logs */}
        <div style={{ 
            background: 'rgba(0,0,0,0.5)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: '12px', 
            padding: '20px', 
            height: '200px', 
            overflowY: 'auto' 
        }}>
            <h4 style={{ margin: '0 0 10px 0', opacity: 0.7 }}>Debug Logs</h4>
            {messages.map((msg, i) => (
                <div key={i} style={{ marginBottom: '4px', fontFamily: 'monospace', fontSize: '0.8rem', opacity: 0.6 }}>
                    {msg}
                </div>
            ))}
        </div>
      </main>
    </div>
  );
}
