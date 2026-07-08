import { archiveExpiredSessions } from '../services/salesAgent/sessionManager.js';

/**
 * Run a cleanup pass — archive sessions older than 24 hours.
 * Called on an hourly interval from server/index.js.
 */
export async function runSessionCleanup() {
  try {
    const count = await archiveExpiredSessions();
    if (count > 0) {
      console.log(`[SessionCleanup] Archived ${count} expired chat session(s).`);
    }
  } catch (err) {
    console.error('[SessionCleanup] Error during cleanup:', err.message);
  }
}
