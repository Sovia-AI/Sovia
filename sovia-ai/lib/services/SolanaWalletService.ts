import { 
  Connection, 
  PublicKey, 
  Transaction, 
  TransactionInstruction,
  LAMPORTS_PER_SOL, 
  TokenAccountsFilter 
} from '@solana/web3.js';
import { 
  getOrCreateAssociatedTokenAccount,
  getAccount, 
  getMint,
  TOKEN_PROGRAM_ID 
} from '@solana/spl-token';
import { toast } from 'sonner';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection } from '@solana/wallet-adapter-react';
import { withRpcErrorHandling, withRetry } from '@/lib/utils/rpcErrorHandler';

// Real wallet service that interacts with actual Solana blockchain
export class SolanaWalletService {
  private connection: Connection;
  private endpoint: string;
  
  constructor(endpoint?: string) {
    this.endpoint = endpoint || 'https://api.mainnet-beta.solana.com';
    this.connection = new Connection(this.endpoint, {
      commitment: 'confirmed',
      disableRetryOnRateLimit: false,
      confirmTransactionInitialTimeout: 60000 // 60 seconds
    });
  }

  /**
   * Set new RPC endpoint
   */
  public setEndpoint(endpoint: string): void {
    this.endpoint = endpoint;
    this.connection = new Connection(endpoint, {
      commitment: 'confirmed',
      disableRetryOnRateLimit: false
    });
    console.log(`RPC endpoint set to: ${endpoint}`);
  }

  /**
   * Get current connection
   */
  public getConnection(): Connection {
    return this.connection;
  }

  /**
   * Send a transaction using the provided signer with improved error handling
   */
  public async sendTransaction(
    transaction: Transaction,
    signers: any[],
    options: any = {}
  ): Promise<string> {
    try {
      transaction.recentBlockhash = (
        await this.connection.getRecentBlockhash('confirmed')
      ).blockhash;
      
      transaction.feePayer = signers[0].publicKey;
      
      // Sign the transaction
      if (signers.length > 0) {
        transaction.sign(...signers);
      }
      
      // Send the transaction with retry
      const signature = await withRetry(async () => {
        return await this.connection.sendRawTransaction(
          transaction.serialize(),
          {
            skipPreflight: false,
            preflightCommitment: 'confirmed',
            maxRetries: 5,
            ...options
          }
        );
      }, 3);

      // Wait for confirmation with retry
      const confirmation = await withRetry(async () => {
        return await this.connection.confirmTransaction(
          signature,
          'confirmed'
        );
      }, 3);

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`);
      }

      return signature;
    } catch (error) {
      console.error("Error sending transaction:", error);
      throw error;
    }
  }

  /**
   * Get SOL balance for a wallet with RPC error handling
   */
  public async getSolBalance(walletAddress: string): Promise<number> {
    return withRpcErrorHandling(async () => {
      try {
        const publicKey = new PublicKey(walletAddress);
        const balance = await this.connection.getBalance(publicKey);
        return balance / LAMPORTS_PER_SOL;
      } catch (error) {
        console.error("Error getting SOL balance:", error);
        throw error;
      }
    })();
  }

  /**
   * Get all token accounts for a wallet with RPC error handling
   */
  public async getTokenAccounts(walletAddress: string): Promise<any[]> {
    return withRpcErrorHandling(async () => {
      try {
        const publicKey = new PublicKey(walletAddress);
        const filter: TokenAccountsFilter = {
          programId: TOKEN_PROGRAM_ID
        };

        const { value: tokenAccounts } = await this.connection.getTokenAccountsByOwner(
          publicKey,
          filter
        );

        const parsedAccounts = await Promise.all(
          tokenAccounts.map(async (tokenAccount) => {
            try {
              const accountInfo = await getAccount(
                this.connection, 
                tokenAccount.pubkey
              );

              let tokenInfo = {};
              try {
                const mintInfo = await getMint(
                  this.connection,
                  accountInfo.mint
                );

                tokenInfo = {
                  mint: accountInfo.mint.toString(),
                  amount: Number(accountInfo.amount) / Math.pow(10, mintInfo.decimals),
                  decimals: mintInfo.decimals
                };
              } catch (e) {
                console.warn(`Could not fetch mint info for ${accountInfo.mint.toString()}`, e);
                tokenInfo = {
                  mint: accountInfo.mint.toString(),
                  amount: Number(accountInfo.amount),
                  decimals: 0
                };
              }

              return tokenInfo;
            } catch (e) {
              console.warn(`Error processing token account ${tokenAccount.pubkey.toString()}`, e);
              return null;
            }
          })
        );

        return parsedAccounts.filter(Boolean);
      } catch (error) {
        console.error("Error getting token accounts:", error);
        throw error;
      }
    })();
  }

  /**
   * Process wallet command with actual wallet functionality
   */
  public processWalletCommand(command: string, params?: string): string {
    // For command processing, we rely on the React hooks
    // These will be used in the UI components
    return `
## Wallet Commands

Available wallet commands:
- \`/wallet connect\` - Connect your wallet (Phantom, Solflare, etc.)
- \`/wallet balance\` - Check your wallet balance
- \`/wallet disconnect\` - Disconnect your wallet

Use the wallet buttons in the UI to perform these actions with your actual Solana wallet.
    `;
  }
}

// React hooks for using the wallet in components with improved caching and error handling
export function useWalletBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const fetchBalance = async () => {
    if (!publicKey) {
      throw new WalletNotConnectedError();
    }

    return withRpcErrorHandling(async () => {
      try {
        const balance = await connection.getBalance(publicKey);
        return balance / LAMPORTS_PER_SOL;
      } catch (error) {
        console.error("Error fetching balance:", error);
        throw error;
      }
    })();
  };

  return { fetchBalance };
}

export function useTokenAccounts() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const fetchTokenAccounts = withRpcErrorHandling(async () => {
    if (!publicKey) {
      throw new WalletNotConnectedError();
    }

    try {
      const filter: TokenAccountsFilter = {
        programId: TOKEN_PROGRAM_ID
      };

      const { value: tokenAccounts } = await connection.getTokenAccountsByOwner(
        publicKey,
        filter
      );

      const parsedAccounts = await Promise.all(
        tokenAccounts.map(async (tokenAccount) => {
          try {
            const accountInfo = await getAccount(
              connection, 
              tokenAccount.pubkey
            );

            try {
              const mintInfo = await getMint(
                connection,
                accountInfo.mint
              );

              return {
                mint: accountInfo.mint.toString(),
                amount: Number(accountInfo.amount) / Math.pow(10, mintInfo.decimals),
                decimals: mintInfo.decimals,
                pubkey: tokenAccount.pubkey.toString()
              };
            } catch (e) {
              console.warn(`Could not fetch mint info for ${accountInfo.mint.toString()}`, e);
              return {
                mint: accountInfo.mint.toString(),
                amount: Number(accountInfo.amount),
                decimals: 0,
                pubkey: tokenAccount.pubkey.toString()
              };
            }
          } catch (e) {
            console.warn(`Error processing token account ${tokenAccount.pubkey.toString()}`, e);
            return null;
          }
        })
      );

      return parsedAccounts.filter(Boolean);
    } catch (error) {
      console.error("Error getting token accounts:", error);
      throw error;
    }
  });

  return { fetchTokenAccounts };
}
