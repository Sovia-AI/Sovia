
/**
 * Shortens an address for display purposes
 */
export const shortenAddress = (address: string, chars = 4): string => {
  if (!address) return '';
  return `${address.substring(0, chars)}...${address.substring(address.length - chars)}`;
};

/**
 * Format number with commas
 */
export const formatNumber = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 9,
  });
};

/**
 * Format currency with $ sign
 */
export const formatCurrency = (value: number | string, currency = 'USD'): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Format percentage
 */
export const formatPercent = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `${num.toFixed(2)}%`;
};

/**
 * Format token amount based on decimals
 */
export const formatTokenAmount = (amount: number | string, decimals = 9): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  const divisor = Math.pow(10, decimals);
  const formatted = (num / divisor).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
  return formatted;
};
