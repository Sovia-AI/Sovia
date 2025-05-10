
import { MiddlewareFunction } from '../core/types';
import { MarketAnalysisAgent } from '../core/marketAnalysis';
import { TokenAnalysisService } from '../integrations/tokenAnalysisService';
import { BirdeyeService } from '../integrations/birdeyeService';
import { extractTokenFromQuery } from '../config/birdeyeConfig';
import { AnalysisResponseBuilder } from '../services/AnalysisResponseBuilder';
import { UnifiedAnalysisService } from '../services/UnifiedAnalysisService';

export const createMarketAnalysisMiddleware = (): MiddlewareFunction => {
  const marketAnalyzer = new MarketAnalysisAgent();
  const tokenAnalysisService = new TokenAnalysisService();
  const birdeyeService = new BirdeyeService();
  const responseBuilder = new AnalysisResponseBuilder();
  const unifiedAnalysisService = new UnifiedAnalysisService();

  return async (context, next) => {
    const input = context.currentInput?.toLowerCase() || '';
    
    // First, check if this is specifically a buying level or price target query
    // These queries often get misinterpreted as weather queries
    const isBuyingLevelQuery = /\b(buy|buying|entry|good|best|target)\b.*\b(level|price|point|zone|dip|opportunity)\b/i.test(input) ||
                               /\b(level|price|point|zone|dip|opportunity)\b.*\b(buy|buying|entry|good|best|target)\b/i.test(input);

    if (isBuyingLevelQuery) {
      console.log('Detected buying level query:', input);
      try {
        // Extract token from query
        const token = await marketAnalyzer.extractTokenFromQuery(input);
        if (token) {
          console.log(`Found token for buying level query: ${token}`);
          const tokenData = await birdeyeService.fetchTokenData(token);
          if (tokenData) {
            // Generate focused analysis for buying levels
            const analysis = responseBuilder.buildBuyingLevelAnalysis(tokenData, input);
            if (analysis) {
              context.response = analysis;
              context.lastToken = token;
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error processing buying level query:', error);
        // Continue with normal processing as fallback
      }
    }
    
    // Handle tokens with "pump" suffix first
    const pumpMatch = input.match(/([1-9A-HJ-NP-Za-km-z]{32,44})pump\b/i);
    if (pumpMatch) {
      try {
        const fullAddress = pumpMatch[0]; // Use the full address including pump suffix
        console.log(`Detected token address with 'pump' suffix: ${fullAddress}`);
        
        try {
          // Use UnifiedAnalysisService for consistent handling
          const analysis = await unifiedAnalysisService.processQuery(fullAddress);
          
          if (analysis) {
            context.response = analysis;
            context.lastToken = fullAddress;
            return;
          }
        } catch (pumpError) {
          console.error(`Error processing token with pump suffix: ${pumpError}`);
          
          // Fallback to direct approach
          const tokenData = await birdeyeService.fetchTokenData(fullAddress);
          if (tokenData) {
            const analysis = responseBuilder.buildComprehensiveAnalysis(tokenData, `Technical analysis of ${fullAddress}`);
            if (analysis) {
              context.response = analysis;
              context.lastToken = fullAddress;
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error processing token with pump suffix:', error);
        // Continue with normal processing
      }
    }
    
    // IMPROVED: More robust check for $symbol pattern with better handling
    const dollarSignMatch = input.match(/\$([a-zA-Z0-9]+)/i);
    if (dollarSignMatch) {
      try {
        const tokenSymbol = dollarSignMatch[1].toLowerCase();
        console.log(`Detected $ prefix token lookup: ${tokenSymbol}`);
        
        // Map common token symbols to their addresses
        const tokenAddressMap = {
          'sol': 'So11111111111111111111111111111111111111112',
          'bonk': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
          'jup': 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
          'wen': 'WenMEv5hQQJ7DoCCMkTy1tXnQzjkiKk8u5uLuVr57GPB',
          'jto': 'jtojtomepa8beP8AuQc6eXt5FriJwTMDwD9ZoJVCg7Ny',
          'pyth': 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
          'msol': 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
          'ray': '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
          'orca': 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
          'usdc': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          'wif': '5fTwKZP2AK39LtFN9Ayppu6hdCVKfMGVm79F2EgHCtR1',
          'neet': 'Ce2gx9KGXJ6C9Mp5b5x1sn9Mg87JwEbrQby4Zqo3',
          'house': 'DitHyRMQiSDhn5cnKMJV2CDDt6sVct96YrECiM49',
          'fartcoin': '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbg',
          'gork': '38PgzpJYu2HkiYvV8qePFakB8tuobPdGm2FFEn7D',
        };
        
        // Also add pump tokens
        const pumpTokenMap = {
          'neet': 'Ce2gx9KGXJ6C9Mp5b5x1sn9Mg87JwEbrQby4Zqo3pump',
          'house': 'DitHyRMQiSDhn5cnKMJV2CDDt6sVct96YrECiM49pump',
          'fartcoin': '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump',
          'gork': '38PgzpJYu2HkiYvV8qePFakB8tuobPdGm2FFEn7Dpump',
        };
        
        // Check if there's a "pump" keyword in the query after $ symbol
        const isPumpQuery = input.includes('pump') || 
                           /pump\b/i.test(input.slice(input.indexOf('$')));
        
        let tokenAddress;
        if (isPumpQuery && pumpTokenMap[tokenSymbol]) {
          tokenAddress = pumpTokenMap[tokenSymbol];
          console.log(`Using pump address for $${tokenSymbol}: ${tokenAddress}`);
        } else if (tokenAddressMap[tokenSymbol]) {
          tokenAddress = tokenAddressMap[tokenSymbol];
          console.log(`Mapped $${tokenSymbol} to address: ${tokenAddress}`);
        }
        
        if (tokenAddress) {
          try {
            // Direct approach using Birdeye for faster response
            const tokenData = await birdeyeService.fetchTokenData(tokenAddress);
            if (tokenData) {
              console.log(`Direct Birdeye fetch succeeded for $${tokenSymbol}`);
              const analysis = responseBuilder.buildComprehensiveAnalysis(tokenData, `Technical analysis of ${tokenSymbol}`);
              
              if (analysis) {
                context.response = analysis;
                context.lastToken = tokenSymbol;
                return;
              }
            }
          } catch (directError) {
            console.error(`Error with direct approach for $${tokenSymbol}:`, directError);
            // Fall through to UnifiedAnalysisService as backup
          }
          
          // Use UnifiedAnalysisService as backup
          try {
            const analysis = await unifiedAnalysisService.processQuery(tokenAddress);
            
            if (analysis) {
              context.response = analysis;
              context.lastToken = tokenSymbol;
              return;
            }
          } catch (unifiedError) {
            console.error(`Error with UnifiedAnalysisService for $${tokenSymbol}:`, unifiedError);
          }
          
          // As a last resort, try token analysis service
          try {
            const analysisResult = await tokenAnalysisService.analyzeToken(tokenAddress);
            if (analysisResult?.analysis) {
              context.response = analysisResult.analysis;
              context.lastToken = tokenSymbol;
              return;
            }
          } catch (lastResortError) {
            console.error(`Last resort error for $${tokenSymbol}:`, lastResortError);
          }
          
          // Provide a fallback response if all else fails
          context.response = `I tried to analyze $${tokenSymbol.toUpperCase()}, but I'm having trouble retrieving the data at the moment. Please try another token or try again later.`;
          return;
        } else {
          console.log(`No address mapping found for token symbol: ${tokenSymbol}`);
          context.response = `I don't have data for the token symbol $${tokenSymbol.toUpperCase()}. Supported tokens include $SOL, $BONK, $JUP, $WEN, $JTO, $PYTH, $MSOL, $RAY, $ORCA, $USDC, and $WIF. You can also try providing a full token address.`;
          return;
        }
      } catch (error) {
        console.error('Error processing $ token lookup:', error);
        // Continue with normal processing
      }
    }
    
    // Also check for bare token symbols for major tokens like SOL, ETH, etc.
    const bareTokenCheck = (input: string): string | null => {
      const tokens = input.toLowerCase().split(/\s+/);
      const knownTokens = {
        'sol': 'So11111111111111111111111111111111111111112',
        'bonk': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
        'jup': 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'
      };
      
      // Check for tokens that appear as standalone words
      for (const token of tokens) {
        const cleanToken = token.replace(/[.,?!]/g, '');
        if (knownTokens[cleanToken]) {
          return knownTokens[cleanToken];
        }
      }
      
      // For buying level queries, check for SOL specifically
      if (isBuyingLevelQuery && /\b(sol|solana)\b/i.test(input)) {
        return 'So11111111111111111111111111111111111111112';
      }
      
      return null;
    };
    
    const bareToken = bareTokenCheck(input);
    if (bareToken) {
      console.log(`Found bare token reference: ${bareToken}`);
      try {
        const tokenData = await birdeyeService.fetchTokenData(bareToken);
        if (tokenData) {
          const analysis = responseBuilder.buildComprehensiveAnalysis(tokenData, input);
          if (analysis) {
            context.response = analysis;
            context.lastToken = bareToken;
            return;
          }
        }
      } catch (error) {
        console.error('Error processing bare token:', error);
        // Continue with normal processing
      }
    }
    
    // Enhanced market query detection patterns to identify more specific analysis requests
    // We've added buying level, entry point, support/resistance, and price target related terms
    const isMarketQuery = input.includes('market') || 
      input.includes('price') || 
      input.includes('analysis') ||
      input.includes('technical') ||
      input.includes('trend') ||
      input.includes('trading') ||
      input.includes('volume') ||
      input.includes('token') ||
      input.includes('crypto') ||
      input.includes('coin') ||
      input.includes('sol') ||
      input.includes('chart') ||
      input.includes('buy') || 
      input.includes('buying') || 
      input.includes('level') || 
      input.includes('entry') || 
      input.includes('target') || 
      input.includes('support') || 
      input.includes('resistance') ||
      /rsi|macd|bollinger|moving average|support|resistance|stochastic/i.test(input) ||
      /fibonacci|obv|on[ -]?balance volume|adx|atr|ichimoku/i.test(input) ||
      /parabolic|sar|vwap|stochastic|momentum|volatility/i.test(input) ||
      /breakout|breakdown|bullish|bearish|consolidation/i.test(input) ||
      /[1-9A-HJ-NP-Za-km-z]{32,44}/.test(input);

    if (isMarketQuery) {
      try {
        console.log('Market analysis middleware detected market query:', input);
        
        // Check for specific indicator requests
        const isOHLCVRequest = /ohlcv|candle|candlestick|chart data/i.test(input);
        const isAdvancedIndicator = /ichimoku|cloud|atr|average true range|keltner|donchian/i.test(input);
        
        // If requesting OHLCV data or advanced indicators, prioritize enhanced data flow
        if (isOHLCVRequest || isAdvancedIndicator) {
          console.log('Detected request for advanced indicators or OHLCV data');
          // Extract token from query
          const token = await marketAnalyzer.extractTokenFromQuery(input);
          if (token) {
            const tokenData = await birdeyeService.fetchTokenData(token);
            if (tokenData) {
              // Enhance with OHLCV data
              try {
                const ohlcvData = await birdeyeService.fetchOHLCVData(tokenData.address);
                if (ohlcvData && ohlcvData.length > 0) {
                  tokenData.ohlcv = ohlcvData;
                }
              } catch (ohlcvError) {
                console.error('Error fetching OHLCV data:', ohlcvError);
              }
              
              // Generate enhanced analysis
              const enhancedAnalysis = responseBuilder.buildComprehensiveAnalysis(tokenData, input);
              if (enhancedAnalysis) {
                context.response = enhancedAnalysis;
                context.lastToken = token;
                return;
              }
            }
          }
        }
        
        // First approach - use UnifiedAnalysisService as the new primary handler
        try {
          console.log('Attempting with UnifiedAnalysisService');
          const analysisResult = await unifiedAnalysisService.processQuery(input);
          
          if (analysisResult) {
            console.log('UnifiedAnalysisService analysis successful');
            context.response = analysisResult;
            
            // Extract token for context
            const token = await marketAnalyzer.extractTokenFromQuery(input);
            if (token) {
              context.lastToken = token;
            }
            return;
          }
        } catch (unifiedError) {
          console.error('Error in UnifiedAnalysisService:', unifiedError);
          // Continue to fallback paths
        }
        
        // Direct approach - use TokenAnalysisService as the orchestration layer
        try {
          console.log('Attempting with TokenAnalysisService');
          const analysisResult = await tokenAnalysisService.analyzeToken(input);
          
          if (analysisResult?.analysis) {
            console.log('TokenAnalysisService analysis successful');
            
            // Check if query is asking for a specific indicator and extract it if needed
            if (
              /\b(rsi|macd|volume|bollinger|support|resistance|moving average|stochastic)\b/i.test(input) &&
              !/full|complete|detailed analysis/i.test(input)
            ) {
              const specificResponse = responseBuilder.extractSingleIndicatorResponse(input, analysisResult.analysis);
              context.response = specificResponse;
            } else {
              context.response = analysisResult.analysis;
            }
            
            // Save token to context for follow-up questions
            if (analysisResult.tokenData?.symbol) {
              context.lastToken = analysisResult.tokenData.symbol;
            }
            return;
          }
        } catch (primaryError) {
          console.error('Error in TokenAnalysisService path:', primaryError);
          // Continue to fallback paths
        }
        
        // If the above fails, try direct approach using MarketAnalysisAgent
        try {
          console.log('Attempting direct analysis with MarketAnalysisAgent');
          const analysis = await marketAnalyzer.handleQuery(input);
          
          if (analysis) {
            console.log('Direct analysis successful');
            
            // Check if query is asking for a specific indicator
            if (
              /\b(rsi|macd|volume|bollinger|support|resistance|moving average|stochastic)\b/i.test(input) &&
              !/full|complete|detailed analysis/i.test(input)
            ) {
              const specificResponse = responseBuilder.extractSingleIndicatorResponse(input, analysis);
              context.response = specificResponse;
            } else {
              context.response = analysis;
            }
            
            // Extract token from query for context
            const token = await marketAnalyzer.extractTokenFromQuery(input);
            if (token) {
              context.lastToken = token;
            }
            return;
          }
        } catch (directError) {
          console.error('Error in direct analysis path:', directError);
          // Continue to fallback paths
        }
        
        // Try to extract token and use Birdeye directly as final fallback
        try {
          const token = await marketAnalyzer.extractTokenFromQuery(input);
          console.log('Final fallback with extracted token:', token);
          
          if (token) {
            console.log(`Trying direct Birdeye approach for ${token}`);
            const tokenData = await birdeyeService.fetchTokenData(token);
            
            if (tokenData) {
              console.log(`Successfully fetched data for ${token}, generating analysis...`);
              
              // First try using the new response builder
              try {
                const enhancedAnalysis = responseBuilder.buildComprehensiveAnalysis(tokenData, input);
                
                if (enhancedAnalysis) {
                  console.log('Enhanced analysis generated successfully');
                  
                  // Check if query is asking for a specific indicator
                  if (
                    /\b(rsi|macd|volume|bollinger|support|resistance|moving average|stochastic)\b/i.test(input) &&
                    !/full|complete|detailed analysis/i.test(input)
                  ) {
                    const specificResponse = responseBuilder.extractSingleIndicatorResponse(input, enhancedAnalysis);
                    context.response = specificResponse;
                  } else {
                    context.response = enhancedAnalysis;
                  }
                  
                  context.lastToken = token;
                  return;
                }
              } catch (enhancedError) {
                console.error('Error generating enhanced analysis:', enhancedError);
                // Fall back to original method
              }
              
              // Fall back to original analysis method
              const analysis = await marketAnalyzer.generateTokenAnalysis(tokenData, 'overview', input);
              
              if (analysis) {
                console.log('Fallback analysis successful');
                context.response = analysis;
                context.lastToken = token;
                return;
              }
            }
          }
        } catch (fallbackError) {
          console.error('Error in fallback analysis path:', fallbackError);
        }
        
        // Check if this is a general market question
        if (/market|trend|overview|condition|status|crypto\s+market/i.test(input)) {
          try {
            console.log('Attempting to generate general market overview');
            const generalAnalysis = await marketAnalyzer.generateMarketOverview(input);
            if (generalAnalysis) {
              console.log('General market analysis generated');
              context.response = generalAnalysis;
              return;
            }
          } catch (marketError) {
            console.error('Error generating market overview:', marketError);
          }
        }
        
        // Generic response if all else fails
        context.response = "I'm having trouble analyzing that market data right now. Could you try asking about a specific token like SOL or BONK?";
      } catch (error) {
        console.error('Error in market analysis middleware:', error);
        // Let the next middleware handle it
      }
    }

    await next();
  };
};
