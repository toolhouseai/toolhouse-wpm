/**
 * API utilities and helpers
 */

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

/**
 * Create a JSON response with CORS headers
 */
export function createJsonResponse(
  data: unknown,
  status: number = 200,
  additionalHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      ...additionalHeaders,
    },
  });
}

/**
 * Create an error response with CORS headers
 */
export function createErrorResponse(
  message: string,
  status: number = 400,
  code?: string
): Response {
  return createJsonResponse({ error: message, code }, status);
}
