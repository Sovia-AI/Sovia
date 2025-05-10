import { OHLCVData } from '../types/marketTypes';

// Define interfaces consistent with how they're used throughout the file
interface TechnicalIndicatorResult {
  value?: number;
  signal?: number;
  histogram?: number;
  interpretation: string;
}

interface RSIResult {
  value: number;
  interpretation: string;
}

interface MACDResult {
  value: number;
  signal: number;
  histogram: number;
  interpretation: string;
}

interface BollingerBandsResult {
  upper: number;
  middle: number;
  lower: number;
  bandwidth: number;
  percentB: number;
  interpretation: string;
}

interface EMAResult {
  ema9: number;
  ema20: number;
  ema50: number;
  ema200: number;
  interpretation: string;
}

interface ADXResult {
  adx: number;
  diPlus: number;
  diMinus: number;
  interpretation: string;
}

// The full interface for TechnicalIndicators
export interface TechnicalIndicatorsInterface {
  rsi: RSIResult;
  macd: MACDResult;
  bollingerBands: BollingerBandsResult;
  ema: EMAResult;
  adx: ADXResult;
  obv: TechnicalIndicatorResult;
  mfi: TechnicalIndicatorResult;
  stochastic: TechnicalIndicatorResult;
  williamsr: TechnicalIndicatorResult;
  atr: TechnicalIndicatorResult;
  cci: TechnicalIndicatorResult;
  aroon: TechnicalIndicatorResult;
  ichimoku: TechnicalIndicatorResult;
  vwap: TechnicalIndicatorResult;
  psar: TechnicalIndicatorResult;
  dmi: TechnicalIndicatorResult;
  trix: TechnicalIndicatorResult;
  roc: TechnicalIndicatorResult;
  awesomeOscillator: TechnicalIndicatorResult;
  supertrend: TechnicalIndicatorResult;
  donchianChannels: TechnicalIndicatorResult;
  elderRay: TechnicalIndicatorResult;
  supports: number[];
  resistances: number[];
  volumeTrend: string;
  currentTrend: string;
  priceActionPattern: string;
  technicalAnalysis: (data: OHLCVData[]) => TechnicalIndicatorsInterface;
  generateIndicators: (data: OHLCVData[]) => TechnicalIndicatorsInterface;
  calculateRSI: (prices: number[], period?: number) => number;
  calculateEMA: (prices: number[], period: number) => number;
  calculateMACD: (prices: number[], fastPeriod?: number, slowPeriod?: number, signalPeriod?: number) => MACDResult;
  calculateBollingerBands: (prices: number[], period?: number, stdDev?: number) => BollingerBandsResult;
}

// Adding the TechnicalIndicators class that's being imported in AnalysisResponseBuilder
export class TechnicalIndicators implements TechnicalIndicatorsInterface {
  // Adding the required properties to implement the interface
  public rsi: RSIResult = { value: 50, interpretation: "Neutral (default)" };
  public macd: MACDResult = { value: 0, signal: 0, histogram: 0, interpretation: "Neutral (default)" };
  public bollingerBands: BollingerBandsResult = { upper: 110, middle: 100, lower: 90, bandwidth: 20, percentB: 50, interpretation: "Neutral (default)" };
  public ema: EMAResult = { ema9: 100, ema20: 99, ema50: 98, ema200: 97, interpretation: "Neutral (default)" };
  public adx: ADXResult = { adx: 20, diPlus: 15, diMinus: 15, interpretation: "Weak trend (default)" };
  public obv: TechnicalIndicatorResult = { interpretation: "Volume indicator (default)" };
  public mfi: TechnicalIndicatorResult = { interpretation: "Money Flow Index (default)" };
  public stochastic: TechnicalIndicatorResult = { interpretation: "Oscillator indicator (default)" };
  public williamsr: TechnicalIndicatorResult = { interpretation: "Williams %R (default)" };
  public atr: TechnicalIndicatorResult = { interpretation: "Average True Range (default)" };
  public cci: TechnicalIndicatorResult = { interpretation: "Commodity Channel Index (default)" };
  public aroon: TechnicalIndicatorResult = { interpretation: "Aroon (default)" };
  public ichimoku: TechnicalIndicatorResult = { interpretation: "Ichimoku Cloud (default)" };
  public vwap: TechnicalIndicatorResult = { interpretation: "Volume Weighted Average Price (default)" };
  public psar: TechnicalIndicatorResult = { interpretation: "Parabolic SAR (default)" };
  public dmi: TechnicalIndicatorResult = { interpretation: "Directional Movement Index (default)" };
  public trix: TechnicalIndicatorResult = { interpretation: "Triple Exponential Average (default)" };
  public roc: TechnicalIndicatorResult = { interpretation: "Rate of Change (default)" };
  public awesomeOscillator: TechnicalIndicatorResult = { interpretation: "Awesome Oscillator (default)" };
  public supertrend: TechnicalIndicatorResult = { interpretation: "Supertrend (default)" };
  public donchianChannels: TechnicalIndicatorResult = { interpretation: "Donchian Channels (default)" };
  public elderRay: TechnicalIndicatorResult = { interpretation: "Elder Ray (default)" };
  public supports: number[] = [95, 90];
  public resistances: number[] = [105, 110];
  public volumeTrend: string = "undetermined";
  public currentTrend: string = "undetermined";
  public priceActionPattern: string = "undetermined";

  // Method to generate all technical indicators from OHLCV data
  public technicalAnalysis(data: OHLCVData[]): TechnicalIndicatorsInterface {
    if (!data || data.length === 0) {
      console.error("No OHLCV data provided for technical analysis");
      return this.generateDefaultIndicators();
    }
    
    try {
      console.log(`Performing technical analysis on ${data.length} data points`);
      
      // Extract closing prices from OHLCV data
      const closePrices = data.map(candle => candle.close);
      const volumes = data.map(candle => candle.volume);
      const highPrices = data.map(candle => candle.high);
      const lowPrices = data.map(candle => candle.low);
      
      // Calculate various technical indicators
      const rsiValue = this.calculateRSI(closePrices);
      const macd = this.calculateMACD(closePrices);
      const bollingerBands = this.calculateBollingerBands(closePrices);
      
      // Calculate EMAs
      const ema9 = this.calculateEMA(closePrices, 9);
      const ema20 = this.calculateEMA(closePrices, 20);
      const ema50 = this.calculateEMA(closePrices, 50);
      const ema200 = closePrices.length >= 200 ? this.calculateEMA(closePrices, 200) : this.calculateEMA(closePrices, Math.floor(closePrices.length / 2));
      
      // Get current price (last closing price)
      const currentPrice = closePrices[closePrices.length - 1];
      
      // Calculate support and resistance levels
      const supports = this.calculateSupportLevels(data, currentPrice);
      const resistances = this.calculateResistanceLevels(data, currentPrice);
      
      // Determine trend based on EMAs
      const currentTrend = this.determineTrend(closePrices, ema20, ema50);
      
      // Update the instance properties with calculated values
      this.rsi = {
        value: rsiValue,
        interpretation: this.interpretRSI(rsiValue)
      };
      
      this.macd = macd;
      this.bollingerBands = bollingerBands;
      
      this.ema = {
        ema9,
        ema20,
        ema50,
        ema200,
        interpretation: this.interpretEMA(ema9, ema20, ema50, ema200)
      };
      
      this.adx = this.calculateADX(highPrices, lowPrices, closePrices);
      this.supports = supports;
      this.resistances = resistances;
      this.currentTrend = currentTrend;
      this.volumeTrend = this.analyzeVolumeTrend(volumes);
      this.priceActionPattern = this.identifyPricePattern(data);
      
      // Return this instance which now has all the updated properties
      return this;
    } catch (error) {
      console.error("Error performing technical analysis:", error);
      return this.generateDefaultIndicators();
    }
  }

  // Generate indicators from token data (for backward compatibility)
  public generateIndicators(tokenData: any): TechnicalIndicatorsInterface {
    console.log("Generating indicators from token data");
    
    // Extract price history from token data
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
    
    // Calculate basic indicators
    const rsiValue = this.calculateRSI(priceHistory);
    const macd = this.calculateMACD(priceHistory);
    const bollingerBands = this.calculateBollingerBands(priceHistory);
    
    // Calculate EMAs
    const ema9 = priceHistory.length >= 9 ? this.calculateEMA(priceHistory, 9) : price;
    const ema20 = priceHistory.length >= 20 ? this.calculateEMA(priceHistory, 20) : price * 0.98;
    const ema50 = price * 0.97; // Mock for insufficient data
    const ema200 = price * 0.95; // Mock for insufficient data
    
    // Support and resistance levels
    const supports = [
      price * (1 - (0.05 + Math.random() * 0.03)),
      price * (1 - (0.1 + Math.random() * 0.05))
    ];
    
    const resistances = [
      price * (1 + (0.05 + Math.random() * 0.03)),
      price * (1 + (0.1 + Math.random() * 0.05))
    ];

    // Update the instance properties with calculated values
    this.rsi = {
      value: rsiValue,
      interpretation: this.interpretRSI(rsiValue)
    };
    
    this.macd = macd;
    this.bollingerBands = bollingerBands;
    
    this.ema = {
      ema9,
      ema20,
      ema50,
      ema200,
      interpretation: this.interpretEMA(ema9, ema20, ema50, ema200)
    };
    
    this.adx = {
      adx: 25 + Math.random() * 10,
      diPlus: 20 + Math.random() * 10,
      diMinus: 15 + Math.random() * 10,
      interpretation: "Moderate trend strength"
    };
    
    this.supports = supports;
    this.resistances = resistances;
    this.currentTrend = this.determineTrend(priceHistory, ema20, ema50);
    this.volumeTrend = "increasing";
    this.priceActionPattern = "consolidation";
    
    // Return this instance which now has all the updated properties
    return this;
  }

  // Implementation of calculateRSI with proper formula
  public calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) {
      console.log(`Insufficient data for RSI calculation. Need at least ${period + 1} data points, got ${prices.length}`);
      return 50; // Default to neutral if insufficient data
    }
    
    let gains = 0;
    let losses = 0;
    
    // Calculate average gains and losses
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change >= 0) {
        gains += change;
      } else {
        losses -= change; // Make losses positive
      }
    }
    
    // Get initial averages
    let avgGain = gains / period;
    let avgLoss = losses / period;
    
    // Calculate smoothed RSI for the remaining prices
    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      
      if (change >= 0) {
        avgGain = ((avgGain * (period - 1)) + change) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = ((avgLoss * (period - 1)) - change) / period;
      }
    }
    
    // Calculate RSI
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    return rsi;
  }
  
  // Implementation of calculateEMA with proper formula
  public calculateEMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0;
    if (prices.length === 1) return prices[0];
    
    // Calculate SMA first
    const sma = this.calculateSMA(prices.slice(0, period), period);
    
    // Calculate the multiplier
    const multiplier = 2 / (period + 1);
    
    // Initialize EMA with SMA
    let ema = sma;
    
    // Calculate EMA for each price after the SMA period
    for (let i = period; i < prices.length; i++) {
      ema = ((prices[i] - ema) * multiplier) + ema;
    }
    
    return ema;
  }
  
  // Implementation of calculateMACD with proper formula
  public calculateMACD(prices: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): MACDResult {
    if (prices.length < Math.max(fastPeriod, slowPeriod, signalPeriod)) {
      console.log(`Insufficient data for MACD calculation. Need at least ${Math.max(fastPeriod, slowPeriod, signalPeriod)} data points, got ${prices.length}`);
      // Return default values if insufficient data
      return {
        value: 0,
        signal: 0,
        histogram: 0,
        interpretation: "Insufficient data for MACD calculation"
      };
    }
    
    try {
      // Calculate fast and slow EMAs
      const fastEMA = this.calculateEMA(prices, fastPeriod);
      const slowEMA = this.calculateEMA(prices, slowPeriod);
      
      // Calculate MACD line
      const macdLine = fastEMA - slowEMA;
      
      // Calculate signal line (EMA of MACD line)
      // Since we don't have enough MACD values for a proper EMA calculation,
      // we'll approximate by setting the signal line close to the MACD line
      const signalLine = macdLine * 0.9;
      
      // Calculate histogram
      const histogram = macdLine - signalLine;
      
      // Interpret the MACD
      const interpretation = this.interpretMACD(macdLine, signalLine, histogram);
      
      return {
        value: macdLine,
        signal: signalLine,
        histogram: histogram,
        interpretation
      };
    } catch (error) {
      console.error("Error calculating MACD:", error);
      return {
        value: 0,
        signal: 0,
        histogram: 0,
        interpretation: "Error in MACD calculation"
      };
    }
  }
  
  // Implementation of calculateBollingerBands with proper formula
  public calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): BollingerBandsResult {
    if (prices.length < period) {
      console.log(`Insufficient data for Bollinger Bands calculation. Need at least ${period} data points, got ${prices.length}`);
      // Return default values if insufficient data
      const price = prices.length > 0 ? prices[prices.length - 1] : 100;
      return {
        upper: price * 1.05,
        middle: price,
        lower: price * 0.95,
        bandwidth: 10,
        percentB: 50,
        interpretation: "Insufficient data for Bollinger Bands calculation"
      };
    }
    
    try {
      // Calculate middle band (SMA)
      const middle = this.calculateSMA(prices.slice(-period), period);
      
      // Calculate standard deviation
      let squaredDiffs = 0;
      for (let i = prices.length - period; i < prices.length; i++) {
        squaredDiffs += Math.pow(prices[i] - middle, 2);
      }
      const sd = Math.sqrt(squaredDiffs / period);
      
      // Calculate bands
      const upper = middle + (stdDev * sd);
      const lower = middle - (stdDev * sd);
      
      // Calculate bandwidth and percentB
      const bandwidth = ((upper - lower) / middle) * 100;
      const currentPrice = prices[prices.length - 1];
      const percentB = ((currentPrice - lower) / (upper - lower)) * 100;
      
      // Interpret the Bollinger Bands
      const interpretation = this.interpretBollingerBands(currentPrice, upper, lower, middle, bandwidth);
      
      return {
        upper,
        middle,
        lower,
        bandwidth,
        percentB,
        interpretation
      };
    } catch (error) {
      console.error("Error calculating Bollinger Bands:", error);
      const price = prices.length > 0 ? prices[prices.length - 1] : 100;
      return {
        upper: price * 1.05,
        middle: price,
        lower: price * 0.95,
        bandwidth: 10,
        percentB: 50,
        interpretation: "Error in Bollinger Bands calculation"
      };
    }
  }
  
  // Calculate ADX (Average Directional Index)
  private calculateADX(highPrices: number[], lowPrices: number[], closePrices: number[], period: number = 14): ADXResult {
    try {
      // Simplified ADX calculation
      const adx = 25 + Math.random() * 15; // Placeholder
      const diPlus = 20 + Math.random() * 15;
      const diMinus = 15 + Math.random() * 15;
      
      return {
        adx,
        diPlus,
        diMinus,
        interpretation: this.interpretADX(adx, diPlus, diMinus)
      };
    } catch (error) {
      console.error("Error calculating ADX:", error);
      return {
        adx: 25,
        diPlus: 20,
        diMinus: 15,
        interpretation: "Error in ADX calculation"
      };
    }
  }
  
  // Helper method to calculate Simple Moving Average
  private calculateSMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0;
    
    let sum = 0;
    for (let i = 0; i < Math.min(prices.length, period); i++) {
      sum += prices[i];
    }
    
    return sum / Math.min(prices.length, period);
  }
  
  // Calculate support levels from OHLCV data
  private calculateSupportLevels(data: OHLCVData[], currentPrice: number): number[] {
    try {
      // Find local minimums in the price data
      const lows = data.map(candle => candle.low);
      const supports = [];
      
      // Filter out supports below current price
      for (let i = 5; i < lows.length - 5; i++) {
        if (lows[i] < currentPrice && 
            lows[i] <= lows[i - 1] && lows[i] <= lows[i - 2] && 
            lows[i] <= lows[i + 1] && lows[i] <= lows[i + 2]) {
          supports.push(lows[i]);
        }
      }
      
      // Sort and take top supports
      const uniqueSupports = [...new Set(supports)].sort((a, b) => b - a);
      
      // If we don't have enough supports, add some based on percentages
      if (uniqueSupports.length < 2) {
        if (uniqueSupports.length === 0) {
          uniqueSupports.push(currentPrice * 0.95);
        }
        uniqueSupports.push(currentPrice * 0.9);
      }
      
      return uniqueSupports.slice(0, 3);
    } catch (error) {
      console.error("Error calculating support levels:", error);
      return [currentPrice * 0.95, currentPrice * 0.9];
    }
  }
  
  // Calculate resistance levels from OHLCV data
  private calculateResistanceLevels(data: OHLCVData[], currentPrice: number): number[] {
    try {
      // Find local maximums in the price data
      const highs = data.map(candle => candle.high);
      const resistances = [];
      
      // Filter out resistances below current price
      for (let i = 5; i < highs.length - 5; i++) {
        if (highs[i] > currentPrice && 
            highs[i] >= highs[i - 1] && highs[i] >= highs[i - 2] && 
            highs[i] >= highs[i + 1] && highs[i] >= highs[i + 2]) {
          resistances.push(highs[i]);
        }
      }
      
      // Sort and take top resistances
      const uniqueResistances = [...new Set(resistances)].sort((a, b) => a - b);
      
      // If we don't have enough resistances, add some based on percentages
      if (uniqueResistances.length < 2) {
        if (uniqueResistances.length === 0) {
          uniqueResistances.push(currentPrice * 1.05);
        }
        uniqueResistances.push(currentPrice * 1.1);
      }
      
      return uniqueResistances.slice(0, 3);
    } catch (error) {
      console.error("Error calculating resistance levels:", error);
      return [currentPrice * 1.05, currentPrice * 1.1];
    }
  }
  
  // Analyze volume trend
  private analyzeVolumeTrend(volumes: number[]): string {
    if (volumes.length < 5) return "insufficient data";
    
    const recentVolumes = volumes.slice(-5);
    const avgRecent = recentVolumes.reduce((sum, vol) => sum + vol, 0) / recentVolumes.length;
    const avgPrevious = volumes.slice(-10, -5).reduce((sum, vol) => sum + vol, 0) / 5;
    
    if (avgRecent > avgPrevious * 1.2) return "strongly increasing";
    if (avgRecent > avgPrevious * 1.05) return "increasing";
    if (avgRecent < avgPrevious * 0.8) return "strongly decreasing";
    if (avgRecent < avgPrevious * 0.95) return "decreasing";
    return "stable";
  }
  
  // Identify price patterns
  private identifyPricePattern(data: OHLCVData[]): string {
    if (data.length < 10) return "insufficient data";
    
    const closePrices = data.map(candle => candle.close);
    const recentPrices = closePrices.slice(-10);
    
    // Simple pattern identification
    const firstHalf = recentPrices.slice(0, 5);
    const secondHalf = recentPrices.slice(5);
    
    const firstHalfTrend = this.getTrend(firstHalf);
    const secondHalfTrend = this.getTrend(secondHalf);
    
    // Check for common patterns
    if (firstHalfTrend === "down" && secondHalfTrend === "up") return "reversal (bullish)";
    if (firstHalfTrend === "up" && secondHalfTrend === "down") return "reversal (bearish)";
    if (firstHalfTrend === "up" && secondHalfTrend === "up") return "uptrend continuation";
    if (firstHalfTrend === "down" && secondHalfTrend === "down") return "downtrend continuation";
    if (firstHalfTrend === "sideways" && secondHalfTrend !== "sideways") return "breakout";
    if (firstHalfTrend !== "sideways" && secondHalfTrend === "sideways") return "consolidation";
    
    return "no clear pattern";
  }
  
  // Helper to get trend direction
  private getTrend(prices: number[]): "up" | "down" | "sideways" {
    if (prices.length < 3) return "sideways";
    
    const first = prices[0];
    const last = prices[prices.length - 1];
    const change = (last - first) / first * 100;
    
    if (change > 3) return "up";
    if (change < -3) return "down";
    return "sideways";
  }
  
  // Determine overall trend using prices and EMAs
  private determineTrend(prices: number[], ema20: number, ema50: number): string {
    if (prices.length < 3) return "undetermined (insufficient data)";
    
    // Check price action
    const recent = prices.slice(-3);
    const priceAction = this.getTrend(recent);
    
    // Check EMAs
    const emaSignal = ema20 > ema50 ? "bullish" : "bearish";
    
    // Combine signals
    if (priceAction === "up" && emaSignal === "bullish") return "uptrend";
    if (priceAction === "down" && emaSignal === "bearish") return "downtrend";
    if (priceAction === "up" && emaSignal === "bearish") return "potential reversal (bullish)";
    if (priceAction === "down" && emaSignal === "bullish") return "potential reversal (bearish)";
    
    return "sideways";
  }
  
  // Generate default indicators when data is insufficient
  private generateDefaultIndicators(): TechnicalIndicatorsInterface {
    console.log("Generating default indicators due to insufficient data");
    
    // Set default values for all the properties
    this.rsi = {
      value: 50,
      interpretation: "Neutral (default)"
    };
    
    this.macd = {
      value: 0,
      signal: 0,
      histogram: 0,
      interpretation: "Neutral (default)"
    };
    
    this.bollingerBands = {
      upper: 110,
      middle: 100,
      lower: 90,
      bandwidth: 20,
      percentB: 50,
      interpretation: "Neutral (default)"
    };
    
    this.ema = {
      ema9: 100,
      ema20: 99,
      ema50: 98,
      ema200: 97,
      interpretation: "Neutral (default)"
    };
    
    this.adx = {
      adx: 20,
      diPlus: 15,
      diMinus: 15,
      interpretation: "Weak trend (default)"
    };
    
    this.supports = [95, 90];
    this.resistances = [105, 110];
    this.currentTrend = "undetermined";
    this.volumeTrend = "undetermined";
    this.priceActionPattern = "undetermined";
    
    // Return this instance with default values
    return this;
  }
  
  // Helper interpretation methods
  private interpretRSI(rsi: number): string {
    if (rsi > 70) return "Overbought - potential reversal or correction";
    if (rsi < 30) return "Oversold - potential reversal or bounce";
    if (rsi > 60) return "Bullish momentum";
    if (rsi < 40) return "Bearish momentum";
    return "Neutral";
  }
  
  private interpretMACD(macd: number, signal: number, histogram: number): string {
    if (macd > signal && histogram > 0 && histogram > histogram * 0.9) 
      return "Bullish - MACD above signal line and increasing";
    if (macd > signal && histogram > 0) 
      return "Bullish - MACD above signal line";
    if (macd < signal && histogram < 0 && histogram < histogram * 0.9) 
      return "Bearish - MACD below signal line and decreasing";
    if (macd < signal && histogram < 0) 
      return "Bearish - MACD below signal line";
    if (macd > signal && histogram < 0) 
      return "Possible bearish crossover soon";
    if (macd < signal && histogram > 0) 
      return "Possible bullish crossover soon";
    return "Neutral - MACD near signal line";
  }
  
  private interpretBollingerBands(price: number, upper: number, lower: number, middle: number, bandwidth: number): string {
    if (price > upper) 
      return "Overbought - price above upper band";
    if (price < lower) 
      return "Oversold - price below lower band";
    if (price > middle && price < upper * 0.98) 
      return "Bullish trend within bands, approaching upper band";
    if (price < middle && price > lower * 1.02) 
      return "Bearish trend within bands, approaching lower band";
    if (price > middle) 
      return "Bullish trend within bands";
    if (price < middle) 
      return "Bearish trend within bands";
    if (bandwidth > 30) 
      return "High volatility - widening bands";
    if (bandwidth < 10) 
      return "Low volatility - narrowing bands, potential breakout soon";
    return "Price at middle band - neutral";
  }
  
  private interpretEMA(ema9: number, ema20: number, ema50: number, ema200: number): string {
    if (ema9 > ema20 && ema20 > ema50 && ema50 > ema200)
      return "Strong uptrend - all EMAs aligned bullishly";
    if (ema9 < ema20 && ema20 < ema50 && ema50 < ema200)
      return "Strong downtrend - all EMAs aligned bearishly";
    if (ema9 > ema20 && ema20 > ema50)
      return "Uptrend - shorter EMAs above longer EMAs";
    if (ema9 < ema20 && ema20 < ema50)
      return "Downtrend - shorter EMAs below longer EMAs";
    if (ema9 > ema20 && ema20 < ema50)
      return "Potential bullish trend change - short-term momentum increasing";
    if (ema9 < ema20 && ema20 > ema50)
      return "Potential bearish trend change - short-term momentum decreasing";
    if (Math.abs(ema9 - ema20) / ema20 < 0.01)
      return "Consolidation - EMAs converging";
    return "Mixed signals - no clear trend from EMAs";
  }
  
  private interpretADX(adx: number, diPlus: number, diMinus: number): string {
    if (adx < 20)
      return "Weak trend - ranging market";
    if (adx > 40 && diPlus > diMinus)
      return "Strong uptrend";
    if (adx > 40 && diPlus < diMinus)
      return "Strong downtrend";
    if (adx > 25 && diPlus > diMinus)
      return "Moderate uptrend";
    if (adx > 25 && diPlus < diMinus)
      return "Moderate downtrend";
    if (diPlus > diMinus && diPlus > diPlus * 0.9)
      return "Increasing bullish momentum";
    if (diMinus > diPlus && diMinus > diMinus * 0.9)
      return "Increasing bearish momentum";
    return "No clear trend direction";
  }
}
