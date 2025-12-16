// apps/web/src/libs/tetris-core.ts

export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export type Grid = (TetrominoType | null)[][];

export interface Position {
  x: number;
  y: number;
}

export interface Tetromino {
  type: TetrominoType;
  shape: number[][]; // 2D array representing shape (0 or 1)
  pos: Position;
  color: string;
}

export interface GameState {
  grid: Grid;
  activePiece: Tetromino | null;
  score: number;
  gameOver: boolean;
  level: number;
  lines: number;
}

export const COLS = 10;
export const ROWS = 20;

export const TETROMINOS: Record<TetrominoType, { shape: number[][]; color: string }> = {
  I: { shape: [[1, 1, 1, 1]], color: '#00f0f0' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: '#0000f0' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: '#f0a000' },
  O: { shape: [[1, 1], [1, 1]], color: '#f0f000' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: '#00f000' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: '#a000f0' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: '#f00000' },
};

export const createEmptyGrid = (): Grid => 
  Array.from({ length: ROWS }, () => Array(COLS).fill(null));

export const randomTetromino = (): Tetromino => {
  const types = Object.keys(TETROMINOS) as TetrominoType[];
  const type = types[Math.floor(Math.random() * types.length)];
  const { shape, color } = TETROMINOS[type];
  return {
    type,
    shape,
    color,
    pos: { x: Math.floor(COLS / 2) - Math.ceil(shape[0].length / 2), y: 0 },
  };
};

// --- CORE LOGIC ---

export const isValidMove = (grid: Grid, piece: Tetromino, moveX: number, moveY: number): boolean => {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const newX = piece.pos.x + x + moveX;
        const newY = piece.pos.y + y + moveY;
        
        if (newX < 0 || newX >= COLS || newY >= ROWS) return false;
        if (newY >= 0 && grid[newY][newX]) return false;
      }
    }
  }
  return true;
};

export const rotatePiece = (piece: Tetromino): Tetromino => {
  // CLOCKWISE: Transpose + Reverse rows
  const newShape = piece.shape[0].map((_, index) =>
    piece.shape.map(row => row[index]).reverse()
  );
  return { ...piece, shape: newShape };
};

export const rotatePieceCCW = (piece: Tetromino): Tetromino => {
  // COUNTER-CLOCKWISE: Reverse rows + Transpose
  const reversed = [...piece.shape].reverse(); // Reverse rows first
  const newShape = reversed[0].map((_, index) =>
    reversed.map(row => row[index])
  );
  return { ...piece, shape: newShape };
};

export const lockPiece = (state: GameState): GameState => {
    if (!state.activePiece) return state;
    
    // Copy grid
    const newGrid = state.grid.map(row => [...row]);
    
    // Stamp piece onto grid
    state.activePiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value && state.activePiece) {
                const py = state.activePiece.pos.y + y;
                const px = state.activePiece.pos.x + x;
                if (py >= 0) newGrid[py][px] = state.activePiece.type;
            }
        });
    });

    // Clear lines
    let linesCleared = 0;
    const clearedGrid = newGrid.filter(row => {
        const isFull = row.every(cell => cell !== null);
        if (isFull) linesCleared++;
        return !isFull;
    });

    // Add new empty rows at top
    while (clearedGrid.length < ROWS) {
        clearedGrid.unshift(Array(COLS).fill(null));
    }

    return {
        ...state,
        grid: clearedGrid,
        activePiece: randomTetromino(),
        score: state.score + (linesCleared * 100 * state.level),
        lines: state.lines + linesCleared,
        // Check game over (simple check: if new piece collides immediately)
        gameOver: !isValidMove(clearedGrid, randomTetromino(), 0, 0)
    };
};

export const tickMatrix = (state: GameState): GameState => {
    if (state.gameOver || !state.activePiece) return state;

    if (isValidMove(state.grid, state.activePiece, 0, 1)) {
        return {
            ...state,
            activePiece: {
                ...state.activePiece,
                pos: { ...state.activePiece.pos, y: state.activePiece.pos.y + 1 }
            }
        };
    } else {
        return lockPiece(state);
    }
};
