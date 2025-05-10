
// Basic interfaces for token and market data
export interface TokenData {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  price: number;
  priceChange?: PriceChange;
  volume?: VolumeData;
  marketCap?: number;
  fdv?: number;
  liquidity?: number;
  uniqueHolders?: number;
  logoURI?: string;
  extensions?: any;
  
  // Additional properties from Birdeye API
  holder?: number;
  v24h?: number;
  v24hUSD?: number;
  v24hChangePercent?: number;
  v12h?: number;
  v8h?: number;
  v6h?: number;
  v4h?: number;
  v2h?: number;
  v1h?: number;
  vBuy24hUSD?: number;
  vSell24hUSD?: number;
  uniqueWallet24h?: number;
  uniqueWallet24hChangePercent?: number;
  uniqueWallet12h?: number;
  uniqueWallet8h?: number;
  uniqueWallet4h?: number;
  uniqueWallet2h?: number;
  uniqueWallet1h?: number;
  uniqueWallet30m?: number;

  // Historical prices
  history24hPrice?: number;
  history12hPrice?: number;
  history8hPrice?: number;
  history6hPrice?: number;
  history4hPrice?: number;
  history2hPrice?: number;
  history1hPrice?: number;
  history30mPrice?: number;

  // Price changes
  priceChange24hPercent?: number;
  priceChange12hPercent?: number;
  priceChange8hPercent?: number;
  priceChange6hPercent?: number;
  priceChange4hPercent?: number;
  priceChange2hPercent?: number;
  priceChange1hPercent?: number;
  priceChange30mPercent?: number;
}

// Add the missing Sentiment type
export type Sentiment = 'bullish' | 'bearish' | 'neutral';

// Add the missing TokenMarketData interface
export interface TokenMarketData {
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  liquidity: number;
  holders: number;
}

export interface PriceChange {
  '24h': number;
  '1h': number;
  '7d'?: number;
  '4h'?: number;  // Added 4h property
}

export interface VolumeData {
  '24h': number;
  'change'?: number;
}

// OHLCV specific types
export interface OHLCVData {
  o: number;          // Open price
  h: number;          // High price
  l: number;          // Low price
  c: number;          // Close price
  v: number;          // Volume
  unixTime: number;   // Timestamp
  address: string;    // Token address
  type: string;       // Timeframe
  currency: string;   // Currency (usd)
}

// Historical price data point
export interface PriceDataPoint {
  time: number;
  value: number;
}

// Technical indicators interface
export interface TechnicalIndicators {
  rsi?: {
    value: number;
    interpretation: string;
  };
  macd?: {
    value: number;
    signal: number;
    histogram: number;
    interpretation: string;
  };
  bollingerBands?: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
    interpretation: string;
  };
  ema?: {
    ema9: number;
    ema20: number;
    ema50: number;
    ema200?: number;
    interpretation: string;
  };
  ichimokuCloud?: {
    conversionLine: number;
    baseLine: number;
    leadingSpanA: number;
    leadingSpanB: number;
    laggingSpan: number;
    cloudColor: 'green' | 'red';
    interpretation: string;
  };
  adx?: {
    adx: number;  // Using adx property name consistently
    diPlus: number;
    diMinus: number;
    interpretation: string;
  };
  atr?: {
    value: number;
    interpretation: string;
  };
  supports?: number[];
  resistances?: number[];
  stochastic?: {
    k: number;
    d: number;
    interpretation: string;
  };
  volumeTrend?: string;  // Added missing property
  trendStrength?: string;
  volumeProfile?: { price: number; volume: number; }[] | any[] | null;  // Updated to match marketTypes
  priceActionPattern?: string;
  currentTrend?: 'uptrend' | 'downtrend' | 'sideways' | 'consolidation' | 'volatile';
}

// Technical indicators data type - separate from the UI representation
export interface TechnicalIndicatorsData {
  // Using the same structure as TechnicalIndicators to avoid duplicate interfaces
  rsi: {
    value: number;
    interpretation: string;
  };
  macd: {
    value: number;
    signal: number;
    histogram: number;
    interpretation: string;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
    interpretation: string;
  };
  ema: {
    ema9: number;
    ema20: number;
    ema50: number;
    interpretation: string;
  };
  adx: {
    adx: number;  // Using adx property name consistently
    diPlus: number;
    diMinus: number;
    interpretation: string;
  };
  stochastic: {
    k: number;
    d: number;
    interpretation: string;
  };
  supports: number[];
  resistances: number[];
  volumeTrend: string;
  currentTrend: 'uptrend' | 'downtrend' | 'sideways' | 'consolidation' | 'volatile';
  priceActionPattern: string;
}

// Enhanced token data with technical information
export interface EnrichedTokenData extends TokenData {
  priceHistory?: PriceDataPoint[];
  ohlcv?: OHLCVData[];
  technicalIndicators?: TechnicalIndicators;
  tradingPairs?: any[];
  tradeData?: any;
  markets?: any[];
  
  // Add these missing properties that are used in tokenAnalysisService.ts
  coinGeckoData?: any;
  solscanData?: any;
  jupiterData?: any;
}

// Agent context interface
export interface AgentContext {
  userId?: string;
  agentId?: string;
  history: Message[];
  lastToken?: string;
  response?: string;
  currentInput?: string;
  marketContext?: any;
  memoryProvider?: any;
  prompt?: string;
  previousMessages?: any[];  
  metadata?: any;
  roomId?: string;
  memories?: any[];
}

// Memory interface
export interface Memory {
  id: string;
  userId: string;
  agentId: string;
  roomId?: string;
  content: {
    text: string;
    source: string;
  };
  type: string;
  createdAt: Date;
  updatedAt: Date;
  value?: any;
  key?: any;
}

// Message interface for conversations
export interface Message {
  id?: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  createdAt?: Date;
}

// Message example interface
export interface MessageExample {
  user: string;
  assistant: string;
}

// Character style interface
export interface CharacterStyle {
  all?: string[] | string;
  response?: {
    tone?: string[];
    format?: string[];
  };
}

// Middleware function type
export type MiddlewareFunction = (context: AgentContext, next: () => Promise<void>) => Promise<void>;

// Request and Response interface for API handlers
export interface Request {
  userId?: string;
  agentId?: string;
  content: string;
  body?: any;
  id?: string;
  createdAt?: Date;
}

export interface Response {
  send: (content: string) => Promise<void>;
  error: (message: string) => Promise<void>;
  status?: (code: number) => any;
  stream?: (generator: AsyncGenerator<string>) => Promise<void>;
}

// Route interface for API routes
export interface Route {
  name: string;
  description: string;
  path: string;
  match: (input: string) => boolean;
  handler: (context: AgentContext, req: Request, res: Response) => Promise<void>;
}

// Character interface
export interface Character {
  id?: string;
  name: string;
  avatarUrl?: string;
  systemPrompt: string;
  description?: string;  
  instructions?: string;
  agentId?: string;      
  system?: string;       
  bio?: string | string[];          
  style?: CharacterStyle;
}

// Model Provider interface
export interface ModelProvider {
  id: string;
  name: string;
  models: string[];
  getCompletion: (prompt: string, model: string) => Promise<string>;
}

// Market Analyzer interface
export interface MarketAnalyzer {
  analyzeToken: (tokenData: any) => Promise<string>;
  analyzeTechnicals: (technicalData: any) => Promise<string>;
  extractTokenFromQuery: (query: string) => Promise<string | null>;
}

// AgentFrameworkOptions interface
export interface AgentFrameworkOptions {
  memoryProvider?: any;
  modelProvider?: ModelProvider;
  enableLogging?: boolean;
  middleware?: MiddlewareFunction[];
}

// MemoryProvider interface
export interface MemoryProvider {
  createMemory: (memoryData: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Memory>;
  getMemories: (query: any) => Promise<Memory[]>;
  deleteMemory: (id: string) => Promise<boolean>;
  clearMemories: (userId: string, agentId: string, roomId?: string) => Promise<number>;
}

// Additional interfaces for MessageExample and CharacterStyle if they were missing
export interface MessageExample {
  user: string;
  assistant: string;
}

export interface CharacterStyle {
  all?: string[] | string;
  response?: {
    tone?: string[];
    format?: string[];
  };
}

// Petfinder provider interface
export interface PetfinderProvider {
  searchAnimals(params: any): Promise<any>;
  getAnimal(id: number): Promise<any>;
  getAnimalTypes(): Promise<any>;
  getAnimalType(type: string): Promise<any>;
  getAnimalBreeds(type: string): Promise<any>;
}
