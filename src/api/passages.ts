/**
 * Passages API endpoint
 */

import { SAMPLE_PASSAGES, getRandomPassage } from '../db/passages';

interface Env {
  DB: D1Database;
}

export async function handleGetPassages(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'random') {
      const passage = getRandomPassage();
      return new Response(
        JSON.stringify(passage),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Default: return all passages
    return new Response(
      JSON.stringify({ passages: SAMPLE_PASSAGES }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching passages:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch passages' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
