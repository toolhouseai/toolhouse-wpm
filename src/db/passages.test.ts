import { describe, it, expect } from 'vitest';
import { SAMPLE_PASSAGES, getRandomPassage, getPassageById } from './passages';

describe('Passages', () => {
  describe('SAMPLE_PASSAGES', () => {
    it('should have at least 10 passages', () => {
      expect(SAMPLE_PASSAGES.length).toBeGreaterThanOrEqual(10);
    });

    it('should have valid structure for each passage', () => {
      SAMPLE_PASSAGES.forEach(passage => {
        expect(passage).toHaveProperty('id');
        expect(passage).toHaveProperty('text');
        expect(passage).toHaveProperty('difficulty');
        expect(passage).toHaveProperty('wordCount');
        expect(passage.id).toBeTruthy();
        expect(passage.text).toBeTruthy();
        expect(['easy', 'medium', 'hard']).toContain(passage.difficulty);
        expect(passage.wordCount).toBeGreaterThan(0);
      });
    });

    it('should have unique passage IDs', () => {
      const ids = SAMPLE_PASSAGES.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have correct word counts', () => {
      SAMPLE_PASSAGES.forEach(passage => {
        const words = passage.text.trim().split(/\s+/).length;
        expect(passage.wordCount).toBe(words);
      });
    });
  });

  describe('getRandomPassage', () => {
    it('should return a passage', () => {
      const passage = getRandomPassage();
      expect(passage).toBeDefined();
      expect(passage.id).toBeTruthy();
      expect(passage.text).toBeTruthy();
    });

    it('should return different passages on multiple calls', () => {
      const passages = new Set();
      for (let i = 0; i < 20; i++) {
        passages.add(getRandomPassage().id);
      }
      // With 15 passages and 20 calls, we should get multiple different ones
      expect(passages.size).toBeGreaterThan(1);
    });

    it('should return a valid passage', () => {
      const passage = getRandomPassage();
      expect(SAMPLE_PASSAGES).toContainEqual(passage);
    });
  });

  describe('getPassageById', () => {
    it('should return the correct passage for a valid ID', () => {
      const targetPassage = SAMPLE_PASSAGES[0];
      const found = getPassageById(targetPassage.id);
      expect(found).toEqual(targetPassage);
    });

    it('should return undefined for an invalid ID', () => {
      const found = getPassageById('nonexistent_id_12345');
      expect(found).toBeUndefined();
    });

    it('should find all passages by their IDs', () => {
      SAMPLE_PASSAGES.forEach(passage => {
        const found = getPassageById(passage.id);
        expect(found).toEqual(passage);
      });
    });
  });
});
