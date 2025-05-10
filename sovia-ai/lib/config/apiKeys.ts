
// API Keys configuration
// This file contains utilities for securely handling API keys

import { toast } from "sonner";

// Session storage key for temporary API keys (not persisted across browser sessions)
const API_KEY_SESSION_PREFIX = 'temp_api_key_';

// Environment variable keys (for server-side usage)
export const ENV_API_KEYS = {
  OPENAI: 'OPENAI_API_KEY',
  ANTHROPIC: 'ANTHROPIC_API_KEY',
  PERPLEXITY: 'PERPLEXITY_API_KEY',
  GEMINI: 'GEMINI_API_KEY',
  WEATHERAPI: 'WEATHERAPI_KEY',
  HELIUS_RPC: 'HELIUS_RPC_KEY',
  BIRDEYE: 'BIRDEYE_API_KEY',
  PETFINDER: {
    API_KEY: 'PETFINDER_API_KEY',
    SECRET: 'PETFINDER_SECRET'
  },
  RAYDIUM: 'RAYDIUM_API_KEY',
  PUMPFUN: 'PUMPFUN_API_KEY'
};

// Export API keys for backward compatibility with existing code
// But these should be replaced with getApiKeyFromTemporaryStorage in new code
export const API_KEYS = {
  WEATHERAPI: "35b810ebe912460b9ca194502253004",
  BIRDEYE: "465a0d98f7874159bb83b6aae327b789",
  PETFINDER: {
    API_KEY: "AMiDYRJlWheIJs489hGhTKZv2LeozTX4ygOITadqE92RC7BJSB",
    SECRET: "kR4HQIlJGGivdANV3JHbX0Cd6wQwmaJtiOzlZ2uR" 
  },
  RAYDIUM: "DEMO_RAYDIUM_KEY_1234567890",
  PUMPFUN: "DEMO_PUMPFUN_KEY_1234567890"
};

// Placeholder for server-side environment variable
export const WEATHERAPI_KEY = API_KEYS.WEATHERAPI;

// Store API key temporarily (will be cleared when browser session ends)
export function storeApiKeyTemporarily(provider: string, apiKey: string): void {
  if (!apiKey) {
    return;
  }
  
  try {
    sessionStorage.setItem(`${API_KEY_SESSION_PREFIX}${provider}`, apiKey);
  } catch (error) {
    console.error('Error storing API key temporarily:', error);
    toast.error('Failed to store API key');
  }
}

// Retrieve API key from temporary storage
export function getApiKeyFromTemporaryStorage(provider: string): string | null {
  try {
    // Try to get from session storage first
    const storedKey = sessionStorage.getItem(`${API_KEY_SESSION_PREFIX}${provider}`);
    if (storedKey) return storedKey;
    
    // Otherwise fall back to hardcoded keys (for demo only)
    switch (provider.toLowerCase()) {
      case 'weatherapi':
        return API_KEYS.WEATHERAPI;
      case 'birdeye':
        return API_KEYS.BIRDEYE;
      case 'petfinder':
        return API_KEYS.PETFINDER.API_KEY;
      case 'petfinder_secret':
        return API_KEYS.PETFINDER.SECRET;
      case 'raydium':
        return API_KEYS.RAYDIUM;
      case 'pumpfun':
        return API_KEYS.PUMPFUN;
      default:
        return null;
    }
  } catch (error) {
    console.error('Error retrieving API key from temporary storage:', error);
    return null;
  }
}

// Remove API key from temporary storage
export function removeApiKeyFromTemporaryStorage(provider: string): void {
  try {
    sessionStorage.removeItem(`${API_KEY_SESSION_PREFIX}${provider}`);
  } catch (error) {
    console.error('Error removing API key from temporary storage:', error);
  }
}

// Clear all temporary API keys
export function clearAllTemporaryApiKeys(): void {
  try {
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith(API_KEY_SESSION_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing temporary API keys:', error);
  }
}

// Warning message about API keys
export function getApiKeySecurityMessage(): string {
  return 'API keys are stored temporarily in your browser session and will be cleared when you close the browser. For production use, consider using server-side storage.';
}
