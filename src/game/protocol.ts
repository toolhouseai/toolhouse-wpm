/**
 * WebSocket event protocol definitions
 * Standardized message format for client-server real-time communication
 */

/**
 * All possible WebSocket message types
 */
export type WebSocketMessageType =
  | 'connection_established'
  | 'player_joined'
  | 'game_start'
  | 'typing_update'
  | 'player_list_updated'
  | 'player_update'
  | 'timer_tick'
  | 'game_started'
  | 'game_ended'
  | 'leaderboard'
  | 'player_left'
  | 'error'
  | 'reconnect';

/**
 * Base message structure
 */
export interface BaseMessage {
  type: WebSocketMessageType;
  payload: Record<string, unknown>;
  timestamp?: number;
}

/**
 * Connection established message (Server → Client)
 */
export interface ConnectionEstablishedMessage extends BaseMessage {
  type: 'connection_established';
  payload: {
    playerId: string;
  };
}

/**
 * Player joined message (Client → Server)
 */
export interface PlayerJoinedMessage extends BaseMessage {
  type: 'player_joined';
  payload: {
    playerId: string;
  };
}

/**
 * Game start message (Client → Server)
 */
export interface GameStartMessage extends BaseMessage {
  type: 'game_start';
  payload: Record<string, unknown>;
}

/**
 * Typing update message (Client → Server)
 */
export interface TypingUpdateMessage extends BaseMessage {
  type: 'typing_update';
  payload: {
    playerId: string;
    charsTyped: number;
    correctChars: number;
  };
}

/**
 * Player list updated message (Server → Client)
 */
export interface PlayerListUpdatedMessage extends BaseMessage {
  type: 'player_list_updated';
  payload: {
    players: Array<{ id: string; joinedAt: number }>;
    leader: string;
    count: number;
    maxPlayers: number;
  };
}

/**
 * Player update message (Server → Client)
 */
export interface PlayerUpdateMessage extends BaseMessage {
  type: 'player_update';
  payload: {
    playerId: string;
    charsTyped: number;
    correctChars: number;
  };
}

/**
 * Timer tick message (Server → Client)
 */
export interface TimerTickMessage extends BaseMessage {
  type: 'timer_tick';
  payload: {
    remainingSeconds: number;
  };
}

/**
 * Game started message (Server → Client)
 */
export interface GameStartedMessage extends BaseMessage {
  type: 'game_started';
  payload: {
    duration: number;
    startTime: number;
  };
}

/**
 * Game ended message (Server → Client)
 */
export interface GameEndedMessage extends BaseMessage {
  type: 'game_ended';
  payload: {
    results: Array<{
      playerId: string;
      wpm: number;
      accuracy: number;
      charsTyped: number;
      placement: number;
    }>;
  };
}

/**
 * Error message (Server → Client)
 */
export interface ErrorMessage extends BaseMessage {
  type: 'error';
  payload: {
    message: string;
    code?: string;
  };
}

/**
 * Reconnect message (Server → Client)
 */
export interface ReconnectMessage extends BaseMessage {
  type: 'reconnect';
  payload: {
    message: string;
  };
}

/**
 * Type guard for checking message type
 */
export function isMessageType<T extends BaseMessage>(
  message: BaseMessage,
  type: T['type']
): message is T {
  return message.type === type;
}

/**
 * Create a typed message
 */
export function createMessage<T extends BaseMessage>(
  type: T['type'],
  payload: T['payload']
): T {
  return {
    type,
    payload,
    timestamp: Date.now(),
  } as T;
}
