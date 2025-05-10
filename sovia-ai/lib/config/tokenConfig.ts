export interface TokenInfo {
  name: string;
  symbol: string;
  address: string;
  category: 'Core' | 'DeFi' | 'Meme' | 'Staking' | 'Infrastructure';
  description?: string;
  pumpAddress?: string; // Add pump address variant
}

export const TOKENS: { [key: string]: TokenInfo } = {
  // Core Tokens
  SOL: {
    name: 'Solana',
    symbol: 'SOL',
    address: 'So11111111111111111111111111111111111111112',
    category: 'Core',
    description: 'The native token of the Solana blockchain, used for transaction fees and staking.'
  },
  USDC: {
    name: 'USD Coin',
    symbol: 'USDC',
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    category: 'Core',
    description: 'A widely used stablecoin on Solana for DeFi and payments.'
  },
  USDT: {
    name: 'Tether USD',
    symbol: 'USDT',
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    category: 'Core',
    description: 'A widely used stablecoin on Solana.'
  },
  WSOL: {
    name: 'Wrapped SOL',
    symbol: 'WSOL',
    address: 'So11111111111111111111111111111111111111112',
    category: 'Core',
    description: 'A wrapped version of SOL for use in DeFi protocols.'
  },
  WBTC: {
    name: 'Wrapped Bitcoin',
    symbol: 'WBTC',
    address: '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh',
    category: 'Core',
    description: 'Wrapped Bitcoin on Solana.'
  },
  WETH: {
    name: 'Wrapped Ethereum',
    symbol: 'WETH',
    address: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
    category: 'Core',
    description: 'Wrapped Ethereum on Solana.'
  },
  EURC: {
    name: 'Euro Coin',
    symbol: 'EURC',
    address: 'HzwqbKZw8HxMN6bF2yFZNrht3c2iXXzpKcFu7uBEDKtr',
    category: 'Core',
    description: 'Euro-backed stablecoin on Solana.'
  },
  USDS: {
    name: 'USDS',
    symbol: 'USDS',
    address: 'USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA',
    category: 'Core',
    description: 'A USD-pegged stablecoin on Solana.'
  },

  // DeFi Tokens
  JUP: {
    name: 'Jupiter',
    symbol: 'JUP',
    address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    category: 'DeFi',
    description: 'A DEX aggregator with advanced trading features.'
  },
  RAY: {
    name: 'Raydium',
    symbol: 'RAY',
    address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    category: 'DeFi',
    description: 'A leading DEX and AMM integrated with Serum\'s order book.'
  },
  JLP: {
    name: 'Jupiter LP',
    symbol: 'JLP',
    address: '27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4',
    category: 'DeFi',
    description: 'Jupiter Liquidity Pool token.'
  },
  CIPHER: {
    name: 'Cipher',
    symbol: 'CIPHER',
    address: 'C1NajeuDuiZqchrbVM2TsbAtbcEKhwQECuD4ETknfd1f',
    category: 'DeFi',
    description: 'DeFi protocol token on Solana.'
  },
  SYS: {
    name: 'SYS',
    symbol: 'SYS',
    address: 'FKBRnWDqnzLUJxM8odGYMhqQygMEseY4NcsBgqekLn6W',
    category: 'DeFi',
    description: 'DeFi system token on Solana.'
  },

  // Staking Tokens
  MSOL: {
    name: 'Marinade Staked SOL',
    symbol: 'mSOL',
    address: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
    category: 'Staking',
    description: 'Liquid staking token from Marinade Finance.'
  },
  JITOSOL: {
    name: 'Jito Staked SOL',
    symbol: 'JitoSOL',
    address: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
    category: 'Staking',
    description: 'Liquid staking token from Jito Labs.'
  },

  // Meme Tokens
  FARTCOIN: {
    name: 'Fartcoin',
    symbol: 'FARTCOIN',
    address: '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbg',
    category: 'Meme',
    description: 'A memecoin on Solana.',
    pumpAddress: '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump'
  },
  BOOP: {
    name: 'Boop',
    symbol: 'BOOP',
    address: 'boopkpWqe68MSxLqBGogs8ZbUDN4GXaLhFwNP7mpP1i',
    category: 'Meme',
    description: 'A memecoin on Solana.'
  },
  TRUMP: {
    name: 'Trump Token',
    symbol: 'TRUMP',
    address: '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN',
    category: 'Meme',
    description: 'A Trump-themed memecoin.'
  },
  POPCAT: {
    name: 'Popcat',
    symbol: 'POPCAT',
    address: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
    category: 'Meme',
    description: 'A cat-themed memecoin.'
  },
  GORK: {
    name: 'Gork',
    symbol: 'GORK',
    address: '38PgzpJYu2HkiYvV8qePFakB8tuobPdGm2FFEn7D',
    category: 'Meme',
    description: 'A memecoin on Solana.',
    pumpAddress: '38PgzpJYu2HkiYvV8qePFakB8tuobPdGm2FFEn7Dpump'
  },
  ETRUMP: {
    name: 'ETrump',
    symbol: 'ETRUMP',
    address: '2U599wqfnj6E1tbGuMd1aGvSYrNLT8yoeZoFn64T',
    category: 'Meme',
    description: 'Another Trump-themed memecoin.',
    pumpAddress: '2U599wqfnj6E1tbGuMd1aGvSYrNLT8yoeZoFn64Tpump'
  },
  BETTY: {
    name: 'Betty',
    symbol: 'BETTY',
    address: '6N7CrWe6qNt27G4sHXcjQMMy6btKRb7i9n4RYkKboop',
    category: 'Meme',
    description: 'A memecoin on Solana.'
  },
  HOUSE: {
    name: 'House',
    symbol: 'HOUSE',
    address: 'DitHyRMQiSDhn5cnKMJV2CDDt6sVct96YrECiM49',
    category: 'Meme',
    description: 'A house-themed memecoin.',
    pumpAddress: 'DitHyRMQiSDhn5cnKMJV2CDDt6sVct96YrECiM49pump'
  },
  BEEP: {
    name: 'Beep',
    symbol: 'BEEP',
    address: '7GS48oeNiTpNkni4msFBBB44R3JdRArRYKyvTw5boop',
    category: 'Meme',
    description: 'A memecoin on Solana.'
  },
  HOSICO: {
    name: 'Hosico',
    symbol: 'HOSICO',
    address: '9wK8yN6iz1ie5kEJkvZCTxyN1x5sTdNfx8yeMY8Ebonk',
    category: 'Meme',
    description: 'A cat-themed memecoin.'
  },
  FUCKCOIN: {
    name: 'Fuckcoin',
    symbol: 'FUCKCOIN',
    address: 'Cz75ZtjwgZmr5J1VDBRTm5ZybZvEFR5DEdb8hEy59pWq',
    category: 'Meme',
    description: 'A memecoin on Solana.'
  },
  POOP: {
    name: 'Poop',
    symbol: 'POOP',
    address: '1QMoP7gFmBMJhN62C9uBErawfBgExdR65mJbCBeboop',
    category: 'Meme',
    description: 'A poop-themed memecoin.'
  },
  MEW: {
    name: 'Mew',
    symbol: 'MEW',
    address: 'MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5',
    category: 'Meme',
    description: 'A cat-themed memecoin.'
  },
  TROLL: {
    name: 'Troll',
    symbol: 'TROLL',
    address: '5UUH9RTDiSpq6HKS6bp4NdU9PNJpXRXuiw6ShBTBhgH2',
    category: 'Meme',
    description: 'A troll-themed memecoin.'
  },
  NEET: {
    name: 'NotInEmploymentEducationTraining',
    symbol: 'NEET',
    address: 'Ce2gx9KGXJ6C9Mp5b5x1sn9Mg87JwEbrQby4Zqo3',
    category: 'Meme',
    description: 'A memecoin on Solana.',
    pumpAddress: 'Ce2gx9KGXJ6C9Mp5b5x1sn9Mg87JwEbrQby4Zqo3pump'
  },
  PENGU: {
    name: 'Pengu',
    symbol: 'PENGU',
    address: '2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv',
    category: 'Meme',
    description: 'A penguin-themed memecoin.'
  },
  BOOPA: {
    name: 'Boopa',
    symbol: 'BOOPA',
    address: 'JmMRbLcKgNCu17yHZDAn4strE5NjmWJ4pCeJ7s7boop',
    category: 'Meme',
    description: 'A memecoin on Solana.'
  },

  // Infrastructure Tokens
  AI16Z: {
    name: 'AI16Z',
    symbol: 'AI16Z',
    address: 'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC',
    category: 'Infrastructure',
    description: 'AI-focused infrastructure token.'
  },
  LFG: {
    name: 'LFG',
    symbol: 'LFG',
    address: '8hhRHZkoCwLojdSthxu3Ho5K2j4BZHnSZ93HZjd4Mxo6',
    category: 'Infrastructure',
    description: 'Infrastructure token on Solana.'
  },
  MTGA: {
    name: 'MTGA',
    symbol: 'MTGA',
    address: '2TJGNnPP26LzdSsFMUXDXohzfkDGiP1Y25yYW1FiCT5w',
    category: 'Infrastructure',
    description: 'Infrastructure token on Solana.'
  },
  SOLDA: {
    name: 'Solda',
    symbol: 'SOLDA',
    address: 'A4LGQjgLomHTvmEswxgn8N4zVBTpUqTTdCMHpzqNSfyz',
    category: 'Infrastructure',
    description: 'Infrastructure token for Solana development.'
  },
  LYRA: {
    name: 'Lyra',
    symbol: 'LYRA',
    address: '47MP6mzg1mkWawZcyPbXtLiikwcSvAqYMKukxRHvBbm5',
    category: 'Infrastructure',
    description: 'Infrastructure token on Solana.'
  },
  GUARNET: {
    name: 'Guarnet',
    symbol: 'GUARNET',
    address: '97uXZdavSESAgt4BmEPhqkBjetFKQM3yKE5n6FQLSubX',
    category: 'Infrastructure',
    description: 'Infrastructure security token.'
  }
};

// Helper function to get token info by address
export const getTokenByAddress = (address: string): TokenInfo | undefined => {
  // First check for exact match
  const directMatch = Object.values(TOKENS).find(token => 
    token.address.toLowerCase() === address.toLowerCase() || 
    token.pumpAddress?.toLowerCase() === address.toLowerCase()
  );
  
  if (directMatch) return directMatch;
  
  // Check if it's a token with pump suffix
  const pumpSuffixRegex = /^([1-9A-HJ-NP-Za-km-z]{32,44})pump$/i;
  const pumpMatch = address.match(pumpSuffixRegex);
  
  if (pumpMatch) {
    const baseAddress = pumpMatch[1];
    return Object.values(TOKENS).find(token => token.address.toLowerCase() === baseAddress.toLowerCase());
  }
  
  return undefined;
};

// Helper function to get token info by symbol
export const getTokenBySymbol = (symbol: string): TokenInfo | undefined => {
  return TOKENS[symbol.toUpperCase()];
};

// Get all tokens by category
export const getTokensByCategory = (category: TokenInfo['category']): TokenInfo[] => {
  return Object.values(TOKENS).filter(token => token.category === category);
};

// Get token info for address with or without pump suffix
export const getTokenWithPump = (address: string): TokenInfo | undefined => {
  // First try direct match
  const token = getTokenByAddress(address);
  if (token) return token;
  
  // Check if it's a pump address variant
  const pumpRegex = /^([1-9A-HJ-NP-Za-km-z]{32,44})pump$/i;
  const match = address.match(pumpRegex);
  
  if (match) {
    const baseAddress = match[1];
    const baseToken = getTokenByAddress(baseAddress);
    if (baseToken) return baseToken;
  }
  
  return undefined;
};
