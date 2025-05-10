
import axios from 'axios';
import { OHLCVData, PairOverviewData, TokenHolderData, TokenTradeData } from '../types/marketTypes';
import { getApiKeyFromTemporaryStorage } from '../config/apiKeys';
import { TOKENS, getTokenByAddress, getTokenBySymbol } from '../config/tokenConfig';
import { BIRDEYE_CONFIG, saveTokenToCache, getTokenFromCache, isValidSolanaAddress } from '../config/birdeyeConfig';

export class BirdeyeService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    // Use the getApiKeyFromTemporaryStorage function to get the API key
    this.apiKey = getApiKeyFromTemporaryStorage('birdeye') || 
                  BIRDEYE_CONFIG.API_KEY; // Fallback to example API key
    this.baseUrl = BIRDEYE_CONFIG.BASE_URL;
  }

  /**
   * Get default request options with API key and chain
   */
  private getRequestOptions() {
    return {
      headers: {
        accept: 'application/json',
        'x-chain': BIRDEYE_CONFIG.CHAIN,
        'X-API-KEY': this.apiKey
      }
    };
  }

  /**
   * Fetch token data from Birdeye API with improved error handling
   * @param tokenAddress Address or symbol of the token to fetch data for
   * @returns Token data from Birdeye API
   */
  async fetchTokenData(tokenAddress: string) {
    try {
      // First check if this is a known token in our tokenConfig
      const knownToken = getTokenByAddress(tokenAddress) || getTokenBySymbol(tokenAddress);
      
      if (knownToken) {
        console.log(`Found known token in config: ${knownToken.symbol} (${knownToken.name})`);
        // Use the address as is - don't modify pump addresses
        tokenAddress = knownToken.address;
      }
      
      // Store the original address for later use
      const originalAddress = tokenAddress;
      
      if (!isValidSolanaAddress(tokenAddress)) {
        console.warn(`Invalid Solana address format: ${tokenAddress}`);
        return this.generateMockTokenData(tokenAddress);
      }

      const options = this.getRequestOptions();

      console.log(`Fetching token data for address: ${tokenAddress}`);
      try {
        // Try with the full address first (including pump suffix if present)
        let response = await axios.get(
          `${this.baseUrl}${BIRDEYE_CONFIG.ENDPOINTS.TOKEN_OVERVIEW}?address=${tokenAddress}`,
          options
        );
        
        if (response.data && response.data.success && response.data.data) {
          console.log(`Got token data from API: ${response.data.data.name || "Unknown"} (${response.data.data.symbol || "Unknown"})`);
          
          // Cache the token name and symbol
          if (response.data.data.name && response.data.data.symbol) {
            saveTokenToCache(
              originalAddress, 
              response.data.data.name, 
              response.data.data.symbol,
              true // This is verified data from API
            );
          }
          
          return response.data;
        } else {
          // If the full address fails and it has a pump suffix, try the base address
          const pumpSuffixRegex = /^([1-9A-HJ-NP-Za-km-z]{32,44})pump$/i;
          const pumpMatch = tokenAddress.match(pumpSuffixRegex);
          
          if (pumpMatch) {
            const baseAddress = pumpMatch[1];
            console.log(`First attempt failed. Trying base address without 'pump' suffix: ${baseAddress}`);
            
            try {
              response = await axios.get(
                `${this.baseUrl}${BIRDEYE_CONFIG.ENDPOINTS.TOKEN_OVERVIEW}?address=${baseAddress}`,
                options
              );
              
              if (response.data && response.data.success && response.data.data) {
                console.log(`Got token data from API using base address: ${response.data.data.name || "Unknown"}`);
                
                // Modify the response to indicate it's a pump variant
                const pumpedName = `${response.data.data.name} PUMP`;
                const pumpedSymbol = `${response.data.data.symbol}PUMP`;
                
                response.data.data.name = pumpedName;
                response.data.data.symbol = pumpedSymbol;
                response.data.data.address = originalAddress;
                
                // Cache both the original and base versions
                saveTokenToCache(originalAddress, pumpedName, pumpedSymbol, true);
                saveTokenToCache(baseAddress, response.data.data.name, response.data.data.symbol, true);
                
                return response.data;
              }
            } catch (baseAddressError) {
              console.error('Error with base address API call:', baseAddressError);
            }
          }
          
          console.warn('Birdeye API returned unsuccessful response:', response.data);
          return this.generateMockTokenData(originalAddress);
        }
      } catch (apiError) {
        console.error('Error in Birdeye API call:', apiError);
        
        // Try the base address as fallback if this has a pump suffix
        const pumpSuffixRegex = /^([1-9A-HJ-NP-Za-km-z]{32,44})pump$/i;
        const pumpMatch = tokenAddress.match(pumpSuffixRegex);
        
        if (pumpMatch) {
          const baseAddress = pumpMatch[1];
          console.log(`API call failed. Trying base address: ${baseAddress}`);
          
          try {
            const response = await axios.get(
              `${this.baseUrl}${BIRDEYE_CONFIG.ENDPOINTS.TOKEN_OVERVIEW}?address=${baseAddress}`,
              options
            );
            
            if (response.data && response.data.success && response.data.data) {
              // Create a pump variant from the base token data
              const pumpedName = `${response.data.data.name} PUMP`;
              const pumpedSymbol = `${response.data.data.symbol}PUMP`;
              
              response.data.data.name = pumpedName;
              response.data.data.symbol = pumpedSymbol;
              response.data.data.address = originalAddress;
              
              // Cache both versions
              saveTokenToCache(originalAddress, pumpedName, pumpedSymbol, true);
              saveTokenToCache(baseAddress, response.data.data.name, response.data.data.symbol, true);
              
              return response.data;
            }
          } catch (fallbackError) {
            console.error('Error in fallback API call with base address:', fallbackError);
          }
        }
        
        // Generate mock data if all API calls fail
        return this.generateMockTokenData(originalAddress);
      }
    } catch (error) {
      console.error('Error in fetchTokenData:', error);
      return this.generateMockTokenData(tokenAddress);
    }
  }

  /**
   * Fetch wrapped SOL data from Birdeye API
   * @returns Wrapped SOL data
   */
  async fetchWrappedSolData() {
    return this.fetchTokenData(BIRDEYE_CONFIG.WRAPPED_SOL);
  }

  /**
   * Fetch the candle OHLCV data from Birdeye API
   * @param tokenAddress The token address to fetch data for
   * @param timeframe The timeframe for the data (e.g., '15m', '1h', '4h', '1d')
   * @param limit The number of candles to return
   * @param currency The currency for price (default: 'usd')
   * @returns Array of OHLCV data
   */
  async fetchOHLCVData(
    tokenAddress: string, 
    timeframe: string = '1d', 
    limit: number = 30,
    currency: string = 'usd'
  ): Promise<OHLCVData[]> {
    try {
      // Check if this is a known token and use the main address
      const knownToken = getTokenByAddress(tokenAddress) || getTokenBySymbol(tokenAddress);
      
      if (knownToken) {
        console.log(`Using token address from config: ${knownToken.address}`);
        tokenAddress = knownToken.address;
      }
      
      // Store original address for later reference
      const originalAddress = tokenAddress;
      
      if (!isValidSolanaAddress(tokenAddress)) {
        console.warn(`Invalid Solana address format for OHLCV data: ${tokenAddress}`);
        return this.generateMockOHLCVData(tokenAddress, limit);
      }

      const options = this.getRequestOptions();

      // Try with the full address first (including pump suffix if present)
      const url = `${this.baseUrl}${BIRDEYE_CONFIG.ENDPOINTS.OHLCV}?address=${tokenAddress}&type=${timeframe}&limit=${limit}&currency=${currency}`;
      console.log(`Fetching OHLCV data from: ${url}`);
      
      try {
        const response = await axios.get(url, options);
        
        if (response.data && response.data.success && response.data.data && response.data.data.items && Array.isArray(response.data.data.items)) {
          const items = response.data.data.items;
          console.log(`Successfully retrieved ${items.length} OHLCV data points`);
          
          // Transform the data to match OHLCVData format
          return items.map(item => ({
            timestamp: item.unixTime * 1000, // Convert to milliseconds
            open: parseFloat(item.o || item.open),
            high: parseFloat(item.h || item.high),
            low: parseFloat(item.l || item.low),
            close: parseFloat(item.c || item.close),
            volume: parseFloat(item.v || item.volume)
          }));
        }
        
        // If the full address fails and it has a pump suffix, try the base address
        const pumpSuffixRegex = /^([1-9A-HJ-NP-Za-km-z]{32,44})pump$/i;
        const pumpMatch = tokenAddress.match(pumpSuffixRegex);
        
        if (pumpMatch) {
          const baseAddress = pumpMatch[1];
          console.log(`First OHLCV attempt failed. Trying base address: ${baseAddress}`);
          
          const baseResponse = await axios.get(
            `${this.baseUrl}${BIRDEYE_CONFIG.ENDPOINTS.OHLCV}?address=${baseAddress}&type=${timeframe}&limit=${limit}&currency=${currency}`, 
            options
          );
          
          if (baseResponse.data && baseResponse.data.success && baseResponse.data.data && baseResponse.data.data.items && Array.isArray(baseResponse.data.data.items)) {
            const items = baseResponse.data.data.items;
            console.log(`Successfully retrieved ${items.length} OHLCV data points from base address`);
            
            // Transform the data
            return items.map(item => ({
              timestamp: item.unixTime * 1000,
              open: parseFloat(item.o || item.open),
              high: parseFloat(item.h || item.high),
              low: parseFloat(item.l || item.low),
              close: parseFloat(item.c || item.close),
              volume: parseFloat(item.v || item.volume)
            }));
          }
        }

        // Try using the history price endpoint as a fallback
        return this.fetchHistoricalPriceData(tokenAddress, timeframe, limit);
      } catch (error) {
        console.error(`Error fetching OHLCV data: ${error}`);
        
        // Try with base address as fallback if this is a pump token
        const pumpMatch = tokenAddress.match(/^([1-9A-HJ-NP-Za-km-z]{32,44})pump$/i);
        if (pumpMatch) {
          const baseAddress = pumpMatch[1];
          console.log(`Trying OHLCV with base address: ${baseAddress}`);
          
          try {
            const fallbackResponse = await axios.get(
              `${this.baseUrl}${BIRDEYE_CONFIG.ENDPOINTS.OHLCV}?address=${baseAddress}&type=${timeframe}&limit=${limit}&currency=${currency}`,
              options
            );
            
            if (fallbackResponse.data && fallbackResponse.data.success && fallbackResponse.data.data && fallbackResponse.data.data.items && Array.isArray(fallbackResponse.data.data.items)) {
              const items = fallbackResponse.data.data.items;
              console.log(`Retrieved ${items.length} OHLCV data points from base address fallback`);
              
              return items.map(item => ({
                timestamp: item.unixTime * 1000,
                open: parseFloat(item.o || item.open),
                high: parseFloat(item.h || item.high),
                low: parseFloat(item.l || item.low),
                close: parseFloat(item.c || item.close),
                volume: parseFloat(item.v || item.volume)
              }));
            }
          } catch (fallbackError) {
            console.error(`Error with OHLCV fallback: ${fallbackError}`);
          }
        }

        // Try historical price data if OHLCV fails
        try {
          return this.fetchHistoricalPriceData(tokenAddress, timeframe, limit);
        } catch (historyError) {
          console.error(`Error fetching historical price data: ${historyError}`);
          
          // Fallback to mock data if all API calls fail
          console.log('Falling back to mock OHLCV data');
          return this.generateMockOHLCVData(originalAddress, limit);
        }
      }
    } catch (error) {
      console.error(`Error in fetchOHLCVData: ${error}`);
      return this.generateMockOHLCVData(tokenAddress, limit);
    }
  }

  /**
   * Fetch historical price data from Birdeye API
   * @param tokenAddress The token address
   * @param timeframe The timeframe (e.g., '15m', '1h', '4h', '1d')
   * @param limit The number of data points
   * @returns Array of OHLCV data (close price only)
   */
  async fetchHistoricalPriceData(
    tokenAddress: string,
    timeframe: string = '1d',
    limit: number = 30
  ): Promise<OHLCVData[]> {
    try {
      console.log(`Fetching historical price data for ${tokenAddress}`);
      
      const options = this.getRequestOptions();
      const url = `${this.baseUrl}${BIRDEYE_CONFIG.ENDPOINTS.HISTORY_PRICE}?address=${tokenAddress}&address_type=token&type=${timeframe}`;
      
      const response = await axios.get(url, options);
      
      if (response.data && response.data.success && response.data.data && response.data.data.items && Array.isArray(response.data.data.items)) {
        const items = response.data.data.items;
        console.log(`Successfully retrieved ${items.length} historical price points`);
        
        // Since this endpoint only returns timestamp and price, we need to create simulated OHLCV data
        const historicalData: OHLCVData[] = [];
        
        // Sort by time ascending
        const sortedItems = [...items].sort((a, b) => a.unixTime - b.unixTime).slice(-limit);
        
        // Create simulated OHLCV from price values
        for (let i = 0; i < sortedItems.length; i++) {
          const item = sortedItems[i];
          const closePrice = parseFloat(item.value);
          
          // For the first item, use close price for all values
          // For subsequent items, use some variation around the close price
          if (i === 0 || !historicalData[i - 1]) {
            historicalData.push({
              timestamp: item.unixTime * 1000,
              open: closePrice,
              high: closePrice * 1.01, // 1% higher
              low: closePrice * 0.99,  // 1% lower
              close: closePrice,
              volume: 100000 // placeholder volume
            });
          } else {
            // Use previous candle's close as this candle's open
            const open = historicalData[i - 1].close;
            const high = Math.max(open, closePrice) * 1.01;
            const low = Math.min(open, closePrice) * 0.99;
            
            historicalData.push({
              timestamp: item.unixTime * 1000,
              open,
              high,
              low,
              close: closePrice,
              volume: 100000 + Math.random() * 50000 // placeholder volume with some variation
            });
          }
        }
        
        return historicalData;
      }
      
      throw new Error('Invalid response format from historical price API');
    } catch (error) {
      console.error(`Error fetching historical price data: ${error}`);
      throw error;
    }
  }

  /**
   * Fetch token trade data with detailed metrics
   * @param tokenAddress The token address
   * @returns Detailed trade metrics
   */
  async fetchTokenTradeData(tokenAddress: string): Promise<TokenTradeData | null> {
    try {
      console.log(`Fetching token trade data for ${tokenAddress}`);
      
      const options = this.getRequestOptions();
      const url = `${this.baseUrl}${BIRDEYE_CONFIG.ENDPOINTS.TOKEN_TRADE_DATA}?address=${tokenAddress}`;
      
      const response = await axios.get(url, options);
      
      if (response.data && response.data.success && response.data.data) {
        console.log(`Successfully retrieved token trade data`);
        return response.data.data as TokenTradeData;
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching token trade data: ${error}`);
      return null;
    }
  }

  /**
   * Fetch token holders information
   * @param tokenAddress The token address
   * @param limit Maximum number of holders to return
   * @param offset Pagination offset
   * @returns List of token holders
   */
  async fetchTokenHolders(
    tokenAddress: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<TokenHolderData[]> {
    try {
      console.log(`Fetching top ${limit} token holders for ${tokenAddress}`);
      
      const options = this.getRequestOptions();
      const url = `${this.baseUrl}${BIRDEYE_CONFIG.ENDPOINTS.TOKEN_HOLDER}?address=${tokenAddress}&offset=${offset}&limit=${limit}`;
      
      const response = await axios.get(url, options);
      
      if (response.data && response.data.success && response.data.data && response.data.data.items) {
        console.log(`Successfully retrieved ${response.data.data.items.length} token holders`);
        return response.data.data.items;
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching token holders: ${error}`);
      return [];
    }
  }

  /**
   * Fetch pair overview data for a trading pair
   * @param pairAddress The pair address
   * @returns Pair overview data
   */
  async fetchPairOverview(pairAddress: string): Promise<PairOverviewData | null> {
    try {
      console.log(`Fetching pair overview for ${pairAddress}`);
      
      const options = this.getRequestOptions();
      const url = `${this.baseUrl}${BIRDEYE_CONFIG.ENDPOINTS.PAIR_OVERVIEW}?address=${pairAddress}`;
      
      const response = await axios.get(url, options);
      
      if (response.data && response.data.success && response.data.data) {
        console.log(`Successfully retrieved pair overview data`);
        return response.data.data as PairOverviewData;
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching pair overview: ${error}`);
      return null;
    }
  }

  /**
   * Fetch trending tokens list
   * @param limit Maximum number of tokens to return
   * @param offset Pagination offset
   * @returns List of trending tokens
   */
  async fetchTrendingTokens(
    limit: number = 20,
    offset: number = 0
  ): Promise<any[]> {
    try {
      console.log(`Fetching trending tokens list`);
      
      const options = this.getRequestOptions();
      const url = `${this.baseUrl}${BIRDEYE_CONFIG.ENDPOINTS.TOKEN_TRENDING}?sort_by=rank&sort_type=asc&offset=${offset}&limit=${limit}`;
      
      const response = await axios.get(url, options);
      
      if (response.data && response.data.success && response.data.data && response.data.data.tokens) {
        console.log(`Successfully retrieved ${response.data.data.tokens.length} trending tokens`);
        return response.data.data.tokens;
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching trending tokens: ${error}`);
      return [];
    }
  }

  /**
   * Fetch new token listings
   * @param limit Maximum number of tokens to return
   * @param includeMemeTokens Whether to include meme tokens from platforms like pump.fun
   * @returns List of new token listings
   */
  async fetchNewTokenListings(
    limit: number = 10,
    includeMemeTokens: boolean = true
  ): Promise<any[]> {
    try {
      console.log(`Fetching new token listings`);
      
      const options = this.getRequestOptions();
      const url = `${this.baseUrl}${BIRDEYE_CONFIG.ENDPOINTS.TOKEN_NEW_LISTING}?limit=${limit}&meme_platform_enabled=${includeMemeTokens}`;
      
      const response = await axios.get(url, options);
      
      if (response.data && response.data.success && response.data.data && response.data.data.items) {
        console.log(`Successfully retrieved ${response.data.data.items.length} new token listings`);
        return response.data.data.items;
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching new token listings: ${error}`);
      return [];
    }
  }

  /**
   * Fetch top traders (gainers/losers)
   * @param timeType Time period ('1D', '1W', '1M')
   * @param sortType Sort order ('asc' for losers, 'desc' for gainers)
   * @param limit Maximum number of traders to return
   * @returns List of top traders
   */
  async fetchTopTraders(
    timeType: string = '1W',
    sortType: string = 'desc',
    limit: number = 10
  ): Promise<any[]> {
    try {
      console.log(`Fetching top traders (${sortType === 'desc' ? 'gainers' : 'losers'})`);
      
      const options = this.getRequestOptions();
      const url = `${this.baseUrl}${BIRDEYE_CONFIG.ENDPOINTS.TRADER_GAINERS_LOSERS}?type=${timeType}&sort_by=PnL&sort_type=${sortType}&offset=0&limit=${limit}`;
      
      const response = await axios.get(url, options);
      
      if (response.data && response.data.success && response.data.data && response.data.data.items) {
        console.log(`Successfully retrieved ${response.data.data.items.length} top traders`);
        return response.data.data.items;
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching top traders: ${error}`);
      return [];
    }
  }
  
  /**
   * Generate mock OHLCV data for testing
   * @param tokenAddress The token address
   * @param limit The number of data points to generate
   * @returns Array of mock OHLCV data
   */
  private async generateMockOHLCVData(tokenAddress: string, limit: number): Promise<OHLCVData[]> {
    try {
      // Fetch token data to get current price
      const tokenData = await this.fetchTokenData(tokenAddress);
      const currentPrice = tokenData?.data?.price || 100; // Default to 100 if not available
      
      // Generate mock OHLCV data based on current price
      const mockOHLCVData: OHLCVData[] = [];
      
      for (let i = 0; i < limit; i++) {
        const dayOffset = limit - i - 1;
        const basePrice = currentPrice * (1 - (dayOffset * 0.005) + (Math.random() * 0.01 - 0.005));
        
        // Generate realistic-looking data with a trend
        const volatility = basePrice * 0.03; // 3% volatility
        const open = basePrice * (1 + (Math.random() * 0.04 - 0.02));
        const high = open * (1 + Math.random() * 0.02);
        const low = open * (1 - Math.random() * 0.02);
        const close = (open + high + low) / 3 + (Math.random() * volatility - volatility/2);
        const volume = Math.floor(Math.random() * 100000) + 50000;
        
        // Create OHLCV data point
        mockOHLCVData.push({
          timestamp: new Date(Date.now() - (dayOffset * 86400000)).getTime(), // 1 day back for each point
          open,
          high,
          close,
          low,
          volume
        });
      }
      
      return mockOHLCVData;
    } catch (error) {
      console.error(`Error generating mock OHLCV data: ${error}`);
      
      // Fallback to very basic mock data if everything else fails
      return Array(limit).fill(0).map((_, i) => ({
        timestamp: new Date(Date.now() - (i * 86400000)).getTime(),
        open: 100 - i,
        high: 105 - i,
        low: 95 - i,
        close: 102 - i,
        volume: 50000
      })).reverse();
    }
  }
  
  /**
   * Generate mock token data with improved naming for unknown tokens
   */
  private generateMockTokenData(tokenAddress: string) {
    // First check if this token is in our cache
    const cachedToken = getTokenFromCache(tokenAddress);
    if (cachedToken) {
      console.log(`Using cached token data for ${tokenAddress}: ${cachedToken.name} (${cachedToken.symbol})`);
      // Use the name and symbol from cache
      const mockData = this.generateRealisticMockData(cachedToken.name, cachedToken.symbol, tokenAddress);
      return {
        success: true,
        data: mockData
      };
    }
    
    // Check if this is a known token in our config
    const knownToken = getTokenByAddress(tokenAddress);
    
    if (knownToken) {
      // Use data from the known token
      const mockData = this.generateRealisticMockData(
        knownToken.name, 
        knownToken.symbol, 
        tokenAddress
      );
      
      return {
        success: true,
        data: mockData
      };
    }
    
    // Check if this is a pump variant
    const pumpMatch = tokenAddress.match(/^([1-9A-HJ-NP-Za-km-z]{32,44})pump$/i);
    if (pumpMatch) {
      const baseAddress = pumpMatch[1];
      const baseToken = getTokenByAddress(baseAddress);
      
      if (baseToken) {
        // Use data from the base token but modify for pump
        const mockData = this.generateRealisticMockData(
          `${baseToken.name} PUMP`,
          `${baseToken.symbol}PUMP`,
          tokenAddress
        );
        
        // Save to cache
        saveTokenToCache(tokenAddress, `${baseToken.name} PUMP`, `${baseToken.symbol}PUMP`);
        
        return {
          success: true,
          data: mockData
        };
      }
    }
    
    // For completely unknown tokens, try to extract a meaningful name from the address
    // instead of just using "Unknown"
    const shortAddress = tokenAddress.substring(0, 12);
    
    // Try to create a more descriptive name with the full address visible
    const symbol = tokenAddress.substring(0, 4).toUpperCase();
    const name = `Token (${shortAddress})`;
    
    // Save this to cache for future use
    saveTokenToCache(tokenAddress, name, symbol);
    
    // Generate realistic mock data for unknown token
    const mockData = this.generateRealisticMockData(name, symbol, tokenAddress);
    
    return {
      success: true,
      data: mockData
    };
  }
  
  /**
   * Helper method to generate realistic mock data with proper naming
   */
  private generateRealisticMockData(name: string, symbol: string, address: string) {
    // Get category based on token name or default to Meme
    let category = "Meme"; // Default
    
    // Look for keywords in the name to determine category
    if (/sol|core|eth|btc|usdc|usdt/i.test(name)) {
      category = "Core";
    } else if (/defi|swap|trade|exchange|liquidity/i.test(name)) {
      category = "DeFi";
    } else if (/stake|staking|yield|dividend/i.test(name)) {
      category = "Staking";
    } else if (/infra|protocol|chain|platform|network/i.test(name)) {
      category = "Infrastructure";
    }
    
    // Determine realistic price ranges based on category
    let price: number;
    let marketCap: number;
    let volume24h: number;
    
    switch (category) {
      case 'Core':
        // Core tokens like SOL, USDC typically have higher prices
        price = Math.random() * 200 + 10; // $10-$210
        marketCap = price * (Math.random() * 50000000000 + 1000000000); // $1B-$51B
        volume24h = Math.floor(Math.random() * 1000000000) + 50000000; // $50M-$1.05B
        break;
      case 'DeFi':
        // DeFi tokens typically in the mid-range
        price = Math.random() * 50 + 0.5; // $0.50-$50.50
        marketCap = price * (Math.random() * 10000000000 + 100000000); // $100M-$10.1B
        volume24h = Math.floor(Math.random() * 300000000) + 10000000; // $10M-$310M
        break;
      case 'Staking':
        // Staking tokens similar to DeFi
        price = Math.random() * 40 + 1; // $1-$41
        marketCap = price * (Math.random() * 5000000000 + 200000000); // $200M-$5.2B
        volume24h = Math.floor(Math.random() * 200000000) + 15000000; // $15M-$215M
        break;
      case 'Infrastructure':
        // Infrastructure tokens medium range
        price = Math.random() * 20 + 0.2; // $0.20-$20.20
        marketCap = price * (Math.random() * 3000000000 + 50000000); // $50M-$3.05B
        volume24h = Math.floor(Math.random() * 100000000) + 5000000; // $5M-$105M
        break;
      case 'Meme':
      default:
        // Meme tokens typically very low price
        if (Math.random() > 0.1) {
          // 90% chance of a very small number
          price = Math.random() * 0.01;  // $0-$0.01
        } else {
          // 10% chance of a slightly higher number
          price = Math.random() * 1 + 0.01; // $0.01-$1.01
        }
        marketCap = price * (Math.random() * 1000000000 + 5000000); // $5M-$1.005B
        volume24h = Math.floor(Math.random() * 50000000) + 1000000; // $1M-$51M
        break;
    }

    const priceChange24h = (Math.random() * 20) - 10; // -10% to +10%
    const liquidity = marketCap * (Math.random() * 0.3 + 0.05); // 5%-35% of market cap
    
    return {
      address: address,
      symbol: symbol,
      name: name,
      decimals: 9,
      logoURI: null,
      price: price,
      priceChange: {
        '1h': (Math.random() * 4) - 2, // -2% to +2%
        '24h': priceChange24h,
        '7d': (Math.random() * 30) - 15, // -15% to +15%
      },
      priceChange24hPercent: priceChange24h,
      volume: {
        '24h': volume24h
      },
      v24hUSD: volume24h,
      marketCap: marketCap,
      liquidity: liquidity,
      holder: Math.floor(Math.random() * 200000) + 1000, // 1,000 to 201,000 holders
      uniqueWallet24h: Math.floor(Math.random() * 20000) + 100, // 100 to 20,100 active wallets
      uniqueWallet24hChangePercent: (Math.random() * 30) - 15, // -15% to +15%
    };
  }
}
