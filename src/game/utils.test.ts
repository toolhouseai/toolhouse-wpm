import { describe, it, expect } from 'vitest';
import {
  generateRoomId,
  generatePlayerId,
  generateUUID,
  isValidRoomId,
  isValidPlayerId,
  formatWPM,
  formatAccuracy,
} from './utils';

describe('Game Utilities', () => {
  describe('generateRoomId', () => {
    it('should generate a 6-character room ID', () => {
      const roomId = generateRoomId();
      expect(roomId).toHaveLength(6);
    });

    it('should only contain uppercase letters and numbers', () => {
      const roomId = generateRoomId();
      expect(/^[A-Z0-9]{6}$/.test(roomId)).toBe(true);
    });

    it('should generate different room IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateRoomId());
      }
      // Should generate multiple different IDs
      expect(ids.size).toBeGreaterThan(1);
    });
  });

  describe('generatePlayerId', () => {
    it('should generate a player ID starting with "player_"', () => {
      const playerId = generatePlayerId();
      expect(playerId).toMatch(/^player_/);
    });

    it('should generate IDs with sufficient length', () => {
      const playerId = generatePlayerId();
      expect(playerId.length).toBeGreaterThan(7);
    });

    it('should generate different player IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 50; i++) {
        ids.add(generatePlayerId());
      }
      // Should generate multiple different IDs
      expect(ids.size).toBe(50);
    });
  });

  describe('generateUUID', () => {
    it('should generate a valid UUID format', () => {
      const uuid = generateUUID();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(uuid)).toBe(true);
    });

    it('should generate different UUIDs', () => {
      const ids = new Set();
      for (let i = 0; i < 10; i++) {
        ids.add(generateUUID());
      }
      expect(ids.size).toBe(10);
    });
  });

  describe('isValidRoomId', () => {
    it('should validate correct room IDs', () => {
      expect(isValidRoomId('ABC123')).toBe(true);
      expect(isValidRoomId('XYZ789')).toBe(true);
      expect(isValidRoomId('AAAAAA')).toBe(true);
      expect(isValidRoomId('000000')).toBe(true);
    });

    it('should reject invalid room IDs', () => {
      expect(isValidRoomId('abc123')).toBe(false); // lowercase
      expect(isValidRoomId('AB123')).toBe(false); // too short
      expect(isValidRoomId('ABC1234')).toBe(false); // too long
      expect(isValidRoomId('ABC-12')).toBe(false); // invalid char
      expect(isValidRoomId('AB@123')).toBe(false); // invalid char
    });
  });

  describe('isValidPlayerId', () => {
    it('should validate correct player IDs', () => {
      expect(isValidPlayerId('player_abc123')).toBe(true);
      expect(isValidPlayerId('player_xyz789')).toBe(true);
    });

    it('should reject invalid player IDs', () => {
      expect(isValidPlayerId('player_')).toBe(false); // too short
      expect(isValidPlayerId('abc123')).toBe(false); // missing prefix
      expect(isValidPlayerId('Player_abc123')).toBe(false); // wrong case
    });
  });

  describe('formatWPM', () => {
    it('should round WPM to nearest integer', () => {
      expect(formatWPM(75.4)).toBe('75');
      expect(formatWPM(75.5)).toBe('76');
      expect(formatWPM(75.9)).toBe('76');
    });

    it('should handle zero WPM', () => {
      expect(formatWPM(0)).toBe('0');
    });

    it('should handle high WPM', () => {
      expect(formatWPM(150.7)).toBe('151');
    });
  });

  describe('formatAccuracy', () => {
    it('should format accuracy to 2 decimal places', () => {
      expect(formatAccuracy(99.5)).toBe('99.50%');
      expect(formatAccuracy(85.333)).toBe('85.33%');
      expect(formatAccuracy(100)).toBe('100.00%');
    });

    it('should include percent sign', () => {
      expect(formatAccuracy(50).endsWith('%')).toBe(true);
    });

    it('should handle zero accuracy', () => {
      expect(formatAccuracy(0)).toBe('0.00%');
    });
  });
});
