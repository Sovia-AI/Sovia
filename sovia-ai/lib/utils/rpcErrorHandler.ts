
/**
 * Utility functions for handling RPC errors and endpoint rotation
 */

// Custom event for RPC errors to trigger endpoint rotation
const RPC_ERROR_EVENT = 'solana-rpc-error';

// RPC error codes that should trigger endpoint rotation
const RPC_ERROR_CODES = [
  -32000, // JSON RPC invalid request
  -32001, // JSON RPC method not found
  -32002, // JSON RPC invalid params
  -32005, // JSON RPC timeout
  -32006, // JSON RPC aborted
  -32603, // JSON RPC internal error
  429,    // Too many requests
  408,    // Request timeout
];

// RPC error messages that should trigger endpoint rotation
const RPC_ERROR_MESSAGES = [
  'failed to fetch',
  'network error',
  'timeout',
  'connection refused',
  'abort',
  'cannot estimate fee',
  'rate limit',
  'cluster down',
  'cluster unavailable',
  'Node is unhealthy',
  'Service unavailable',
  'Too many requests',
  '429',
  'ERR_INSUFFICIENT_RESOURCES',
  'ECONNABORTED',
  'ECONNREFUSED',
  'ECONNRESET',
  'EHOSTUNREACH',
  'ETIMEDOUT',
];

/**
 * Check if an error is an RPC error that should trigger endpoint rotation
 */
export function isRpcError(error: any): boolean {
  if (!error) return false;
  
  // Check error code
  if (error.code && RPC_ERROR_CODES.includes(error.code)) {
    return true;
  }
  
  // Check error message
  if (error.message) {
    return RPC_ERROR_MESSAGES.some(msg => 
      error.message.toLowerCase().includes(msg.toLowerCase())
    );
  }
  
  return false;
}

/**
 * Dispatch a custom event to signal RPC connection issues
 * This will trigger the endpoint rotation in WalletContextProvider
 */
export function dispatchRpcError(error: any) {
  // Check if this is an RPC error
  if (!isRpcError(error)) return;
  
  // Log the error for debugging
  console.error('Solana RPC Error:', error);
  
  // Create and dispatch a custom event
  const errorEvent = new CustomEvent(RPC_ERROR_EVENT, { 
    detail: { 
      message: error?.message || 'Unknown RPC error',
      code: error?.code,
      timestamp: Date.now()
    } 
  });
  
  window.dispatchEvent(errorEvent);
}

/**
 * Wrap a function with RPC error handling
 * This will catch RPC errors and dispatch the custom event
 */
export function withRpcErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      // Check if this is likely an RPC error
      if (isRpcError(error)) {
        dispatchRpcError(error);
      }
      throw error;
    }
  }) as T;
}

/**
 * Helper function to add retry capability to async functions
 * with exponential backoff and jitter
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 500,
  maxDelay: number = 10000
): Promise<T> {
  let retries = 0;
  let lastError: any = null;
  
  while (true) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Dispatch RPC error if applicable
      if (isRpcError(error)) {
        dispatchRpcError(error);
      }
      
      if (retries >= maxRetries) {
        console.error(`Failed after ${retries} retries:`, error);
        throw error;
      }
      
      // Calculate delay with exponential backoff and jitter
      const jitter = Math.random() * 0.5 + 0.75; // 0.75-1.25 range for jitter
      let delay = initialDelay * Math.pow(2, retries) * jitter;
      
      // Cap at maximum delay
      delay = Math.min(delay, maxDelay);
      
      console.log(`Retrying after ${Math.round(delay)}ms (${retries + 1}/${maxRetries})...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      retries++;
    }
  }
}

/**
 * Combine retry and RPC error handling
 */
export function withRetryAndRpcErrorHandling<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  return withRetry(() => withRpcErrorHandling(() => fn())(), maxRetries);
}

/**
 * Helper to check RPC endpoint health
 */
export async function checkRpcEndpointHealth(endpoint: string, timeout: number = 5000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getHealth'
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.result === 'ok';
  } catch (error) {
    console.warn(`Health check failed for endpoint ${endpoint}:`, error);
    return false;
  }
}
