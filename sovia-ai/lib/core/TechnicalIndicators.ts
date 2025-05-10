
import { OHLCVData } from '../types/marketTypes';

// Define missing interfaces at the top of the file
export interface IchimokuCloudAnalysis {
  conversionLine: number;
  baseLine: number;
  leadingSpanA: number;
  leadingSpanB: number;
  laggingSpan: number;
  cloudColor: 'green' | 'red';
  interpretation: string;
}

export interface MarketProfileAnalysis {
  valueArea: {
    high: number;
    low: number;
    volume: number;
  };
  pointOfControl: number;
  volumeNodes: Array<{
    price: number;
    volume: number;
    timeSpent: number;
  }>;
  balanceTarget: number;
  interpretation: string;
}

export interface KeltnerChannels {
  upper: number;
  middle: number;
  lower: number;
  bandwidth: number;
  interpretation: string;
}

export interface DonchianChannels {
  upper: number;
  middle: number;
  lower: number;
  bandwidth: number;
  interpretation: string;
}

export interface ChaikinMoneyFlow {
  value: number;
  signal: number;
  divergence: boolean;
  interpretation: string;
}

export interface ElderRayIndex {
  bullPower: number;
  bearPower: number;
  trend: string;
  interpretation: string;
}

// Remove the duplicate imports that are causing TypeScript errors
// import { 
//   TechnicalIndicatorResult,
//   BollingerBandsResult,
//   IchimokuResult,
//   StochasticResult,
//   ADXResult,
//   VWAPResult,
//   TechnicalIndicators,
//   IchimokuCloudAnalysis,
//   MarketProfileAnalysis,
//   KeltnerChannels,
//   DonchianChannels,
//   ChaikinMoneyFlow,
//   ElderRayIndex
// } from '../types/marketTypes';

export interface TechnicalIndicatorResult {
  value: number;
  signal?: number;
  histogram?: number;
  interpretation: string;
}

export interface BollingerBandsResult {
  upper: number;
  middle: number;
  lower: number;
  bandwidth: number;
  percentB: number;
  interpretation: string;
}

export interface IchimokuResult {
  conversionLine: number;
  baseLine: number;
  leadingSpanA: number;
  leadingSpanB: number;
  laggingSpan: number;
  interpretation: string;
}

export interface StochasticResult {
  k: number;
  d: number;
  interpretation: string;
}

export interface ADXResult {
  adx: number;
  plusDI: number;
  minusDI: number;
  interpretation: string;
}

export interface VWAPResult {
  value: number;
  interpretation: string;
}

export interface TechnicalIndicators {
  rsi: TechnicalIndicatorResult;
  macd: TechnicalIndicatorResult;
  bollingerBands: BollingerBandsResult;
  stochastic: StochasticResult;
  adx: ADXResult;
  vwap: VWAPResult;
  ichimoku: IchimokuResult;
  atr: TechnicalIndicatorResult;
  obv: TechnicalIndicatorResult;
  mfi: TechnicalIndicatorResult;
  cci: TechnicalIndicatorResult;
  williamsPctR: TechnicalIndicatorResult;
  aroon: {
    up: number;
    down: number;
    oscillator: number;
    interpretation: string;
  };
  trix: TechnicalIndicatorResult;
  roc: TechnicalIndicatorResult;
  psar: {
    value: number;
    trend: 'up' | 'down';
    interpretation: string;
  };
  dmi: {
    adx: number;
    plusDI: number;
    minusDI: number;
    interpretation: string;
  };
  supertrend: {
    value: number;
    trend: 'up' | 'down';
    interpretation: string;
  };
  ema: {
    ema9: number;
    ema20: number;
    ema50: number;
    ema200: number;
    interpretation: string;
  };
  sma: {
    sma20: number;
    sma50: number;
    sma200: number;
    interpretation: string;
  };
  ichimokuCloud: IchimokuCloudAnalysis;
  marketProfile: MarketProfileAnalysis;
  keltnerChannels: KeltnerChannels;
  donchianChannels: DonchianChannels;
  chaikinMoneyFlow: ChaikinMoneyFlow;
  elderRay: ElderRayIndex;
}

export class TechnicalAnalysis {
  private validatePrices(prices: number[], minLength: number = 2): void {
    if (!Array.isArray(prices)) {
      throw new Error('Price data must be an array');
    }
    if (prices.length < minLength) {
      throw new Error(`Insufficient data points. Need at least ${minLength} prices.`);
    }
    if (prices.some(price => typeof price !== 'number' || isNaN(price) || price < 0)) {
      throw new Error('Invalid price data. Prices must be positive numbers.');
    }
  }

  private validateOHLCV(ohlcv: OHLCVData[]): void {
    if (!Array.isArray(ohlcv)) {
      throw new Error('OHLCV data must be an array');
    }
    if (ohlcv.length < 2) {
      throw new Error('Insufficient OHLCV data points');
    }
    ohlcv.forEach((candle, i) => {
      if (!candle.open || !candle.high || !candle.low || !candle.close || !candle.volume) {
        throw new Error(`Missing OHLCV data at index ${i}`);
      }
      if (candle.high < candle.low) {
        throw new Error(`Invalid OHLCV data: high (${candle.high}) is less than low (${candle.low}) at index ${i}`);
      }
      if (candle.open < 0 || candle.high < 0 || candle.low < 0 || candle.close < 0 || candle.volume < 0) {
        throw new Error(`Negative values in OHLCV data at index ${i}`);
      }
    });
  }

  // RSI (Relative Strength Index)
  public calculateRSI(prices: number[], period: number = 14): TechnicalIndicatorResult {
    this.validatePrices(prices, period + 1);
    
    let gains = 0;
    let losses = 0;

    // Calculate initial average gain and loss
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change >= 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Calculate subsequent values using Wilder's smoothing
    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      avgGain = ((avgGain * (period - 1)) + (change > 0 ? change : 0)) / period;
      avgLoss = ((avgLoss * (period - 1)) + (change < 0 ? -change : 0)) / period;
    }

    // Prevent division by zero
    const rs = avgGain / (avgLoss || 1);
    // Cap RSI at 85
    const rsi = Math.min(100 - (100 / (1 + rs)), 85);

    return {
      value: rsi,
      interpretation: this.interpretRSI(rsi)
    };
  }

  // MACD (Moving Average Convergence Divergence)
  public calculateMACD(prices: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): TechnicalIndicatorResult {
    this.validatePrices(prices, Math.max(fastPeriod, slowPeriod) + signalPeriod);

    // Calculate percentage changes for more realistic MACD
    const priceChanges = prices.map((price, i) => 
      i === 0 ? 0 : ((price - prices[i - 1]) / prices[i - 1]) * 100
    );
    
    // Calculate EMAs
    const fastEMA = this.calculateEMA(priceChanges, fastPeriod);
    const slowEMA = this.calculateEMA(priceChanges, slowPeriod);
    
    const macdLine = fastEMA - slowEMA;
    const signalLine = this.calculateEMA([macdLine], signalPeriod);
    const histogram = macdLine - signalLine;

    // Format values to avoid extremely small numbers
    return {
      value: parseFloat(macdLine.toFixed(8)),
      signal: parseFloat(signalLine.toFixed(8)),
      histogram: parseFloat(histogram.toFixed(8)),
      interpretation: this.interpretMACD(macdLine, signalLine, histogram)
    };
  }

  // Bollinger Bands
  public calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): BollingerBandsResult {
    this.validatePrices(prices, period);

    const sma = this.calculateSMA(prices, period);
    const variance = prices.slice(-period).reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);
    
    // Ensure bands don't go negative
    const upper = Math.max(sma + (standardDeviation * stdDev), sma * 1.001);
    const lower = Math.max(sma - (standardDeviation * stdDev), 0);
    const bandwidth = ((upper - lower) / sma) * 100;
    const lastPrice = prices[prices.length - 1];
    const percentB = ((lastPrice - lower) / (upper - lower)) * 100;

    return {
      upper,
      middle: sma,
      lower,
      bandwidth,
      percentB,
      interpretation: this.interpretBollingerBands(lastPrice, upper, lower, sma, bandwidth)
    };
  }

  // Stochastic Oscillator
  public calculateStochastic(ohlcv: OHLCVData[], kPeriod: number = 14, dPeriod: number = 3): StochasticResult {
    const highs = ohlcv.map(candle => candle.high);
    const lows = ohlcv.map(candle => candle.low);
    const closes = ohlcv.map(candle => candle.close);

    const highestHigh = Math.max(...highs.slice(-kPeriod));
    const lowestLow = Math.min(...lows.slice(-kPeriod));
    const currentClose = closes[closes.length - 1];

    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    const kValues = [k];
    const d = this.calculateSMA(kValues, dPeriod);

    return {
      k,
      d,
      interpretation: this.interpretStochastic(k, d)
    };
  }

  // ADX (Average Directional Index)
  public calculateADX(ohlcv: OHLCVData[], period: number = 14): ADXResult {
    this.validateOHLCV(ohlcv);

    let plusDM = 0;
    let minusDM = 0;
    let tr = 0;

    for (let i = 1; i < ohlcv.length; i++) {
      const high = ohlcv[i].high;
      const low = ohlcv[i].low;
      const prevHigh = ohlcv[i - 1].high;
      const prevLow = ohlcv[i - 1].low;
      const prevClose = ohlcv[i - 1].close;

      const upMove = high - prevHigh;
      const downMove = prevLow - low;

      if (upMove > downMove && upMove > 0) {
        plusDM += upMove;
      }
      if (downMove > upMove && downMove > 0) {
        minusDM += downMove;
      }

      tr += Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    }

    // Prevent division by zero and scale ADX to reasonable range
    const trSafe = tr || 1;
    const plusDI = Math.min(65, (plusDM / trSafe) * 100);
    const minusDI = Math.min(65, (minusDM / trSafe) * 100);
    const adx = Math.min(65, Math.max(15, Math.abs((plusDI - minusDI) / (plusDI + minusDI || 1)) * 100));

    return {
      adx,
      plusDI,
      minusDI,
      interpretation: this.interpretADX(adx, plusDI, minusDI)
    };
  }

  // VWAP (Volume Weighted Average Price)
  public calculateVWAP(ohlcv: OHLCVData[]): VWAPResult {
    let cumulativeTPV = 0;
    let cumulativeVolume = 0;

    for (const candle of ohlcv) {
      const typicalPrice = (candle.high + candle.low + candle.close) / 3;
      cumulativeTPV += typicalPrice * candle.volume;
      cumulativeVolume += candle.volume;
    }

    const vwap = cumulativeTPV / cumulativeVolume;
    const lastClose = ohlcv[ohlcv.length - 1].close;

    return {
      value: vwap,
      interpretation: this.interpretVWAP(lastClose, vwap)
    };
  }

  // Ichimoku Cloud
  public calculateIchimoku(ohlcv: OHLCVData[]): IchimokuResult {
    const conversionPeriod = 9;
    const basePeriod = 26;
    const leadingSpanBPeriod = 52;
    const displacement = 26;

    const getHighLow = (data: OHLCVData[], period: number) => {
      const slice = data.slice(-period);
      const high = Math.max(...slice.map(candle => candle.high));
      const low = Math.min(...slice.map(candle => candle.low));
      return (high + low) / 2;
    };

    const conversionLine = getHighLow(ohlcv, conversionPeriod);
    const baseLine = getHighLow(ohlcv, basePeriod);
    const leadingSpanA = (conversionLine + baseLine) / 2;
    const leadingSpanB = getHighLow(ohlcv, leadingSpanBPeriod);
    const laggingSpan = ohlcv[ohlcv.length - displacement]?.close || ohlcv[ohlcv.length - 1].close;

    return {
      conversionLine,
      baseLine,
      leadingSpanA,
      leadingSpanB,
      laggingSpan,
      interpretation: this.interpretIchimoku(conversionLine, baseLine, leadingSpanA, leadingSpanB, laggingSpan, ohlcv[ohlcv.length - 1].close)
    };
  }

  // ATR (Average True Range)
  public calculateATR(ohlcv: OHLCVData[], period: number = 14): TechnicalIndicatorResult {
    const trueRanges: number[] = [];

    for (let i = 1; i < ohlcv.length; i++) {
      const high = ohlcv[i].high;
      const low = ohlcv[i].low;
      const prevClose = ohlcv[i - 1].close;

      const tr1 = high - low;
      const tr2 = Math.abs(high - prevClose);
      const tr3 = Math.abs(low - prevClose);

      trueRanges.push(Math.max(tr1, tr2, tr3));
    }

    const atr = this.calculateEMA(trueRanges, period);
    const currentPrice = ohlcv[ohlcv.length - 1].close;

    return {
      value: atr,
      interpretation: this.interpretATR(atr, currentPrice)
    };
  }

  // OBV (On Balance Volume)
  public calculateOBV(ohlcv: OHLCVData[]): TechnicalIndicatorResult {
    let obv = 0;
    for (let i = 1; i < ohlcv.length; i++) {
      if (ohlcv[i].close > ohlcv[i - 1].close) {
        obv += ohlcv[i].volume;
      } else if (ohlcv[i].close < ohlcv[i - 1].close) {
        obv -= ohlcv[i].volume;
      }
    }

    const obvSMA = this.calculateSMA([obv], 20);
    const trend = obv > obvSMA ? 'uptrend' : 'downtrend';

    return {
      value: obv,
      signal: obvSMA,
      interpretation: `OBV indicates ${trend}. ${obv > obvSMA ? 'Volume supports price action' : 'Possible divergence between price and volume'}`
    };
  }

  // MFI (Money Flow Index)
  public calculateMFI(ohlcv: OHLCVData[], period: number = 14): TechnicalIndicatorResult {
    let positiveMF = 0;
    let negativeMF = 0;

    for (let i = 1; i < ohlcv.length; i++) {
      const typicalPrice = (ohlcv[i].high + ohlcv[i].low + ohlcv[i].close) / 3;
      const prevTypicalPrice = (ohlcv[i - 1].high + ohlcv[i - 1].low + ohlcv[i - 1].close) / 3;
      const rawMoneyFlow = typicalPrice * ohlcv[i].volume;

      if (typicalPrice > prevTypicalPrice) {
        positiveMF += rawMoneyFlow;
      } else {
        negativeMF += rawMoneyFlow;
      }
    }

    const mfi = 100 - (100 / (1 + (positiveMF / negativeMF)));

    return {
      value: mfi,
      interpretation: this.interpretMFI(mfi)
    };
  }

  // CCI (Commodity Channel Index)
  public calculateCCI(ohlcv: OHLCVData[], period: number = 20): TechnicalIndicatorResult {
    const typicalPrices = ohlcv.map(candle => (candle.high + candle.low + candle.close) / 3);
    const sma = this.calculateSMA(typicalPrices, period);
    const meanDeviation = typicalPrices.slice(-period).reduce((sum, tp) => sum + Math.abs(tp - sma), 0) / period;
    const cci = (typicalPrices[typicalPrices.length - 1] - sma) / (0.015 * meanDeviation);

    return {
      value: cci,
      interpretation: this.interpretCCI(cci)
    };
  }

  // Williams %R
  public calculateWilliamsPctR(ohlcv: OHLCVData[], period: number = 14): TechnicalIndicatorResult {
    const highs = ohlcv.map(candle => candle.high);
    const lows = ohlcv.map(candle => candle.low);
    const close = ohlcv[ohlcv.length - 1].close;

    const highestHigh = Math.max(...highs.slice(-period));
    const lowestLow = Math.min(...lows.slice(-period));

    const r = ((highestHigh - close) / (highestHigh - lowestLow)) * -100;

    return {
      value: r,
      interpretation: this.interpretWilliamsPctR(r)
    };
  }

  // Aroon Indicator
  public calculateAroon(ohlcv: OHLCVData[], period: number = 25): { up: number; down: number; oscillator: number; interpretation: string } {
    const highs = ohlcv.map(candle => candle.high);
    const lows = ohlcv.map(candle => candle.low);

    let highestIndex = 0;
    let lowestIndex = 0;

    for (let i = 1; i < period; i++) {
      if (highs[highs.length - 1 - i] > highs[highs.length - 1 - highestIndex]) {
        highestIndex = i;
      }
      if (lows[lows.length - 1 - i] < lows[lows.length - 1 - lowestIndex]) {
        lowestIndex = i;
      }
    }

    const up = ((period - highestIndex) / period) * 100;
    const down = ((period - lowestIndex) / period) * 100;
    const oscillator = up - down;

    return {
      up,
      down,
      oscillator,
      interpretation: this.interpretAroon(up, down)
    };
  }

  // TRIX (Triple Exponential Average)
  public calculateTRIX(prices: number[], period: number = 15): TechnicalIndicatorResult {
    let ema1 = this.calculateEMA(prices, period);
    let ema2 = this.calculateEMA([ema1], period);
    let ema3 = this.calculateEMA([ema2], period);
    
    const prevEma3 = this.calculateEMA([this.calculateEMA([this.calculateEMA(prices.slice(0, -1), period)], period)], period);
    const trix = ((ema3 - prevEma3) / prevEma3) * 100;

    return {
      value: trix,
      interpretation: this.interpretTRIX(trix)
    };
  }

  // ROC (Rate of Change)
  public calculateROC(prices: number[], period: number = 14): TechnicalIndicatorResult {
    const currentPrice = prices[prices.length - 1];
    const oldPrice = prices[prices.length - period - 1];
    const roc = ((currentPrice - oldPrice) / oldPrice) * 100;

    return {
      value: roc,
      interpretation: this.interpretROC(roc)
    };
  }

  // PSAR (Parabolic SAR)
  public calculatePSAR(ohlcv: OHLCVData[], af: number = 0.02, maxAf: number = 0.2): { value: number; trend: 'up' | 'down'; interpretation: string } {
    let psar = ohlcv[0].low;
    let ep = ohlcv[0].high;
    let trend: 'up' | 'down' = 'up';
    let currentAf = af;

    for (let i = 1; i < ohlcv.length; i++) {
      psar = psar + currentAf * (ep - psar);
      
      if (trend === 'up') {
        if (ohlcv[i].high > ep) {
          ep = ohlcv[i].high;
          currentAf = Math.min(currentAf + af, maxAf);
        }
        if (ohlcv[i].low < psar) {
          trend = 'down';
          psar = ep;
          ep = ohlcv[i].low;
          currentAf = af;
        }
      } else {
        if (ohlcv[i].low < ep) {
          ep = ohlcv[i].low;
          currentAf = Math.min(currentAf + af, maxAf);
        }
        if (ohlcv[i].high > psar) {
          trend = 'up';
          psar = ep;
          ep = ohlcv[i].high;
          currentAf = af;
        }
      }
    }

    return {
      value: psar,
      trend,
      interpretation: this.interpretPSAR(psar, trend, ohlcv[ohlcv.length - 1].close)
    };
  }

  // Supertrend
  public calculateSupertrend(ohlcv: OHLCVData[], period: number = 10, multiplier: number = 3): { value: number; trend: 'up' | 'down'; interpretation: string } {
    const atr = this.calculateATR(ohlcv, period).value;
    
    const upperBand = ((ohlcv[ohlcv.length - 1].high + ohlcv[ohlcv.length - 1].low) / 2) + (multiplier * atr);
    const lowerBand = ((ohlcv[ohlcv.length - 1].high + ohlcv[ohlcv.length - 1].low) / 2) - (multiplier * atr);
    
    const currentClose = ohlcv[ohlcv.length - 1].close;
    const trend: 'up' | 'down' = currentClose > upperBand ? 'up' : 'down';
    const value = trend === 'up' ? lowerBand : upperBand;

    return {
      value,
      trend,
      interpretation: this.interpretSupertrend(value, trend, currentClose)
    };
  }

  // Helper Methods
  private calculateEMA(prices: number[], period: number): number {
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }
    
    return ema;
  }

  public calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) {
      throw new Error(`Not enough data points for SMA calculation. Need at least ${period} points.`);
    }
    return prices.slice(-period).reduce((sum, price) => sum + price, 0) / period;
  }

  // Interpretation Methods
  private interpretRSI(rsi: number): string {
    if (rsi > 70) {
      return "Overbought - The asset may be overvalued and due for a price correction downward.";
    } else if (rsi < 30) {
      return "Oversold - The asset may be undervalued and due for a price correction upward.";
    } else if (rsi > 50) {
      return "Bullish momentum - Price strength is above average.";
    } else {
      return "Bearish momentum - Price strength is below average.";
    }
  }

  private interpretMACD(macdLine: number, signalLine: number, histogram: number): string {
    let interpretation = '';
    
    if (macdLine > signalLine) {
      interpretation = 'Bullish - MACD is above signal line';
      if (histogram > 0) {
        interpretation += histogram > Math.abs(macdLine) * 0.1 ? ' with strong momentum' : ' with moderate momentum';
      }
    } else {
      interpretation = 'Bearish - MACD is below signal line';
      if (histogram < 0) {
        interpretation += histogram < -Math.abs(macdLine) * 0.1 ? ' with strong momentum' : ' with moderate momentum';
      }
    }

    if (macdLine > 0) {
      interpretation += ' in uptrend';
    } else {
      interpretation += ' in downtrend';
    }

    return interpretation;
  }

  private interpretBollingerBands(price: number, upper: number, lower: number, middle: number, bandwidth: number): string {
    let interpretation = '';
    
    if (price > upper) {
      interpretation = 'Overbought - Price is above the upper band, suggesting potential reversal or continuation of strong uptrend';
    } else if (price < lower) {
      interpretation = 'Oversold - Price is below the lower band, suggesting potential reversal or continuation of strong downtrend';
    } else if (price > middle) {
      interpretation = 'Bullish - Price is above the middle band but within the bands, suggesting moderate upward momentum';
    } else {
      interpretation = 'Bearish - Price is below the middle band but within the bands, suggesting moderate downward momentum';
    }

    if (bandwidth < 10) {
      interpretation += '. Low bandwidth suggests potential breakout incoming';
    } else if (bandwidth > 40) {
      interpretation += '. High bandwidth indicates high volatility';
    }

    return interpretation;
  }

  private interpretStochastic(k: number, d: number): string {
    if (k > 80 && d > 80) {
      return 'Overbought - Strong selling pressure may be incoming';
    } else if (k < 20 && d < 20) {
      return 'Oversold - Strong buying pressure may be incoming';
    } else if (k > d) {
      return 'Bullish momentum building';
    } else {
      return 'Bearish momentum building';
    }
  }

  private interpretADX(adx: number, plusDI: number, minusDI: number): string {
    let trend = plusDI > minusDI ? 'bullish' : 'bearish';
    
    if (adx > 25) {
      return `Strong ${trend} trend`;
    } else if (adx > 20) {
      return `Moderate ${trend} trend`;
    } else {
      return 'No clear trend - Market is ranging';
    }
  }

  private interpretVWAP(price: number, vwap: number): string {
    const percentDiff = ((price - vwap) / vwap) * 100;
    
    if (price > vwap) {
      return `Bullish - Price is ${percentDiff.toFixed(2)}% above VWAP, indicating buying pressure`;
    } else {
      return `Bearish - Price is ${Math.abs(percentDiff).toFixed(2)}% below VWAP, indicating selling pressure`;
    }
  }

  private interpretIchimoku(
    conversion: number,
    base: number,
    spanA: number,
    spanB: number,
    lagging: number,
    currentPrice: number
  ): string {
    let signals = [];
    
    if (currentPrice > spanA && currentPrice > spanB) {
      signals.push('Strong bullish trend');
    } else if (currentPrice < spanA && currentPrice < spanB) {
      signals.push('Strong bearish trend');
    }
    
    if (conversion > base) {
      signals.push('Short-term bullish');
    } else {
      signals.push('Short-term bearish');
    }
    
    if (currentPrice > lagging) {
      signals.push('Confirmation of uptrend');
    } else {
      signals.push('Confirmation of downtrend');
    }
    
    return signals.join('. ');
  }

  private interpretATR(atr: number, currentPrice: number): string {
    const atrPercentage = (atr / currentPrice) * 100;
    
    if (atrPercentage > 5) {
      return 'High volatility - Large price swings expected';
    } else if (atrPercentage > 2) {
      return 'Moderate volatility - Normal market conditions';
    } else {
      return 'Low volatility - Potential breakout incoming';
    }
  }

  private interpretMFI(mfi: number): string {
    if (mfi > 80) {
      return "Overbought - Potential reversal or correction likely";
    } else if (mfi < 20) {
      return "Oversold - Potential buying opportunity";
    } else if (mfi > 60) {
      return "Strong buying pressure";
    } else if (mfi < 40) {
      return "Strong selling pressure";
    }
    return "Neutral money flow";
  }

  private interpretCCI(cci: number): string {
    if (cci > 100) {
      return "Overbought - Potential reversal or correction likely";
    } else if (cci < -100) {
      return "Oversold - Potential buying opportunity";
    } else if (cci > 0) {
      return "Positive momentum building";
    } else {
      return "Negative momentum building";
    }
  }

  private interpretWilliamsPctR(r: number): string {
    if (r > -20) {
      return "Overbought - Potential reversal downward";
    } else if (r < -80) {
      return "Oversold - Potential reversal upward";
    }
    return "Neutral momentum";
  }

  private interpretAroon(up: number, down: number): string {
    if (up > 70 && down < 30) {
      return "Strong bullish trend";
    } else if (down > 70 && up < 30) {
      return "Strong bearish trend";
    } else if (up > down) {
      return "Bullish momentum building";
    } else {
      return "Bearish momentum building";
    }
  }

  private interpretTRIX(trix: number): string {
    if (trix > 0) {
      return trix > 0.5 ? "Strong bullish momentum" : "Moderate bullish momentum";
    } else {
      return trix < -0.5 ? "Strong bearish momentum" : "Moderate bearish momentum";
    }
  }

  private interpretROC(roc: number): string {
    if (roc > 10) {
      return "Strong upward momentum - Potential overbought";
    } else if (roc < -10) {
      return "Strong downward momentum - Potential oversold";
    } else if (roc > 0) {
      return "Positive momentum building";
    }
    return "Negative momentum building";
  }

  private interpretPSAR(psar: number, trend: 'up' | 'down', currentPrice: number): string {
    const distance = Math.abs((psar - currentPrice) / currentPrice) * 100;
    
    if (trend === 'up') {
      return `Uptrend - Support at ${psar.toFixed(8)} (${distance.toFixed(2)}% below price)`;
    }
    return `Downtrend - Resistance at ${psar.toFixed(8)} (${distance.toFixed(2)}% above price)`;
  }

  private interpretSupertrend(value: number, trend: 'up' | 'down', currentPrice: number): string {
    const distance = Math.abs((value - currentPrice) / currentPrice) * 100;
    
    if (trend === 'up') {
      return `Uptrend - Support at ${value.toFixed(8)} (${distance.toFixed(2)}% below price)`;
    }
    return `Downtrend - Resistance at ${value.toFixed(8)} (${distance.toFixed(2)}% above price)`;
  }

  private interpretEMA(prices: number[], periods: number[]): string {
    const currentPrice = prices[prices.length - 1];
    const emas = periods.map(period => this.calculateEMA(prices, period));
    const trends = emas.map(ema => currentPrice > ema ? 'bullish' : 'bearish');
    
    if (trends.every(trend => trend === 'bullish')) {
      return 'Strong bullish trend across all timeframes';
    } else if (trends.every(trend => trend === 'bearish')) {
      return 'Strong bearish trend across all timeframes';
    } else {
      return 'Mixed trend signals across different timeframes';
    }
  }

  private interpretSMA(prices: number[], periods: number[]): string {
    const currentPrice = prices[prices.length - 1];
    const smas = periods.map(period => this.calculateSMA(prices, period));
    const trends = smas.map(sma => currentPrice > sma ? 'bullish' : 'bearish');
    
    if (trends.every(trend => trend === 'bullish')) {
      return 'Strong bullish trend across all timeframes';
    } else if (trends.every(trend => trend === 'bearish')) {
      return 'Strong bearish trend across all timeframes';
    } else {
      return 'Mixed trend signals across different timeframes';
    }
  }

  // Calculate all indicators at once
  public calculateAllIndicators(ohlcv: OHLCVData[]): TechnicalIndicators {
    const prices = ohlcv.map(candle => candle.close);
    
    return {
      rsi: this.calculateRSI(prices),
      macd: this.calculateMACD(prices),
      bollingerBands: this.calculateBollingerBands(prices),
      stochastic: this.calculateStochastic(ohlcv),
      adx: this.calculateADX(ohlcv),
      vwap: this.calculateVWAP(ohlcv),
      ichimoku: this.calculateIchimoku(ohlcv),
      atr: this.calculateATR(ohlcv),
      obv: this.calculateOBV(ohlcv),
      mfi: this.calculateMFI(ohlcv),
      cci: this.calculateCCI(ohlcv),
      williamsPctR: this.calculateWilliamsPctR(ohlcv),
      aroon: this.calculateAroon(ohlcv),
      trix: this.calculateTRIX(prices),
      roc: this.calculateROC(prices),
      psar: this.calculatePSAR(ohlcv),
      dmi: this.calculateADX(ohlcv),
      supertrend: this.calculateSupertrend(ohlcv),
      ema: {
        ema9: this.calculateEMA(prices, 9),
        ema20: this.calculateEMA(prices, 20),
        ema50: this.calculateEMA(prices, 50),
        ema200: this.calculateEMA(prices, 200),
        interpretation: this.interpretEMA(prices, [9, 20, 50, 200])
      },
      sma: {
        sma20: this.calculateSMA(prices, 20),
        sma50: this.calculateSMA(prices, 50),
        sma200: this.calculateSMA(prices, 200),
        interpretation: this.interpretSMA(prices, [20, 50, 200])
      },
      ichimokuCloud: this.calculateIchimokuCloud(ohlcv),
      marketProfile: this.calculateMarketProfile(ohlcv),
      keltnerChannels: this.calculateKeltnerChannels(ohlcv),
      donchianChannels: this.calculateDonchianChannels(ohlcv),
      chaikinMoneyFlow: this.calculateChaikinMoneyFlow(ohlcv),
      elderRay: this.calculateElderRayIndex(ohlcv)
    };
  }

  public calculateIchimokuCloud(ohlcv: OHLCVData[]): IchimokuCloudAnalysis {
    const conversionPeriod = 9;
    const basePeriod = 26;
    const spanBPeriod = 52;
    const displacement = 26;

    const getHighLow = (data: OHLCVData[], period: number) => {
      const slice = data.slice(-period);
      const high = Math.max(...slice.map(candle => candle.high));
      const low = Math.min(...slice.map(candle => candle.low));
      return (high + low) / 2;
    };

    const conversionLine = getHighLow(ohlcv, conversionPeriod);
    const baseLine = getHighLow(ohlcv, basePeriod);
    const leadingSpanA = (conversionLine + baseLine) / 2;
    const leadingSpanB = getHighLow(ohlcv, spanBPeriod);
    const laggingSpan = ohlcv[ohlcv.length - displacement]?.close || ohlcv[ohlcv.length - 1].close;

    const cloudColor = leadingSpanA > leadingSpanB ? 'green' : 'red';

    return {
      conversionLine,
      baseLine,
      leadingSpanA,
      leadingSpanB,
      laggingSpan,
      cloudColor,
      interpretation: this.interpretIchimokuCloud(conversionLine, baseLine, leadingSpanA, leadingSpanB, laggingSpan, ohlcv[ohlcv.length - 1].close)
    };
  }

  public calculateMarketProfile(ohlcv: OHLCVData[]): MarketProfileAnalysis {
    const priceVolumes = new Map<number, { volume: number; timeSpent: number }>();
    let totalVolume = 0;

    // Calculate volume and time spent at each price level
    ohlcv.forEach(candle => {
      const priceStep = Math.round(candle.close * 100) / 100;
      const existing = priceVolumes.get(priceStep) || { volume: 0, timeSpent: 0 };
      priceVolumes.set(priceStep, {
        volume: existing.volume + candle.volume,
        timeSpent: existing.timeSpent + 1
      });
      totalVolume += candle.volume;
    });

    // Find Point of Control (price with highest volume)
    let maxVolume = 0;
    let poc = 0;
    const volumeNodes = [];

    for (const [price, data] of priceVolumes.entries()) {
      volumeNodes.push({
        price,
        volume: data.volume,
        timeSpent: data.timeSpent
      });

      if (data.volume > maxVolume) {
        maxVolume = data.volume;
        poc = price;
      }
    }

    // Calculate Value Area (70% of total volume)
    const targetVolume = totalVolume * 0.7;
    let currentVolume = 0;
    let high = poc;
    let low = poc;

    volumeNodes.sort((a, b) => b.volume - a.volume);

    for (const node of volumeNodes) {
      if (currentVolume >= targetVolume) break;
      currentVolume += node.volume;
      if (node.price > high) high = node.price;
      if (node.price < low) low = node.price;
    }

    // Calculate balance target (theoretical fair value)
    const balanceTarget = (high + low + poc) / 3;

    return {
      valueArea: {
        high,
        low,
        volume: currentVolume
      },
      pointOfControl: poc,
      volumeNodes: volumeNodes.sort((a, b) => a.price - b.price),
      balanceTarget,
      interpretation: this.interpretMarketProfile(poc, high, low, balanceTarget, ohlcv[ohlcv.length - 1].close)
    };
  }

  public calculateKeltnerChannels(ohlcv: OHLCVData[], period: number = 20, multiplier: number = 2): KeltnerChannels {
    const ema = this.calculateEMA(ohlcv.map(candle => candle.close), period);
    const atr = this.calculateATR(ohlcv, period).value;

    const upper = ema + (multiplier * atr);
    const lower = ema - (multiplier * atr);
    const bandwidth = ((upper - lower) / ema) * 100;

    return {
      upper,
      middle: ema,
      lower,
      bandwidth,
      interpretation: this.interpretKeltnerChannels(ohlcv[ohlcv.length - 1].close, upper, lower, ema, bandwidth)
    };
  }

  public calculateDonchianChannels(ohlcv: OHLCVData[], period: number = 20): DonchianChannels {
    const highs = ohlcv.slice(-period).map(candle => candle.high);
    const lows = ohlcv.slice(-period).map(candle => candle.low);

    const upper = Math.max(...highs);
    const lower = Math.min(...lows);
    const middle = (upper + lower) / 2;
    const bandwidth = ((upper - lower) / middle) * 100;

    return {
      upper,
      middle,
      lower,
      bandwidth,
      interpretation: this.interpretDonchianChannels(ohlcv[ohlcv.length - 1].close, upper, lower, middle)
    };
  }

  public calculateChaikinMoneyFlow(ohlcv: OHLCVData[], period: number = 20): ChaikinMoneyFlow {
    const mfMultiplier = (close: number, low: number, high: number) => {
      return ((close - low) - (high - close)) / (high - low);
    };

    const moneyFlowVolume = ohlcv.map(candle => {
      const multiplier = mfMultiplier(candle.close, candle.low, candle.high);
      return multiplier * candle.volume;
    });

    const cmf = this.calculateSMA(moneyFlowVolume, period);
    const signal = this.calculateEMA([cmf], 9);
    const divergence = this.checkCMFDivergence(ohlcv, cmf);

    return {
      value: cmf,
      signal,
      divergence,
      interpretation: this.interpretChaikinMoneyFlow(cmf, signal, divergence)
    };
  }

  public calculateElderRayIndex(ohlcv: OHLCVData[], period: number = 13): ElderRayIndex {
    const ema = this.calculateEMA(ohlcv.map(candle => candle.close), period);
    const currentPrice = ohlcv[ohlcv.length - 1].close;

    const bullPower = ohlcv[ohlcv.length - 1].high - ema;
    const bearPower = ohlcv[ohlcv.length - 1].low - ema;

    const trend = this.determineElderRayTrend(bullPower, bearPower, currentPrice, ema);

    return {
      bullPower,
      bearPower,
      trend,
      interpretation: this.interpretElderRay(bullPower, bearPower, trend)
    };
  }

  private interpretIchimokuCloud(
    conversion: number,
    base: number,
    spanA: number,
    spanB: number,
    lagging: number,
    currentPrice: number
  ): string {
    let signals = [];
    
    if (currentPrice > spanA && currentPrice > spanB) {
      signals.push('Strong bullish trend - Price above the cloud');
    } else if (currentPrice < spanA && currentPrice < spanB) {
      signals.push('Strong bearish trend - Price below the cloud');
    } else {
      signals.push('Price in the cloud - Trend is unclear');
    }
    
    if (conversion > base) {
      signals.push('Short-term momentum is bullish');
    } else {
      signals.push('Short-term momentum is bearish');
    }
    
    if (currentPrice > lagging) {
      signals.push('Confirmation of uptrend');
    } else {
      signals.push('Confirmation of downtrend');
    }
    
    return signals.join('. ');
  }

  private interpretMarketProfile(
    poc: number,
    high: number,
    low: number,
    balanceTarget: number,
    currentPrice: number
  ): string {
    const pricePosition = ((currentPrice - low) / (high - low)) * 100;
    let interpretation = '';

    if (currentPrice > poc) {
      interpretation = `Price is above Point of Control (${poc.toFixed(8)}), showing bullish control`;
    } else if (currentPrice < poc) {
      interpretation = `Price is below Point of Control (${poc.toFixed(8)}), showing bearish control`;
    } else {
      interpretation = 'Price at Point of Control, showing equilibrium';
    }

    if (pricePosition > 80) {
      interpretation += '. Price is in upper value area, potential resistance ahead';
    } else if (pricePosition < 20) {
      interpretation += '. Price is in lower value area, potential support nearby';
    }

    if (Math.abs(currentPrice - balanceTarget) / balanceTarget < 0.01) {
      interpretation += '. Price near balance target, suggesting fair value';
    }

    return interpretation;
  }

  private interpretKeltnerChannels(
    price: number,
    upper: number,
    lower: number,
    middle: number,
    bandwidth: number
  ): string {
    if (price > upper) {
      return `Overbought - Price above upper channel (${bandwidth.toFixed(2)}% bandwidth)`;
    } else if (price < lower) {
      return `Oversold - Price below lower channel (${bandwidth.toFixed(2)}% bandwidth)`;
    } else if (price > middle) {
      return `Bullish momentum within channels (${bandwidth.toFixed(2)}% bandwidth)`;
    } else {
      return `Bearish momentum within channels (${bandwidth.toFixed(2)}% bandwidth)`;
    }
  }

  private interpretDonchianChannels(
    price: number,
    upper: number,
    lower: number,
    middle: number
  ): string {
    if (price >= upper) {
      return 'New high - Strong bullish momentum';
    } else if (price <= lower) {
      return 'New low - Strong bearish momentum';
    } else if (price > middle) {
      return 'Price in upper half of channel - Bullish bias';
    } else {
      return 'Price in lower half of channel - Bearish bias';
    }
  }

  private interpretChaikinMoneyFlow(
    cmf: number,
    signal: number,
    divergence: boolean
  ): string {
    let interpretation = '';

    if (cmf > 0.25) {
      interpretation = 'Strong accumulation';
    } else if (cmf < -0.25) {
      interpretation = 'Strong distribution';
    } else if (cmf > 0) {
      interpretation = 'Moderate accumulation';
    } else {
      interpretation = 'Moderate distribution';
    }

    if (cmf > signal) {
      interpretation += ', bullish momentum building';
    } else {
      interpretation += ', bearish pressure increasing';
    }

    if (divergence) {
      interpretation += ' with potential trend reversal signal';
    }

    return interpretation;
  }

  private interpretElderRay(
    bullPower: number,
    bearPower: number,
    trend: string
  ): string {
    let interpretation = '';

    if (bullPower > 0 && bearPower < 0) {
      interpretation = 'Strong trend - Bulls control highs, bears control lows';
    } else if (bullPower > 0 && bearPower > 0) {
      interpretation = 'Very bullish - Bulls control both highs and lows';
    } else if (bullPower < 0 && bearPower < 0) {
      interpretation = 'Very bearish - Bears control both highs and lows';
    } else {
      interpretation = 'Weak trend - Mixed control between bulls and bears';
    }

    interpretation += `. Overall trend is ${trend}`;
    return interpretation;
  }

  private determineElderRayTrend(
    bullPower: number,
    bearPower: number,
    price: number,
    ema: number
  ): string {
    if (price > ema && bullPower > 0 && bearPower > -bullPower) {
      return 'strongly bullish';
    } else if (price < ema && bearPower < 0 && Math.abs(bearPower) > bullPower) {
      return 'strongly bearish';
    } else if (price > ema) {
      return 'moderately bullish';
    } else {
      return 'moderately bearish';
    }
  }

  private checkCMFDivergence(ohlcv: OHLCVData[], cmf: number): boolean {
    const prices = ohlcv.map(candle => candle.close);
    const priceChange = (prices[prices.length - 1] - prices[0]) / prices[0];
    const cmfChange = cmf - this.calculateSMA(ohlcv.slice(0, -1).map(candle => 
      ((candle.close - candle.low) - (candle.high - candle.close)) / (candle.high - candle.low) * candle.volume
    ), 20);

    return (priceChange > 0 && cmfChange < 0) || (priceChange < 0 && cmfChange > 0);
  }
} 
