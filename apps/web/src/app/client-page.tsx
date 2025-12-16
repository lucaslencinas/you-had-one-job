"use client";

import Link from 'next/link';
import { CreateRoomButton } from "../components/lobby/CreateRoomButton";
import { JoinRoomForm } from "../components/lobby/JoinRoomForm";
import { useEffect, useState } from 'react';
import { generateUsername } from '../utils/username-generator';

interface ClientPageProps {
  vercelRegion: string;
}

export default function ClientPage({ vercelRegion }: ClientPageProps) {
  const [username, setUsername] = useState('');

  useEffect(() => {
    let stored = localStorage.getItem('tetris-username');
    if (!stored) {
        stored = generateUsername();
        localStorage.setItem('tetris-username', stored);
    }
    setUsername(stored);
  }, []);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setUsername(newVal);
    localStorage.setItem('tetris-username', newVal);
  };

  return (
    <div className="container">
      <main className="main" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h1 className="title" style={{ fontSize: '3.5rem', marginBottom: '10px' }}>You Had One Job</h1>
        <p style={{ marginBottom: '40px', opacity: 0.8, fontSize: '1.2rem' }}>
          The chaotic co-op Tetris experience.
        </p>
        
        <div style={{ padding: '40px 60px', background: 'rgba(255,255,255,0.05)', borderRadius: '24px', marginBottom: '50px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', width: '100%', maxWidth: '300px' }}>
                <label style={{ fontSize: '0.9rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px' }}>Your Nickname</label>
                <input 
                    type="text" 
                    value={username}
                    onChange={handleUsernameChange}
                    placeholder="Enter nickname..."
                    style={{
                        padding: '12px 20px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(0,0,0,0.3)',
                        color: '#fff',
                        fontSize: '1.1rem',
                        textAlign: 'center',
                        width: '100%'
                    }}
                />
            </div>

            <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0' }}></div>

            <CreateRoomButton />
            <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '10px 0' }}></div>
            <JoinRoomForm />
          </div>
        </div>

        <div style={{ marginTop: '50px', display: 'flex', gap: '20px', justifyContent: 'center' }}>
            <Link href="/tetris-solo" style={{ color: '#FFD700', textDecoration: 'none', borderBottom: '1px dotted #FFD700', fontSize: '1rem' }}>
                Practice Solo Mode
            </Link>
            <span style={{ opacity: 0.3 }}>|</span>
            <Link href="/benchmark" style={{ color: '#66FCF1', textDecoration: 'none', borderBottom: '1px dotted #66FCF1', fontSize: '1rem' }}>
                View Performance Lab
            </Link>
        </div>
        
        <div style={{ marginTop: '20px', opacity: 0.5, fontSize: '0.8rem' }}>
            <p>Server Region: {vercelRegion}</p>
        </div>
      </main>
    </div>
  );
}
