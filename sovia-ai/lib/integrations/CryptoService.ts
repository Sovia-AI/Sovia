
export interface CoinData {
  symbol: string;
  name: string;
  price: number;
  marketCap: number;
  volume: {
    '24h': number;
    change: number;
  };
  priceChange: {
    '1h'?: number;
    '24h'?: number;
    '7d'?: number;
    '30d'?: number;
  };
}

export interface CryptoService {
  getTokenPrice(token: string): Promise<number | null>;
  getTokenData(token: string): Promise<CoinData | null>;
  searchTokens(query: string): Promise<CoinData[]>;
}
