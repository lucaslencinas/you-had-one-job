"use client";

import Link from 'next/link';
import { CreateRoomButton } from "../components/lobby/CreateRoomButton";
import { JoinRoomForm } from "../components/lobby/JoinRoomForm";

interface ClientPageProps {
  vercelRegion: string;
}

export default function ClientPage({ vercelRegion }: ClientPageProps) {
  return (
    <div className="container">
      <main className="main" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h1 className="title" style={{ fontSize: '3.5rem', marginBottom: '10px' }}>You Had One Job</h1>
        <p style={{ marginBottom: '40px', opacity: 0.8, fontSize: '1.2rem' }}>
          The chaotic co-op Tetris experience.
        </p>
        
        <div style={{ padding: '60px', background: 'rgba(255,255,255,0.05)', borderRadius: '24px', marginBottom: '50px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}>
            <CreateRoomButton />
            <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '10px 0' }}></div>
            <JoinRoomForm />
          </div>
        </div>

        <div style={{ marginTop: '50px', opacity: 0.5 }}>
            <Link href="/benchmark" style={{ color: '#66FCF1', textDecoration: 'none', borderBottom: '1px dotted #66FCF1', fontSize: '0.9rem' }}>
                View Performance Benchmarks
            </Link>
            <p style={{ marginTop: '10px', fontSize: '0.8rem' }}>
                Server Region: {vercelRegion}
            </p>
        </div>
      </main>
    </div>
  );
}
