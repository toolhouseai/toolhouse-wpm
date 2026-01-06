import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTyping } from './useTyping';

describe('useTyping Hook', () => {
  const testPassage = 'The quick brown fox jumps over the lazy dog';

  describe('Initialization', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() =>
        useTyping({ passage: testPassage, isActive: false })
      );

      expect(result.current.input).toBe('');
      expect(result.current.charsTyped).toBe(0);
      expect(result.current.correctChars).toBe(0);
      expect(result.current.accuracy).toBe(0);
      expect(result.current.wpm).toBe(0);
    });
  });

  describe('Typing Input', () => {
    it('should update input on key press', () => {
      const { result } = renderHook(() =>
        useTyping({ passage: testPassage, isActive: true })
      );

      act(() => {
        result.current.handleInputChange('The quick');
      });

      expect(result.current.input).toBe('The quick');
      expect(result.current.charsTyped).toBe(9);
    });

    it('should calculate correct characters', () => {
      const { result } = renderHook(() =>
        useTyping({ passage: testPassage, isActive: true })
      );

      act(() => {
        result.current.handleInputChange('The quick brown');
      });

      expect(result.current.correctChars).toBe(15);
      expect(result.current.charsTyped).toBe(15);
    });

    it('should track incorrect characters', () => {
      const { result } = renderHook(() =>
        useTyping({ passage: testPassage, isActive: true })
      );

      act(() => {
        result.current.handleInputChange('The slow brown');
      });

      expect(result.current.correctChars).toBe(10); // 'The slow br' matches start
      expect(result.current.charsTyped).toBe(14);
    });
  });

  describe('Accuracy Calculation', () => {
    it('should calculate 100% accuracy for perfect typing', () => {
      const { result } = renderHook(() =>
        useTyping({ passage: testPassage, isActive: true })
      );

      act(() => {
        result.current.handleInputChange('The quick brown fox');
      });

      expect(result.current.accuracy).toBe(100);
    });

    it('should calculate partial accuracy for mistakes', () => {
      const { result } = renderHook(() =>
        useTyping({ passage: testPassage, isActive: true })
      );

      act(() => {
        result.current.handleInputChange('The quack brown');
      });

      // 13 correct out of 15 = 86.67%
      expect(result.current.accuracy).toBeGreaterThan(86);
      expect(result.current.accuracy).toBeLessThan(87);
    });

    it('should handle zero characters', () => {
      const { result } = renderHook(() =>
        useTyping({ passage: testPassage, isActive: true })
      );

      expect(result.current.accuracy).toBe(0);
    });
  });

  describe('WPM Calculation', () => {
    it('should calculate WPM with elapsed time', () => {
      const { result } = renderHook(() =>
        useTyping({ passage: testPassage, isActive: true, elapsedSeconds: 30 })
      );

      act(() => {
        result.current.handleInputChange('The quick brown fox jumps over');
      });

      // 31 chars / 5 = 6.2 words, 30 seconds = 0.5 minutes
      // 6.2 / 0.5 = 12.4 WPM
      expect(result.current.wpm).toBeGreaterThan(10);
    });

    it('should return 0 WPM with no elapsed time', () => {
      const { result } = renderHook(() =>
        useTyping({ passage: testPassage, isActive: true, elapsedSeconds: 0 })
      );

      act(() => {
        result.current.handleInputChange('The quick brown');
      });

      expect(result.current.wpm).toBe(0);
    });
  });

  describe('Input Validation', () => {
    it('should validate correct input', () => {
      const { result } = renderHook(() =>
        useTyping({ passage: testPassage, isActive: true })
      );

      act(() => {
        result.current.handleInputChange('The quick');
      });

      expect(result.current.isInputValid).toBe(true);
    });

    it('should invalidate incorrect input', () => {
      const { result } = renderHook(() =>
        useTyping({ passage: testPassage, isActive: true })
      );

      act(() => {
        result.current.handleInputChange('The sloow');
      });

      expect(result.current.isInputValid).toBe(false);
    });

    it('should validate empty input', () => {
      const { result } = renderHook(() =>
        useTyping({ passage: testPassage, isActive: true })
      );

      expect(result.current.isInputValid).toBe(true);
    });
  });

  describe('Next Character', () => {
    it('should return next character to type', () => {
      const { result } = renderHook(() =>
        useTyping({ passage: testPassage, isActive: true })
      );

      expect(result.current.nextChar).toBe('T');

      act(() => {
        result.current.handleInputChange('The');
      });

      expect(result.current.nextChar).toBe(' ');
    });

    it('should return null when passage is complete', () => {
      const { result } = renderHook(() =>
        useTyping({ passage: testPassage, isActive: true })
      );

      act(() => {
        result.current.handleInputChange(testPassage);
      });

      expect(result.current.nextChar).toBeNull();
    });
  });

  describe('Progress Tracking', () => {
    it('should calculate progress percentage', () => {
      const { result } = renderHook(() =>
        useTyping({ passage: testPassage, isActive: true })
      );

      act(() => {
        result.current.handleInputChange('The quick');
      });

      const progress = result.current.progress;
      expect(progress).toBeGreaterThan(0);
      expect(progress).toBeLessThan(100);
    });

    it('should show 0% progress at start', () => {
      const { result } = renderHook(() =>
        useTyping({ passage: testPassage, isActive: true })
      );

      expect(result.current.progress).toBe(0);
    });

    it('should show 100% when complete', () => {
      const { result } = renderHook(() =>
        useTyping({ passage: testPassage, isActive: true })
      );

      act(() => {
        result.current.handleInputChange(testPassage);
      });

      expect(result.current.progress).toBe(100);
    });
  });

  describe('Reset', () => {
    it('should reset state to initial values', () => {
      const { result } = renderHook(() =>
        useTyping({ passage: testPassage, isActive: true })
      );

      act(() => {
        result.current.handleInputChange('Some text');
      });

      expect(result.current.input).not.toBe('');

      act(() => {
        result.current.reset();
      });

      expect(result.current.input).toBe('');
      expect(result.current.charsTyped).toBe(0);
      expect(result.current.correctChars).toBe(0);
    });

    it('should reset when game becomes inactive', () => {
      const { result, rerender } = renderHook(
        ({ isActive }) => useTyping({ passage: testPassage, isActive }),
        { initialProps: { isActive: true } }
      );

      act(() => {
        result.current.handleInputChange('Some text');
      });

      expect(result.current.input).not.toBe('');

      rerender({ isActive: false });

      expect(result.current.input).toBe('');
    });
  });

  describe('Callbacks', () => {
    it('should call onUpdateStats callback', () => {
      const onUpdateStats = vi.fn();
      const { result } = renderHook(() =>
        useTyping({ passage: testPassage, isActive: true, onUpdateStats })
      );

      act(() => {
        result.current.handleInputChange('The');
      });

      expect(onUpdateStats).toHaveBeenCalledWith(
        expect.objectContaining({
          charsTyped: 3,
          input: 'The',
        })
      );
    });
  });
});
