
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { parseWalletSendCommand, parseWalletSwapCommand } from '../utils/WalletCommandParser';
import { PublicKey } from '@solana/web3.js';

export class WalletCommandHandler {
  /**
   * Handle wallet send command
   */
  public async handleSendCommand(params: string): Promise<{ 
    response: string;
    specialType?: string;
    specialData?: Record<string, any>;
  }> {
    if (!params) {
      return {
        response: "Please provide amount, token and recipient address. For example: `/wallet send 0.1 SOL to ADDRESS`"
      };
    }
    
    const { amount, token, recipient } = parseWalletSendCommand(params);
    
    if (!amount || !token || !recipient) {
      return {
        response: `
## Wallet Send

To send tokens, use the format:
\`/wallet send [amount] [token] to [address]\`

Example:
\`/wallet send 0.1 SOL to 5YNmS1R9nNSCDzb5a7mMJ1dwK9uHeAAF4CmPEwKgVWr8\`

Supported tokens: SOL, USDC, BONK
        `
      };
    }
    
    // Validate recipient address
    try {
      new PublicKey(recipient);
    } catch (error) {
      return {
        response: `Invalid recipient address. Please provide a valid Solana address.`
      };
    }
    
    // Return success with special message type
    return {
      response: "Loading send form...",
      specialType: "wallet-send",
      specialData: {
        amount,
        token,
        address: recipient
      }
    };
  }
  
  /**
   * Handle wallet swap command
   */
  public async handleSwapCommand(params: string): Promise<{ 
    response: string;
    specialType?: string;
    specialData?: Record<string, any>;
  }> {
    if (!params) {
      return {
        response: "Please provide amount, from token and to token. For example: `/wallet swap 0.1 SOL to USDC`"
      };
    }
    
    const { amount, fromToken, toToken } = parseWalletSwapCommand(params);
    
    if (!amount || !fromToken || !toToken) {
      return {
        response: `
## Wallet Swap

To swap tokens, use the format:
\`/wallet swap [amount] [from_token] to [to_token]\`

Example:
\`/wallet swap 0.1 SOL to USDC\`

Supported tokens: SOL, USDC, BONK
        `
      };
    }
    
    // Return success with special message type
    return {
      response: "Loading swap form...",
      specialType: "wallet-swap",
      specialData: {
        amount,
        inputToken: fromToken,
        outputToken: toToken
      }
    };
  }
  
  /**
   * Process wallet commands
   */
  public async processWalletCommand(command: string, params?: string): Promise<{ 
    response: string;
    specialType?: string;
    specialData?: Record<string, any>;
  }> {
    if (!command) {
      return this.getDefaultWalletHelp();
    }
    
    switch (command.toLowerCase()) {
      case 'send':
        return this.handleSendCommand(params || '');
      case 'swap':
        return this.handleSwapCommand(params || '');
      default:
        return this.getDefaultWalletHelp();
    }
  }
  
  private getDefaultWalletHelp(): { response: string } {
    return {
      response: `
## Wallet Commands

Available wallet commands:
- \`/wallet connect\` - Connect your wallet
- \`/wallet balance\` - Check your wallet balance
- \`/wallet send [amount] [token] to [address]\` - Send tokens to an address
- \`/wallet swap [amount] [from_token] to [to_token]\` - Swap tokens
- \`/wallet disconnect\` - Disconnect your wallet

For example:
\`/wallet send 0.1 SOL to ADDRESS\`
\`/wallet swap 0.5 SOL to USDC\`
      `
    };
  }
}
