/**
 * Room management API endpoints
 */

import { generateRoomId, generateUUID } from '../game/utils';
import { getRandomPassage } from '../db/passages';

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

    return new Response(
      JSON.stringify({
        roomId,
        sessionId,
        passage: {
          id: passage.id,
          text: passage.text,
          difficulty: passage.difficulty,
          wordCount: passage.wordCount,
        },
        wsUrl: `ws://localhost:8787/ws/rooms/${roomId}`,
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error creating room:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create room' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function handleJoinRoom(
  request: Request,
  roomId: string,
  env: Env
): Promise<Response> {
  try {
    if (!/^[A-Z0-9]{6}$/.test(roomId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid room ID format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
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
      return new Response(
        JSON.stringify({ error: 'Room not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get passage
    const passages = await import('../db/passages');
    const passage = passages.getPassageById(session.passage_id);

    return new Response(
      JSON.stringify({
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
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error joining room:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to join room' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
