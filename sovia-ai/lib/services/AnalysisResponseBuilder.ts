import { formatNumber } from '../utils/formatters';
import { TechnicalIndicators } from './TechnicalIndicators';
import { 
  traderPersonality, 
  enhanceAnalysisWithPersonality, 
  getRandomElement,
  getPersonalizedPatternDescription,
  getPersonalizedIndicatorName
} from '../personality/MarketPersonality';

/**
 * Class responsible for building comprehensive market analysis responses
 * with conversational tone and actionable insights
 */
export class AnalysisResponseBuilder {
  private technicalIndicators: TechnicalIndicators;
  
  constructor() {
    this.technicalIndicators = new TechnicalIndicators();
  }
  
  /**
   * Build a comprehensive market analysis response
   */
  public buildComprehensiveAnalysis(tokenData: any, query: string): string {
    if (!tokenData) {
      return "I couldn't retrieve token data for analysis. Please try again with a valid token symbol or address.";
    }

    const token = tokenData.symbol?.toUpperCase() || 'Unknown';
    const price = tokenData.price || 0;
    const marketCap = tokenData.marketCap || 0;
    const volume24h = tokenData.v24hUSD || tokenData.volume?.['24h'] || 0;
    
    // Ensure we have technical indicators
    let technicalData = tokenData.technicalIndicators;
    if (!technicalData) {
      // Generate indicators if not present
      technicalData = this.technicalIndicators.generateIndicators(tokenData);
    }
    
    // Determine market sentiment based on indicators
    const sentiment = this.determineSentiment(technicalData);
    
    // Generate price analysis section
    const priceAnalysis = this.generatePriceAnalysis(token, price, technicalData, tokenData);
    
    // Generate volume analysis
    const volumeAnalysis = this.generateVolumeAnalysis(token, volume24h, tokenData);
    
    // Generate indicator analysis
    const indicatorAnalysis = this.generateIndicatorAnalysis(technicalData, token);
    
    // Generate market structure analysis
    const marketStructure = this.generateMarketStructureAnalysis(technicalData, tokenData);
    
    // Generate trading recommendation
    const recommendation = this.generateRecommendation(sentiment, technicalData, token, price);
    
    // Compose the final response based on what was asked
    let finalResponse = this.composeResponse(
      query,
      token,
      price,
      marketCap,
      volume24h,
      priceAnalysis,
      volumeAnalysis,
      indicatorAnalysis,
      marketStructure,
      recommendation
    );
    
    // Enhance the response with trading personality
    finalResponse = enhanceAnalysisWithPersonality(finalResponse, token, sentiment as any);
    
    return finalResponse;
  }
  
  /**
   * Build a focused analysis for buying levels and price targets
   */
  public buildBuyingLevelAnalysis(tokenData: any, query: string): string {
    if (!tokenData) {
      return "I couldn't retrieve token data for analysis. Please try again with a valid token symbol or address.";
    }

    const token = tokenData.symbol?.toUpperCase() || 'Unknown';
    const price = tokenData.price || 0;
    
    // Ensure we have technical indicators
    let technicalData = tokenData.technicalIndicators;
    if (!technicalData) {
      // Generate indicators if not present
      technicalData = this.technicalIndicators.generateIndicators(tokenData);
    }
    
    // Calculate support levels
    const supports = technicalData.supports || this.calculateSupportLevels(price, [price * 0.95, price * 0.9, price * 0.85], tokenData);
    
    // Calculate resistance levels
    const resistances = technicalData.resistances || this.calculateResistanceLevels(price, [price * 1.05, price * 1.1, price * 1.15], tokenData);
    
    // Generate market sentiment
    const sentiment = this.determineSentiment(technicalData);
    
    // Build buying level analysis
    let analysis = `## ${token} Buying Level Analysis\n\n`;
    analysis += `**Current Price:** $${price.toFixed(6)}\n\n`;
    
    analysis += `### Key Buying Zones\n`;
    if (Array.isArray(supports) && supports.length > 0) {
      analysis += `- **Strong Support:** $${supports[0].toFixed(6)} (${((supports[0]/price - 1) * 100).toFixed(2)}% from current price)\n`;
      
      if (supports.length > 1) {
        analysis += `- **Secondary Support:** $${supports[1].toFixed(6)} (${((supports[1]/price - 1) * 100).toFixed(2)}% from current price)\n`;
      }
      
      if (supports.length > 2) {
        analysis += `- **Value Zone:** $${supports[2].toFixed(6)} (${((supports[2]/price - 1) * 100).toFixed(2)}% from current price)\n`;
      }
    } else {
      // Calculate default support levels if not available
      analysis += `- **Strong Support:** $${(price * 0.95).toFixed(6)} (-5% from current price)\n`;
      analysis += `- **Secondary Support:** $${(price * 0.9).toFixed(6)} (-10% from current price)\n`;
      analysis += `- **Value Zone:** $${(price * 0.85).toFixed(6)} (-15% from current price)\n`;
    }
    
    analysis += `\n### Key Resistance Levels\n`;
    if (Array.isArray(resistances) && resistances.length > 0) {
      analysis += `- **Immediate Resistance:** $${resistances[0].toFixed(6)} (${((resistances[0]/price - 1) * 100).toFixed(2)}% from current price)\n`;
      
      if (resistances.length > 1) {
        analysis += `- **Strong Resistance:** $${resistances[1].toFixed(6)} (${((resistances[1]/price - 1) * 100).toFixed(2)}% from current price)\n`;
      }
    } else {
      // Calculate default resistance levels if not available
      analysis += `- **Immediate Resistance:** $${(price * 1.05).toFixed(6)} (+5% from current price)\n`;
      analysis += `- **Strong Resistance:** $${(price * 1.1).toFixed(6)} (+10% from current price)\n`;
    }
    
    // Add RSI commentary for timing entries
    if (technicalData.rsi && technicalData.rsi.value) {
      analysis += `\n### Entry Timing Indicators\n`;
      analysis += `- **RSI:** ${technicalData.rsi.value.toFixed(2)} - `;
      
      if (technicalData.rsi.value > 70) {
        analysis += `Overbought. Consider waiting for a pullback before entry.\n`;
      } else if (technicalData.rsi.value < 30) {
        analysis += `Oversold. Potentially favorable entry point.\n`;
      } else if (technicalData.rsi.value > 60) {
        analysis += `Showing strength but not overbought. Watch for pullbacks to support levels.\n`;
      } else if (technicalData.rsi.value < 40) {
        analysis += `Showing weakness. Could present good entry opportunities if support holds.\n`;
      } else {
        analysis += `In neutral territory. Consider dollar-cost averaging around support levels.\n`;
      }
    }
    
    // Add personalized recommendation
    analysis += `\n### Entry Strategy\n`;
    
    if (sentiment === 'bullish') {
      analysis += getRandomElement([
        `The technicals are aligned bullishly for ${token}. Consider scaling into positions near the support levels, especially if we see a healthy pullback to the $${supports[0].toFixed(6)} zone.`,
        `${token} is showing bullish momentum. Look to buy dips to the support levels rather than chasing rallies.`,
        `With bullish technical alignment, consider setting limit orders at the support levels to catch any quick wicks down.`
      ]);
    } else if (sentiment === 'bearish') {
      analysis += getRandomElement([
        `${token} is showing bearish signals right now. Consider waiting for a break and hold above $${resistances[0].toFixed(6)} before entering, or look for deep value buys near $${(supports[2] || price * 0.85).toFixed(6)}.`,
        `The technicals suggest caution with ${token}. If entering, consider smaller position sizes and tight stops below major supports.`,
        `With bearish technicals, patience may pay off. Consider waiting for signs of reversal or accumulate small positions at major support levels only.`
      ]);
    } else {
      analysis += getRandomElement([
        `${token} is in a consolidation phase. Consider using a scaled entry approach around the support levels identified above.`,
        `With mixed signals on ${token}, a more conservative approach would be to split your entry across multiple support levels.`,
        `The market for ${token} is showing indecision. Consider waiting for a clearer trend to emerge or set limit orders at key support levels.`
      ]);
    }
    
    // Add disclaimer
    analysis += `\n\n*Disclaimer: This analysis is generated for informational purposes only and should not be considered financial advice. Always conduct your own research before making investment decisions.*`;
    
    // Enhance with personality
    return enhanceAnalysisWithPersonality(analysis, token, sentiment as any);
  }
  
  /**
   * Extract single indicator response if that's all that was requested
   */
  public extractSingleIndicatorResponse(query: string, fullResponse: string): string {
    try {
      // Check if query is asking for a specific indicator
      const indicators = {
        'rsi': /\brsi\b|\brelative strength\b/i,
        'macd': /\bmacd\b/i,
        'bollinger': /\bbollinger\b/i,
        'support': /\bsupport level/i,
        'resistance': /\bresistance level/i,
        'volume': /\bvolume\b/i,
        'market cap': /\bmarket cap\b/i,
        'moving average': /\b(moving average|ma|ema|sma)\b/i,
        'trend': /\btrend\b/i,
        'stochastic': /\bstochastic\b/i,
        'ichimoku': /\bichimoku\b/i,
        'fibonacci': /\bfibonacci\b/i
      };
      
      for (const [indicator, pattern] of Object.entries(indicators)) {
        if (pattern.test(query.toLowerCase())) {
          console.log(`Extracting specific indicator information for: ${indicator}`);
          
          // Add some personality to the specific indicator response
          const personalizedIndicator = getPersonalizedIndicatorName(indicator);
          
          // Look for sections in the response about this indicator
          const sections = fullResponse.split('\n\n');
          
          // First try to find a whole section about this indicator
          for (const section of sections) {
            if (pattern.test(section.toLowerCase())) {
              console.log(`Found section for ${indicator}`);
              return `Looking at ${personalizedIndicator} right now:\n\n${section}`;
            }
          }
          
          // If no section found, try to find individual lines
          const lines = fullResponse.split('\n');
          const relevantLines = [];
          
          for (let i = 0; i < lines.length; i++) {
            if (pattern.test(lines[i].toLowerCase())) {
              relevantLines.push(lines[i]);
              
              // Include the next line if it seems to be part of the same point
              if (i + 1 < lines.length && !lines[i + 1].includes('**') && !lines[i + 1].includes('-')) {
                relevantLines.push(lines[i + 1]);
              }
            }
          }
          
          if (relevantLines.length > 0) {
            console.log(`Found ${relevantLines.length} relevant lines for ${indicator}`);
            return `Here's what I'm seeing with ${personalizedIndicator}:\n\n${relevantLines.join('\n')}`;
          }
          
          // If still nothing found, check for the indicator term anywhere
          const regex = new RegExp(`([^.]*${indicator}[^.]*\\.?)`, 'i');
          const match = fullResponse.match(regex);
          
          if (match) {
            console.log(`Found match using regex for ${indicator}`);
            return `Checking out ${personalizedIndicator}:\n\n${match[0]}`;
          }
        }
      }
      
      // If no specific indicator request matched, check if it's about RSI value specifically
      if (/\brsi.*sitting at|rsi.*value|rsi.*level|what.*rsi/i.test(query)) {
        const rsiMatch = fullResponse.match(/\*\*RSI:\*\*\s*([0-9.]+)/i);
        if (rsiMatch) {
          return `RSI is currently sitting at ${rsiMatch[1]}. ${this.getRandomRsiComment(parseFloat(rsiMatch[1]))}`;
        }
      }
      
      console.log("No specific indicator found in query, returning full response");
      return fullResponse;
    } catch (error) {
      console.error("Error extracting single indicator response:", error);
      return fullResponse; // Return the full response if extraction fails
    }
  }
  
  /**
   * Get a random comment about RSI value
   */
  private getRandomRsiComment(rsiValue: number): string {
    if (rsiValue > 70) {
      return getRandomElement([
        "That's in overbought territory. Bulls are in control but watch for a potential cooldown.",
        "Looking pretty hot here! Might be due for a pullback soon.",
        "Definitely showing strength, but be cautious of exhaustion at these levels."
      ]);
    } else if (rsiValue < 30) {
      return getRandomElement([
        "That's in oversold territory. Might be a good spot to watch for a bounce.",
        "Bears have been in control, but this could be approaching a reversal zone.",
        "Pretty oversold here. Keep an eye out for potential buy opportunities if support holds."
      ]);
    } else if (rsiValue >= 55 && rsiValue <= 70) {
      return getRandomElement([
        "Showing healthy bullish momentum without being extremely overbought.",
        "Bulls are in control but still have room to run.",
        "Strong but not overheated yet. Trend is your friend here."
      ]);
    } else if (rsiValue >= 30 && rsiValue < 45) {
      return getRandomElement([
        "On the bearish side but not extremely oversold.",
        "Momentum is down but could be stabilizing soon.",
        "Weak momentum, but watch for potential reversal signs."
      ]);
    } else {
      return getRandomElement([
        "That's in neutral territory - no extreme readings either way.",
        "Middle of the range - doesn't tell us much by itself right now.",
        "Neither overbought nor oversold. Look to other indicators for direction."
      ]);
    }
  }
  
  /**
   * Calculate comprehensive technical indicators
   */
  private calculateTechnicalIndicators(tokenData: any): any {
    // Price data preparation
    const price = tokenData.price || 0;
    const priceHistory = [
      tokenData.history24hPrice || 0,
      tokenData.history12hPrice || 0,
      tokenData.history8hPrice || 0,
      tokenData.history6hPrice || 0,
      tokenData.history4hPrice || 0,
      tokenData.history2hPrice || 0,
      tokenData.history1hPrice || 0,
      price
    ].filter(p => p > 0);
    
    // Price changes for indicators
    const priceChanges = [
      tokenData.priceChange24hPercent || 0,
      tokenData.priceChange12hPercent || 0,
      tokenData.priceChange8hPercent || 0,
      tokenData.priceChange6hPercent || 0,
      tokenData.priceChange4hPercent || 0,
      tokenData.priceChange2hPercent || 0,
      tokenData.priceChange1hPercent || 0,
    ];
    
    // Calculate various indicators
    const rsi = this.technicalIndicators.calculateRSI(priceChanges);
    const macd = this.technicalIndicators.calculateMACD(priceHistory);
    const bollingerBands = this.technicalIndicators.calculateBollingerBands(priceHistory);
    const ema = {
      ema9: this.technicalIndicators.calculateEMA(priceHistory, 9),
      ema20: this.technicalIndicators.calculateEMA(priceHistory, 20),
      ema50: this.technicalIndicators.calculateEMA(priceHistory, 50),
      ema200: this.calculateEstimatedEMA200(priceHistory, price)
    };
    
    // Support and Resistance
    const supports = this.calculateSupportLevels(price, priceHistory, tokenData);
    const resistances = this.calculateResistanceLevels(price, priceHistory, tokenData);
    
    // ATR for volatility
    const atr = this.calculateATR(priceHistory);
    
    // Estimated ADX (trend strength)
    const adx = this.estimateADX(priceChanges);
    
    // Other technical indicators
    const stochastic = this.calculateStochastic(priceHistory);
    const obv = this.estimateOBV(price, priceHistory, tokenData.v24h || 0);
    const cmf = this.estimateCMF(priceChanges);
    
    // Trend analysis
    const currentTrend = this.determineTrend(priceChanges, ema);
    
    return {
      price,
      rsi,
      macd,
      bollingerBands,
      ema,
      supports,
      resistances,
      atr,
      adx,
      stochastic,
      obv,
      cmf,
      currentTrend
    };
  }
  
  /**
   * Determine overall market sentiment based on technical indicators
   */
  private determineSentiment(technicalData: any): 'bullish' | 'bearish' | 'neutral' {
    if (!technicalData) {
      return 'neutral'; // Default if no data
    }
    
    let bullishFactors = 0;
    let bearishFactors = 0;
    
    // RSI analysis
    if (technicalData.rsi && technicalData.rsi.value) {
      if (technicalData.rsi.value < 30) bullishFactors += 2; // Oversold
      if (technicalData.rsi.value > 70) bearishFactors += 2; // Overbought
      if (technicalData.rsi.value > 50 && technicalData.rsi.value < 70) bullishFactors += 1;
      if (technicalData.rsi.value > 30 && technicalData.rsi.value < 50) bearishFactors += 1;
    }
    
    // MACD analysis
    if (technicalData.macd) {
      if (technicalData.macd.value > technicalData.macd.signal) bullishFactors += 1;
      if (technicalData.macd.value < technicalData.macd.signal) bearishFactors += 1;
      if (technicalData.macd.histogram > 0) bullishFactors += 1;
      if (technicalData.macd.histogram < 0) bearishFactors += 1;
    }
    
    // EMA analysis
    if (technicalData.ema) {
      if (technicalData.ema.ema9 > technicalData.ema.ema20) bullishFactors += 1;
      if (technicalData.ema.ema9 < technicalData.ema.ema20) bearishFactors += 1;
      if (technicalData.ema.ema20 > technicalData.ema.ema50) bullishFactors += 1;
      if (technicalData.ema.ema20 < technicalData.ema.ema50) bearishFactors += 1;
    }
    
    // Bollinger Bands
    if (technicalData.bollingerBands) {
      const price = technicalData.price || 0;
      if (price < technicalData.bollingerBands.lower) bullishFactors += 1;
      if (price > technicalData.bollingerBands.upper) bearishFactors += 1;
    }
    
    // Trend analysis
    if (technicalData.currentTrend) {
      if (technicalData.currentTrend === 'uptrend') bullishFactors += 2;
      if (technicalData.currentTrend === 'downtrend') bearishFactors += 2;
      if (technicalData.currentTrend === 'sideways') {
        bullishFactors += 0.5;
        bearishFactors += 0.5;
      }
    }
    
    // Determine overall sentiment
    if (bullishFactors > bearishFactors + 2) return 'bullish';
    if (bearishFactors > bullishFactors + 2) return 'bearish';
    return 'neutral';
  }
  
  /**
   * Generate price analysis section with more personality
   */
  private generatePriceAnalysis(token: string, price: number, technicalData: any, tokenData: any): string {
    const priceChange24h = tokenData.priceChange?.['24h'] || tokenData.priceChange24hPercent || 0;
    const priceChange1h = tokenData.priceChange?.['1h'] || tokenData.priceChange1hPercent || 0;
    
    let analysis = `## Technical Analysis for ${tokenData.name || token} (${token})\n\n`;
    analysis += `### Price Analysis\n`;
    analysis += `- **Current Price:** $${price.toFixed(6)}\n`;
    
    // Add personality to price change descriptions
    if (priceChange24h > 5) {
      analysis += `- **24h Change:** ${priceChange24h.toFixed(2)}% 🚀 (making serious moves)\n`;
    } else if (priceChange24h > 2) {
      analysis += `- **24h Change:** ${priceChange24h.toFixed(2)}% 📈 (looking strong)\n`;
    } else if (priceChange24h < -5) {
      analysis += `- **24h Change:** ${priceChange24h.toFixed(2)}% 📉 (taking a beating)\n`;
    } else if (priceChange24h < -2) {
      analysis += `- **24h Change:** ${priceChange24h.toFixed(2)}% ↘️ (sliding lower)\n`;
    } else {
      analysis += `- **24h Change:** ${priceChange24h.toFixed(2)}% (holding steady)\n`;
    }
    
    if (priceChange1h > 2) {
      analysis += `- **1h Change:** ${priceChange1h.toFixed(2)}% (heating up fast)\n`;
    } else if (priceChange1h < -2) {
      analysis += `- **1h Change:** ${priceChange1h.toFixed(2)}% (cooling off)\n`;
    } else {
      analysis += `- **1h Change:** ${priceChange1h.toFixed(2)}%\n`;
    }
    
    return analysis;
  }
  
  /**
   * Generate volume analysis section with more personality
   */
  private generateVolumeAnalysis(token: string, volume: number, tokenData: any): string {
    const volumeChange = tokenData.trade24hChangePercent || 0;
    let volumeTrend = 'stable';
    
    if (volumeChange > 20) {
      volumeTrend = 'exploding higher 💥';
    } else if (volumeChange > 5) {
      volumeTrend = 'picking up nicely 📊';
    } else if (volumeChange < -20) {
      volumeTrend = 'drying up fast 🏜️';
    } else if (volumeChange < -5) {
      volumeTrend = 'fading 📉';
    } else {
      volumeTrend = 'holding steady 🔄';
    }
    
    let analysis = `\n### Volume Analysis\n`;
    analysis += `- **24h Volume:** $${formatNumber(volume)}\n`;
    analysis += `- **Volume Trend:** ${volumeTrend}`;
    
    if (volumeChange) {
      analysis += ` (${volumeChange.toFixed(2)}% change in 24h)`;
    }
    analysis += `\n`;
    
    return analysis;
  }
  
  /**
   * Generate analysis of technical indicators with more personality
   */
  private generateIndicatorAnalysis(technicalData: any, token: string): string {
    if (!technicalData) {
      return "\n### Technical Indicators\nNo technical indicator data available.";
    }
    
    let analysis = `\n### Technical Indicators\n`;
    
    // RSI with personality
    if (technicalData.rsi) {
      const rsiValue = technicalData.rsi.value || 50;
      let rsiComment = technicalData.rsi.interpretation || 'Neutral';
      
      if (rsiValue > 70) {
        rsiComment = getRandomElement([
          `${token} is looking overheated! Bulls in full control, but watch for exhaustion`,
          `RSI screaming overbought - might be time for bulls to take some profits`,
          `Coming in hot! RSI showing potential exhaustion signals`
        ]);
      } else if (rsiValue < 30) {
        rsiComment = getRandomElement([
          `${token} looking seriously oversold - potential bounce zone`,
          `Bears might have overplayed their hand - RSI showing oversold conditions`,
          `RSI in the basement - watch for potential reversal signals`
        ]);
      } else if (rsiValue > 60) {
        rsiComment = getRandomElement([
          `RSI showing healthy bullish momentum`,
          `Bulls still have control but not overheated yet`,
          `RSI trending bullish - momentum is your friend`
        ]);
      } else if (rsiValue < 40) {
        rsiComment = getRandomElement([
          `RSI showing bearish pressure, but not extreme`,
          `Bears have an edge according to RSI`,
          `RSI suggests caution for bulls right now`
        ]);
      }
      
      analysis += `- **RSI:** ${rsiValue.toFixed(2)} - ${rsiComment}\n`;
    }
    
    // MACD with personality
    if (technicalData.macd) {
      let macdComment = technicalData.macd.interpretation || 'Neutral momentum';
      
      if (technicalData.macd.histogram > 0 && technicalData.macd.histogram > technicalData.macd.signal) {
        macdComment = getRandomElement([
          `Bullish momentum building - MACD histogram expanding`,
          `MACD showing strong bullish divergence - momentum traders taking notice`,
          `Green bars growing on the MACD - bulls stepping on the gas`
        ]);
      } else if (technicalData.macd.histogram < 0 && technicalData.macd.histogram < technicalData.macd.signal) {
        macdComment = getRandomElement([
          `Bearish momentum accelerating - MACD histogram expanding to the downside`,
          `MACD firmly bearish - sellers in control`,
          `Red bars growing on the MACD - bears taking charge`
        ]);
      } else if (technicalData.macd.histogram > 0 && technicalData.macd.histogram < technicalData.macd.value) {
        macdComment = getRandomElement([
          `Bullish but momentum slowing - watch for potential shift`,
          `MACD still positive but losing steam - keep an eye on it`,
          `Momentum might be changing - MACD histogram shrinking`
        ]);
      }
      
      analysis += `- **MACD:** Value: ${technicalData.macd.value?.toFixed(6) || 'N/A'}, Signal: ${technicalData.macd.signal?.toFixed(6) || 'N/A'}\n`;
      analysis += `  - ${macdComment}\n`;
    }
    
    // Bollinger Bands with personality
    if (technicalData.bollingerBands) {
      let bbComment = technicalData.bollingerBands.interpretation || 'Normal volatility';
      
      const price = technicalData.price || 0;
      if (price > technicalData.bollingerBands.upper) {
        bbComment = getRandomElement([
          `${token} trading outside the upper band - strong momentum but stretched`,
          `Breaking out above the bands - showing strength but watch for mean reversion`,
          `Outside the upper band - bulls fully in charge but getting extended`
        ]);
      } else if (price < technicalData.bollingerBands.lower) {
        bbComment = getRandomElement([
          `${token} dipped below the lower band - oversold but still bearish`,
          `Trading below the bands - bears in control but due for a bounce`,
          `Below the lower band - showing weakness but getting oversold`
        ]);
      } else if ((technicalData.bollingerBands.upper - technicalData.bollingerBands.lower) / technicalData.bollingerBands.middle < 0.1) {
        bbComment = getRandomElement([
          `Bollinger Bands squeezing tight - explosive move likely coming`,
          `Bands constricting - volatility contraction often precedes big moves`,
          `The squeeze is on! Bands tightening before the next big move`
        ]);
      }
      
      analysis += `- **Bollinger Bands:**\n`;
      analysis += `  - Upper: $${technicalData.bollingerBands.upper?.toFixed(6) || 'N/A'}\n`;
      analysis += `  - Middle: $${technicalData.bollingerBands.middle?.toFixed(6) || 'N/A'}\n`;
      analysis += `  - Lower: $${technicalData.bollingerBands.lower?.toFixed(6) || 'N/A'}\n`;
      analysis += `  - ${bbComment}\n`;
    }
    
    // Moving Averages with personality
    if (technicalData.ema) {
      let emaComment = technicalData.ema.interpretation || 'No clear trend';
      
      if (technicalData.ema.ema9 > technicalData.ema.ema20 && technicalData.ema.ema20 > technicalData.ema.ema50) {
        emaComment = getRandomElement([
          `EMAs perfectly aligned for the bulls - textbook uptrend structure`,
          `Shorter EMAs above longer ones - bullish alignment that traders love to see`,
          `All EMAs stacked in bullish formation - trend is your friend here`
        ]);
      } else if (technicalData.ema.ema9 < technicalData.ema.ema20 && technicalData.ema.ema20 < technicalData.ema.ema50) {
        emaComment = getRandomElement([
          `EMAs in bearish alignment - downtrend structure intact`,
          `Shorter EMAs below longer ones - bears clearly in control`,
          `All EMAs stacked in bearish formation - trend remains down`
        ]);
      } else if (technicalData.ema.ema9 > technicalData.ema.ema20 && technicalData.ema.ema20 < technicalData.ema.ema50) {
        emaComment = getRandomElement([
          `Short-term momentum turning up - potential trend change brewing`,
          `9 EMA crossed above 20 EMA - early bullish signal to watch`,
          `Starting to see bullish EMA crosses - watch for confirmation`
        ]);
      }
      
      analysis += `- **Moving Averages:**\n`;
      analysis += `  - EMA9: $${technicalData.ema.ema9?.toFixed(6) || 'N/A'}\n`;
      analysis += `  - EMA20: $${technicalData.ema.ema20?.toFixed(6) || 'N/A'}\n`;
      analysis += `  - EMA50: $${technicalData.ema.ema50?.toFixed(6) || 'N/A'}\n`;
      analysis += `  - EMA200: $${technicalData.ema.ema200?.toFixed(6) || 'N/A'}\n`;
      analysis += `  - ${emaComment}\n`;
    }
    
    // Support and Resistance with personality
    if (technicalData.supports && technicalData.resistances) {
      analysis += `- **Support Levels:** (where buyers might step in)\n`;
      if (Array.isArray(technicalData.supports)) {
        technicalData.supports.forEach((level: number, index: number) => {
          const supportDesc = index === 0 ? "Strong support" : index === 1 ? "Secondary support" : "Weak support";
          analysis += `  - ${supportDesc}: $${level.toFixed(6)}\n`;
        });
      }
      
      analysis += `- **Resistance Levels:** (where sellers might show up)\n`;
      if (Array.isArray(technicalData.resistances)) {
        technicalData.resistances.forEach((level: number, index: number) => {
          const resistDesc = index === 0 ? "Immediate resistance" : index === 1 ? "Strong resistance" : "Major resistance";
          analysis += `  - ${resistDesc}: $${level.toFixed(6)}\n`;
        });
      }
    }
    
    // Trend with personality
    if (technicalData.currentTrend) {
      let trendDesc = "";
      switch (technicalData.currentTrend) {
        case "uptrend":
          trendDesc = getRandomElement(["strong bullish bias", "higher highs and higher lows", "buyers in control"]);
          break;
        case "downtrend":
          trendDesc = getRandomElement(["bears have the wheel", "lower highs and lower lows", "selling pressure dominates"]);
          break;
        default:
          trendDesc = getRandomElement(["range-bound action", "choppy price action", "no clear direction"]);
      }
      analysis += `- **Current Trend:** ${technicalData.currentTrend} (${trendDesc})\n`;
    }
    
    // Pattern with personalized description
    if (technicalData.priceActionPattern) {
      const personalizedPattern = getPersonalizedPatternDescription(technicalData.priceActionPattern);
      analysis += `- **Pattern Recognition:** ${personalizedPattern}\n`;
    }
    
    return analysis;
  }
  
  /**
   * Generate market structure analysis with more personality
   */
  private generateMarketStructureAnalysis(technicalData: any, tokenData: any): string {
    let analysis = `\n### Market Statistics\n`;
    
    // Add market cap with context
    const marketCap = tokenData.marketCap || 0;
    let marketCapDesc = "";
    if (marketCap > 10000000000) {
      marketCapDesc = "blue chip territory";
    } else if (marketCap > 1000000000) {
      marketCapDesc = "established project";
    } else if (marketCap > 100000000) {
      marketCapDesc = "mid-cap territory";
    } else {
      marketCapDesc = "smaller cap play";
    }
    analysis += `- **Market Cap:** $${formatNumber(marketCap)} (${marketCapDesc})\n`;
    
    // Add liquidity with context
    const liquidity = tokenData.liquidity || 0;
    let liquidityDesc = "";
    if (liquidity > 50000000) {
      liquidityDesc = "extremely deep liquidity";
    } else if (liquidity > 10000000) {
      liquidityDesc = "excellent liquidity";
    } else if (liquidity > 1000000) {
      liquidityDesc = "good liquidity";
    } else if (liquidity > 100000) {
      liquidityDesc = "moderate liquidity";
    } else {
      liquidityDesc = "limited liquidity - watch for slippage";
    }
    analysis += `- **Liquidity:** $${formatNumber(liquidity)} (${liquidityDesc})\n`;
    
    // Add holders with commentary
    if (tokenData.holder) {
      let holderDesc = "";
      if (tokenData.holder > 1000000) {
        holderDesc = "massive community";
      } else if (tokenData.holder > 100000) {
        holderDesc = "large community";
      } else if (tokenData.holder > 10000) {
        holderDesc = "solid community";
      } else {
        holderDesc = "growing community";
      }
      analysis += `- **Holders:** ${tokenData.holder.toLocaleString()} (${holderDesc})\n`;
    }
    
    return analysis;
  }
  
  /**
   * Generate trading recommendation with more personality
   */
  private generateRecommendation(sentiment: string, technicalData: any, token: string, price: number): string {
    // Count bullish/bearish signals
    let bullishFactors = 0;
    let bearishFactors = 0;
    
    if (technicalData?.rsi?.value < 30) bullishFactors++;
    if (technicalData?.rsi?.value > 70) bearishFactors++;
    
    if (technicalData?.macd?.histogram > 0) bullishFactors++;
    if (technicalData?.macd?.histogram < 0) bearishFactors++;
    
    if (technicalData?.currentTrend === 'uptrend') bullishFactors++;
    if (technicalData?.currentTrend === 'downtrend') bearishFactors++;
    
    let summary = `\n### Summary\n`;
    
    if (bullishFactors > bearishFactors + 1) {
      summary += getRandomElement([
        `${token} is flashing multiple bullish signals right now. With ${bullishFactors} bullish indicators versus only ${bearishFactors} bearish ones, the momentum is clearly to the upside.`,
        `The technical picture for ${token} is tilted bullish. ${bullishFactors} bullish signals are outweighing the ${bearishFactors} bearish ones, suggesting buyers have the edge.`,
        `${token}'s chart is looking constructive with ${bullishFactors} bullish signals against ${bearishFactors} bearish ones. The path of least resistance appears to be higher.`
      ]);
      
      if (technicalData?.supports?.[0]) {
        summary += ` Key support to watch sits at $${technicalData.supports[0].toFixed(6)} - bulls want to defend this zone.`;
      }
    } else if (bearishFactors > bullishFactors + 1) {
      summary += getRandomElement([
        `${token} is showing concerning technical signals. With ${bearishFactors} bearish indicators versus only ${bullishFactors} bullish ones, sellers appear to be in control.`,
        `The weight of evidence for ${token} leans bearish right now. ${bearishFactors} bearish signals are dominating the ${bullishFactors} bullish ones, suggesting caution is warranted.`,
        `${token}'s technicals are tilted to the downside with ${bearishFactors} bearish signals against ${bullishFactors} bullish ones. The bears have momentum on their side.`
      ]);
      
      if (technicalData?.resistances?.[0]) {
        summary += ` Watch $${technicalData.resistances[0].toFixed(6)} as key resistance - bears will try to defend this level.`;
      }
    } else {
      summary += getRandomElement([
        `${token} is showing mixed signals with ${bullishFactors} bullish and ${bearishFactors} bearish indicators. The battle between bulls and bears looks evenly matched right now.`,
        `The technical picture for ${token} is balanced with ${bullishFactors} bullish and ${bearishFactors} bearish signals. No clear edge for either side at the moment.`,
        `${token} is at a technical crossroads showing ${bullishFactors} bullish and ${bearishFactors} bearish indicators. This could be a period of accumulation or distribution.`
      ]);
      
      if (technicalData?.supports?.[0] && technicalData?.resistances?.[0]) {
        summary += ` The key levels to watch are $${technicalData.supports[0].toFixed(6)} for support and $${technicalData.resistances[0].toFixed(6)} for resistance. A break of either could determine the next major move.`;
      }
    }
    
    // Add disclaimer
    summary += `\n\n*Disclaimer: This analysis is generated for informational purposes only and should not be considered financial advice. Always conduct your own research before making investment decisions.*`;
    
    return summary;
  }
  
  /**
   * Compose the final response based on query type
   */
  private composeResponse(
    query: string, 
    token: string,
    price: number,
    marketCap: number,
    volume: number,
    priceAnalysis: string,
    volumeAnalysis: string,
    indicatorAnalysis: string,
    marketStructure: string,
    recommendation: string
  ): string {
    // Check if it's a simple query about a specific indicator
    if (this.isSimpleIndicatorQuery(query)) {
      // For simple indicator queries, extract just the relevant section
      const response = priceAnalysis + indicatorAnalysis + recommendation;
      return response;
    }
    
    // For more comprehensive queries, include all sections
    return priceAnalysis + volumeAnalysis + indicatorAnalysis + marketStructure + recommendation;
  }
  
  /**
   * Check if this is a simple query about a specific indicator
   */
  private isSimpleIndicatorQuery(query: string): boolean {
    const simpleQueries = [
      /what('?s| is) the rsi/i,
      /rsi for/i, 
      /rsi level/i,
      /rsi.*sitting at/i,
      /show me the rsi/i,
      /macd for/i,
      /bollinger bands/i
    ];
    
    return simpleQueries.some(pattern => pattern.test(query));
  }
  
  /**
   * Get description for current trend
   */
  private getTrendDescription(trend: string): string {
    switch (trend) {
      case 'uptrend': return 'on an upward trend with higher highs and higher lows';
      case 'downtrend': return 'on a downward trend with lower highs and lower lows';
      case 'sideways': return 'moving sideways in a consolidation pattern';
      default: return 'showing mixed signals without a clear trend';
    }
  }
  
  /**
   * Get description of price position relative to bands
   */
  private getPricePositionDescription(price: number, technicalData: any): string {
    if (!technicalData?.bollingerBands) return '';
    
    if (price > technicalData.bollingerBands.upper) {
      return 'trading above the upper Bollinger Band, suggesting overbought conditions';
    } else if (price < technicalData.bollingerBands.lower) {
      return 'trading below the lower Bollinger Band, suggesting oversold conditions';
    } else if (price > technicalData.bollingerBands.middle) {
      return 'trading above the middle Bollinger Band, showing some bullish momentum';
    } else {
      return 'trading below the middle Bollinger Band, showing some bearish pressure';
    }
  }
  
  /**
   * Determine current trend based on price data and EMAs
   */
  private determineTrend(priceChanges: number[], ema: any): 'uptrend' | 'downtrend' | 'sideways' {
    if (!priceChanges || priceChanges.length < 2 || !ema) return 'sideways';
    
    try {
      // Check EMA alignment for trend direction
      if (ema.ema9 > ema.ema20 && ema.ema20 > ema.ema50) {
        return 'uptrend';
      } else if (ema.ema9 < ema.ema20 && ema.ema20 < ema.ema50) {
        return 'downtrend';
      }
      
      // Check recent price changes for short-term direction
      const recentChanges = priceChanges.slice(0, 3);
      const positiveChanges = recentChanges.filter(change => change > 0).length;
      const negativeChanges = recentChanges.filter(change => change < 0).length;
      
      if (positiveChanges > negativeChanges) {
        return 'uptrend';
      } else if (negativeChanges > positiveChanges) {
        return 'downtrend';
      } else {
        return 'sideways';
      }
    } catch (error) {
      console.error('Error determining trend:', error);
      return 'sideways'; // Default to sideways on error
    }
  }
  
  /**
   * Calculate estimated EMA200
   */
  private calculateEstimatedEMA200(priceHistory: number[], currentPrice: number): number {
    // This is a rough estimation since we don't have 200 periods of data
    const lastPrice = priceHistory[0] || currentPrice;
    const priceChange = currentPrice / lastPrice;
    const decay = Math.pow(priceChange, 1/24); // 24hr to smooth out
    return currentPrice / decay;
  }
  
  /**
   * Calculate support levels
   */
  private calculateSupportLevels(price: number, priceHistory: number[], tokenData: any): number[] {
    // Simplified support calculation
    const lowestPrice = Math.min(...priceHistory);
    const priceRange = price - lowestPrice;
    
    return [
      price * 0.98, // Near-term support
      price * 0.95, // Mid-level support
      price * 0.9   // Strong support
    ];
  }
  
  /**
   * Calculate resistance levels
   */
  private calculateResistanceLevels(price: number, priceHistory: number[], tokenData: any): number[] {
    // Simplified resistance calculation
    const highestPrice = Math.max(...priceHistory);
    const priceRange = highestPrice - price;
    
    return [
      price * 1.03, // Near-term resistance
      price * 1.07, // Mid-level resistance
      price * 1.15  // Strong resistance
    ];
  }
  
  /**
   * Calculate ATR
   */
  private calculateATR(priceHistory: number[]): number {
    if (priceHistory.length < 2) return 0;
    
    let sum = 0;
    for (let i = 0; i < priceHistory.length - 1; i++) {
      sum += Math.abs(priceHistory[i] - priceHistory[i+1]);
    }
    
    return sum / (priceHistory.length - 1);
  }
  
  /**
   * Estimate ADX
   */
  private estimateADX(priceChanges: number[]): number {
    // Simplified ADX calculation based on price changes
    const absPriceChanges = priceChanges.map(pc => Math.abs(pc));
    const averageChange = absPriceChanges.reduce((a, b) => a + b, 0) / absPriceChanges.length;
    
    // Scale to ADX range (0-100)
    return Math.min(Math.max(averageChange * 2, 0), 100);
  }
  
  /**
   * Calculate stochastic
   */
  private calculateStochastic(priceHistory: number[]): number {
    if (priceHistory.length < 3) return 50;
    
    const latestPrice = priceHistory[priceHistory.length - 1];
    const highest = Math.max(...priceHistory);
    const lowest = Math.min(...priceHistory);
    
    if (highest === lowest) return 50;
    
    return ((latestPrice - lowest) / (highest - lowest)) * 100;
  }
  
  /**
   * Estimate OBV
   */
  private estimateOBV(price: number, priceHistory: number[], volume: number): string {
    if (priceHistory.length < 2) return "neutral";
    
    const previousPrice = priceHistory[priceHistory.length - 2] || price * 0.98;
    
    if (price > previousPrice) {
      return "rising";
    } else if (price < previousPrice) {
      return "falling";
    } else {
      return "neutral";
    }
  }
  
  /**
   * Estimate CMF
   */
  private estimateCMF(priceChanges: number[]): number {
    // Simplified CMF estimation
    const recentChanges = priceChanges.slice(0, 4);
    const sumChanges = recentChanges.reduce((a, b) => a + b, 0);
    
    // Scale to -1 to 1 range
    return Math.max(Math.min(sumChanges / 10, 1), -1);
  }
  
  /**
   * Get random element from array
   */
  private getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}
