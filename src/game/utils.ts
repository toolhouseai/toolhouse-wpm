/**
 * Game utility functions
 */

/**
 * Generate a random room ID
 * Format: 6-character alphanumeric uppercase code (e.g., "ABC123")
 * Used for easy player sharing and remembrance
 */
export function generateRoomId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let roomId = '';
  for (let i = 0; i < 6; i++) {
    roomId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return roomId;
}

/**
 * Generate a unique player ID for anonymous players
 * Format: 'player_' + random alphanumeric string
 */
export function generatePlayerId(): string {
  return 'player_' + Math.random().toString(36).substring(2, 10);
}

/**
 * Generate a UUID for database records
 */
export function generateUUID(): string {
  return crypto.getRandomValues(new Uint8Array(16))
    .map((b, i) => {
      if (i === 6) b = (b & 0x0f) | 0x40;
      if (i === 8) b = (b & 0x3f) | 0x80;
      return b.toString(16).padStart(2, '0');
    })
    .join('')
    .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/g, '$1-$2-$3-$4-$5');
}

/**
 * Validate a room ID format
 */
export function isValidRoomId(roomId: string): boolean {
  return /^[A-Z0-9]{6}$/.test(roomId);
}

/**
 * Validate a player ID format
 */
export function isValidPlayerId(playerId: string): boolean {
  return playerId.startsWith('player_') && playerId.length > 7;
}

/**
 * Format WPM for display
 */
export function formatWPM(wpm: number): string {
  return Math.round(wpm).toString();
}

/**
 * Format accuracy for display
 */
export function formatAccuracy(accuracy: number): string {
  return accuracy.toFixed(2) + '%';
}
