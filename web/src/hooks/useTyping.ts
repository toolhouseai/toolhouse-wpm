/**
 * React hook for managing typing input and tracking typing stats
 */

import { useState, useCallback, useEffect } from 'react';

export interface TypingStats {
  charsTyped: number;
  correctChars: number;
  accuracy: number;
  wpm: number;
  input: string;
}

interface UseTypingOptions {
  passage: string;
  isActive: boolean;
  onUpdateStats?: (stats: TypingStats) => void;
  elapsedSeconds?: number;
}

export function useTyping({
  passage,
  isActive,
  onUpdateStats,
  elapsedSeconds = 0,
}: UseTypingOptions) {
  const [input, setInput] = useState('');
  const [stats, setStats] = useState<TypingStats>({
    charsTyped: 0,
    correctChars: 0,
    accuracy: 0,
    wpm: 0,
    input: '',
  });

  /**
   * Calculate typing statistics
   */
  const calculateStats = useCallback((typedText: string): TypingStats => {
    const charsTyped = typedText.length;
    let correctChars = 0;

    // Count correct characters
    for (let i = 0; i < Math.min(typedText.length, passage.length); i++) {
      if (typedText[i] === passage[i]) {
        correctChars++;
      }
    }

    // Calculate accuracy
    const accuracy = charsTyped > 0
      ? Math.round((correctChars / charsTyped) * 10000) / 100
      : 0;

    // Calculate WPM (only if some time has passed)
    let wpm = 0;
    if (elapsedSeconds > 0 && charsTyped > 0) {
      wpm = Math.round(((charsTyped / 5) / (elapsedSeconds / 60)) * 100) / 100;
    }

    return {
      charsTyped,
      correctChars,
      accuracy,
      wpm,
      input: typedText,
    };
  }, [passage, elapsedSeconds]);

  /**
   * Handle input change
   */
  const handleInputChange = useCallback((text: string) => {
    if (!isActive) return;

    setInput(text);

    const newStats = calculateStats(text);
    setStats(newStats);

    if (onUpdateStats) {
      onUpdateStats(newStats);
    }
  }, [isActive, calculateStats, onUpdateStats]);

  /**
   * Reset typing state
   */
  const reset = useCallback(() => {
    setInput('');
    setStats({
      charsTyped: 0,
      correctChars: 0,
      accuracy: 0,
      wpm: 0,
      input: '',
    });
  }, []);

  /**
   * Check if current input is valid (matches passage so far)
   */
  const isInputValid = useCallback(() => {
    if (input.length === 0) return true;
    for (let i = 0; i < input.length; i++) {
      if (input[i] !== passage[i]) {
        return false;
      }
    }
    return true;
  }, [input, passage]);

  /**
   * Get the next character to type
   */
  const getNextChar = useCallback(() => {
    if (input.length < passage.length) {
      return passage[input.length];
    }
    return null;
  }, [input, passage]);

  /**
   * Get current progress percentage
   */
  const getProgress = useCallback(() => {
    if (passage.length === 0) return 0;
    return Math.round((input.length / passage.length) * 100);
  }, [input, passage]);

  /**
   * Clear input when game becomes inactive
   */
  useEffect(() => {
    if (!isActive) {
      reset();
    }
  }, [isActive, reset]);

  return {
    ...stats,
    handleInputChange,
    reset,
    isInputValid: isInputValid(),
    nextChar: getNextChar(),
    progress: getProgress(),
  };
}
