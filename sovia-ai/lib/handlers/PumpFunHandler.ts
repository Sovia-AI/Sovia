import { PumpFunService } from "@/lib/services/PumpFunService";
import { PublicKey } from '@solana/web3.js';
import { toast } from "sonner";

export class PumpFunHandler {
  private pumpFunService: PumpFunService;

  constructor(pumpFunService: PumpFunService) {
    this.pumpFunService = pumpFunService;
  }

  /**
   * Handle PumpFun-related commands
   */
  async handlePumpFunCommand(command: string, params: string): Promise<string> {
    try {
      console.log(`Processing PumpFun command: ${command} with params: ${params}`);
      
      switch (command) {
        case 'create':
          return this.handleCreateCommand(params);
        case 'swap':
          return this.handleSwapCommand(params);
        case 'buy':
          return this.handleBuyCommand(params);
        case 'sell':
          return this.handleSellCommand(params);
        case 'info':
          return this.handleInfoCommand(params);
        default:
          // If no specific command, treat as general query
          return this.pumpFunService.handleQuery(params || "pumpfun information");
      }
    } catch (error) {
      console.error('Error processing PumpFun command:', error);
      return `Sorry, I encountered an error processing your PumpFun request: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`;
    }
  }

  /**
   * Handle token creation command
   */
  private async handleCreateCommand(params: string): Promise<string> {
    if (!params) {
      return `
## PumpFun Token Creation

To create a token, use the format:
\`/pumpfun create [NAME] [SYMBOL] [optional: image URL]\`

For example:
\`/pumpfun create My Awesome Token MAT\`

This will generate a new token with a bonding curve for instant trading.

**Note: You need to connect your wallet first to create a token.**
      `;
    }

    try {
      // Parse the parameters
      const parts = params.split(' ');
      
      // Need at least name and symbol
      if (parts.length < 2) {
        return "Please provide both a NAME and SYMBOL for your token.";
      }
      
      // Extract name and symbol
      // Last part is the symbol, everything before is the name
      const symbol = parts[parts.length - 1];
      const name = parts.slice(0, parts.length - 1).join(' ');
      
      // Use a default URI
      const uri = "https://arweave.net/defaultTokenMetadata";
      
      return `
## Token Creation

To create the token "${name}" (${symbol}), you need to:

1. Connect your wallet using the wallet button
2. The creation will require a small amount of SOL (~0.05 SOL) to pay for:
   - Mint account creation
   - Metadata account
   - Bonding curve initialization

Once created, your token will immediately be tradeable through the bonding curve.

Would you like to proceed with creating this token?
      `;
    } catch (error) {
      console.error("Error in handleCreateCommand:", error);
      return `Error creating token: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Handle swap command
   */
  private async handleSwapCommand(params: string): Promise<string> {
    if (!params) {
      return `
## PumpFun Swap

To swap tokens, use the format:
\`/pumpfun swap [AMOUNT] [FROM_TOKEN] to [TO_TOKEN]\`

For example:
\`/pumpfun swap 1 SOL to BONK\`
\`/pumpfun swap 10000 BONK to SOL\`

Popular tokens: SOL, BONK, NEET, HOUSE, GORK

**Note: You need to connect your wallet first to perform swaps.**
      `;
    }

    try {
      // Parse swap parameters with regex
      const swapRegex = /(\d+\.?\d*)\s+(\w+)\s+to\s+(\w+)/i;
      const match = params.match(swapRegex);
      
      if (!match) {
        return "Please use the format: `/pumpfun swap [AMOUNT] [FROM_TOKEN] to [TO_TOKEN]`";
      }
      
      const [, amountStr, fromToken, toToken] = match;
      const amount = parseFloat(amountStr);
      
      if (isNaN(amount) || amount <= 0) {
        return "Please provide a valid positive amount.";
      }
      
      // Determine swap direction
      const direction = fromToken.toUpperCase() === 'SOL' ? 'quoteToBase' : 'baseToQuote';
      
      return `
## PumpFun Swap

To swap ${amount} ${fromToken.toUpperCase()} to ${toToken.toUpperCase()}:

1. Connect your wallet using the wallet button
2. Confirm the swap details:
   - You'll pay: ${amount} ${fromToken.toUpperCase()}
   - Slippage tolerance: ${this.pumpFunService.getSlippageTolerance()}%
   - Fee: ~0.25% (PumpSwap standard fee)

Please connect your wallet to proceed with this swap.
      `;
    } catch (error) {
      console.error("Error in handleSwapCommand:", error);
      return `Error processing swap: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Handle buy command (bonding curve)
   */
  private async handleBuyCommand(params: string): Promise<string> {
    if (!params) {
      return `
## Buy from PumpFun Bonding Curve

To buy tokens from a bonding curve, use the format:
\`/pumpfun buy [AMOUNT] [TOKEN]\`

For example:
\`/pumpfun buy 10000 BONK\`

This will buy tokens directly from the bonding curve.

**Note: You need to connect your wallet first to buy tokens.**
      `;
    }

    try {
      // Parse parameters
      const buyRegex = /(\d+\.?\d*)\s+(\w+)/i;
      const match = params.match(buyRegex);
      
      if (!match) {
        return "Please use the format: `/pumpfun buy [AMOUNT] [TOKEN]`";
      }
      
      const [, amountStr, token] = match;
      const amount = parseFloat(amountStr);
      
      if (isNaN(amount) || amount <= 0) {
        return "Please provide a valid positive amount.";
      }
      
      return `
## Bonding Curve Buy

To buy ${amount} ${token.toUpperCase()}:

1. Connect your wallet using the wallet button
2. The purchase will use the bonding curve formula:
   - As more tokens are bought, the price increases
   - Fee: 1% (standard bonding curve fee)

Please connect your wallet to proceed with this purchase.
      `;
    } catch (error) {
      console.error("Error in handleBuyCommand:", error);
      return `Error processing buy request: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Handle sell command (bonding curve)
   */
  private async handleSellCommand(params: string): Promise<string> {
    if (!params) {
      return `
## Sell to PumpFun Bonding Curve

To sell tokens to a bonding curve, use the format:
\`/pumpfun sell [AMOUNT] [TOKEN]\`

For example:
\`/pumpfun sell 10000 BONK\`

This will sell tokens directly to the bonding curve.

**Note: You need to connect your wallet first to sell tokens.**
      `;
    }

    try {
      // Parse parameters
      const sellRegex = /(\d+\.?\d*)\s+(\w+)/i;
      const match = params.match(sellRegex);
      
      if (!match) {
        return "Please use the format: `/pumpfun sell [AMOUNT] [TOKEN]`";
      }
      
      const [, amountStr, token] = match;
      const amount = parseFloat(amountStr);
      
      if (isNaN(amount) || amount <= 0) {
        return "Please provide a valid positive amount.";
      }
      
      return `
## Bonding Curve Sell

To sell ${amount} ${token.toUpperCase()}:

1. Connect your wallet using the wallet button
2. The sale will use the bonding curve formula:
   - As more tokens are sold, the price decreases
   - Fee: 1% (standard bonding curve fee)

Please connect your wallet to proceed with this sale.
      `;
    } catch (error) {
      console.error("Error in handleSellCommand:", error);
      return `Error processing sell request: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Handle info command
   */
  private async handleInfoCommand(params: string): Promise<string> {
    // If token is specified, return token info
    if (params) {
      const token = params.trim();
      return this.getTokenInfo(token);
    }
    
    // Otherwise return general PumpFun info
    return this.pumpFunService.handleQuery("pumpfun information");
  }

  /**
   * Get information about a specific token
   */
  private async getTokenInfo(token: string): Promise<string> {
    try {
      const tokenUpper = token.toUpperCase();
      
      // Try to parse as public key
      let mintAddress: string | null = null;
      try {
        const pubkey = new PublicKey(token);
        mintAddress = pubkey.toString();
      } catch {
        // Not a public key, treat as symbol
        
        // Known tokens mapping
        const knownTokens: Record<string, string> = {
          'BONK': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
          'NEET': 'Ce2gx9KGXJ6C9Mp5b5x1sn9Mg87JwEbrQby4Zqo3',
          'HOUSE': 'DitHyRMQiSDhn5cnKMJV2CDDt6sVct96YrECiM49',
          'GORK': '38PgzpJYu2HkiYvV8qePFakB8tuobPdGm2FFEn7D',
          'SOL': 'So11111111111111111111111111111111111111112'
        };
        
        mintAddress = knownTokens[tokenUpper] || null;
      }
      
      if (!mintAddress) {
        return `
## ${tokenUpper} Information

I don't have specific information about ${tokenUpper}. 

Popular PumpFun tokens include: BONK, NEET, HOUSE, GORK.

Try one of these or ask for general PumpFun information.
        `;
      }
      
      // For known tokens, return info
      if (tokenUpper === 'BONK') {
        return `
## Bonk (BONK)

- **Current price:** ~$0.000028
- **Market cap:** ~$156,000,000
- **Holders:** 423,000+
- **Mint address:** DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
- **Trading via:** PumpSwap AMM
- **Migrated from bonding curve:** Yes

You can swap on PumpSwap by using:
\`/pumpfun swap [AMOUNT] BONK\`
        `;
      } else if (tokenUpper === 'NEET') {
        return `
## NotInEmploymentEducationTraining (NEET)

- **Current price:** ~$0.0032
- **Market cap:** ~$3,200,000
- **Holders:** 12,500+
- **Mint address:** Ce2gx9KGXJ6C9Mp5b5x1sn9Mg87JwEbrQby4Zqo3
- **Trading via:** PumpSwap AMM
- **Migrated from bonding curve:** Yes

You can swap on PumpSwap by using:
\`/pumpfun swap [AMOUNT] NEET\`
        `;
      } else {
        return `
## ${tokenUpper} Information

- **Mint address:** ${mintAddress}
- **To get full information:** Connect your wallet to see real-time data

To trade this token:
\`/pumpfun swap [AMOUNT] ${tokenUpper} to SOL\` or
\`/pumpfun swap [AMOUNT] SOL to ${tokenUpper}\`
        `;
      }
    } catch (error) {
      console.error("Error in getTokenInfo:", error);
      return `Error retrieving token information: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Check if a message includes PumpFun-related keywords
   */
  static matchesPumpFunPatterns(message: string): boolean {
    const lowerMsg = message.toLowerCase();
    
    const patterns = [
      /\bpump(fun)?\b/,
      /\bbonding curve\b/,
      /\bpumpswap\b/,
      /\bcreate token\b/,
      /\bmake.*token\b/,
      /\bpump.*token\b/,
      /\bpump.*swap\b/,
      /\bswap.*pump\b/,
    ];
    
    return patterns.some(pattern => pattern.test(lowerMsg));
  }
}
