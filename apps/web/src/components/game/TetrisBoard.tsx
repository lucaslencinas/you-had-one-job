"use client";

import { GameState, Grid, ROWS, COLS, TETROMINOS } from '../../libs/tetris-core';

interface TetrisBoardProps {
  state: GameState;
}

export function TetrisBoard({ state }: TetrisBoardProps) {
  // Merge active piece into grid for rendering (without modifying actual state)
  const renderGrid = state.grid.map(row => [...row]);
  
  if (state.activePiece) {
    state.activePiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value && state.activePiece) {
            const py = state.activePiece.pos.y + y;
            const px = state.activePiece.pos.x + x;
            if (py >= 0 && py < ROWS && px >= 0 && px < COLS) {
                renderGrid[py][px] = state.activePiece.type;
            }
        }
      });
    });
  }

  return (
    <div style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gap: '1px',
        background: 'rgba(0,0,0,0.5)',
        border: '2px solid rgba(255,255,255,0.1)',
        padding: '5px',
        width: '300px',
        height: '600px',
        boxShadow: '0 0 20px rgba(0,0,0,0.5)'
    }}>
      {renderGrid.flat().map((cell, i) => (
        <div 
          key={i} 
          style={{ 
            width: '100%', 
            height: '100%', 
            background: cell ? TETROMINOS[cell].color : 'rgba(255,255,255,0.05)',
            borderRadius: '2px',
            boxShadow: cell ? `inset 0 0 10px rgba(0,0,0,0.2)` : 'none',
            border: cell ? '1px solid rgba(255,255,255,0.2)' : 'none'
          }}
        />
      ))}
      
      {state.gameOver && (
        <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0,0,0,0.9)',
            padding: '20px',
            borderRadius: '10px',
            textAlign: 'center',
            border: '1px solid #ff4444'
        }}>
            <h2 style={{ color: '#ff4444' }}>GAME OVER</h2>
            <p>Score: {state.score}</p>
        </div>
      )}
    </div>
  );
}
