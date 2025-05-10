
// Define types for global objects that may not have TypeScript definitions

declare global {
  interface Window {
    Buffer: typeof Buffer;
    global: Window;
    process: {
      env: Record<string, string>;
    } & Partial<NodeJS.Process>;
    [key: string]: any; // Allow for dynamic crypto objects
    __recoverCryptoObjects?: (force: boolean) => boolean;
    __cryptoGuard?: {
      recoveryAttempts: number;
      lastRecovery: number;
      knownGoodReferences: Record<string, any>;
    };
  }
  
  // Crypto object type for polyfill functionality
  interface CryptoObject {
    from: (data: any) => Uint8Array;
    alloc: (size: number) => Uint8Array;
    decode?: (data: any) => Uint8Array;
    byteLength?: (data: any) => number;
    o?: (data: any) => Uint8Array; // Add 'o' property explicitly
    [key: string]: any; // Other potential methods
  }

  // Extend the BufferConstructor interface to include the 'o' method
  interface BufferConstructor {
    o?: (data: any) => Buffer;
  }
}

export type CryptoObject = {
  from: (data: any) => Uint8Array;
  alloc: (size: number) => Uint8Array;
  decode?: (data: any) => Uint8Array;
  byteLength?: (data: any) => number;
  o?: (data: any) => Uint8Array; // Add 'o' property explicitly
  [key: string]: any; // Other potential methods
};

// Augment window interface to allow Buffer assignment
interface Window {
  Buffer: typeof Buffer;
  global: Window;
  process: {
    env: Record<string, string>;
  } & Partial<NodeJS.Process>;
  [key: string]: any;
}

// Export an empty object to make this a module
export {};
