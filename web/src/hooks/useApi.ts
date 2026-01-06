/**
 * Hook for managing API calls to backend
 */

import { useState, useCallback } from 'react';

export interface Passage {
  id: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  wordCount: number;
}

export interface RoomResponse {
  roomId: string;
  sessionId: string;
  passage: Passage;
  wsUrl: string;
}

export interface ApiState {
  loading: boolean;
  error: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export function useApi() {
  const [state, setState] = useState<ApiState>({
    loading: false,
    error: null,
  });

  /**
   * Create a new game room
   */
  const createRoom = useCallback(async (): Promise<RoomResponse | null> => {
    setState({ loading: true, error: null });

    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to create room`);
      }

      const data = await response.json() as RoomResponse;
      setState({ loading: false, error: null });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState({ loading: false, error: errorMessage });
      return null;
    }
  }, []);

  /**
   * Join an existing game room
   */
  const joinRoom = useCallback(async (roomId: string): Promise<RoomResponse | null> => {
    setState({ loading: true, error: null });

    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Room not found');
        }
        throw new Error(`HTTP ${response.status}: Failed to join room`);
      }

      const data = await response.json() as RoomResponse;
      setState({ loading: false, error: null });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState({ loading: false, error: errorMessage });
      return null;
    }
  }, []);

  /**
   * Get a random passage
   */
  const getRandomPassage = useCallback(async (): Promise<Passage | null> => {
    setState({ loading: true, error: null });

    try {
      const response = await fetch(`${API_BASE_URL}/api/passages?action=random`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch passage`);
      }

      const data = await response.json() as Passage;
      setState({ loading: false, error: null });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState({ loading: false, error: errorMessage });
      return null;
    }
  }, []);

  /**
   * Get all passages
   */
  const getAllPassages = useCallback(async (): Promise<Passage[] | null> => {
    setState({ loading: true, error: null });

    try {
      const response = await fetch(`${API_BASE_URL}/api/passages`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch passages`);
      }

      const data = await response.json() as { passages: Passage[] };
      setState({ loading: false, error: null });
      return data.passages;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState({ loading: false, error: errorMessage });
      return null;
    }
  }, []);

  return {
    ...state,
    createRoom,
    joinRoom,
    getRandomPassage,
    getAllPassages,
  };
}
