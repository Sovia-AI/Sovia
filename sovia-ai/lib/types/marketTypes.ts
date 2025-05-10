
/**
 * OHLCV data structure
 */
export interface OHLCVData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Pair overview data structure
 */
export interface PairOverviewData {
  address: string;
  name: string;
  source: string;
  base: {
    address: string;
    symbol: string;
    decimals: number;
    icon?: string;
  };
  quote: {
    address: string;
    symbol: string;
    decimals: number;
    icon?: string;
  };
  liquidity: number;
  price: number;
  volume_24h: number;
  volume_24h_change_percentage_24h: number | null;
  trade_24h: number;
  uniqueWallet_24h?: number;
  uniqueWallet_24h_change_percent?: number;
  [key: string]: any; // Allow other properties
}

/**
 * Token holder data structure
 */
export interface TokenHolderData {
  amount: string;
  decimals: number;
  mint: string;
  owner: string;
  token_account: string;
  ui_amount: number;
}

/**
 * Token trade data structure
 */
export interface TokenTradeData {
  address: string;
  holder?: number;
  price?: number;
  market?: number;
  last_trade_unix_time?: number;
  last_trade_human_time?: string;
  price_change_24h_percent?: number;
  price_change_1h_percent?: number;
  unique_wallet_24h?: number;
  unique_wallet_24h_change_percent?: number;
  trade_24h?: number;
  volume_24h?: number;
  volume_24h_usd?: number;
  volume_24h_change_percent?: number;
  [key: string]: any; // Allow other properties
}

/**
 * Enhanced token data with all metadata
 */
export interface EnrichedTokenData {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  price: number;
  logoURI?: string | null;
  priceChange?: {
    '1h'?: number;
    '24h'?: number;
    '7d'?: number;
  };
  priceChange24hPercent?: number;
  priceChange1hPercent?: number;
  volume?: {
    '24h'?: number;
  };
  v24hUSD?: number;
  marketCap?: number;
  fdv?: number;
  liquidity?: number;
  holder?: number;
  uniqueWallet24h?: number;
  uniqueWallet24hChangePercent?: number;
  technicalIndicators?: {
    rsi?: { value: number; interpretation: string };
    macd?: { 
      value: number; 
      signal: number; 
      histogram: number; 
      interpretation: string 
    };
    currentTrend?: string;
    supports?: number[];
    resistances?: number[];
    volatility?: number;
    averageVolume?: number;
    volumeProfile?: { price: number; volume: number; }[] | any[] | null;
    [key: string]: any;
  };
  [key: string]: any; // Allow for additional properties
}
