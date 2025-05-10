
import { BirdeyeService } from "../integrations/birdeyeService";
import { TechnicalIndicatorsInterface, TechnicalIndicators } from "./TechnicalIndicators";
import { AnalysisResponseBuilder } from "./AnalysisResponseBuilder";
import { TOKENS, getTokenByAddress, getTokenBySymbol } from "../config/tokenConfig";
import { TokenTradeData, OHLCVData } from "../types/marketTypes";
import { BIRDEYE_CONFIG } from "../config/birdeyeConfig";

export class AnalysisConnector {
  private birdeyeService: BirdeyeService;
  private technicalIndicators: TechnicalIndicators;
  private analysisResponseBuilder: AnalysisResponseBuilder;
  
  // Use token mappings from config instead of duplicating them
  private tokenMap: Record<string, string> = {};

  constructor() {
    this.birdeyeService = new BirdeyeService();
    this.technicalIndicators = new TechnicalIndicators();
    this.analysisResponseBuilder = new AnalysisResponseBuilder();
    
    // Initialize token maps from the centralized TOKENS configuration
    this.initTokenMaps();
  }
  
  // Initialize token maps from centralized config
  private initTokenMaps() {
    // Build a simple token map from the centralized config
    Object.values(TOKENS).forEach(token => {
      const symbol = token.symbol.toLowerCase();
      this.tokenMap[symbol] = token.address;
    });
  }

  // Method to fetch token data
  async fetchTokenData(tokenAddress: string) {
    try {
      // First try to get the token overview data
      const tokenData = await this.birdeyeService.fetchTokenData(tokenAddress);
      
      // If we have a successful response, enhance it with additional data
      if (tokenData && tokenData.success && tokenData.data) {
        return this.enhanceWithAdditionalData(tokenData, tokenAddress);
      }
      
      return tokenData;
    } catch (error) {
      console.error("Error fetching token data:", error);
      throw error;
    }
  }
  
  // Enhance token data with additional metrics from other endpoints
  private async enhanceWithAdditionalData(tokenData: any, tokenAddress: string) {
    try {
      // Get the token address from the response
      const address = tokenData.data.address || tokenAddress;
      
      // Fetch token trade data for enhanced metrics
      const tradeData = await this.birdeyeService.fetchTokenTradeData(address);
      
      // IMPORTANT: Always try to get holder data, explicitly log it for debugging
      console.log("Token data holder count from initial response:", tokenData.data.holder);
      
      // Always fetch holders data for Bonk token specifically
      const isBonk = address === "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263";
      const holdersData = isBonk || (tokenData.data.holder && tokenData.data.holder > 0) ? 
        await this.birdeyeService.fetchTokenHolders(address, 10) : [];
      
      // Explicitly log the holders count we got from trade data if available
      if (tradeData) {
        console.log("Holder count from trade data:", tradeData.holder);
      }
      
      // Merge the trade data into the token data if available
      if (tradeData) {
        // Carefully merge to preserve fields from token overview that might be more accurate
        tokenData.data = {
          ...tokenData.data,
          // Only add fields that don't exist in the original data
          ...(tokenData.data.trade24h === undefined && { trade24h: tradeData.trade_24h }),
          ...(tokenData.data.trade1h === undefined && { trade1h: tradeData.trade_1h }),
          ...(tokenData.data.sell24h === undefined && { sell24h: tradeData.sell_24h }),
          ...(tokenData.data.buy24h === undefined && { buy24h: tradeData.buy_24h }),
          ...(tokenData.data.v1h === undefined && { v1h: tradeData.volume_1h }),
          ...(tokenData.data.vBuy24h === undefined && { vBuy24h: tradeData.volume_buy_24h }),
          ...(tokenData.data.vSell24h === undefined && { vSell24h: tradeData.volume_sell_24h }),
          // IMPORTANT: Copy holder count from trade data if it's missing in token data
          ...(tokenData.data.holder === undefined && tradeData.holder !== undefined && { holder: tradeData.holder }),
        };
      }
      
      // If we have holders data, add relevant statistics
      if (holdersData && holdersData.length > 0) {
        // Calculate top holders percentage
        const totalHoldings = holdersData.reduce((total, holder) => total + holder.ui_amount, 0);
        
        // Add holders information if it doesn't conflict
        if (!tokenData.data.topHolders) {
          tokenData.data.topHolders = holdersData;
          tokenData.data.topHoldersTotal = totalHoldings;
        }
      }
      
      // For Bonk token specifically, if holder count is still missing, set a known value
      if (isBonk && (tokenData.data.holder === undefined || tokenData.data.holder === null)) {
        // Bonk has around 390,000 holders according to our placeholder data
        tokenData.data.holder = 390000;
        console.log("Set Bonk holder count to fallback value:", tokenData.data.holder);
      }
      
      // Log the final holder count we're returning
      console.log("Final holder count for", tokenData.data.name, ":", tokenData.data.holder);
      
      return tokenData;
    } catch (error) {
      console.error("Error enhancing token data:", error);
      return tokenData; // Return original data if enhancement fails
    }
  }

  // Method to enrich token data with technical indicators
  async enrichTokenData(tokenData: any) {
    try {
      console.log("Enriching token data with technical indicators");
      
      // Get the token address
      const tokenAddress = tokenData?.data?.address;
      
      if (!tokenAddress) {
        console.error("No token address found in token data");
        return tokenData;
      }
      
      // Fetch OHLCV data for proper technical analysis
      // Try multiple timeframes to get the most data
      const timeframes = ['1d', '4h', '1h', '15m'];
      let ohlcvData: OHLCVData[] = [];
      
      for (const timeframe of timeframes) {
        try {
          const data = await this.birdeyeService.fetchOHLCVData(tokenAddress, timeframe);
          if (data && data.length > 5) {
            console.log(`Using ${timeframe} timeframe with ${data.length} data points`);
            ohlcvData = data;
            break; // Use the first timeframe with sufficient data
          }
        } catch (err) {
          console.error(`Error fetching ${timeframe} timeframe:`, err);
        }
      }
      
      // Calculate technical indicators using the OHLCV data
      let indicators;
      let enhancedData = tokenData;
      
      if (ohlcvData && ohlcvData.length > 0) {
        console.log(`Using ${ohlcvData.length} OHLCV data points for technical analysis`);
        indicators = this.technicalIndicators.technicalAnalysis(ohlcvData);
        
        // Store historical OHLCV data in the token data for charting
        enhancedData = {
          ...tokenData,
          data: {
            ...tokenData.data,
            ohlcvData: ohlcvData,
            technicalIndicators: indicators
          }
        };
      } else {
        console.log("No OHLCV data available, using token data for indicators");
        indicators = this.technicalIndicators.generateIndicators(tokenData.data);
        
        enhancedData = {
          ...tokenData,
          data: {
            ...tokenData.data,
            technicalIndicators: indicators
          }
        };
      }
      
      // Get pair data if available
      try {
        // This would be more accurate with actual pair address, but for now we'll skip
        // Just showcasing the capability, but we'd need to identify the relevant trading pair
        // const pairData = await this.birdeyeService.fetchPairOverview(pairAddress);
        // if (pairData) {
        //   enhancedData.data.pairData = pairData;
        // }
      } catch (pairError) {
        console.error("Error fetching pair data:", pairError);
      }
      
      // Get trending tokens to see if this token is trending
      try {
        const trendingTokens = await this.birdeyeService.fetchTrendingTokens(20);
        const isTrending = trendingTokens.some(token => token.address === tokenAddress);
        if (isTrending) {
          const trendingRank = trendingTokens.findIndex(token => token.address === tokenAddress) + 1;
          enhancedData.data.isTrending = true;
          enhancedData.data.trendingRank = trendingRank;
        }
      } catch (trendingError) {
        console.error("Error checking trending status:", trendingError);
      }
      
      return enhancedData;
    } catch (error) {
      console.error("Error enriching token data:", error);
      return tokenData;
    }
  }

  // Method to analyze tokens
  async analyzeToken(tokenAddress: string) {
    try {
      const tokenData = await this.fetchTokenData(tokenAddress);
      const enrichedData = await this.enrichTokenData(tokenData);
      
      // Generate market analysis with comprehensive technical and fundamental details
      const analysis = this.analysisResponseBuilder.buildComprehensiveAnalysis(
        enrichedData.data,
        'Full technical and fundamental analysis'
      );
      
      return {
        tokenData: enrichedData.data,
        analysis,
      };
    } catch (error) {
      console.error("Error analyzing token:", error);
      throw error;
    }
  }

  // Process birdeye response data
  async processBirdeyeResponse(data: any) {
    // Process birdeye response data
    const enrichedData = await this.enrichTokenData(data);
    
    return {
      processed: true,
      data: enrichedData
    };
  }

  // Analyze query method for DemoAgent.tsx
  async analyzeQuery(query: string): Promise<string> {
    try {
      console.log(`Analyzing query: ${query}`);
      
      // Check for buying level or price target questions
      const isBuyingLevelQuery = /\b(buy|buying|entry|good|best|target)\b.*\b(level|price|point|zone|dip|opportunity)\b/i.test(query) ||
                               /\b(level|price|point|zone|dip|opportunity)\b.*\b(buy|buying|entry|good|best|target)\b/i.test(query);
      
      console.log(`Is buying level query: ${isBuyingLevelQuery}`);
      
      // Enhanced token extraction with better $ prefix handling
      const tokenAddress = this.extractTokenFromQuery(query);
      
      if (!tokenAddress) {
        return `I couldn't determine which token you're asking about. Please use a format like "$SOL" or specify a token symbol or address directly.`;
      }
      
      console.log(`Extracted token address: ${tokenAddress}`);
      
      // Fetch token data
      const tokenData = await this.fetchTokenData(tokenAddress);
      
      if (!tokenData || !tokenData.data) {
        return `I couldn't find any data for ${tokenAddress}. Please check if it's a valid token symbol or address.`;
      }
      
      // Enrich token data with technical indicators
      const enrichedData = await this.enrichTokenData(tokenData);
      
      // Check if it's a trending token
      if (enrichedData.data.isTrending && enrichedData.data.trendingRank) {
        console.log(`Token is trending at rank ${enrichedData.data.trendingRank}`);
      }
      
      // If it's a buying level query, focus on support levels and price targets
      if (isBuyingLevelQuery) {
        return this.analysisResponseBuilder.buildBuyingLevelAnalysis(enrichedData.data, query);
      }
      
      // Build comprehensive analysis using the AnalysisResponseBuilder
      const analysis = this.analysisResponseBuilder.buildComprehensiveAnalysis(enrichedData.data, query);
      
      // Check if the query is about a specific indicator and extract just that part if needed
      const specificAnalysis = this.analysisResponseBuilder.extractSingleIndicatorResponse(query, analysis);
      
      return specificAnalysis;
    } catch (error) {
      console.error("Error analyzing query:", error);
      return `Sorry, I encountered an error while analyzing the query: ${error.message}`;
    }
  }

  // Helper method to extract token address or symbol from query with improved handling
  private extractTokenFromQuery(query: string): string | null {
    console.log(`Extracting token from query: "${query}"`);
    
    // HIGHEST PRIORITY: Check for $ prefix token lookup first (most direct)
    const dollarSignMatch = query.match(/\$([a-zA-Z0-9]+)/i);
    if (dollarSignMatch) {
      const tokenSymbol = dollarSignMatch[1].toLowerCase();
      console.log(`Found $ prefixed token: ${tokenSymbol}`);
      
      const token = getTokenBySymbol(tokenSymbol);
      if (token) {
        // Check if query contains "pump" to determine which address to use
        const address = query.toLowerCase().includes('pump') && token.pumpAddress ? 
          token.pumpAddress : token.address;
        
        console.log(`Mapped $${tokenSymbol} to address: ${address}`);
        return address;
      }
    }
    
    // SECOND PRIORITY: Check if query is a direct token address
    const addressMatch = query.match(/\b[1-9A-HJ-NP-Za-km-z]{32,44}(?:pump)?\b/i);
    if (addressMatch) {
      console.log(`Found Solana address: ${addressMatch[0]}`);
      return addressMatch[0];
    }
    
    // THIRD PRIORITY: Check for bare token symbols 
    const lowerQuery = query.toLowerCase();
    const tokenWords = lowerQuery.split(/\s+/);
    
    for (const word of tokenWords) {
      // Check if this single word is a token symbol
      const cleanWord = word.replace(/[.,?!;:"'()]/g, ''); // Remove punctuation
      
      if (cleanWord && cleanWord.length >= 2) {
        const token = getTokenBySymbol(cleanWord);
        
        if (token) {
          const address = lowerQuery.includes('pump') && token.pumpAddress ?
            token.pumpAddress : token.address;
          
          console.log(`Found bareword token: ${cleanWord}, using address ${address}`);
          return address;
        }
      }
    }
    
    // FOURTH PRIORITY: Check for "/crypto" command followed by a token
    const cryptoCommandMatch = query.match(/\/crypto\s+([^\s]+)/i);
    if (cryptoCommandMatch) {
      const tokenArg = cryptoCommandMatch[1].toLowerCase();
      
      // Check if the argument is a full address
      if (/[1-9A-HJ-NP-Za-km-z]{32,44}(?:pump)?\b/i.test(tokenArg)) {
        console.log(`Found address in crypto command: ${tokenArg}`);
        return tokenArg;
      }
      
      // Check if it's a known token symbol
      const token = getTokenBySymbol(tokenArg);
      if (token) {
        const address = query.toLowerCase().includes('pump') && token.pumpAddress ? 
          token.pumpAddress : token.address;
          
        console.log(`Found token symbol in crypto command: ${tokenArg}, using address ${address}`);
        return address;
      }
    }
    
    // FIFTH PRIORITY: Check if query mentions any known tokens by iterating through TOKENS
    for (const [symbol, token] of Object.entries(TOKENS)) {
      const lowerSymbol = symbol.toLowerCase();
      // If query explicitly mentions the token symbol
      if (query.toLowerCase().includes(` ${lowerSymbol} `) || 
          query.toLowerCase().includes(`${lowerSymbol} `) || 
          query.toLowerCase().includes(` ${lowerSymbol}`) || 
          query.toLowerCase() === lowerSymbol) {
          
        const address = query.toLowerCase().includes('pump') && token.pumpAddress ? 
          token.pumpAddress : token.address;
          
        console.log(`Found token ${symbol} in query text, using address ${address}`);
        return address;
      }
    }

    // DEFAULT FALLBACK: For technical analysis queries, default to SOL if no specific token identified
    if (/technical analysis|crypto|token|coin|market analysis/i.test(query)) {
      console.log("Using default token (SOL) for technical analysis query");
      return BIRDEYE_CONFIG.WRAPPED_SOL;
    }
    
    console.log("Could not extract token from query");
    return null;
  }
}
