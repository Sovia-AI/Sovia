import { Character } from "./types";
import { BIRDEYE_CONFIG } from "../config/birdeyeConfig";
import { BirdeyeService } from "../integrations/birdeyeService";
import { LLMProvider } from "../llm/types";
import { OpenAIProvider } from "../llm/OpenAIProvider";
import { 
  enhanceAnalysisWithPersonality, 
  getRandomConnector, 
  getRandomInsight, 
  getRandomTransition,
  getRandomConfidenceLevel,
  getRandomTimeReference
} from "../personality/MarketPersonality";

// Default API key for demo purposes - in production, use environment variables
const DEFAULT_OPENAI_API_KEY = "your-openai-api-key-here";

export class MarketAnalysisAgent {
  private birdeyeService: BirdeyeService;
  private modelProvider: LLMProvider;
  
  constructor() {
    this.birdeyeService = new BirdeyeService();
    
    // Get API key from environment or use default for demo
    const apiKey = typeof window !== 'undefined' 
      ? (window as any)?.env?.OPENAI_API_KEY || DEFAULT_OPENAI_API_KEY
      : (typeof process !== 'undefined' && process.env?.OPENAI_API_KEY) || DEFAULT_OPENAI_API_KEY;
      
    this.modelProvider = new OpenAIProvider({
      apiKey,
      model: 'gpt-4',
      dangerouslyAllowBrowser: true
    });
  }
  
  async handleQuery(query: string): Promise<string | null> {
    try {
      console.log(`Market analysis handling query: ${query}`);
      
      // Check if it's a general market question
      if (this.isGeneralMarketQuestion(query)) {
        console.log('Detected general market question');
        return this.generateMarketOverview(query);
      }
      
      // Extract token, preserving case for addresses
      const token = await this.extractTokenFromQuery(query, true);
      if (!token) {
        console.log('No token found in query');
        return this.generateMarketOverview("General market overview");
      }
      
      console.log(`Extracted token: ${token}`);
      
      // Determine analysis type
      const analysisType = this.getAnalysisType(query);
      console.log(`Analysis type: ${analysisType}`);
      
      // Fetch token data from Birdeye API
      let tokenData: any;
      try {
        // For Solana addresses (32-44 chars), preserve case
        const useOriginalCase = token.length >= 32 && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(token);
        const tokenQuery = useOriginalCase ? token : token.toLowerCase();
        
        console.log(`Fetching data for token ${tokenQuery} ${useOriginalCase ? '(preserving case)' : '(lowercase)'}`);
        tokenData = await this.birdeyeService.fetchTokenData(tokenQuery);
        
        if (!tokenData) {
          console.log('No token data found');
          return `I couldn't find data for ${token}. It might be a new token or not listed yet.`;
        }
      } catch (error) {
        console.error('Error fetching token data:', error);
        return `I encountered an error while retrieving data for ${token}. Please try again later.`;
      }
      
      // Generate token analysis - now we'll use the new generateTokenAnalysis method as the main router
      return this.generateTokenAnalysis(tokenData, analysisType, query);
    } catch (error) {
      console.error('Error in handleQuery:', error);
      return null;
    }
  }
  
  /**
   * Extract token from query with option to preserve case for addresses
   */
  async extractTokenFromQuery(query: string, preserveCaseForAddresses: boolean = false): Promise<string | null> {
    try {
      console.log(`Extracting token from query: "${query}" (preserve case: ${preserveCaseForAddresses})`);
      
      // First, check if there's a Solana address in the original query (preserving case)
      if (preserveCaseForAddresses) {
        const addressRegex = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;
        const addressMatches = query.match(addressRegex);
        
        if (addressMatches && addressMatches.length > 0) {
          console.log(`Found Solana address with preserved case: ${addressMatches[0]}`);
          return addressMatches[0]; // Return the address with original case
        }
      }
      
      // If no address found or not preserving case, proceed with normal extraction
      const lowerQuery = query.toLowerCase();
      
      // Check for common token mentions
      // 1. Check for specific tokens by name
      const tokenMap = {
        'solana': 'sol',
        'bitcoin': 'btc',
        'ethereum': 'eth',
        'jupiter': 'jup',
        'jito': 'jto',
        'bonk': 'bonk',
        'dogwifhat': 'wif',
        'pyth': 'pyth',
        'raydium': 'ray'
      };
      
      for (const [name, symbol] of Object.entries(tokenMap)) {
        if (lowerQuery.includes(name)) {
          console.log(`Found token ${symbol} from name ${name}`);
          return symbol;
        }
      }
      
      // 2. Check for token symbols
      const symbolRegex = /\b(sol|btc|eth|jup|jto|bonk|wif|pyth|ray|orca|msol|samo|usdc|dai)\b/i;
      const symbolMatch = lowerQuery.match(symbolRegex);
      
      if (symbolMatch) {
        console.log(`Found token symbol: ${symbolMatch[0].toLowerCase()}`);
        return symbolMatch[0].toLowerCase();
      }
      
      // 3. If no explicit matches found, check for Solana address in lowercase
      if (!preserveCaseForAddresses) {
        const addressMatch = lowerQuery.match(/[1-9a-hj-np-z]{32,44}/);
        if (addressMatch) {
          console.log(`Found Solana address (lowercase): ${addressMatch[0]}`);
          return addressMatch[0];
        }
      }

      console.log("No token identified in query");
      return null;
    } catch (error) {
      console.error('Error extracting token:', error);
      return null;
    }
  }

  getAnalysisType(query: string): string {
    if (/technical analysis|technical|analysis|rsi|macd|moving average|bollinger|support|resistance|volume profile|trend/i.test(query)) {
      return 'technical';
    } else if (/fundamental analysis|fundamental|project|team|tokenomics|white paper|use case/i.test(query)) {
      return 'fundamental';
    } else {
      return 'overview';
    }
  }

  isGeneralMarketQuestion(query: string): boolean {
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

  formatTechnicalIndicators(technicalIndicators: any): string {
    if (!technicalIndicators) {
      return "No technical indicators available.";
    }
    
    let formatted = "Technical Indicators:\n";
    for (const key in technicalIndicators) {
      if (technicalIndicators.hasOwnProperty(key)) {
        formatted += `- ${key}: ${JSON.stringify(technicalIndicators[key])}\n`;
      }
    }
    return formatted;
  }

  formatTokenData(tokenData: any): string {
    if (!tokenData) {
      return "No token data available.";
    }
    
    let formatted = "Token Data:\n";
    for (const key in tokenData) {
      if (tokenData.hasOwnProperty(key) && key !== 'priceHistory' && key !== 'technicalIndicators') {
        formatted += `- ${key}: ${JSON.stringify(tokenData[key])}\n`;
      }
    }
    return formatted;
  }

  /**
   * Main method to generate token analysis based on the type of analysis requested
   * This method routes to the specific analysis type methods
   */
  async generateTokenAnalysis(tokenData: any, analysisType: string, query: string): Promise<string> {
    // Check what kind of analysis is requested and route to the appropriate method
    if (analysisType === 'technical') {
      return this.generateTechnicalAnalysis(tokenData, query);
    } else if (analysisType === 'fundamental') {
      return this.generateFundamentalAnalysis(tokenData, query);
    } else {
      return this.generateTokenOverview(tokenData, query);
    }
  }

  async generateTechnicalAnalysis(tokenData: any, query: string): Promise<string> {
    try {
      if (!tokenData) {
        return "I couldn't retrieve the token data for technical analysis. Please make sure the token symbol or address is correct.";
      }
      
      const technicalIndicators = tokenData.technicalIndicators || {};
      const symbol = tokenData.symbol?.toUpperCase() || 'Unknown';
      const name = tokenData.name || 'Unknown Token';
      
      let analysis = `## Technical Analysis for ${name} (${symbol})\n\n`;
      
      // Price section with conversational elements
      analysis += `### Price Analysis\n`;
      analysis += `- **Current Price:** $${tokenData.price?.toFixed(6) || 'N/A'}\n`;
      
      if (tokenData.priceChange) {
        analysis += `- **24h Change:** ${tokenData.priceChange['24h']?.toFixed(2) || 0}%\n`;
        analysis += `- ${getRandomConnector()} **1h Change:** ${tokenData.priceChange['1h']?.toFixed(2) || 0}%\n`;
      }
      
      // Volume analysis with personalized insights
      analysis += `\n### Volume Analysis\n`;
      analysis += `- **24h Volume:** $${(tokenData.volume?.['24h'] || 0).toLocaleString()}\n`;
      
      if (technicalIndicators.volumeTrend) {
        analysis += `- ${getRandomInsight()} **Volume Trend:** ${technicalIndicators.volumeTrend} `;
        
        if (tokenData.trade24hChangePercent) {
          analysis += `(${tokenData.trade24hChangePercent.toFixed(2)}% change in 24h)\n`;
        } else {
          analysis += '\n';
        }
      }
      
      // Technical indicators with conversational transitions
      analysis += `\n### Technical Indicators\n`;
      
      // RSI
      if (technicalIndicators.rsi) {
        analysis += `- **RSI:** ${technicalIndicators.rsi.value?.toFixed(2) || 'N/A'} - ${technicalIndicators.rsi.interpretation}\n`;
      }
      
      // MACD with confidence level
      if (technicalIndicators.macd) {
        analysis += `- ${getRandomTransition()} **MACD:** Value: ${technicalIndicators.macd.value?.toFixed(6) || 'N/A'}, Signal: ${technicalIndicators.macd.signal?.toFixed(6) || 'N/A'}\n`;
        analysis += `  - ${getRandomConfidenceLevel()} ${technicalIndicators.macd.interpretation}\n`;
      }
      
      // Bollinger Bands
      if (technicalIndicators.bollingerBands) {
        analysis += `- **Bollinger Bands:**\n`;
        analysis += `  - Upper: $${technicalIndicators.bollingerBands.upper?.toFixed(6) || 'N/A'}\n`;
        analysis += `  - Middle: $${technicalIndicators.bollingerBands.middle?.toFixed(6) || 'N/A'}\n`;
        analysis += `  - Lower: $${technicalIndicators.bollingerBands.lower?.toFixed(6) || 'N/A'}\n`;
        analysis += `  - ${technicalIndicators.bollingerBands.interpretation}\n`;
      }
      
      // Moving Averages with time reference
      if (technicalIndicators.ema) {
        analysis += `- **Moving Averages:** ${getRandomTimeReference()}\n`;
        analysis += `  - EMA9: $${technicalIndicators.ema.ema9?.toFixed(6) || 'N/A'}\n`;
        analysis += `  - EMA20: $${technicalIndicators.ema.ema20?.toFixed(6) || 'N/A'}\n`;
        analysis += `  - EMA50: $${technicalIndicators.ema.ema50?.toFixed(6) || 'N/A'}\n`;
        analysis += `  - EMA200: $${technicalIndicators.ema.ema200?.toFixed(6) || 'N/A'}\n`;
        analysis += `  - ${technicalIndicators.ema.interpretation}\n`;
      }
      
      // Support and Resistance
      if (technicalIndicators.supports && technicalIndicators.resistances) {
        analysis += `- **Support Levels:**\n`;
        technicalIndicators.supports.forEach((level: number, index: number) => {
          analysis += `  - Support ${index + 1}: $${level.toFixed(6)}\n`;
        });
        
        analysis += `- **Resistance Levels:**\n`;
        technicalIndicators.resistances.forEach((level: number, index: number) => {
          analysis += `  - Resistance ${index + 1}: $${level.toFixed(6)}\n`;
        });
      }
      
      // Trends
      if (technicalIndicators.currentTrend) {
        analysis += `- **Current Trend:** ${technicalIndicators.currentTrend}\n`;
      }
      
      if (technicalIndicators.priceActionPattern) {
        analysis += `- **Pattern Recognition:** Potential ${technicalIndicators.priceActionPattern} pattern forming\n`;
      }
      
      // Market statistics
      analysis += `\n### Market Statistics\n`;
      analysis += `- **Market Cap:** $${tokenData.marketCap?.toLocaleString() || 'N/A'}\n`;
      analysis += `- **Liquidity:** $${tokenData.liquidity?.toLocaleString() || 'N/A'}\n`;
      
      if (tokenData.holder) {
        analysis += `- **Holders:** ${tokenData.holder?.toLocaleString() || 'N/A'}\n`;
      }
      
      // Add a conclusion section
      analysis += `\n### Summary\n`;
      
      // Generate a conclusion based on indicators
      let bullishFactors = 0;
      let bearishFactors = 0;
      
      // Count bullish/bearish signals from indicators
      if (technicalIndicators.rsi?.value < 30) bullishFactors++;
      if (technicalIndicators.rsi?.value > 70) bearishFactors++;
      
      if (technicalIndicators.macd?.histogram > 0) bullishFactors++;
      if (technicalIndicators.macd?.histogram < 0) bearishFactors++;
      
      if (technicalIndicators.ema?.ema9 > technicalIndicators.ema?.ema20) bullishFactors++;
      if (technicalIndicators.ema?.ema9 < technicalIndicators.ema?.ema20) bearishFactors++;
      
      if (tokenData.priceChange?.['24h'] > 0) bullishFactors++;
      if (tokenData.priceChange?.['24h'] < 0) bearishFactors++;
      
      if (technicalIndicators.volumeTrend === 'increasing' && tokenData.priceChange?.['24h'] > 0) bullishFactors++;
      if (technicalIndicators.volumeTrend === 'increasing' && tokenData.priceChange?.['24h'] < 0) bearishFactors++;
      
      // Generate conclusion based on signals count with conversational tone
      if (bullishFactors > bearishFactors + 1) {
        analysis += `${getRandomConnector()} The technical indicators for ${symbol} are predominantly bullish. With ${bullishFactors} bullish signals versus ${bearishFactors} bearish signals, the token shows positive momentum. Key support is at $${technicalIndicators.supports?.[0]?.toFixed(6) || 'N/A'}.\n`;
      } else if (bearishFactors > bullishFactors + 1) {
        analysis += `${getRandomConnector()} The technical indicators for ${symbol} are predominantly bearish. With ${bearishFactors} bearish signals versus ${bullishFactors} bullish signals, the token shows negative momentum. Watch for key resistance at $${technicalIndicators.resistances?.[0]?.toFixed(6) || 'N/A'}.\n`;
      } else {
        analysis += `${getRandomConfidenceLevel()} the technical indicators for ${symbol} are showing mixed signals with ${bullishFactors} bullish and ${bearishFactors} bearish indicators. The token appears to be in a consolidation phase. Monitor price action around support at $${technicalIndicators.supports?.[0]?.toFixed(6) || 'N/A'} and resistance at $${technicalIndicators.resistances?.[0]?.toFixed(6) || 'N/A'}.\n`;
      }
      
      // Add disclaimer
      analysis += `\n*Disclaimer: This analysis is generated for informational purposes only and should not be considered financial advice. Always conduct your own research before making investment decisions.*`;
      
      // Determine sentiment for personality enhancement
      let sentiment: 'bullish' | 'bearish' | 'neutral';
      if (bullishFactors > bearishFactors + 1) {
        sentiment = 'bullish';
      } else if (bearishFactors > bullishFactors + 1) {
        sentiment = 'bearish';
      } else {
        sentiment = 'neutral';
      }
      
      // Enhance the analysis with personality
      return enhanceAnalysisWithPersonality(analysis, symbol, sentiment);
    } catch (error) {
      console.error('Error generating technical analysis:', error);
      return `I encountered an error while generating the technical analysis. Basic token info: ${tokenData?.name || 'Unknown'} (${tokenData?.symbol || 'Unknown'}) priced at $${tokenData?.price || 'Unknown'}.`;
    }
  }
  
  async generateFundamentalAnalysis(tokenData: any, query: string): Promise<string> {
    try {
      if (!tokenData) {
        return "I couldn't retrieve the token data for fundamental analysis. Please make sure the token symbol or address is correct.";
      }
      
      const symbol = tokenData.symbol?.toUpperCase() || 'Unknown';
      const name = tokenData.name || 'Unknown Token';
      
      let analysis = `## Fundamental Analysis for ${name} (${symbol})\n\n`;
      
      // Token info section
      analysis += `### Token Information\n`;
      analysis += `- **Name:** ${name}\n`;
      analysis += `- **Symbol:** ${symbol}\n`;
      analysis += `- **Current Price:** $${tokenData.price?.toFixed(6) || 'N/A'}\n`;
      analysis += `- **Market Cap:** $${tokenData.marketCap?.toLocaleString() || 'N/A'}\n`;
      analysis += `- **Fully Diluted Valuation:** $${tokenData.fdv?.toLocaleString() || 'N/A'}\n`;
      analysis += `- **Circulating Supply:** ${tokenData.circulatingSupply?.toLocaleString() || 'N/A'}\n`;
      analysis += `- **Total Supply:** ${tokenData.totalSupply?.toLocaleString() || 'N/A'}\n`;
      
      // Project details - extracted from extensions if available
      if (tokenData.extensions) {
        analysis += `\n### Project Information\n`;
        
        if (tokenData.extensions.website) {
          analysis += `- **Website:** ${tokenData.extensions.website}\n`;
        }
        
        if (tokenData.extensions.twitter) {
          analysis += `- **Twitter:** ${tokenData.extensions.twitter}\n`;
        }
        
        if (tokenData.extensions.discord) {
          analysis += `- **Discord:** ${tokenData.extensions.discord}\n`;
        }
        
        if (tokenData.extensions.telegram) {
          analysis += `- **Telegram:** ${tokenData.extensions.telegram || 'Not available'}\n`;
        }
        
        if (tokenData.extensions.description) {
          analysis += `- **Description:** ${tokenData.extensions.description}\n`;
        }
        
        if (tokenData.extensions.coingeckoId) {
          analysis += `- **CoinGecko ID:** ${tokenData.extensions.coingeckoId}\n`;
        }
      }
      
      // Market adoption section
      analysis += `\n### Market Adoption\n`;
      analysis += `- **Holders:** ${tokenData.holder?.toLocaleString() || 'N/A'}\n`;
      analysis += `- **Active Wallets (24h):** ${tokenData.uniqueWallet24h?.toLocaleString() || 'N/A'}\n`;
      
      if (tokenData.uniqueWallet24hChangePercent) {
        const walletTrend = tokenData.uniqueWallet24hChangePercent > 0 ? 'increasing' : 'decreasing';
        analysis += `- **Wallet Activity:** ${walletTrend} (${tokenData.uniqueWallet24hChangePercent.toFixed(2)}%)\n`;
      }
      
      analysis += `- **Trades (24h):** ${tokenData.trade24h?.toLocaleString() || 'N/A'}\n`;
      
      // Liquidity analysis
      analysis += `\n### Liquidity Analysis\n`;
      analysis += `- **Liquidity:** $${tokenData.liquidity?.toLocaleString() || 'N/A'}\n`;
      analysis += `- **Trading Volume (24h):** $${(tokenData.v24hUSD || tokenData.volume?.['24h'] || 0).toLocaleString()}\n`;
      
      if (tokenData.numberMarkets) {
        analysis += `- **Trading Markets:** ${tokenData.numberMarkets.toLocaleString()}\n`;
      }
      
      // Contract info
      analysis += `\n### Contract Information\n`;
      analysis += `- **Token Address:** ${tokenData.address || 'N/A'}\n`;
      analysis += `- **Decimals:** ${tokenData.decimals || 'N/A'}\n`;
      
      // Add a conclusion section
      analysis += `\n### Summary\n`;
      analysis += `${name} (${symbol}) shows ${tokenData.marketCap > 100000000 ? 'significant' : 'moderate'} market adoption with a market cap of $${tokenData.marketCap?.toLocaleString() || 'N/A'} and ${tokenData.holder?.toLocaleString() || 'N/A'} holders. `;
      
      if (tokenData.liquidity > 1000000) {
        analysis += `The token has strong liquidity of $${tokenData.liquidity?.toLocaleString() || 'N/A'}, which suggests reduced slippage for larger trades. `;
      } else if (tokenData.liquidity > 100000) {
        analysis += `The token has moderate liquidity of $${tokenData.liquidity?.toLocaleString() || 'N/A'}, which should be adequate for average-sized trades. `;
      } else {
        analysis += `The token has limited liquidity of $${tokenData.liquidity?.toLocaleString() || 'N/A'}, which could result in higher slippage for larger trades. `;
      }
      
      // Add disclaimer
      analysis += `\n\n*Disclaimer: This analysis is generated for informational purposes only and should not be considered financial advice. Always conduct your own research before making investment decisions.*`;
      
      return analysis;
    } catch (error) {
      console.error('Error generating fundamental analysis:', error);
      return `I encountered an error while generating the fundamental analysis. Basic token info: ${tokenData?.name || 'Unknown'} (${tokenData?.symbol || 'Unknown'}) priced at $${tokenData?.price || 'Unknown'}.`;
    }
  }
  
  async generateTokenOverview(tokenData: any, query: string): Promise<string> {
    try {
      if (!tokenData) {
        return "I couldn't retrieve the token data. Please make sure the token symbol or address is correct.";
      }
      
      const symbol = tokenData.symbol?.toUpperCase() || 'Unknown';
      const name = tokenData.name || 'Unknown Token';
      
      let analysis = `## Market Overview for ${name} (${symbol})\n\n`;
      analysis += `- **Current Price:** $${tokenData.price?.toFixed(6) || 'N/A'}\n`;
      analysis += `- **Market Cap:** $${tokenData.marketCap?.toLocaleString() || 'N/A'}\n`;
      analysis += `- **24h Volume:** $${(tokenData.v24hUSD || tokenData.volume?.['24h'] || 0).toLocaleString()}\n\n`;
      
      analysis += `For more detailed information, you can ask for specific analysis types:\n`;
      analysis += `- Technical analysis (e.g., "Give me a technical analysis of ${symbol}")\n`;
      analysis += `- Fundamental analysis (e.g., "What's the fundamental analysis for ${symbol}")\n\n`;
      
      // Add disclaimer
      analysis += `*Disclaimer: This analysis is for informational purposes only and not financial advice.*`;
      
      return analysis;
    } catch (error) {
      console.error('Error generating token overview:', error);
      return `I encountered an error while generating the token overview. Basic token info: ${tokenData?.name || 'Unknown'} (${tokenData?.symbol || 'Unknown'}) priced at $${tokenData?.price || 'Unknown'}.`;
    }
  }

  async generateMarketOverview(query: string): Promise<string> {
    try {
      // Get data for major tokens
      const solData = await this.birdeyeService.fetchTokenData('sol');
      const btcData = await this.birdeyeService.fetchTokenData('btc');
      
      let overview = `## Crypto Market Overview\n\n`;
      
      if (solData) {
        overview += `### Solana (SOL)\n`;
        overview += `- **Current Price:** $${solData.price?.toFixed(2) || 'N/A'}\n`;
        overview += `- **24h Change:** ${solData.priceChange?.['24h']?.toFixed(2) || solData.priceChange24hPercent?.toFixed(2) || '0'}%\n`;
        overview += `- **Market Cap:** $${solData.marketCap?.toLocaleString() || 'N/A'}\n`;
        overview += `- **24h Volume:** $${(solData.v24hUSD || solData.volume?.['24h'] || 0).toLocaleString()}\n\n`;
      }
      
      if (btcData) {
        overview += `### Bitcoin (BTC)\n`;
        overview += `- **Current Price:** $${btcData.price?.toFixed(2) || 'N/A'}\n`;
        overview += `- **24h Change:** ${btcData.priceChange?.['24h']?.toFixed(2) || btcData.priceChange24hPercent?.toFixed(2) || '0'}%\n`;
        overview += `- **Market Cap:** $${btcData.marketCap?.toLocaleString() || 'N/A'}\n\n`;
      }
      
      // General market sentiment
      overview += `### Market Sentiment\n`;
      
      const solChange = solData?.priceChange?.['24h'] || solData?.priceChange24hPercent || 0;
      const btcChange = btcData?.priceChange?.['24h'] || btcData?.priceChange24hPercent || 0;
      
      const averageChange = (solChange + btcChange) / 2;
      
      if (averageChange > 3) {
        overview += `The market is showing strong bullish momentum with major assets up significantly in the last 24 hours.\n`;
      } else if (averageChange > 1) {
        overview += `The market is trending positive with moderate gains across major assets.\n`;
      } else if (averageChange > -1) {
        overview += `The market is relatively stable with mixed performance across different assets.\n`;
      } else if (averageChange > -3) {
        overview += `The market is showing bearish pressure with moderate losses across major assets.\n`;
      } else {
        overview += `The market is experiencing significant bearish momentum with major assets down in the last 24 hours.\n`;
      }
      
      // Add notable highlights
      overview += `\n### Market Highlights\n`;
      overview += `- **Solana DeFi TVL:** Growing steadily with multiple protocols showing increased adoption\n`;
      overview += `- **NFT Market:** Activity levels moderate with selective collections showing strength\n`;
      overview += `- **DEX Volume:** Consistent trading volume across major Solana DEXes\n\n`;
      
      // Add disclaimer
      overview += `*Disclaimer: This market overview is for informational purposes only and not financial advice.*`;
      
      return overview;
    } catch (error) {
      console.error('Error generating market overview:', error);
      
      // Fallback overview if API calls fail
      let overview = `## Crypto Market Overview\n\n`;
      overview += `The cryptocurrency market is currently showing mixed signals across major assets. `;
      overview += `Solana ecosystem tokens have been demonstrating varied performance with select projects showing strength. `;
      overview += `Overall market sentiment appears neutral with selective opportunities emerging in both established and newer projects.\n\n`;
      overview += `*Disclaimer: This overview is for informational purposes only and not financial advice.*`;
      
      return overview;
    }
  }
}
