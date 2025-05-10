
import { MarketAnalysisAgent } from '../core/marketAnalysis';
import { TokenAnalysisService } from '../integrations/tokenAnalysisService';
import { BirdeyeService } from '../integrations/birdeyeService';
import { AnalysisResponseBuilder } from './AnalysisResponseBuilder';
import { 
  enhanceAnalysisWithPersonality, 
  createPersonalizedIntro, 
  createPersonalizedConclusion 
} from '../personality/MarketPersonality';
import { TOKENS, getTokenByAddress, getTokenBySymbol } from '../config/tokenConfig';

/**
 * UnifiedAnalysisService - Central service that combines and enhances
 * all market analysis functionality with personalized responses
 */
export class UnifiedAnalysisService {
  private marketAnalysisAgent: MarketAnalysisAgent;
  private tokenAnalysisService: TokenAnalysisService;
  private birdeyeService: BirdeyeService;
  private responseBuilder: AnalysisResponseBuilder;
  
  // Simple cache to store recent analysis results
  private cache: Map<string, { timestamp: number, result: string }> = new Map();
  private CACHE_TTL: number = 60 * 1000; // 1 minute cache
  
  constructor() {
    this.marketAnalysisAgent = new MarketAnalysisAgent();
    this.tokenAnalysisService = new TokenAnalysisService();
    this.birdeyeService = new BirdeyeService();
    this.responseBuilder = new AnalysisResponseBuilder();
  }
  
  /**
   * Main method to process incoming queries and provide enhanced analysis
   * with personality and market trader language
   */
  async processQuery(query: string): Promise<string | null> {
    try {
      console.log('UnifiedAnalysisService: Processing query:', query);
      
      // Check for $ prefix token lookup
      const dollarSignMatch = query.match(/\$([a-zA-Z0-9]+)/i);
      if (dollarSignMatch) {
        const tokenSymbol = dollarSignMatch[1].toLowerCase();
        const token = getTokenBySymbol(tokenSymbol.toUpperCase());
        
        if (token) {
          console.log(`Processing $ prefix token lookup: ${tokenSymbol}`);
          // Use token address for further processing, checking if we need pump address
          const address = query.toLowerCase().includes('pump') && token.pumpAddress ? 
            token.pumpAddress : token.address;
          
          // Replace query with token address for further processing
          query = address;
        }
      }
      
      // Check cache first
      const cacheKey = this.getCacheKey(query);
      if (this.cache.has(cacheKey)) {
        const cachedData = this.cache.get(cacheKey)!;
        if (Date.now() - cachedData.timestamp < this.CACHE_TTL) {
          console.log('UnifiedAnalysisService: Cache hit for query');
          return cachedData.result;
        }
        console.log('UnifiedAnalysisService: Cache expired for query');
      }
      
      // Process with specialized logic based on query type
      let result: string | null = null;
      
      // Check if it's a general market question
      if (this.isGeneralMarketQuestion(query)) {
        console.log('UnifiedAnalysisService: Processing general market question');
        const marketOverview = await this.marketAnalysisAgent.generateMarketOverview(query);
        
        // Add personalized touch to market overview
        result = this.addPersonalityToMarketOverview(marketOverview);
      } else {
        // Try to extract token
        const token = await this.extractToken(query);
        if (!token) {
          console.log('UnifiedAnalysisService: No token found in query');
          return null;
        }
        
        console.log('UnifiedAnalysisService: Found token:', token);
        
        // Get analysis type
        const analysisType = this.getAnalysisType(query);
        console.log('UnifiedAnalysisService: Analysis type:', analysisType);
        
        // Process specific query types
        if (this.isSpecificIndicatorQuery(query)) {
          console.log('UnifiedAnalysisService: Specific indicator query detected');
          result = await this.processSpecificIndicatorQuery(query, token);
        } else {
          // Get complete analysis based on type
          result = await this.getAnalysisByType(token, analysisType, query);
        }
      }
      
      // Cache the result
      if (result) {
        this.cache.set(cacheKey, {
          timestamp: Date.now(),
          result
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error in UnifiedAnalysisService:', error);
      return null;
    }
  }
  
  /**
   * Add personality to market overview
   */
  private addPersonalityToMarketOverview(marketOverview: string): string {
    // Split the text into sections
    const sections = marketOverview.split('\n\n');
    
    // Add personalized intro to the beginning
    const personalizedIntros = [
      "Fresh off the charts, here's what the market's showing us today:",
      "Just scanned the market landscape, and here's the current picture:",
      "Taking the market's temperature right now, here's what we're seeing:",
      "Market check time! Here's the latest data I'm looking at:"
    ];
    
    // Add personalized intro after the first line (title)
    if (sections.length > 1) {
      sections.splice(1, 0, personalizedIntros[Math.floor(Math.random() * personalizedIntros.length)]);
    }
    
    // Add personalized conclusion before the disclaimer
    const personalizedConclusions = [
      "That's the market snapshot for now - remember to watch how these trends develop throughout the day.",
      "Keep these levels on your radar as the market evolves - what happens at key support/resistance often tells the next chapter of the story.",
      "I'll be tracking these developments closely - the smart money often positions ahead of the next major move."
    ];
    
    // Find the disclaimer and add conclusion before it
    const disclaimerIndex = sections.findIndex(section => section.includes('Disclaimer'));
    if (disclaimerIndex !== -1) {
      sections.splice(disclaimerIndex, 0, personalizedConclusions[Math.floor(Math.random() * personalizedConclusions.length)]);
    } else {
      // If no disclaimer, add to the end
      sections.push(personalizedConclusions[Math.floor(Math.random() * personalizedConclusions.length)]);
    }
    
    return sections.join('\n\n');
  }
  
  /**
   * Extract token from query
   */
  private async extractToken(query: string): Promise<string | null> {
    try {
      console.log(`UnifiedAnalysisService: Extracting token from query "${query}"`);
      
      // Check if query is a direct token address
      if (/^[1-9A-HJ-NP-Za-km-z]{32,44}(?:pump)?$/.test(query)) {
        console.log('Query is a direct token address');
        return query;
      }
      
      // Check for tokens with "pump" suffix
      const pumpMatch = query.match(/([1-9A-HJ-NP-Za-km-z]{32,44})pump\b/i);
      if (pumpMatch) {
        console.log(`Found token address with 'pump' suffix: ${pumpMatch[0]}`);
        return pumpMatch[0]; // Return the full address including pump
      }
      
      // Check for $ prefix token lookup
      const dollarSignMatch = query.match(/\$([a-zA-Z0-9]+)/i);
      if (dollarSignMatch) {
        const tokenSymbol = dollarSignMatch[1].toUpperCase();
        console.log(`Found $ prefix token: ${tokenSymbol}`);
        
        const token = getTokenBySymbol(tokenSymbol);
        if (token) {
          const address = query.toLowerCase().includes('pump') && token.pumpAddress ? 
            token.pumpAddress : token.address;
          
          console.log(`Mapped to address: ${address}`);
          return address;
        }
      }
      
      // Check if query mentions any known tokens
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
      
      // Check for bare token symbol (entire query is just the symbol)
      const lowerQuery = query.toLowerCase().trim();
      const token = getTokenBySymbol(lowerQuery.toUpperCase());
      if (token) {
        console.log(`Found bare token symbol: ${lowerQuery}`);
        const address = query.toLowerCase().includes('pump') && token.pumpAddress ? 
          token.pumpAddress : token.address;
        return address;
      }
      
      // Check for address in the query
      const addressMatch = query.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);
      if (addressMatch) {
        console.log(`Found Solana address in query: ${addressMatch[0]}`);
        return addressMatch[0];
      }
      
      // Use MarketAnalysisAgent for token extraction as last resort
      return await this.marketAnalysisAgent.extractTokenFromQuery(query, true);
    } catch (error) {
      console.error('Error extracting token:', error);
      return null;
    }
  }
  
  /**
   * Get analysis type from query
   */
  private getAnalysisType(query: string): string {
    if (/technical analysis|technical|analysis|rsi|macd|moving average|bollinger|support|resistance|volume profile|trend/i.test(query)) {
      return 'technical';
    } else if (/fundamental analysis|fundamental|project|team|tokenomics|white paper|use case/i.test(query)) {
      return 'fundamental';
    } else {
      return 'overview';
    }
  }
  
  /**
   * Check if the query is for a specific indicator
   */
  private isSpecificIndicatorQuery(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    
    // Check for specific indicator requests
    const specificIndicators = [
      /\brsi\b(?!.*analysis)/i,
      /\bmacd\b(?!.*analysis)/i,
      /\bbollinger\b(?!.*analysis)/i,
      /\bsupport\b(?!.*analysis)/i,
      /\bresistance\b(?!.*analysis)/i,
      /\bvolume\b(?!.*analysis)/i,
      /\bmarket cap\b(?!.*analysis)/i,
      /\bliquidity\b(?!.*analysis)/i
    ];
    
    return specificIndicators.some(pattern => pattern.test(lowerQuery)) && 
           !lowerQuery.includes('technical analysis') &&
           !lowerQuery.includes('full analysis');
  }
  
  /**
   * Process a query for a specific indicator with personality
   */
  private async processSpecificIndicatorQuery(query: string, token: string): Promise<string | null> {
    // For specific indicators, first get the full analysis
    const tokenData = await this.birdeyeService.fetchTokenData(token);
    if (!tokenData) {
      return null;
    }
    
    // Generate comprehensive analysis
    const fullAnalysis = await this.responseBuilder.buildComprehensiveAnalysis(tokenData, query);
    
    // Extract the specific indicator information
    return this.responseBuilder.extractSingleIndicatorResponse(query, fullAnalysis);
  }
  
  /**
   * Get analysis by type for a token with enhanced personality
   */
  private async getAnalysisByType(token: string, analysisType: string, query: string): Promise<string | null> {
    try {
      // Fetch token data
      const tokenData = await this.birdeyeService.fetchTokenData(token);
      if (!tokenData) {
        console.log('UnifiedAnalysisService: No token data found');
        return null;
      }
      
      // Always use enhanced response builder first
      try {
        const enhancedAnalysis = this.responseBuilder.buildComprehensiveAnalysis(tokenData, query);
        if (enhancedAnalysis) {
          return enhancedAnalysis;
        }
      } catch (builderError) {
        console.error('Error generating enhanced analysis:', builderError);
      }
      
      // Fall back to MarketAnalysisAgent if response builder fails
      const baseAnalysis = await this.marketAnalysisAgent.generateTokenAnalysis(tokenData, analysisType, query);
      
      // Even if we use the fallback, enhance it with personality
      if (baseAnalysis) {
        const sentiment = analysisType === 'technical' && tokenData.priceChange24hPercent > 2 ? 'bullish' : 
                         analysisType === 'technical' && tokenData.priceChange24hPercent < -2 ? 'bearish' : 
                         'neutral';
        
        return enhanceAnalysisWithPersonality(baseAnalysis, token.toUpperCase(), sentiment as any);
      }
      
      return baseAnalysis;
    } catch (error) {
      console.error('Error getting analysis by type:', error);
      return null;
    }
  }
  
  /**
   * Check if this is a general market question
   */
  private isGeneralMarketQuestion(query: string): boolean {
    const marketQuestions = [
      /market.*look/i,
      /overall market/i,
      /market overview/i,
      /market condition/i,
      /crypto market/i,
      /solana market/i,
      /market sentiment/i,
      /market.*(doing|performance)/i,
      /how.*market/i,
      /market.*today/i,
      /state of.*(market|crypto)/i,
      /whats.*market/i,
      /what.*market/i,
      /hows.*market/i,
      /trending/i
    ];
    
    return marketQuestions.some(pattern => pattern.test(query));
  }
  
  /**
   * Generate cache key for a query
   */
  private getCacheKey(query: string): string {
    // Normalize the query for consistent caching
    return query.toLowerCase().trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[.,?!;]/g, ''); // Remove punctuation
  }
}
