import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateWPM,
  calculateAccuracy,
  calculateElapsedSeconds,
  calculatePlacement,
} from './scoring';

describe('Game Scoring', () => {
  describe('calculateWPM', () => {
    it('should calculate WPM correctly', () => {
      // 300 chars in 60 seconds = 60 WPM (300 / 5 = 60 words)
      const wpm = calculateWPM(300, 60);
      expect(wpm).toBe(60);
    });

    it('should handle half minute correctly', () => {
      // 150 chars in 30 seconds = 60 WPM (150 / 5 = 30 words in 30 seconds = 60 WPM)
      const wpm = calculateWPM(150, 30);
      expect(wpm).toBe(60);
    });

    it('should round to 2 decimal places', () => {
      // 100 chars in 10 seconds = 120 WPM
      const wpm = calculateWPM(100, 10);
      expect(wpm).toBe(120);
    });

    it('should return 0 for zero elapsed time', () => {
      const wpm = calculateWPM(100, 0);
      expect(wpm).toBe(0);
    });

    it('should return 0 for zero characters typed', () => {
      const wpm = calculateWPM(0, 60);
      expect(wpm).toBe(0);
    });

    it('should handle decimal elapsed seconds', () => {
      // 300 chars in 45.5 seconds
      const wpm = calculateWPM(300, 45.5);
      expect(wpm).toBeGreaterThan(0);
    });
  });

  describe('calculateAccuracy', () => {
    it('should calculate perfect accuracy', () => {
      const accuracy = calculateAccuracy(100, 100);
      expect(accuracy).toBe(100);
    });

    it('should calculate partial accuracy', () => {
      // 80 correct out of 100 = 80%
      const accuracy = calculateAccuracy(80, 100);
      expect(accuracy).toBe(80);
    });

    it('should round to 2 decimal places', () => {
      // 1 correct out of 3 = 33.33%
      const accuracy = calculateAccuracy(1, 3);
      expect(accuracy).toBe(33.33);
    });

    it('should return 0 for zero characters typed', () => {
      const accuracy = calculateAccuracy(0, 0);
      expect(accuracy).toBe(0);
    });

    it('should return 0 when no correct characters', () => {
      const accuracy = calculateAccuracy(0, 100);
      expect(accuracy).toBe(0);
    });

    it('should handle edge case where correct > total', () => {
      // This shouldn't happen in practice, but function should handle it
      const accuracy = calculateAccuracy(110, 100);
      expect(accuracy).toBe(110);
    });
  });

  describe('calculateElapsedSeconds', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should calculate elapsed seconds correctly', () => {
      const startTime = Date.now();
      vi.advanceTimersByTime(5000); // 5 seconds
      const elapsed = calculateElapsedSeconds(startTime);
      expect(elapsed).toBe(5);
    });

    it('should handle 1 minute elapsed', () => {
      const startTime = Date.now();
      vi.advanceTimersByTime(60000); // 60 seconds
      const elapsed = calculateElapsedSeconds(startTime);
      expect(elapsed).toBe(60);
    });

    it('should return 0 for no elapsed time', () => {
      const startTime = Date.now();
      const elapsed = calculateElapsedSeconds(startTime);
      expect(elapsed).toBe(0);
    });
  });

  describe('calculatePlacement', () => {
    it('should place highest WPM first', () => {
      const placement = calculatePlacement(100, [100, 80, 60, 40]);
      expect(placement).toBe(1);
    });

    it('should place middle WPM correctly', () => {
      const placement = calculatePlacement(80, [100, 80, 60, 40]);
      expect(placement).toBe(2);
    });

    it('should place lowest WPM last', () => {
      const placement = calculatePlacement(40, [100, 80, 60, 40]);
      expect(placement).toBe(4);
    });

    it('should handle duplicate WPMs', () => {
      const placement = calculatePlacement(80, [100, 80, 80, 60]);
      expect(placement).toBeGreaterThanOrEqual(2);
      expect(placement).toBeLessThanOrEqual(3);
    });

    it('should handle single player', () => {
      const placement = calculatePlacement(75, [75]);
      expect(placement).toBe(1);
    });

    it('should handle WPM not in list', () => {
      const placement = calculatePlacement(55, [100, 80, 60, 40]);
      expect(placement).toBe(4);
    });
  });
});
