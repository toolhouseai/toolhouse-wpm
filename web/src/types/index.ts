/**
 * Shared types between frontend and backend
 */

export type GameState = 'waiting' | 'active' | 'completed';

export interface Player {
  id: string;
  joinedAt: number;
  charsTyped: number;
  correctChars: number;
  completed: boolean;
}

export interface GameResult {
  playerId: string;
  wpm: number;
  accuracy: number;
  charsTyped: number;
  placement: number;
}

export interface Passage {
  id: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  wordCount: number;
}

export interface WebSocketMessage {
  type: 'player_joined' | 'game_start' | 'typing_update' | 'player_left' | 'game_ended' | 'player_list_updated' | 'leaderboard';
  payload: Record<string, unknown>;
}
