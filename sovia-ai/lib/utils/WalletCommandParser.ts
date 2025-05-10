
/**
 * Parse wallet send command parameters
 */
export function parseWalletSendCommand(input: string): { 
  amount: string | null;
  token: string | null;
  recipient: string | null;
} {
  if (!input) return { amount: null, token: null, recipient: null };
  
  // Clean and normalize the input
  const cleanInput = input.trim().toLowerCase();
  
  // Regular expression to match the pattern:
  // send 0.1 SOL to address
  const sendRegex = /(?:send|transfer|pay)\s+([0-9.]+)\s*(SOL|USDC|BONK|[a-zA-Z0-9]{30,})\s+(?:to|toward|towards)\s+([a-zA-Z0-9]{32,})/i;
  const match = cleanInput.match(sendRegex);
  
  if (match) {
    const amount = match[1];
    let token = match[2].toUpperCase();
    const recipient = match[3];
    
    // Handle token mint addresses
    if (token.length > 10) {
      // If the second part looks like a mint address, check for known tokens
      const knownTokens: Record<string, string> = {
        'So11111111111111111111111111111111111111112': 'SOL',
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
        'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'BONK',
      };
      
      token = knownTokens[token] || token;
    }
    
    return { amount, token, recipient };
  }
  
  // Alternative format: send 0.1 SOL address
  const altSendRegex = /(?:send|transfer|pay)\s+([0-9.]+)\s*(SOL|USDC|BONK)\s+([a-zA-Z0-9]{32,})/i;
  const altMatch = cleanInput.match(altSendRegex);
  
  if (altMatch) {
    return {
      amount: altMatch[1],
      token: altMatch[2].toUpperCase(),
      recipient: altMatch[3]
    };
  }
  
  return { amount: null, token: null, recipient: null };
}

/**
 * Parse wallet swap command parameters
 */
export function parseWalletSwapCommand(input: string): { 
  amount: string | null;
  fromToken: string | null;
  toToken: string | null;
} {
  if (!input) return { amount: null, fromToken: null, toToken: null };
  
  // Clean and normalize the input
  const cleanInput = input.trim().toLowerCase();
  
  // Regular expression to match the pattern:
  // swap 0.1 SOL to USDC
  const swapRegex = /(?:swap|exchange|convert)\s+([0-9.]+)\s*(SOL|USDC|BONK|[a-zA-Z0-9]{30,})\s+(?:to|for|into)\s+(SOL|USDC|BONK|[a-zA-Z0-9]{30,})/i;
  const match = cleanInput.match(swapRegex);
  
  if (match) {
    const amount = match[1];
    let fromToken = match[2].toUpperCase();
    let toToken = match[3].toUpperCase();
    
    // Handle token mint addresses
    const knownTokens: Record<string, string> = {
      'So11111111111111111111111111111111111111112': 'SOL',
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'BONK',
    };
    
    if (fromToken.length > 10) {
      fromToken = knownTokens[fromToken] || fromToken;
    }
    
    if (toToken.length > 10) {
      toToken = knownTokens[toToken] || toToken;
    }
    
    return { amount, fromToken, toToken };
  }
  
  return { amount: null, fromToken: null, toToken: null };
}
