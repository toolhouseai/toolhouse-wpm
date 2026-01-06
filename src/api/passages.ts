/**
 * Passages API endpoint
 */

import { SAMPLE_PASSAGES, getRandomPassage } from '../db/passages';
import { createJsonResponse, createErrorResponse } from './utils';

interface Env {
  DB: D1Database;
}

export async function handleGetPassages(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'random') {
      const passage = getRandomPassage();
      return createJsonResponse(passage);
    }

    // Default: return all passages
    return createJsonResponse({ passages: SAMPLE_PASSAGES });
  } catch (error) {
    console.error('Error fetching passages:', error);
    return createErrorResponse('Failed to fetch passages', 500);
  }
}
