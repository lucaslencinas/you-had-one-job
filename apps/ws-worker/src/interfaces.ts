export interface GameState {
  players: Record<string, PlayerState>;
  status: 'waiting' | 'playing' | 'ended';
  score: number;
}

export interface PlayerState {
  id: string;
  username: string;
  team?: 'A' | 'B';
  isReady: boolean;
  x: number;
  y: number;
}

export interface GameAction {
  type: 'move' | 'command' | 'start' | 'join';
  payload: any;
  timestamp: number;
}

// Abstraction for Game State Management
export interface IGameBackend {
  connect(request: Request): Promise<Response>;
  handleAction(action: GameAction): Promise<void>;
}
