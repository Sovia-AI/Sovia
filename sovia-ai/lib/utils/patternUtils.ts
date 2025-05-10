
/**
 * Pattern matching utility functions
 */

// Helper function to match patterns
export function matchesAnyPattern(input: string, patterns: RegExp[]): boolean {
  return patterns.some(pattern => pattern.test(input));
}
