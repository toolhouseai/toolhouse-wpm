/**
 * Cloudflare Workers entry point
 * Routes requests to appropriate handlers
 */

import { GameRoom } from './game/gameRoom';
import { handleRoomCreation } from './api/rooms';
import { handleGetPassages } from './api/passages';

export { GameRoom };

interface Env {
  DB: D1Database;
  GAME_ROOM: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;

    // Enable CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Routes
    if (pathname === '/api/rooms' && request.method === 'POST') {
      return handleRoomCreation(request, env);
    }

    if (pathname === '/api/passages' && request.method === 'GET') {
      return handleGetPassages(request, env);
    }

    if (pathname.match(/^\/ws\/rooms\/[A-Z0-9]{6}$/)) {
      return handleGameRoomWebSocket(pathname, request, env);
    }

    return new Response('Not Found', { status: 404 });
  },
};

/**
 * Route WebSocket connections to Durable Object
 */
async function handleGameRoomWebSocket(
  pathname: string,
  request: Request,
  env: Env
): Promise<Response> {
  const roomId = pathname.split('/').pop();

  if (!roomId) {
    return new Response('Invalid room ID', { status: 400 });
  }

  const stub = env.GAME_ROOM.get(roomId);
  return stub.fetch(request);
}
