import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameWebSocket, ConnectionState } from './websocket';
import type { BaseMessage } from '../../../src/game/protocol';

// Mock WebSocket
class MockWebSocket {
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: (() => void) | null = null;
  readyState = 1; // OPEN

  send = vi.fn();
  close = vi.fn();

  simulateOpen() {
    this.onopen?.();
  }

  simulateMessage(data: string) {
    this.onmessage?.(new MessageEvent('message', { data }));
  }

  simulateError(error: Event) {
    this.onerror?.(error);
  }

  simulateClose() {
    this.onclose?.();
  }
}

describe('GameWebSocket', () => {
  let mockWs: MockWebSocket;
  let gameWs: GameWebSocket;

  beforeEach(() => {
    mockWs = new MockWebSocket();
    (global as any).WebSocket = vi.fn(() => mockWs);
    gameWs = new GameWebSocket({ url: 'ws://localhost:8787/test' });
  });

  afterEach(() => {
    gameWs.disconnect();
  });

  describe('Connection Management', () => {
    it('should initialize in disconnected state', () => {
      expect(gameWs.getState()).toBe(ConnectionState.Disconnected);
      expect(gameWs.isConnected()).toBe(false);
    });

    it('should transition to connecting when connecting', async () => {
      const connectPromise = gameWs.connect();
      expect(gameWs.getState()).toBe(ConnectionState.Connecting);
      mockWs.simulateOpen();
      await connectPromise;
    });

    it('should transition to connected when connection opens', async () => {
      const connectPromise = gameWs.connect();
      mockWs.simulateOpen();
      await connectPromise;

      expect(gameWs.getState()).toBe(ConnectionState.Connected);
      expect(gameWs.isConnected()).toBe(true);
    });

    it('should disconnect cleanly', async () => {
      const connectPromise = gameWs.connect();
      mockWs.simulateOpen();
      await connectPromise;

      gameWs.disconnect();
      expect(gameWs.getState()).toBe(ConnectionState.Disconnected);
      expect(mockWs.close).toHaveBeenCalled();
    });
  });

  describe('Message Sending', () => {
    it('should queue messages when disconnected', async () => {
      const message: BaseMessage = {
        type: 'player_joined',
        payload: { playerId: 'test_player' },
      };

      gameWs.send(message);
      // Message should be queued
      expect(mockWs.send).not.toHaveBeenCalled();
    });

    it('should send messages when connected', async () => {
      const connectPromise = gameWs.connect();
      mockWs.simulateOpen();
      await connectPromise;

      const message: BaseMessage = {
        type: 'typing_update',
        payload: { playerId: 'p1', charsTyped: 100, correctChars: 95 },
      };

      gameWs.send(message);
      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should flush queued messages on reconnect', async () => {
      const message: BaseMessage = {
        type: 'player_joined',
        payload: { playerId: 'test_player' },
      };

      gameWs.send(message);
      expect(mockWs.send).not.toHaveBeenCalled();

      const connectPromise = gameWs.connect();
      mockWs.simulateOpen();
      await connectPromise;

      expect(mockWs.send).toHaveBeenCalled();
    });
  });

  describe('Message Handling', () => {
    it('should handle incoming messages', async () => {
      const connectPromise = gameWs.connect();
      mockWs.simulateOpen();
      await connectPromise;

      const handler = vi.fn();
      gameWs.on('connection_established', handler);

      const message = {
        type: 'connection_established',
        payload: { playerId: 'player_123' },
      };

      mockWs.simulateMessage(JSON.stringify(message));
      expect(handler).toHaveBeenCalledWith(expect.objectContaining(message));
    });

    it('should support multiple handlers for same message type', async () => {
      const connectPromise = gameWs.connect();
      mockWs.simulateOpen();
      await connectPromise;

      const handler1 = vi.fn();
      const handler2 = vi.fn();

      gameWs.on('player_update', handler1);
      gameWs.on('player_update', handler2);

      const message = {
        type: 'player_update',
        payload: { playerId: 'p1', charsTyped: 100, correctChars: 95 },
      };

      mockWs.simulateMessage(JSON.stringify(message));
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should unsubscribe from messages', async () => {
      const connectPromise = gameWs.connect();
      mockWs.simulateOpen();
      await connectPromise;

      const handler = vi.fn();
      gameWs.on('game_started', handler);
      gameWs.off('game_started', handler);

      const message = {
        type: 'game_started',
        payload: { duration: 60000, startTime: Date.now() },
      };

      mockWs.simulateMessage(JSON.stringify(message));
      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle malformed messages', async () => {
      const connectPromise = gameWs.connect();
      mockWs.simulateOpen();
      await connectPromise;

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockWs.simulateMessage('invalid json {');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Event Handlers', () => {
    it('should call onOpen handlers when connected', async () => {
      const handler = vi.fn();
      gameWs.onOpen(handler);

      const connectPromise = gameWs.connect();
      mockWs.simulateOpen();
      await connectPromise;

      expect(handler).toHaveBeenCalled();
    });

    it('should call onClose handlers when disconnected', async () => {
      const handler = vi.fn();
      gameWs.onClose(handler);

      const connectPromise = gameWs.connect();
      mockWs.simulateOpen();
      await connectPromise;

      mockWs.simulateClose();
      expect(handler).toHaveBeenCalled();
    });

    it('should call onError handlers on error', async () => {
      const handler = vi.fn();
      gameWs.onError(handler);

      const connectPromise = gameWs.connect();
      const error = new Event('error');
      mockWs.simulateError(error);

      // Wait for error handling
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Reconnection Logic', () => {
    it('should attempt reconnection on close', async () => {
      vi.useFakeTimers();

      const connectPromise = gameWs.connect();
      mockWs.simulateOpen();
      await connectPromise;

      mockWs.simulateClose();
      expect(gameWs.getState()).toBe(ConnectionState.Reconnecting);

      vi.useRealTimers();
    });

    it('should stop reconnecting after max retries', async () => {
      vi.useFakeTimers();

      const connectPromise = gameWs.connect();
      mockWs.simulateOpen();
      await connectPromise;

      // Simulate multiple failures
      for (let i = 0; i < 6; i++) {
        mockWs.simulateError(new Event('error'));
        vi.advanceTimersByTime(2000);
      }

      expect(gameWs.getState()).toBe(ConnectionState.Failed);
      vi.useRealTimers();
    });
  });
});
