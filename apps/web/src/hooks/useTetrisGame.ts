import { useState, useEffect, useCallback } from 'react';
import { 
  GameState, createEmptyGrid, randomTetromino, 
  tickMatrix, isValidMove, rotatePiece, rotatePieceCCW,
  lockPiece, Tetromino 
} from '../libs/tetris-core';

export const useTetrisGame = () => {
  const [gameState, setGameState] = useState<GameState>({
    grid: createEmptyGrid(),
    activePiece: randomTetromino(),
    score: 0,
    gameOver: false,
    level: 1,
    lines: 0
  });

  // GAME LOOP
  useEffect(() => {
    if (gameState.gameOver) return;

    const interval = setInterval(() => {
        setGameState(prev => tickMatrix(prev));
    }, 1000 / gameState.level); 

    return () => clearInterval(interval);
  }, [gameState.gameOver, gameState.level]);

  // CONTROLS
  const move = useCallback((dir: -1 | 1) => {
    setGameState(prev => {
        if (!prev.activePiece || prev.gameOver) return prev;
        if (isValidMove(prev.grid, prev.activePiece, dir, 0)) {
            return {
                ...prev,
                activePiece: { ...prev.activePiece, pos: { ...prev.activePiece.pos, x: prev.activePiece.pos.x + dir } }
            };
        }
        return prev;
    });
  }, []);

  const rotate = useCallback((dir: 'CW' | 'CCW') => {
    setGameState(prev => {
        if (!prev.activePiece || prev.gameOver) return prev;
        const newPiece = dir === 'CW' ? rotatePiece(prev.activePiece) : rotatePieceCCW(prev.activePiece);
        
        // Simple wall kick: try standard, then -1 x, then +1 x
        if (isValidMove(prev.grid, newPiece, 0, 0)) {
            return { ...prev, activePiece: newPiece };
        }
        // Basic wall kicks
        if (isValidMove(prev.grid, newPiece, -1, 0)) { // Kick right
             return { ...prev, activePiece: { ...newPiece, pos: { ...newPiece.pos, x: newPiece.pos.x - 1 } } };
        }
         if (isValidMove(prev.grid, newPiece, 1, 0)) { // Kick left
             return { ...prev, activePiece: { ...newPiece, pos: { ...newPiece.pos, x: newPiece.pos.x + 1 } } };
        }
        return prev;
    });
  }, []);

  const drop = useCallback(() => {
    setGameState(prev => {
         if (!prev.activePiece || prev.gameOver) return prev;
         return tickMatrix(prev); // Just force a tick
    });
  }, []);

  const hardDrop = useCallback(() => {
     setGameState(prev => {
        if (!prev.activePiece || prev.gameOver) return prev;
        let p = { ...prev.activePiece };
        while (isValidMove(prev.grid, p, 0, 1)) {
            p.pos.y += 1;
        }
        return tickMatrix({ ...prev, activePiece: p }); // Lock immediately
     });
  }, []);

  // Keyboard binding
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (gameState.gameOver) return;
        
        switch(e.key) {
            case 'ArrowLeft': move(-1); break;
            case 'ArrowRight': move(1); break;
            case 'ArrowUp': rotate('CW'); break;
            case 'ArrowDown': drop(); break;
            case ' ': hardDrop(); break;
            case 'z': case 'Z': rotate('CCW'); break;
            case 'c': case 'C': rotate('CW'); break;
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move, rotate, drop, hardDrop, gameState.gameOver]);

  return { gameState, reset: () => setGameState({ grid: createEmptyGrid(), activePiece: randomTetromino(), score: 0, gameOver: false, level: 1, lines: 0 }) };
};
