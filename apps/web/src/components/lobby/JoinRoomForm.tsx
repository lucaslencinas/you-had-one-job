"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function JoinRoomForm() {
  const [roomId, setRoomId] = useState('');
  const router = useRouter();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      router.push(`/room/${roomId.trim()}`);
    }
  };

  return (
    <form onSubmit={handleJoin} style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'center' }}>
      <input
        type="text"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        placeholder="Enter Room Code"
        style={{
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.2)',
          background: 'rgba(0,0,0,0.3)',
          color: '#fff',
          fontSize: '1rem'
        }}
      />
      <button 
        type="submit"
        className="button"
        style={{ background: '#66FCF1', color: '#000' }}
        disabled={!roomId.trim()}
      >
        Join Game
      </button>
    </form>
  );
}
