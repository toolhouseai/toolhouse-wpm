/**
 * React hook for managing game room connection and state
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameWebSocket, ConnectionState } from '../lib/websocket';
import type {
  ConnectionEstablishedMessage,
  PlayerListUpdatedMessage,
  GameStartedMessage,
  PlayerUpdateMessage,
  GameEndedMessage,
  TypingUpdateMessage,
} from '../../../src/game/protocol';
import { createMessage } from '../../../src/game/protocol';

export interface Player {
  id: string;
  joinedAt: number;
  charsTyped: number;
  correctChars: number;
}

export interface GameResult {
  playerId: string;
  wpm: number;
  accuracy: number;
  charsTyped: number;
  placement: number;
}

export interface GameRoomState {
  playerId: string | null;
  players: Player[];
  leaderId: string | null;
  gameState: 'waiting' | 'active' | 'completed';
  timeRemaining: number;
  connectionState: ConnectionState;
  error: string | null;
  results: GameResult[];
}

interface UseGameRoomOptions {
  roomId: string;
  wsUrl: string;
}

export function useGameRoom({ roomId, wsUrl }: UseGameRoomOptions) {
  const [state, setState] = useState<GameRoomState>({
    playerId: null,
    players: [],
    leaderId: null,
    gameState: 'waiting',
    timeRemaining: 60,
    connectionState: ConnectionState.Disconnected,
    error: null,
    results: [],
  });

  const wsRef = useRef<GameWebSocket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  /**
   * Initialize WebSocket connection
   */
  useEffect(() => {
    const ws = new GameWebSocket({ url: wsUrl });
    wsRef.current = ws;

    // Handle connection open
    ws.onOpen(() => {
      setState(prev => ({ ...prev, connectionState: ConnectionState.Connected }));
      // Send player_joined message
      ws.send(createMessage<any>('player_joined', { playerId: '' }));
    });

    // Handle connection close
    ws.onClose(() => {
      setState(prev => ({ ...prev, connectionState: ConnectionState.Disconnected }));
      stopTimer();
    });

    // Handle connection error
    ws.onError((error) => {
      console.error('WebSocket error:', error);
      setState(prev => ({
        ...prev,
        connectionState: ConnectionState.Failed,
        error: 'Connection failed',
      }));
    });

    // Handle connection established
    ws.on('connection_established', (message) => {
      const msg = message as ConnectionEstablishedMessage;
      setState(prev => ({ ...prev, playerId: msg.payload.playerId }));
    });

    // Handle player list updates
    ws.on('player_list_updated', (message) => {
      const msg = message as PlayerListUpdatedMessage;
      setState(prev => ({
        ...prev,
        players: msg.payload.players.map(p => ({
          id: p.id,
          joinedAt: p.joinedAt,
          charsTyped: 0,
          correctChars: 0,
        })),
        leaderId: msg.payload.leader,
      }));
    });

    // Handle player updates
    ws.on('player_update', (message) => {
      const msg = message as PlayerUpdateMessage;
      setState(prev => ({
        ...prev,
        players: prev.players.map(p =>
          p.id === msg.payload.playerId
            ? {
              ...p,
              charsTyped: msg.payload.charsTyped,
              correctChars: msg.payload.correctChars,
            }
            : p
        ),
      }));
    });

    // Handle game started
    ws.on('game_started', (message) => {
      const msg = message as GameStartedMessage;
      setState(prev => ({ ...prev, gameState: 'active' }));
      startTimeRef.current = msg.payload.startTime;
      startTimer();
    });

    // Handle game ended
    ws.on('game_ended', (message) => {
      const msg = message as GameEndedMessage;
      stopTimer();
      setState(prev => ({
        ...prev,
        gameState: 'completed',
        results: msg.payload.results,
      }));
    });

    // Connect to the room
    ws.connect().catch(error => {
      console.error('Failed to connect:', error);
      setState(prev => ({ ...prev, error: 'Failed to connect to game room' }));
    });

    return () => {
      ws.disconnect();
      stopTimer();
    };
  }, [wsUrl]);

  /**
   * Start the game (only leader can do this)
   */
  const startGame = useCallback(() => {
    if (wsRef.current && state.playerId === state.leaderId) {
      wsRef.current.send(createMessage('game_start', {}));
    }
  }, [state.playerId, state.leaderId]);

  /**
   * Send typing update
   */
  const updateTyping = useCallback((charsTyped: number, correctChars: number) => {
    if (wsRef.current && state.playerId) {
      wsRef.current.send(
        createMessage<TypingUpdateMessage>('typing_update', {
          playerId: state.playerId,
          charsTyped,
          correctChars,
        })
      );
    }
  }, [state.playerId]);

  /**
   * Timer management
   */
  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, 60 - Math.floor(elapsed / 1000));
        setState(prev => ({ ...prev, timeRemaining: remaining }));

        if (remaining === 0) {
          stopTimer();
        }
      }
    }, 100);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    ...state,
    startGame,
    updateTyping,
    isConnected: state.connectionState === ConnectionState.Connected,
    isLeader: state.playerId === state.leaderId,
  };
}
