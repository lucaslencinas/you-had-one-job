"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WORKER_URL } from '../../config';

export function CreateRoomButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const createRoom = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${WORKER_URL}/api/rooms/create`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.roomId) {
        router.push(`/room/${data.roomId}`);
      }
    } catch (e) {
      console.error("Failed to create room", e);
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={createRoom}
      disabled={isLoading}
      className="button"
      style={{
        background: '#4CAF50',
        color: '#fff',
        fontSize: '1.2rem',
        padding: '15px 30px',
        width: '100%',
        maxWidth: '300px'
      }}
    >
      {isLoading ? 'Creating Room...' : 'Create New Game'}
    </button>
  );
}
