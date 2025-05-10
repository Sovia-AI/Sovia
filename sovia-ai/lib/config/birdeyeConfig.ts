
/**
 * Birdeye API configuration
 */

export const BIRDEYE_CONFIG = {
  BASE_URL: "https://public-api.birdeye.so",
  ENDPOINTS: {
    TOKEN_OVERVIEW: "/defi/token_overview",
    OHLCV: "/defi/ohlcv",
    HISTORY_PRICE: "/defi/history_price",
    PAIR_OVERVIEW: "/defi/v3/pair/overview/single",
    TOKEN_HOLDER: "/defi/v3/token/holder",
    TOKEN_TRADE_DATA: "/defi/v3/token/trade-data/single",
    TOKEN_LIST: "/defi/tokenlist",
    TOKEN_LIST_SCROLL: "/defi/v3/token/list/scroll",
    TOKEN_TRENDING: "/defi/token_trending",
    TOKEN_NEW_LISTING: "/defi/v2/tokens/new_listing",
    TRADER_GAINERS_LOSERS: "/trader/gainers-losers"
  },
  API_URL: "https://public-api.birdeye.so",
  API_KEY: "465a0d98f7874159bb83b6aae327b789",
  CHAIN: "solana",
  WRAPPED_SOL: "So11111111111111111111111111111111111111112",
  TEST_TOKEN: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
};

// Improved token name cache to remember tokens we've seen
interface TokenCache {
  [address: string]: {
    name: string;
    symbol: string;
    lastUpdated: number;
    isVerified: boolean; // Flag to indicate if this came from an actual API response
  }
}

// In-memory cache for tokens we've seen via the API
const tokenNameCache: TokenCache = {};

/**
 * Extract token from user query
 */
export function extractTokenFromQuery(query: string, preserveCase = false): string | null {
  // Basic token extraction logic
  const tokenRegexPatterns = [
    /\b(sol|solana|bonk|jup|jupiter|jito|pyth|wen|wif|usdc|usdt|eth|btc|mango|orca|raydium)\b/i,
    /\b[1-9A-HJ-NP-Za-km-z]{32,44}(?:pump)?\b/
  ];
  
  for (const pattern of tokenRegexPatterns) {
    const match = query.match(pattern);
    if (match && match[0]) {
      return preserveCase ? match[0] : match[0].toLowerCase();
    }
  }
  
  return null;
}

/**
 * Check if a string is a valid Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  // Basic validation for Solana address format 
  // (should be base58 encoded, 32-44 characters)
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  // Check for valid Solana address format including pump suffix
  const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}(?:pump)?$/i;
  return solanaAddressRegex.test(address);
}

/**
 * Determine analysis type from query
 */
export function getAnalysisType(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  if (/technical|rsi|macd|chart|resistance|support|indicator|trend/i.test(lowerQuery)) {
    return 'technical';
  }
  
  if (/fundamental|project|team|tokenomics|utility|use case/i.test(lowerQuery)) {
    return 'fundamental';
  }
  
  return 'overview';
}

/**
 * Get token name from cache with improved token resolution
 */
export function getTokenFromCache(address: string): { name: string; symbol: string; isVerified?: boolean } | null {
  // Direct cache lookup - check if we have this exact address
  if (tokenNameCache[address] && Date.now() - tokenNameCache[address].lastUpdated < 24 * 60 * 60 * 1000) {
    return {
      name: tokenNameCache[address].name,
      symbol: tokenNameCache[address].symbol,
      isVerified: tokenNameCache[address].isVerified
    };
  }
  
  // Check for pump variant in cache by removing suffix
  if (address.toLowerCase().endsWith('pump')) {
    const baseAddress = address.slice(0, -4);
    if (tokenNameCache[baseAddress] && Date.now() - tokenNameCache[baseAddress].lastUpdated < 24 * 60 * 60 * 1000) {
      // Create pump variant based on base token
      const pumpName = `${tokenNameCache[baseAddress].name} PUMP`;
      const pumpSymbol = `${tokenNameCache[baseAddress].symbol}PUMP`;
      
      // Cache this pump variant for future use
      saveTokenToCache(address, pumpName, pumpSymbol, tokenNameCache[baseAddress].isVerified);
      
      return {
        name: pumpName,
        symbol: pumpSymbol,
        isVerified: tokenNameCache[baseAddress].isVerified
      };
    }
  }
  
  // Check for base variant in cache by adding pump suffix
  if (!address.toLowerCase().endsWith('pump')) {
    const pumpAddress = `${address}pump`;
    if (tokenNameCache[pumpAddress] && Date.now() - tokenNameCache[pumpAddress].lastUpdated < 24 * 60 * 60 * 1000) {
      // Create base variant from pump token
      const baseName = tokenNameCache[pumpAddress].name.replace(/ PUMP$/, '');
      const baseSymbol = tokenNameCache[pumpAddress].symbol.replace(/PUMP$/, '');
      
      // Cache this base variant for future use
      saveTokenToCache(address, baseName, baseSymbol, tokenNameCache[pumpAddress].isVerified);
      
      return {
        name: baseName,
        symbol: baseSymbol,
        isVerified: tokenNameCache[pumpAddress].isVerified
      };
    }
  }
  
  return null;
}

/**
 * Save token to cache with timestamp
 */
export function saveTokenToCache(
  address: string, 
  name: string, 
  symbol: string, 
  isVerified: boolean = false
): void {
  if (!address || !name || !symbol) {
    console.warn(`Attempted to save incomplete token data to cache: ${address}, ${name}, ${symbol}`);
    return;
  }

  // Don't overwrite verified token data with unverified data
  if (
    tokenNameCache[address] && 
    tokenNameCache[address].isVerified && 
    !isVerified &&
    Date.now() - tokenNameCache[address].lastUpdated < 24 * 60 * 60 * 1000
  ) {
    console.log(`Not overwriting verified token data for ${address} with unverified data`);
    return;
  }

  tokenNameCache[address] = {
    name,
    symbol,
    lastUpdated: Date.now(),
    isVerified
  };
  
  console.log(`Saved token to cache: ${address} = ${name} (${symbol}), verified: ${isVerified}`);
}

/**
 * Generate placeholder data for common tokens or unknown tokens with improved naming
 */
export function generatePlaceholderTokenData(tokenSymbol: string): any {
  const lowerToken = tokenSymbol.toLowerCase();
  
  // Check cache first for more accurate token data
  const cachedToken = getTokenFromCache(tokenSymbol);
  if (cachedToken) {
    console.log(`Using cached token data for ${tokenSymbol}: ${cachedToken.name} (${cachedToken.symbol})`);
    return {
      name: cachedToken.name,
      symbol: cachedToken.symbol,
      address: tokenSymbol,
      decimals: 9,
      price: 0.5,
      marketCap: 10000000,
      fdv: 25000000,
      liquidity: 1000000,
      holder: 5000,
      priceChange24hPercent: 0,
      priceChange1hPercent: 0
    };
  }
  
  // Common tokens with predefined data
  if (lowerToken === 'sol' || lowerToken === 'solana') {
    return {
      name: "Solana",
      symbol: "SOL",
      address: "So11111111111111111111111111111111111111112",
      decimals: 9,
      price: 148.5,
      marketCap: 78000000000,
      fdv: 90000000000,
      liquidity: 13500000000,
      holder: 1700000,
      priceChange24hPercent: 2.4,
      priceChange1hPercent: 0.2
    };
  }
  
  if (lowerToken === 'bonk') {
    return {
      name: "Bonk",
      symbol: "BONK",
      address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
      decimals: 5,
      price: 0.000028,
      marketCap: 1800000000,
      fdv: 2100000000,
      liquidity: 45000000,
      holder: 390000,
      priceChange24hPercent: -1.5,
      priceChange1hPercent: 0.3
    };
  }
  
  // For unknown tokens with pump suffix, extract base address for better names
  const pumpMatch = tokenSymbol.match(/^([1-9A-HJ-NP-Za-km-z]{32,44})pump$/i);
  if (pumpMatch && pumpMatch[1]) {
    const baseAddress = pumpMatch[1];
    const baseTokenCached = getTokenFromCache(baseAddress);
    
    if (baseTokenCached) {
      const pumpedName = `${baseTokenCached.name} PUMP`;
      const pumpedSymbol = `${baseTokenCached.symbol}PUMP`;
      
      // Save to cache
      saveTokenToCache(tokenSymbol, pumpedName, pumpedSymbol);
      
      return {
        name: pumpedName,
        symbol: pumpedSymbol,
        address: tokenSymbol,
        decimals: 9,
        price: 0.5,
        marketCap: 10000000,
        fdv: 25000000,
        liquidity: 1000000,
        holder: 5000,
        priceChange24hPercent: 0,
        priceChange1hPercent: 0
      };
    }
  }
  
  // For completely unknown tokens, create a more descriptive placeholder
  // Extract a meaningful display from the address
  const shortAddr = `${tokenSymbol.substring(0, 4)}...${tokenSymbol.substring(tokenSymbol.length - 4)}`;
  const displaySymbol = tokenSymbol.substring(0, 4).toUpperCase();
  const displayName = `Token (${shortAddr})`;
  
  // Save to cache for future use
  saveTokenToCache(tokenSymbol, displayName, displaySymbol);
  
  return {
    name: displayName,
    symbol: displaySymbol,
    address: tokenSymbol,
    decimals: 9,
    price: 0.5,
    marketCap: 10000000,
    fdv: 25000000,
    liquidity: 1000000,
    holder: 5000,
    priceChange24hPercent: 0,
    priceChange1hPercent: 0
  };
}
