/**
 * Game state types for multiplayer typing game
 */

export type GameState = 'waiting' | 'active' | 'completed';

export interface Player {
  id: string;
  joinedAt: number;
  charsTyped: number;
  correctChars: number;
  completed: boolean;
}

export interface GameRoom {
  roomId: string;
  passageId: string;
  leaderId: string;
  players: Map<string, Player>;
  status: GameState;
  startTime: number | null;
  duration: number; // in milliseconds
}

export interface GameResult {
  playerId: string;
  wpm: number;
  accuracy: number;
  charsTyped: number;
  placement: number;
}

export interface WebSocketMessage {
  type: 'player_joined' | 'game_start' | 'typing_update' | 'player_left' | 'game_ended';
  payload: Record<string, unknown>;
}
