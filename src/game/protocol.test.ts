import { describe, it, expect } from 'vitest';
import {
  isMessageType,
  createMessage,
  type ConnectionEstablishedMessage,
  type TypingUpdateMessage,
  type GameStartedMessage,
} from './protocol';

describe('WebSocket Protocol', () => {
  describe('createMessage', () => {
    it('should create a message with type and payload', () => {
      const message = createMessage<ConnectionEstablishedMessage>(
        'connection_established',
        { playerId: 'player_123' }
      );

      expect(message.type).toBe('connection_established');
      expect(message.payload.playerId).toBe('player_123');
      expect(message.timestamp).toBeDefined();
    });

    it('should set timestamp', () => {
      const beforeTime = Date.now();
      const message = createMessage<GameStartedMessage>(
        'game_started',
        { duration: 60000, startTime: Date.now() }
      );
      const afterTime = Date.now();

      expect(message.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(message.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should handle complex payloads', () => {
      const results = [
        { playerId: 'p1', wpm: 75, accuracy: 95, charsTyped: 300, placement: 1 },
        { playerId: 'p2', wpm: 60, accuracy: 90, charsTyped: 240, placement: 2 },
      ];

      const message = createMessage<any>(
        'game_ended',
        { results }
      );

      expect(message.payload.results).toHaveLength(2);
      expect(message.payload.results[0].wpm).toBe(75);
    });
  });

  describe('isMessageType', () => {
    it('should identify message type correctly', () => {
      const message = createMessage<ConnectionEstablishedMessage>(
        'connection_established',
        { playerId: 'player_123' }
      );

      expect(isMessageType<ConnectionEstablishedMessage>(message, 'connection_established')).toBe(true);
      expect(isMessageType(message, 'game_started')).toBe(false);
    });

    it('should work with different message types', () => {
      const typingMessage = createMessage<TypingUpdateMessage>(
        'typing_update',
        { playerId: 'p1', charsTyped: 100, correctChars: 95 }
      );

      expect(isMessageType<TypingUpdateMessage>(typingMessage, 'typing_update')).toBe(true);
      expect(isMessageType(typingMessage, 'player_update')).toBe(false);
    });
  });

  describe('Message payload validation', () => {
    it('should create connection_established message', () => {
      const message = createMessage<ConnectionEstablishedMessage>(
        'connection_established',
        { playerId: 'player_abc123' }
      );

      expect(message.type).toBe('connection_established');
      expect(typeof message.payload.playerId).toBe('string');
    });

    it('should create typing_update message', () => {
      const message = createMessage<TypingUpdateMessage>(
        'typing_update',
        {
          playerId: 'p1',
          charsTyped: 150,
          correctChars: 145,
        }
      );

      expect(message.payload.charsTyped).toBe(150);
      expect(message.payload.correctChars).toBe(145);
    });

    it('should create game_started message', () => {
      const startTime = Date.now();
      const message = createMessage<GameStartedMessage>(
        'game_started',
        {
          duration: 60000,
          startTime,
        }
      );

      expect(message.payload.duration).toBe(60000);
      expect(message.payload.startTime).toBe(startTime);
    });
  });
});
