"use client";

import { useTetrisGame } from '../../hooks/useTetrisGame';
import { TetrisBoard } from '../../components/game/TetrisBoard';
import Link from 'next/link';

export function ClientTetris() {
  const { gameState, reset } = useTetrisGame();

  return (
    <div className="container">
      <main className="main" style={{ flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '300px', marginBottom: '20px' }}>
            <Link href="/" className="button" style={{ padding: '5px 10px', fontSize: '0.8rem', background: '#333' }}>
                ← Exit
            </Link>
            <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Solo Mode</h1>
        </div>

        <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
            <TetrisBoard state={gameState} />
            
            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', minWidth: '200px' }}>
                <h3 style={{ marginBottom: '15px', borderBottom: '1px solid #66FCF1', paddingBottom: '5px' }}>Stats</h3>
                <p>Score: <span style={{ color: '#FFD700', fontWeight: 'bold' }}>{gameState.score}</span></p>
                <p>Lines: {gameState.lines}</p>
                <p>Level: {gameState.level}</p>

                <div style={{ marginTop: '30px' }}>
                    <h3 style={{ marginBottom: '10px' }}>Controls</h3>
                    <ul style={{ fontSize: '0.8rem', paddingLeft: '20px', opacity: 0.8, lineHeight: '1.6' }}>
                        <li>← / → : Move</li>
                        <li>↑ / C : Rotate CW</li>
                        <li>Z : Rotate CCW</li>
                        <li>↓ : Soft Drop</li>
                        <li>Space : Hard Drop</li>
                    </ul>
                </div>

                <button 
                    onClick={reset}
                    className="button"
                    style={{ marginTop: '30px', width: '100%', background: '#F44336', color: '#fff' }}
                >
                    Reset Game
                </button>
            </div>
        </div>
      </main>
    </div>
  );
}
