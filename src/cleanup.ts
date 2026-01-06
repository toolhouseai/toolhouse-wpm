/**
 * Database cleanup worker
 * Runs periodically to clean up old game sessions and results
 */

interface Env {
  DB: D1Database;
}

/**
 * Scheduled event handler for cleanup
 * Configure in wrangler.toml with:
 *
 * [triggers]
 * crons = ["0 0 * * *"]  # Daily at midnight
 */
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('Running database cleanup...');

    try {
      // Delete game sessions older than 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deleteSessionsResult = await env.DB.prepare(
        `DELETE FROM game_sessions WHERE created_at < ?`
      ).bind(thirtyDaysAgo.toISOString()).run();

      console.log(`Deleted ${deleteSessionsResult.meta.changes || 0} old game sessions`);

      // Delete orphaned game results (results without a session)
      const deleteOrphanedResults = await env.DB.prepare(
        `DELETE FROM game_results
         WHERE session_id NOT IN (SELECT id FROM game_sessions)`
      ).run();

      console.log(`Deleted ${deleteOrphanedResults.meta.changes || 0} orphaned game results`);

      // Optional: Clean up very old waiting rooms that never started
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const deleteWaitingRooms = await env.DB.prepare(
        `DELETE FROM game_sessions
         WHERE status = 'waiting' AND created_at < ?`
      ).bind(sevenDaysAgo.toISOString()).run();

      console.log(`Deleted ${deleteWaitingRooms.meta.changes || 0} stale waiting rooms`);

    } catch (error) {
      console.error('Error during cleanup:', error);
      throw error;
    }
  },

  /**
   * HTTP endpoint to manually trigger cleanup
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/cleanup' && request.method === 'POST') {
      try {
        // Run cleanup immediately
        await this.scheduled({} as ScheduledEvent, env, ctx);
        return new Response(JSON.stringify({ success: true, message: 'Cleanup completed' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response('Not Found', { status: 404 });
  },
};
