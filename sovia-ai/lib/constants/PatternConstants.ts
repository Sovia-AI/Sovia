
// Crypto pattern detection
export const CRYPTO_PATTERNS = [
  /\b(token|crypto|coin|trading|market|price|analysis|chart|technical|sol|bonk|btc|eth)\b/i,
  /\b(rsi|macd|support|resistance|consolidation|trend|bullish|bearish|candle)\b/i,
  /\b(breakout|breakdown|volume|indicator|buy|sell|trade|holding|pump|dump)\b/i,
  /\b(market cap|liquidity|pool|swap|staking|yield|farming|apy|apr)\b/i,
  /\$[a-zA-Z0-9]+/i, // $SOL, $BTC style
  /[1-9A-HJ-NP-Za-km-z]{32,44}/, // Solana address pattern
];

// Weather pattern detection
export const WEATHER_PATTERNS = [
  /weather in/i,
  /\b(weather|temperature|forecast|humidity|precipitation|rain|sunny|cloudy|wind|climate)\b/i,
  /\b(hot|cold|warm|cool|freezing|heatwave|storm|thunder|lightning)\b/i,
  /\b(today's weather|how's the weather|current weather|weather update|weather report)\b/i,
];

// Weather forecast patterns
export const FORECAST_PATTERNS = [
  /\b(forecast|prediction|outlook|expected|upcoming|future|tomorrow|next week|weather report)\b/i,
  /\b(\d+ day forecast|\d+-day forecast|weekly forecast|weekend weather|weekly outlook)\b/i,
  /\b(what will the weather be|how will the weather be|weather tomorrow|weather this week)\b/i,
];

// Astronomy pattern detection
export const ASTRONOMY_PATTERNS = [
  /\b(astronomy|astrology|stars|planets|moon phase|moon|sun|solar|lunar|celestial)\b/i,
  /\b(sunrise|sunset|moonrise|moonset|eclipse|meteor|asteroid|galaxy|cosmos|space)\b/i,
  /\b(constellation|zodiac|horoscope|planet alignment|night sky|stargazing)\b/i,
];

// Pet adoption patterns
export const PET_PATTERNS = [
  /\b(pet|adopt|adoption|rescue|animal|shelter|dog|cat|puppy|kitten)\b/i,
  /\b(breed|dogs|cats|pets|animals|shelter|adoption center|pet store|animal welfare)\b/i,
  /\b(pet adoption|adopt a pet|animal rescue|animal shelter|adoptable|stray|rescue center)\b/i,
];

// PumpFun/Raydium patterns
export const PUMPFUN_PATTERNS = [
  /\b(pumpfun|pump fun|pump.*token|token.*pump|pump.*coin|coin.*pump)\b/i,
  /\b(raydium|ray.*swap|swap.*ray|liquidity|amm|dex)\b/i,
  /\b(bonding curve|tokenomics|create token|launch token|make token|new token)\b/i,
  /\b(solana.*swap|swap.*solana|sol.*swap|swap.*sol)\b/i,
  /\b(pump.*swap|swap.*pump|swap pool|pool.*swap|add liquidity)\b/i,
];

// Wallet patterns
export const WALLET_PATTERNS = [
  /\b(wallet|connect wallet|disconnect wallet|wallet connection|wallet status)\b/i,
  /\b(balance|token balance|sol balance|account|address|public key|private key)\b/i,
  /\b(transaction|send|receive|transfer|sign|signature|authorize|approve)\b/i,
  /\b(send|transfer|pay)\s+([0-9.]+)\s*(?:SOL|USDC|BONK|token|tokens)\s+(?:to|toward|towards)\s+([A-Za-z0-9]+)/i,
  /\b(swap|exchange|convert)\s+([0-9.]+)\s*(?:SOL|USDC|BONK|token|tokens)\s+(?:to|for|into)\s+(?:SOL|USDC|BONK|token|tokens)/i,
];
