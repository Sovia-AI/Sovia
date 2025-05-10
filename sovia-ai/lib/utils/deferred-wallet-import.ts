
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter
} from '@solana/wallet-adapter-wallets';

import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack';

let walletsInitialized = false;
let walletAdapters: any[] = [];

/**
 * Get wallet adapters only when crypto objects are guaranteed to be available
 */
export const getWalletAdapters = () => {
  if (!walletsInitialized) {
    // Verify critical crypto objects exist before creating adapters
    const requiredObjects = ['qC', 'VC', 'HC', 'UC', 'uk'];
    const missing = requiredObjects.filter(
      name => !window[name] || typeof window[name].alloc !== 'function'
    );
    
    if (missing.length > 0) {
      console.error(`Cannot initialize wallets, missing crypto objects: ${missing.join(', ')}`);
      // Return empty array to prevent crashes, but log the error
      return [];
    }
    
    // Initialize wallet adapters only if all crypto objects are available
    try {
      console.debug('Initializing wallet adapters');
      walletAdapters = [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
        new BackpackWalletAdapter()
      ];
      walletsInitialized = true;
      console.debug('Wallet adapters initialized successfully');
    } catch (err) {
      console.error('Failed to initialize wallet adapters:', err);
      return [];
    }
  }
  
  return walletAdapters;
};
