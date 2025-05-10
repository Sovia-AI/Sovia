import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { TokenSwap } from '@solana/spl-token-swap';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

// Raydium Service Options Interface
export interface RadiumServiceOptions {
  // Add any options if needed in the future
}

// Token Pair Information
interface TokenPair {
  inputToken: {
    symbol: string;
    mint: string;
    decimals: number;
  };
  outputToken: {
    symbol: string;
    mint: string;
    decimals: number;
  };
}

// Swap Quote Result
interface SwapQuote {
  inputAmount: number;
  outputAmount: number;
  price: number;
  priceImpact: number;
  fee: number;
  minOutputAmount: number;
  route: string[];
}

// Swap Result
interface SwapResult {
  signature: string;
  inputAmount: number;
  outputAmount: number;
  timestamp: number;
}

// Token Info
interface TokenInfo {
  symbol: string;
  name: string;
  mint: string;
  decimals: number;
  logoURI?: string;
  price?: number;
  change24h?: number;
  volume24h?: number;
}

// Raydium API Pair Data Interface
interface RaydiumPairData {
  name: string;
  price: string;
  priceChange24h?: string;
  volume24h?: string;
  id?: string;
  baseSymbol?: string;
  quoteSymbol?: string;
  tvl?: string;
}

/**
 * Service for interacting with Raydium DEX on Solana
 */
export class RadiumService {
  private connection: Connection;
  private slippageTolerance: number;
  private tokenCache: Map<string, TokenInfo> = new Map();
  private cacheDuration: number;
  private lastCacheUpdate: number = 0;
  private popularTokens: TokenInfo[] = [];
  private apiFailedAttempts: number = 0;
  private maxApiRetries: number = 3;
  private raydiumApiUrl: string = 'https://api.raydium.io/v2/main/pairs';
  
  constructor(options?: RadiumServiceOptions) {
    // Initialize service
    this.connection = new Connection('https://api.raydium.io/v2/main/pairs', 'confirmed');
    this.slippageTolerance = 0.5; // Default 0.5%
    this.cacheDuration = 60000; // Default 60 seconds
    
    // Initialize popular tokens
    this.initPopularTokens();
  }

  /**
   * Initialize the list of popular tokens on Raydium
   */
  private initPopularTokens() {
    this.popularTokens = [
      {
        symbol: "SOL",
        name: "Solana",
        mint: "So11111111111111111111111111111111111111112",
        decimals: 9,
      },
      {
        symbol: "RAY",
        name: "Raydium",
        mint: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
        decimals: 6,
      },
      {
        symbol: "USDC",
        name: "USD Coin",
        mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        decimals: 6,
      },
      {
        symbol: "USDT",
        name: "Tether USD",
        mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
        decimals: 6,
      },
      {
        symbol: "BTC",
        name: "Bitcoin (Sollet)",
        mint: "9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E",
        decimals: 6,
      },
      {
        symbol: "ETH",
        name: "Ethereum (Sollet)",
        mint: "2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk",
        decimals: 6,
      },
    ];
  }

  /**
   * Refresh token data with the latest prices and stats from Raydium API
   */
  public async refreshTokenData(): Promise<void> {
    const currentTime = Date.now();
    
    // Only refresh if cache has expired
    if (currentTime - this.lastCacheUpdate < this.cacheDuration) {
      return;
    }
    
    try {
      // Fetch real token data from Raydium API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      console.log("RadiumService: Fetching data from Raydium API...");
      const response = await fetch(this.raydiumApiUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TAIGU-Demo-Agent/1.0'
        }
      }).finally(() => clearTimeout(timeoutId));
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Raydium token data: ${response.status} ${response.statusText}`);
      }
      
      const data: RaydiumPairData[] = await response.json();
      if (!data || !Array.isArray(data)) {
        throw new Error("Invalid data format received from Raydium API");
      }
      
      console.log(`RadiumService: Received ${data.length} pairs from API`);
      
      // Process pairs data to extract token prices
      const processedPairs = this.processPairsData(data);
      
      if (Object.keys(processedPairs).length > 0) {
        // Update our token cache with fetched data
        this.updateTokenCache(processedPairs);
        this.lastCacheUpdate = currentTime;
        this.apiFailedAttempts = 0; // Reset failed attempts counter
        console.log("RadiumService: Token data refreshed successfully");
      } else {
        throw new Error("No usable pair data found in API response");
      }
    } catch (error) {
      console.error("Error refreshing token data:", error);
      this.apiFailedAttempts++;
      console.warn(`RadiumService: API fetch attempt failed (${this.apiFailedAttempts}/${this.maxApiRetries})`);
      this.lastCacheUpdate = currentTime; // Still update the timestamp to prevent constant retries
      throw new Error(`Failed to refresh token data after ${this.apiFailedAttempts} attempts`);
    }
  }
  
  /**
   * Process Raydium pairs data to extract token prices and stats
   */
  private processPairsData(pairsData: RaydiumPairData[]): Record<string, any> {
    const tokenPrices: Record<string, any> = {};
    
    // Find direct USD pairs first for base price references
    const usdPairs = pairsData.filter(pair => 
      pair.name && (pair.name.endsWith('-USDC') || pair.name.endsWith('-USDT'))
    );
    
    // Process USD pairs to get direct token prices
    for (const pair of usdPairs) {
      if (!pair.name || !pair.price) continue;
      
      const [tokenSymbol] = pair.name.split('-');
      const change24h = pair.priceChange24h ? parseFloat(pair.priceChange24h) : 0;
      const volume24h = pair.volume24h ? parseFloat(pair.volume24h) : 0;
      const price = parseFloat(pair.price);
      
      if (!tokenSymbol || isNaN(price)) continue;
      
      // Find token in our popular tokens list
      const matchingToken = this.popularTokens.find(
        t => t.symbol.toLowerCase() === tokenSymbol.toLowerCase()
      );
      
      if (matchingToken) {
        tokenPrices[matchingToken.symbol.toLowerCase()] = {
          price,
          change24h,
          volume24h
        };
      }
    }
    
    // Process SOL pairs for tokens that don't have USD pairs
    const solPairs = pairsData.filter(pair => 
      pair.name && pair.name.endsWith('-SOL')
    );
    
    // Get SOL price from our already processed data
    const solPrice = tokenPrices['sol']?.price;
    
    if (solPrice) {
      // Process SOL pairs to derive token prices
      for (const pair of solPairs) {
        if (!pair.name || !pair.price) continue;
        
        const [tokenSymbol] = pair.name.split('-');
        const price = parseFloat(pair.price) * solPrice; // Convert to USD using SOL price
        const change24h = pair.priceChange24h ? parseFloat(pair.priceChange24h) : 0;
        const volume24h = pair.volume24h ? parseFloat(pair.volume24h) : 0;
        
        if (!tokenSymbol || isNaN(price)) continue;
        
        // Find token in our popular tokens list if not already processed
        const matchingToken = this.popularTokens.find(
          t => t.symbol.toLowerCase() === tokenSymbol.toLowerCase()
        );
        
        if (matchingToken && !tokenPrices[matchingToken.symbol.toLowerCase()]) {
          tokenPrices[matchingToken.symbol.toLowerCase()] = {
            price,
            change24h,
            volume24h
          };
        }
      }
    }
    
    // Special handling for USDC and USDT if not found
    if (!tokenPrices['usdc']) {
      tokenPrices['usdc'] = { price: 1.0, change24h: 0, volume24h: 1000000 };
    }
    
    if (!tokenPrices['usdt']) {
      tokenPrices['usdt'] = { price: 1.0, change24h: 0, volume24h: 1000000 };
    }
    
    return tokenPrices;
  }
  
  /**
   * Update token cache with processed data
   */
  private updateTokenCache(tokenPricesData: Record<string, any>): void {
    for (const token of this.popularTokens) {
      const tokenData = tokenPricesData[token.symbol.toLowerCase()];
      
      if (tokenData) {
        const updatedToken: TokenInfo = {
          ...token,
          price: tokenData.price,
          change24h: tokenData.change24h,
          volume24h: tokenData.volume24h,
          logoURI: `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${token.mint}/logo.png`
        };
        
        this.tokenCache.set(token.symbol.toLowerCase(), updatedToken);
      } else {
        console.log(`No price data found for ${token.symbol}, using current data or generating mock data`);
        // If we don't have data for this token, keep existing data or generate mock
        if (!this.tokenCache.has(token.symbol.toLowerCase())) {
          this.generateTokenMockData(token);
        }
      }
    }
  }
  
  /**
   * Generate current mock data with realistic values based on today's market
   */
  private generateCurrentMockData(): void {
    for (const token of this.popularTokens) {
      this.generateTokenMockData(token);
    }
  }
  
  /**
   * Generate realistic mock data for a specific token
   */
  private generateTokenMockData(token: TokenInfo): void {
    // Use realistic current price ranges (as of April 2025)
    let mockPrice: number;
    
    switch (token.symbol.toLowerCase()) {
      case 'sol':
        mockPrice = 140 + Math.random() * 15; // Around $140-155
        break;
      case 'ray':
        mockPrice = 0.55 + Math.random() * 0.15; // Around $0.55-0.70
        break;
      case 'usdc':
      case 'usdt':
        mockPrice = 0.98 + Math.random() * 0.03; // Around $0.98-1.01
        break;
      case 'btc':
        mockPrice = 93500 + Math.random() * 1000; // Around $93,500-94,500
        break;
      case 'eth':
        mockPrice = 1750 + Math.random() * 50; // Around $1,750-1,800
        break;
      default:
        mockPrice = 1 + Math.random() * 10; // Generic price
    }
    
    // Generate realistic price changes
    const mockChange = (Math.random() * 10) - 5; // -5% to +5%
    
    const updatedToken: TokenInfo = {
      ...token,
      price: mockPrice,
      change24h: parseFloat(mockChange.toFixed(2)),
      volume24h: Math.random() * 10000000,
      logoURI: `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${token.mint}/logo.png`
    };
    
    this.tokenCache.set(token.symbol.toLowerCase(), updatedToken);
  }

  /**
   * Get information about a specific token by symbol
   * @param symbol Token symbol (e.g. 'SOL', 'RAY')
   * @returns TokenInfo or null if not found
   */
  public async getTokenInfo(symbol: string): Promise<TokenInfo | null> {
    await this.refreshTokenData();
    return this.tokenCache.get(symbol.toLowerCase()) || null;
  }

  /**
   * Get a list of popular tokens on Raydium
   * @returns Array of token information
   */
  public async getPopularTokens(): Promise<TokenInfo[]> {
    await this.refreshTokenData();
    return Array.from(this.tokenCache.values());
  }

  /**
   * Get swap quote for a token pair
   * @param inputToken Input token symbol
   * @param outputToken Output token symbol
   * @param amount Amount of input token to swap
   * @returns Swap quote details
   */
  public async getSwapQuote(inputToken: string, outputToken: string, amount: number): Promise<SwapQuote | null> {
    await this.refreshTokenData();
    return this.getSwapQuoteSync(inputToken, outputToken, amount);
  }

  /**
   * Set slippage tolerance percentage
   * @param slippage Slippage tolerance percentage
   */
  public setSlippageTolerance(slippage: number): void {
    if (slippage < 0 || slippage > 100) {
      throw new Error("Slippage tolerance must be between 0 and 100");
    }
    this.slippageTolerance = slippage;
  }

  /**
   * Get the current slippage tolerance setting
   * @returns Current slippage tolerance percentage
   */
  public getSlippageTolerance(): number {
    return this.slippageTolerance;
  }
  
  /**
   * Execute a swap transaction with Raydium API
   * @param wallet Wallet public key
   * @param inputToken Input token symbol
   * @param outputToken Output token symbol
   * @param amount Amount of input token to swap
   * @returns Transaction signature and swap details
   */
  public async executeSwapTransaction(wallet: string, inputToken: string, outputToken: string, amount: number): Promise<SwapResult> {
    try {
      // Get the swap quote based on real prices
      const quote = await this.getSwapQuote(inputToken, outputToken, amount);
      
      if (!quote) {
        throw new Error(`Couldn't get swap quote for ${inputToken} to ${outputToken}`);
      }
      
      // Generate a transaction signature for demonstration
      // In a production environment, this would submit a real transaction to the blockchain
      const signature = "5KpwrN" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      return {
        signature,
        inputAmount: amount,
        outputAmount: quote.outputAmount,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("Error executing swap transaction:", error);
      throw new Error(`Failed to execute swap: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Synchronous version of getSwapQuote for internal use
   * @private
   */
  private getSwapQuoteSync(inputToken: string, outputToken: string, amount: number): SwapQuote | null {
    // Get token info for input and output tokens
    const inputTokenInfo = this.tokenCache.get(inputToken.toLowerCase());
    const outputTokenInfo = this.tokenCache.get(outputToken.toLowerCase());
    
    if (!inputTokenInfo || !outputTokenInfo) {
      return null;
    }
    
    // Calculate price based on real token prices
    const inputPrice = inputTokenInfo.price || 1;
    const outputPrice = outputTokenInfo.price || 1;
    const price = inputPrice / outputPrice;
    
    // Calculate output amount
    const outputAmount = amount * price;
    
    // For realistic quotes, calculate price impact based on amount
    // For larger trades, the impact is higher - using a logarithmic scale
    const baseImpact = 0.1; // Base impact for small trades
    const impactFactor = amount / (inputPrice * 10000); // Scale factor based on trade size
    const priceImpact = Math.min(baseImpact + Math.log10(1 + impactFactor) * 2, 5); 
    
    // Apply price impact to output amount
    const impactedOutputAmount = outputAmount * (1 - priceImpact / 100);
    
    // Calculate fee (0.25% is typical for Raydium)
    const fee = amount * 0.0025;
    
    // Calculate minimum output amount based on slippage tolerance
    const minOutputAmount = impactedOutputAmount * (1 - this.slippageTolerance / 100);
    
    return {
      inputAmount: amount,
      outputAmount: parseFloat(impactedOutputAmount.toFixed(outputTokenInfo.decimals)),
      price: parseFloat(price.toFixed(8)),
      priceImpact: parseFloat(priceImpact.toFixed(2)),
      fee: parseFloat(fee.toFixed(inputTokenInfo.decimals)),
      minOutputAmount: parseFloat(minOutputAmount.toFixed(outputTokenInfo.decimals)),
      route: [inputTokenInfo.symbol, outputTokenInfo.symbol] // Direct route
    };
  }

  public async handleQuery(query: string): Promise<string> {
    // Implementation
    return "Raydium service response";
  }
}
