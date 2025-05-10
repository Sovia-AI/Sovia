
/**
 * Utility functions for generating unique IDs for messages and requests
 */

/**
 * Creates a unique message ID with an optional prefix
 * @param prefix Optional prefix for the message ID
 * @returns A unique message ID string
 */
export function createMessageId(prefix: string = 'msg'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Creates a unique request ID with an optional prefix
 * @param prefix Optional prefix for the request ID
 * @returns A unique request ID string
 */
export function createRequestId(prefix: string = 'req'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Creates a unique memory ID with an optional prefix
 * @param prefix Optional prefix for the memory ID
 * @returns A unique memory ID string
 */
export function createMemoryId(prefix: string = 'mem'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Creates a unique agent ID with an optional prefix
 * @param prefix Optional prefix for the agent ID
 * @returns A unique agent ID string
 */
export function generateAgentId(prefix: string = 'agent'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}
