import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameRoom } from './gameRoom';

describe('GameRoom', () => {
  let gameRoom: GameRoom;

  beforeEach(() => {
    const mockState = {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };

    const mockEnv = {
      DB: undefined,
    };

    gameRoom = new GameRoom(mockState, mockEnv);
    gameRoom.roomId = 'TEST123';
    gameRoom.passageId = 'passage_001';
  });

  describe('Player Management', () => {
    it('should add a player', async () => {
      const playerId = 'player_test1';
      await gameRoom.addPlayer(playerId, {});

      expect(gameRoom.players.has(playerId)).toBe(true);
      expect(gameRoom.players.get(playerId)?.charsTyped).toBe(0);
    });

    it('should set first player as leader', async () => {
      const playerId = 'player_leader';
      await gameRoom.addPlayer(playerId, {});

      expect(gameRoom.leaderId).toBe(playerId);
    });

    it('should not add more than 10 players', async () => {
      for (let i = 0; i < 11; i++) {
        await gameRoom.addPlayer(`player_${i}`, {});
      }

      expect(gameRoom.players.size).toBe(10);
    });

    it('should remove a player', async () => {
      const playerId = 'player_test1';
      await gameRoom.addPlayer(playerId, {});
      gameRoom.removePlayer(playerId);

      expect(gameRoom.players.has(playerId)).toBe(false);
    });

    it('should reassign leader when leader leaves', async () => {
      const leader = 'player_leader';
      const other = 'player_other';

      await gameRoom.addPlayer(leader, {});
      await gameRoom.addPlayer(other, {});

      expect(gameRoom.leaderId).toBe(leader);

      gameRoom.removePlayer(leader);

      expect(gameRoom.leaderId).toBe(other);
    });
  });

  describe('Game State', () => {
    it('should start in waiting state', () => {
      expect(gameRoom.gameState).toBe('waiting');
    });

    it('should transition to active when game starts', () => {
      gameRoom.startGame();

      expect(gameRoom.gameState).toBe('active');
      expect(gameRoom.startTime).not.toBeNull();
    });

    it('should not start if already active', () => {
      gameRoom.gameState = 'active';
      const originalStartTime = gameRoom.startTime;

      gameRoom.startGame();

      expect(gameRoom.startTime).toBe(originalStartTime);
    });

    it('should transition to completed when game ends', async () => {
      gameRoom.gameState = 'active';
      gameRoom.startTime = Date.now() - 1000; // Started 1 second ago

      await gameRoom.endGame();

      expect(gameRoom.gameState).toBe('completed');
    });
  });

  describe('Typing Progress', () => {
    it('should update player typing progress', async () => {
      const playerId = 'player_test1';
      await gameRoom.addPlayer(playerId, {});

      gameRoom.updatePlayerProgress(playerId, {
        charsTyped: 150,
        correctChars: 145,
      });

      const player = gameRoom.players.get(playerId)!;
      expect(player.charsTyped).toBe(150);
      expect(player.correctChars).toBe(145);
    });

    it('should handle updates for non-existent player', () => {
      expect(() => {
        gameRoom.updatePlayerProgress('nonexistent', { charsTyped: 100 });
      }).not.toThrow();
    });
  });

  describe('Scoring', () => {
    it('should calculate results for all players', async () => {
      gameRoom.gameState = 'active';
      gameRoom.startTime = Date.now() - 30000; // 30 seconds ago

      const player1 = 'player_1';
      const player2 = 'player_2';

      await gameRoom.addPlayer(player1, {});
      await gameRoom.addPlayer(player2, {});

      gameRoom.updatePlayerProgress(player1, {
        charsTyped: 300,
        correctChars: 295,
      });

      gameRoom.updatePlayerProgress(player2, {
        charsTyped: 200,
        correctChars: 195,
      });

      const results = gameRoom.calculateResults();

      expect(results).toHaveLength(2);
      expect(results[0].playerId).toBe(player1); // Higher WPM = first place
      expect(results[0].placement).toBe(1);
      expect(results[1].placement).toBe(2);
    });

    it('should calculate correct WPM', async () => {
      gameRoom.gameState = 'active';
      gameRoom.startTime = Date.now() - 60000; // 60 seconds ago

      const playerId = 'player_test1';
      await gameRoom.addPlayer(playerId, {});

      gameRoom.updatePlayerProgress(playerId, {
        charsTyped: 300,
        correctChars: 300,
      });

      const results = gameRoom.calculateResults();
      expect(results[0].wpm).toBe(60); // 300 chars / 5 = 60 words per minute
    });

    it('should calculate correct accuracy', async () => {
      gameRoom.gameState = 'active';
      gameRoom.startTime = Date.now() - 10000;

      const playerId = 'player_test1';
      await gameRoom.addPlayer(playerId, {});

      gameRoom.updatePlayerProgress(playerId, {
        charsTyped: 100,
        correctChars: 80,
      });

      const results = gameRoom.calculateResults();
      expect(results[0].accuracy).toBe(80); // 80/100 * 100 = 80%
    });
  });

  describe('Broadcasting', () => {
    it('should broadcast to all connected clients', () => {
      const mockWs1 = { send: vi.fn() };
      const mockWs2 = { send: vi.fn() };

      gameRoom.connections.set('player_1', mockWs1 as any);
      gameRoom.connections.set('player_2', mockWs2 as any);

      gameRoom.broadcast({ type: 'test', payload: {} });

      expect(mockWs1.send).toHaveBeenCalled();
      expect(mockWs2.send).toHaveBeenCalled();
    });

    it('should broadcast player list update', async () => {
      const mockWs = { send: vi.fn() };
      gameRoom.connections.set('player_test', mockWs as any);

      await gameRoom.addPlayer('player_test', {});
      gameRoom.broadcastPlayerList();

      expect(mockWs.send).toHaveBeenCalled();
      const callData = mockWs.send.mock.calls[0][0];
      const message = JSON.parse(callData);

      expect(message.type).toBe('player_list_updated');
      expect(message.payload.count).toBe(1);
    });
  });
});
