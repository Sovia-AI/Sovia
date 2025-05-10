
/**
 * Format a number for display (e.g., 1000000 -> 1M)
 * @param num Number to format
 * @returns Formatted number string
 */
export function formatNumber(num: number): string {
  if (num === undefined || num === null || isNaN(num)) return 'N/A';
  
  if (num >= 1e9) {
    return (num / 1e9).toFixed(2) + 'B';
  } else if (num >= 1e6) {
    return (num / 1e6).toFixed(2) + 'M';
  } else if (num >= 1e3) {
    return (num / 1e3).toFixed(2) + 'K';
  } else {
    return num.toFixed(2);
  }
}

/**
 * Format percentage change with + or - prefix
 * @param change Percentage change value
 * @returns Formatted percentage string
 */
export function formatPercentChange(change: number): string {
  if (change === undefined || change === null || isNaN(change)) return 'N/A';
  return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
}

/**
 * Format price based on its magnitude
 * @param price Price value
 * @returns Formatted price string
 */
export function formatPrice(price: number): string {
  if (price === undefined || price === null || isNaN(price)) return 'N/A';
  
  if (price >= 1000) {
    return price.toFixed(2);
  } else if (price >= 1) {
    return price.toFixed(4);
  } else if (price >= 0.0001) {
    return price.toFixed(6);
  } else {
    return price.toExponential(4);
  }
}

/**
 * Format date to readable string
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  if (!date) return 'N/A';
  try {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Invalid Date';
  }
}

/**
 * Format volume for display with appropriate precision
 * @param volume Volume value
 * @returns Formatted volume string
 */
export function formatVolume(volume: number): string {
  if (volume === undefined || volume === null || isNaN(volume)) return 'N/A';
  return formatNumber(volume);
}

/**
 * Format market cap for display
 * @param marketCap Market cap value
 * @returns Formatted market cap string
 */
export function formatMarketCap(marketCap: number): string {
  if (marketCap === undefined || marketCap === null || isNaN(marketCap)) return 'N/A';
  return formatNumber(marketCap);
}

/**
 * Format indicator value with appropriate precision
 * @param value Indicator value
 * @param precision Number of decimal places
 * @returns Formatted indicator value string
 */
export function formatIndicator(value: number, precision: number = 2): string {
  if (value === undefined || value === null || isNaN(value)) return 'N/A';
  return value.toFixed(precision);
}

/**
 * Format time period in a human-readable way
 * @param period Time period in seconds, minutes, hours, or days
 * @returns Formatted time period string
 */
export function formatTimePeriod(period: string): string {
  const periodMap: Record<string, string> = {
    '1m': '1 minute',
    '5m': '5 minutes',
    '15m': '15 minutes',
    '30m': '30 minutes',
    '1h': '1 hour',
    '4h': '4 hours',
    '1d': '1 day',
    '1w': '1 week',
    '1M': '1 month'
  };
  
  return periodMap[period] || period;
}

/**
 * Format token price according to its magnitude
 * @param price Token price value
 * @returns Formatted price string
 */
export function formatTokenPrice(price: number | undefined): string {
  if (price === undefined || price === null || isNaN(price)) return 'N/A';
  
  if (price >= 1000) {
    return `$${price.toFixed(2)}`;
  } else if (price >= 1) {
    return `$${price.toFixed(3)}`;
  } else if (price >= 0.01) {
    return `$${price.toFixed(4)}`;
  } else if (price >= 0.0001) {
    return `$${price.toFixed(6)}`;
  } else if (price > 0) {
    return `$${price.toExponential(4)}`;
  } else {
    return 'N/A';
  }
}

/**
 * Format large numbers with abbreviations and proper precision
 * @param num Number to format
 * @returns Formatted string with B/M/K suffix as appropriate
 */
export function formatLargeNumber(num: number | undefined): string {
  if (num === undefined || num === null || isNaN(num) || num === 0) return 'N/A';
  
  if (num >= 1e9) {
    return `$${(num / 1e9).toFixed(2)}B`;
  } else if (num >= 1e6) {
    return `$${(num / 1e6).toFixed(2)}M`;
  } else if (num >= 1e3) {
    return `$${(num / 1e3).toFixed(2)}K`;
  } else {
    return `$${num.toFixed(2)}`;
  }
}

/**
 * Format RSI value with interpretation color context
 * @param rsi RSI value
 * @returns Object with formatted value and color suggestion
 */
export function formatRSI(rsi: number): { value: string, color: string } {
  if (rsi === undefined || rsi === null || isNaN(rsi)) {
    return { value: 'N/A', color: 'text-gray-400' };
  }
  
  let color = 'text-yellow-500'; // Neutral color for middle range
  
  if (rsi >= 70) {
    color = 'text-red-500';  // Overbought
  } else if (rsi <= 30) {
    color = 'text-green-500'; // Oversold
  }
  
  return {
    value: rsi.toFixed(2),
    color
  };
}
