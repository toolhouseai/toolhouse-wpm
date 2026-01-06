/**
 * Durable Object for managing multiplayer game sessions
 * Handles player connections, game state, scoring, and WebSocket communication
 */

import { GameState, Player, GameResult } from './types';
import { calculateWPM, calculateAccuracy, calculateElapsedSeconds, calculatePlacement } from './scoring';
import { generateUUID } from './utils';

interface DurableObjectState {
  get<T>(key: string): Promise<T | undefined>;
  put(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
}

interface DurableObjectEnv {
  DB?: D1Database;
}

export class GameRoom {
  state: DurableObjectState;
  env: DurableObjectEnv;

  roomId!: string;
  passageId!: string;
  leaderId!: string;
  players: Map<string, Player> = new Map();
  gameState: GameState = 'waiting';
  startTime: number | null = null;
  duration = 60000; // 60 seconds in milliseconds
  connections: Map<string, WebSocket> = new Map();

  constructor(state: DurableObjectState, env: DurableObjectEnv) {
    this.state = state;
    this.env = env;
  }

  /**
   * Handle WebSocket fetch requests
   */
  async fetch(request: Request): Promise<Response> {
    // Initialize room if not set
    if (!this.roomId) {
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      this.roomId = pathParts[pathParts.length - 1];
    }

    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocket(request);
    }

    return new Response('Not Found', { status: 404 });
  }

  /**
   * Upgrade HTTP connection to WebSocket
   */
  async handleWebSocket(request: Request): Promise<Response> {
    const { 0: client, 1: server } = new WebSocketPair();

    server.accept();
    const playerId = this.generatePlayerId();

    // Store connection
    this.connections.set(playerId, server);

    // Set up message handler
    server.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data as string);
        await this.handleMessage(playerId, message);
      } catch (error) {
        console.error('Error handling message:', error);
      }
    };

    server.onclose = async () => {
      this.connections.delete(playerId);
      this.removePlayer(playerId);
      this.broadcastPlayerList();
    };

    server.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Send welcome message
    server.send(JSON.stringify({
      type: 'connection_established',
      payload: { playerId },
    }));

    return new Response(null, { status: 101, webSocket: client as any });
  }

  /**
   * Handle incoming WebSocket messages
   */
  async handleMessage(playerId: string, message: any): Promise<void> {
    const { type, payload } = message;

    switch (type) {
      case 'player_joined':
        await this.addPlayer(playerId, payload);
        break;
      case 'game_start':
        if (playerId === this.leaderId) {
          this.startGame();
        }
        break;
      case 'typing_update':
        this.updatePlayerProgress(playerId, payload);
        this.broadcastPlayerUpdate(playerId);
        break;
      default:
        console.warn(`Unknown message type: ${type}`);
    }
  }

  /**
   * Add a player to the game
   */
  async addPlayer(playerId: string, payload: any): Promise<void> {
    if (this.players.size >= 10) {
      const ws = this.connections.get(playerId);
      if (ws) {
        ws.send(JSON.stringify({
          type: 'error',
          payload: { message: 'Room is full' },
        }));
        ws.close();
      }
      return;
    }

    // Initialize room data from database on first player
    if (this.players.size === 0 && this.env.DB) {
      try {
        const session = await this.env.DB.prepare(
          `SELECT passage_id, leader_id FROM game_sessions WHERE room_id = ? LIMIT 1`
        ).bind(this.roomId).first();

        if (session) {
          this.passageId = session.passage_id as string;
          // Don't override leader, let first connected player be leader
        }
      } catch (error) {
        console.error('Error loading room data:', error);
      }
    }

    const player: Player = {
      id: playerId,
      joinedAt: Date.now(),
      charsTyped: 0,
      correctChars: 0,
      completed: false,
    };

    this.players.set(playerId, player);

    // First player is the leader
    if (this.players.size === 1) {
      this.leaderId = playerId;
    }

    this.broadcastPlayerList();
  }

  /**
   * Remove a player from the game
   */
  removePlayer(playerId: string): void {
    this.players.delete(playerId);

    // If leader left, assign new leader
    if (playerId === this.leaderId && this.players.size > 0) {
      this.leaderId = Array.from(this.players.keys())[0];
    }
  }

  /**
   * Update player's typing progress
   */
  updatePlayerProgress(playerId: string, payload: any): void {
    const player = this.players.get(playerId);
    if (player) {
      player.charsTyped = payload.charsTyped || 0;
      player.correctChars = payload.correctChars || 0;
    }
  }

  /**
   * Start the game
   */
  startGame(): void {
    if (this.gameState !== 'waiting') return;

    this.gameState = 'active';
    this.startTime = Date.now();

    this.broadcast({
      type: 'game_started',
      payload: { duration: this.duration, startTime: this.startTime },
    });

    // Schedule game end
    setTimeout(() => this.endGame(), this.duration);
  }

  /**
   * End the game
   */
  async endGame(): Promise<void> {
    if (this.gameState !== 'active') return;

    this.gameState = 'completed';

    // Calculate results
    const results = this.calculateResults();

    // Broadcast results
    this.broadcast({
      type: 'game_ended',
      payload: { results },
    });

    // Save to database
    await this.saveGameResults(results);

    // Schedule cleanup after 5 minutes to allow players to view results
    setTimeout(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Calculate final results for all players
   */
  calculateResults(): GameResult[] {
    if (!this.startTime) return [];

    const elapsedSeconds = calculateElapsedSeconds(this.startTime);
    const results: GameResult[] = [];

    // Calculate each player's score
    const playerScores = Array.from(this.players.values()).map(player => {
      const wpm = calculateWPM(player.charsTyped, elapsedSeconds);
      const accuracy = calculateAccuracy(player.correctChars, player.charsTyped);

      return { playerId: player.id, wpm, accuracy, charsTyped: player.charsTyped };
    });

    // Get WPM values for placement calculation
    const allWpms = playerScores.map(p => p.wpm);

    // Build final results
    playerScores.forEach(score => {
      const placement = calculatePlacement(score.wpm, allWpms);
      results.push({
        playerId: score.playerId,
        wpm: score.wpm,
        accuracy: score.accuracy,
        charsTyped: score.charsTyped,
        placement,
      });
    });

    return results.sort((a, b) => a.placement - b.placement);
  }

  /**
   * Save game results to database
   */
  async saveGameResults(results: GameResult[]): Promise<void> {
    if (!this.env.DB) return;

    // Don't save if required fields are missing
    if (!this.roomId || !this.passageId || !this.leaderId || !this.startTime) {
      console.warn('Skipping database save - missing required fields');
      return;
    }

    const sessionId = generateUUID();

    try {
      // Insert game session
      await this.env.DB.prepare(
        `INSERT INTO game_sessions (id, room_id, passage_id, leader_id, status, started_at, ended_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        sessionId,
        this.roomId,
        this.passageId,
        this.leaderId,
        'completed',
        new Date(this.startTime).toISOString(),
        new Date().toISOString(),
        new Date().toISOString(),
      ).run();

      // Insert player results
      for (const result of results) {
        const resultId = generateUUID();
        const player = this.players.get(result.playerId);

        await this.env.DB.prepare(
          `INSERT INTO game_results (id, session_id, player_id, wpm, accuracy, chars_typed, correct_chars, completed, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          resultId,
          sessionId,
          result.playerId,
          result.wpm,
          result.accuracy,
          result.charsTyped,
          player?.correctChars || 0,
          true,
          new Date().toISOString(),
        ).run();
      }
    } catch (error) {
      console.error('Error saving game results:', error);
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message: any): void {
    const data = JSON.stringify(message);
    for (const ws of this.connections.values()) {
      try {
        ws.send(data);
      } catch (error) {
        console.error('Error broadcasting:', error);
      }
    }
  }

  /**
   * Broadcast player list update to all clients
   */
  broadcastPlayerList(): void {
    const playerList = Array.from(this.players.values()).map(p => ({
      id: p.id,
      joinedAt: p.joinedAt,
    }));

    this.broadcast({
      type: 'player_list_updated',
      payload: {
        players: playerList,
        leader: this.leaderId,
        count: this.players.size,
        maxPlayers: 10,
      },
    });
  }

  /**
   * Broadcast a specific player's update
   */
  broadcastPlayerUpdate(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;

    this.broadcast({
      type: 'player_update',
      payload: {
        playerId,
        charsTyped: player.charsTyped,
        correctChars: player.correctChars,
      },
    });
  }

  /**
   * Generate a unique player ID for this session
   */
  private generatePlayerId(): string {
    return `player_${Math.random().toString(36).substring(2, 10)}`;
  }

  /**
   * Cleanup room resources after game completion
   * Closes all WebSocket connections and clears state
   */
  cleanup(): void {
    // Close all WebSocket connections
    for (const [playerId, ws] of this.connections.entries()) {
      try {
        ws.close(1000, 'Game completed');
      } catch (error) {
        console.error(`Error closing connection for ${playerId}:`, error);
      }
    }

    // Clear all state
    this.connections.clear();
    this.players.clear();

    console.log(`Room ${this.roomId} cleaned up after game completion`);

    // Note: Durable Object will be evicted by Cloudflare after inactivity
  }
}
