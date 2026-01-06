/**
 * Game scoring utilities
 */

/**
 * Calculate Words Per Minute (WPM)
 * Formula: (Characters Typed / 5) / (Seconds Elapsed / 60)
 *
 * @param charsTyped - Total characters typed
 * @param elapsedSeconds - Time elapsed in seconds
 * @returns WPM rounded to 2 decimal places
 */
export function calculateWPM(charsTyped: number, elapsedSeconds: number): number {
  if (elapsedSeconds === 0) return 0;
  const wpm = (charsTyped / 5) / (elapsedSeconds / 60);
  return Math.round(wpm * 100) / 100;
}

/**
 * Calculate accuracy percentage
 * Formula: (Correct Characters / Total Characters Typed) * 100
 *
 * @param correctChars - Number of correctly typed characters
 * @param totalCharsTyped - Total characters typed (including mistakes)
 * @returns Accuracy as percentage, rounded to 2 decimal places
 */
export function calculateAccuracy(correctChars: number, totalCharsTyped: number): number {
  if (totalCharsTyped === 0) return 0;
  const accuracy = (correctChars / totalCharsTyped) * 100;
  return Math.round(accuracy * 100) / 100;
}

/**
 * Calculate elapsed time in seconds
 * @param startTime - Start time in milliseconds
 * @returns Elapsed time in seconds
 */
export function calculateElapsedSeconds(startTime: number): number {
  const now = Date.now();
  return (now - startTime) / 1000;
}

/**
 * Determine placement based on WPM ranking
 * @param wpm - Words per minute
 * @param allWpms - Array of all WPM scores
 * @returns Placement (1-indexed, 1 = highest WPM)
 */
export function calculatePlacement(wpm: number, allWpms: number[]): number {
  const sortedWpms = [...allWpms].sort((a, b) => b - a);
  const placement = sortedWpms.findIndex(w => w === wpm) + 1;
  return placement > 0 ? placement : allWpms.length;
}
