/**
 * Room management API endpoints
 */

import { generateRoomId, generateUUID } from '../game/utils';
import { getRandomPassage } from '../db/passages';
import { createJsonResponse, createErrorResponse } from './utils';

interface Env {
  DB: D1Database;
}

export async function handleRoomCreation(request: Request, env: Env): Promise<Response> {
  try {
    const roomId = generateRoomId();
    const sessionId = generateUUID();
    const passage = getRandomPassage();

    // Save session to database
    if (env.DB) {
      await env.DB.prepare(
        `INSERT INTO game_sessions (id, room_id, passage_id, leader_id, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(
        sessionId,
        roomId,
        passage.id,
        'anonymous', // Will be updated when player joins
        'waiting',
        new Date().toISOString(),
      ).run();
    }

    return createJsonResponse({
      roomId,
      sessionId,
      passage: {
        id: passage.id,
        text: passage.text,
        difficulty: passage.difficulty,
        wordCount: passage.wordCount,
      },
      wsUrl: `ws://localhost:8787/ws/rooms/${roomId}`,
    }, 201);
  } catch (error) {
    console.error('Error creating room:', error);
    return createErrorResponse('Failed to create room', 500);
  }
}

export async function handleJoinRoom(
  request: Request,
  roomId: string,
  env: Env
): Promise<Response> {
  try {
    if (!/^[A-Z0-9]{6}$/.test(roomId)) {
      return createErrorResponse('Invalid room ID format', 400);
    }

    // Get session from database
    let session = null;
    if (env.DB) {
      const result = await env.DB.prepare(
        `SELECT * FROM game_sessions WHERE room_id = ? LIMIT 1`
      ).bind(roomId).first();

      session = result;
    }

    if (!session) {
      return createErrorResponse('Room not found', 404);
    }

    // Get passage
    const passages = await import('../db/passages');
    const passage = passages.getPassageById(session.passage_id);

    return createJsonResponse({
      roomId,
      sessionId: session.id,
      status: session.status,
      passage: passage ? {
        id: passage.id,
        text: passage.text,
        difficulty: passage.difficulty,
        wordCount: passage.wordCount,
      } : null,
      wsUrl: `ws://localhost:8787/ws/rooms/${roomId}`,
    });
  } catch (error) {
    console.error('Error joining room:', error);
    return createErrorResponse('Failed to join room', 500);
  }
}
