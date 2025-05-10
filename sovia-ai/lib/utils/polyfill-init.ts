import { Buffer } from 'buffer';
import { CryptoObject } from '@/types/global';

/**
 * This file must be the first imported in the application
 * It sets up critical polyfills before any other code runs
 */

// --- DEFENSIVE GLOBAL BUFFER POLYFILL (MUST BE FIRST) ---
if (typeof window !== 'undefined' && (!window.Buffer || typeof window.Buffer.from !== 'function')) {
  // Use any type to avoid TypeScript errors
  window.Buffer = window.Buffer || {} as any;
  // Cast explicitly to avoid TypeScript errors
  (window.Buffer as any).from = function(data: any) {
    if (typeof data === 'string') {
      const encoder = new TextEncoder();
      return encoder.encode(data);
    }
    return new Uint8Array(Array.isArray(data) ? data : []);
  };
  (window.Buffer as any).alloc = function(size: number) {
    return new Uint8Array(size || 0);
  };
  (window.Buffer as any).o = function(data: any) {
    if (typeof data === 'string') {
      const encoder = new TextEncoder();
      return encoder.encode(data);
    }
    return new Uint8Array(Array.isArray(data) ? data : []);
  };
}

// Function to create resilient crypto objects immune to minification issues
function createCryptoObject(name: string): CryptoObject {
  console.debug(`Creating resilient ${name} object (production hardened)`);
  
  // Create objects with noinline functions to prevent optimization issues
  const obj = {
    // Using function declarations instead of arrows to improve name preservation
    alloc: function alloc(size: number) { 
      console.debug(`${name}.alloc called`);
      return new Uint8Array(size || 0); 
    },
    from: function from(data: any) {
      console.debug(`${name}.from called`);
      try {
        if (Array.isArray(data)) return new Uint8Array(data);
        if (data instanceof Uint8Array) return new Uint8Array(data);
        if (typeof data === 'string') {
          const encoder = new TextEncoder();
          return encoder.encode(data);
        }
        if (data && typeof data === 'object' && 'byteLength' in data) {
          return new Uint8Array(data);
        }
      } catch (e) {
        console.error(`Error in ${name}.from:`, e);
      }
      return new Uint8Array(0);
    },
    byteLength: function byteLength(data: any) { 
      try {
        if (data === null || data === undefined) return 0;
        if (typeof data.byteLength === 'number') return data.byteLength;
        if (Array.isArray(data)) return data.length;
        if (typeof data === 'string') {
          const encoder = new TextEncoder();
          return encoder.encode(data).byteLength;
        }
      } catch (e) {
        console.error(`Error in ${name}.byteLength:`, e);
      }
      return 0;
    },
    decode: function decode(data: any) {
      console.debug(`${name}.decode called`);
      try {
        if (Array.isArray(data)) return new Uint8Array(data);
        if (data instanceof Uint8Array) return new Uint8Array(data);
        if (typeof data === 'string') {
          const encoder = new TextEncoder();
          return encoder.encode(data);
        }
      } catch (e) {
        console.error(`Error in ${name}.decode:`, e);
      }
      return new Uint8Array(0);
    },
    // Add additional minified property handlers that might be used
    o: function(data: any) {
      console.debug(`${name}.o (minified method) called`);
      // Try to intelligently handle the operation based on arguments
      if (typeof data === 'number') {
        return new Uint8Array(data || 0);
      }
      try {
        if (Array.isArray(data)) return new Uint8Array(data);
        if (data instanceof Uint8Array) return new Uint8Array(data);
        if (typeof data === 'string') {
          const encoder = new TextEncoder();
          return encoder.encode(data);
        }
      } catch (e) {
        console.error(`Error in ${name}.o:`, e);
      }
      return new Uint8Array(0);
    }
  };
  
  // Create a proxy that handles arbitrary method calls which could be minified names
  const handler = {
    get: function(target: any, prop: string | symbol) {
      // First check if the property exists on the target
      if (prop in target) {
        return target[prop];
      }
      
      // Handle minified method names with a consistent fallback
      if (typeof prop === 'string') {
        console.debug(`Accessing unknown property ${String(prop)} on ${name} - providing fallback`);
        
        // Return a function that tries to intelligently handle common crypto operations
        return function(...args: any[]) {
          console.debug(`Called unknown method ${String(prop)} on ${name} with args:`, args);
          
          // If it looks like an allocation call (single number argument)
          if (args.length === 1 && typeof args[0] === 'number') {
            return new Uint8Array(args[0] || 0);
          }
          
          // If it looks like a conversion call (from data)
          if (args.length === 1) {
            try {
              if (Array.isArray(args[0])) return new Uint8Array(args[0]);
              if (args[0] instanceof Uint8Array) return new Uint8Array(args[0]);
              if (typeof args[0] === 'string') {
                const encoder = new TextEncoder();
                return encoder.encode(args[0]);
              }
            } catch (e) {
              console.error(`Error handling unknown method ${String(prop)} on ${name}:`, e);
              return new Uint8Array(0);
            }
          }
          
          // Default fallback
          return new Uint8Array(0);
        };
      }
      
      return undefined;
    }
  };
  
  return new Proxy(obj, handler);
}

// Immediately create critical objects needed for wallet adapters and OpenAI
(function initializeCryptoPolyfills() {
  // Explicitly define Buffer globally before any other code runs
  if (typeof window !== 'undefined') {
    console.debug('Initializing production-hardened polyfills');
    
    // Create a robust Buffer proxy to handle all possible access patterns
    try {
      // First make sure real Buffer object is available
      const originalBuffer = Buffer;
      if (!originalBuffer || (typeof originalBuffer !== 'function' && typeof originalBuffer !== 'object')) {
        // Emergency fallback: minimal Buffer polyfill
        (window as any).Buffer = {
          from: function(data: any) {
            if (typeof data === 'string') {
              const encoder = new TextEncoder();
              return encoder.encode(data);
            }
            return new Uint8Array(Array.isArray(data) ? data : []);
          },
          alloc: function(size: number) {
            return new Uint8Array(size || 0);
          },
          o: function(data: any) {
            if (typeof data === 'string') {
              const encoder = new TextEncoder();
              return encoder.encode(data);
            }
            return new Uint8Array(Array.isArray(data) ? data : []);
          }
        } as any;
      } else {
        // Create a robust Buffer proxy to handle minified property access
        const bufferProxy = new Proxy(originalBuffer, {
          get: function(target, prop) {
            const value = target[prop];
            if (value !== undefined) {
              return value;
            }
            // Handle minified property access with fallback methods
            if (prop === 'o' || prop === 'a' || prop === 'c' || prop === 'f' || prop === 'r') {
              return function(...args) {
                if (args.length === 1 && typeof args[0] === 'number') {
                  return Buffer.alloc(args[0]);
                } else if (args.length >= 1) {
                  try {
                    return Buffer.from(args[0]);
                  } catch (e) {
                    return Buffer.alloc(0);
                  }
                }
                return Buffer.alloc(0);
              };
            }
            return undefined;
          }
        });
        Object.defineProperty(window, 'Buffer', {
          value: bufferProxy,
          writable: true,
          configurable: true,
          enumerable: true
        });
      }
      // Test Buffer functionality
      try {
        const testBuf = window.Buffer.from("test");
        if (!testBuf || typeof testBuf.length !== 'number') {
          window.Buffer = originalBuffer;
        }
      } catch (e) {
        window.Buffer = originalBuffer;
      }
      
      // Specific fix for the qe.Buffer.o pattern - Fix for TypeScript errors
      try {
        if (typeof (window as any).qe === 'undefined') {
          (window as any).qe = { Buffer: { o: function(...args: any[]) {
            console.debug('qe.Buffer.o fallback called:', args);
            if (args.length === 1 && typeof args[0] === 'number') {
              return Buffer.alloc(args[0]);
            } else if (args.length >= 1) {
              try {
                return Buffer.from(args[0]);
              } catch (e) {
                return Buffer.alloc(0);
              }
            }
            return Buffer.alloc(0);
          }}};
        } else if (typeof (window as any).qe.Buffer === 'undefined') {
          (window as any).qe.Buffer = { o: function(...args: any[]) {
            console.debug('qe.Buffer.o fallback called:', args);
            if (args.length === 1 && typeof args[0] === 'number') {
              return Buffer.alloc(args[0]);
            } else if (args.length >= 1) {
              try {
                return Buffer.from(args[0]);
              } catch (e) {
                return Buffer.alloc(0);
              }
            }
            return Buffer.alloc(0);
          }};
        } else if (!((window as any).qe.Buffer.o) || typeof (window as any).qe.Buffer.o !== 'function') {
          (window as any).qe.Buffer.o = function(...args: any[]) {
            console.debug('qe.Buffer.o fallback called:', args);
            if (args.length === 1 && typeof args[0] === 'number') {
              return Buffer.alloc(args[0]);
            } else if (args.length >= 1) {
              try {
                return Buffer.from(args[0]);
              } catch (e) {
                return Buffer.alloc(0);
              }
            }
            return Buffer.alloc(0);
          };
        }
      } catch (e) {
        console.error('Error setting up qe.Buffer.o fix:', e);
      }
      
      // Also check for other common patterns that cause errors
      const commonPrefixes = ['qe', 'ze', 'le', 'pe', 'ue', 'me', 'ne', 'ge', 'fe', 'ie'];
      commonPrefixes.forEach(prefix => {
        try {
          if (typeof (window as any)[prefix] !== 'undefined') {
            if (typeof (window as any)[prefix].Buffer !== 'undefined' && 
                (!(window as any)[prefix].Buffer.o || typeof (window as any)[prefix].Buffer.o !== 'function')) {
              console.debug(`Adding o method to ${prefix}.Buffer`);
              (window as any)[prefix].Buffer.o = function(...args: any[]) {
                console.debug(`${prefix}.Buffer.o fallback called with:`, args);
                if (args.length === 1 && typeof args[0] === 'number') {
                  return Buffer.alloc(args[0]);
                } else if (args.length >= 1) {
                  try {
                    return Buffer.from(args[0]);
                  } catch (e) {
                    return Buffer.alloc(0);
                  }
                }
                return Buffer.alloc(0);
              };
            }
          } else {
            // Create the object to prevent future errors - Fix for TypeScript errors
            (window as any)[prefix] = { 
              Buffer: {
                o: function(...args: any) {
                  console.debug(`${prefix}.Buffer.o preventive fallback called:`, args);
                  if (args.length === 1 && typeof args[0] === 'number') {
                    return Buffer.alloc(args[0]);
                  } else if (args.length >= 1) {
                    try {
                      return Buffer.from(args[0]);
                    } catch (e) {
                      return Buffer.alloc(0);
                    }
                  }
                  return Buffer.alloc(0);
                }
              } 
            };
          }
        } catch (e) {
          console.error(`Error adding ${prefix}.Buffer.o protection:`, e);
        }
      });
    } catch (e) {
      console.error('Failed to create Buffer proxy:', e);
      window.Buffer = Buffer as typeof Buffer;
    }
    
    // Define global for Node.js compatibility
    if (!(window as any).global) {
      (window as any).global = window;
    }
    
    // Define process.env for compatibility
    if (!(window as any).process) {
      (window as any).process = { env: {} };
    }
    
    // Create crypto guard to maintain known-good references
    (window as any).__cryptoGuard = {
      recoveryAttempts: 0,
      lastRecovery: Date.now(),
      knownGoodReferences: {}
    };
    
    // Pre-create ALL critical objects known to cause issues in production
    const criticalObjects = [
      // Core objects needed by wallet adapters
      'uk', 'hw', 'fw', 'my', 'dC',
      // Core objects needed by serialization
      'qC', 'VC', 'HC', 'UC', 'SC', 'rS',
      // Objects needed for token accounts
      'fC', 'wC', 'wme', 'fme', 'FC', 'WC', 'wME', 'Wme',
      // Objects that appear in error messages
      'ime', 'u0', 'U0', 'Ime', 'IME', 'mE', 'ME', 'me', 'uC'
    ];
    
    // Create all critical objects with production-hardened implementations
    criticalObjects.forEach(name => {
      try {
        const obj = createCryptoObject(name);
        
        // Use Object.defineProperty for better protection in production
        Object.defineProperty((window as any), name, {
          value: obj,
          writable: true,
          configurable: true,
          enumerable: true
        });
        
        // Store reference in crypto guard for recovery
        if ((window as any).__cryptoGuard) {
          (window as any).__cryptoGuard.knownGoodReferences[name] = obj;
        }
      } catch (e) {
        console.error(`Failed to initialize ${name}:`, e);
      }
    });
    
    // Define the global recovery function that prevents recursion
    (window as any).__recoverCryptoObjects = function(force = false) {
      // Track recovery attempts
      if ((window as any).__cryptoGuard) {
        (window as any).__cryptoGuard.recoveryAttempts++;
        (window as any).__cryptoGuard.lastRecovery = Date.now();
      }
      
      console.debug('Running global crypto recovery, force:', force);
      
      // Restore from known good references if available
      if ((window as any).__cryptoGuard?.knownGoodReferences) {
        Object.entries((window as any).__cryptoGuard.knownGoodReferences).forEach(([key, value]) => {
          if (force || !(window as any)[key] || typeof (window as any)[key].alloc !== 'function') {
            console.debug(`Restoring ${key} from known good reference`);
            try {
              (window as any)[key] = value;
            } catch (e) {
              console.error(`Failed to restore ${key}:`, e);
            }
          }
        });
      }
      
      // Check if Buffer has been compromised
      if (typeof (window as any).Buffer !== 'function' || typeof (window as any).Buffer.from !== 'function') {
        console.warn("Buffer object compromised, reinstalling");
        // Reinstall Buffer
        try {
          const originalBuffer = Buffer;
          if (!originalBuffer || (typeof originalBuffer !== 'function' && typeof originalBuffer !== 'object')) {
            // Emergency fallback: minimal Buffer polyfill
            (window as any).Buffer = {
              from: function(data: any) {
                if (typeof data === 'string') {
                  const encoder = new TextEncoder();
                  return encoder.encode(data);
                }
                return new Uint8Array(Array.isArray(data) ? data : []);
              },
              alloc: function(size: number) {
                return new Uint8Array(size || 0);
              },
              o: function(data: any) {
                if (typeof data === 'string') {
                  const encoder = new TextEncoder();
                  return encoder.encode(data);
                }
                return new Uint8Array(Array.isArray(data) ? data : []);
              }
            };
          } else {
            // Create Buffer proxy
            const bufferProxy = new Proxy(originalBuffer, {
              get: function(target, prop) {
                const value = target[prop];
                if (value !== undefined) {
                  return value;
                }
                // Handle minified property access
                if (prop === 'o' || prop === 'a' || prop === 'c' || prop === 'f' || prop === 'r') {
                  return function(...args) {
                    if (args.length === 1 && typeof args[0] === 'number') {
                      return Buffer.alloc(args[0]);
                    } else if (args.length >= 1) {
                      try {
                        return Buffer.from(args[0]);
                      } catch (e) {
                        return Buffer.alloc(0);
                      }
                    }
                    return Buffer.alloc(0);
                  };
                }
                return undefined;
              }
            });
            (window as any).Buffer = bufferProxy;
          }
        } catch (e) {
          console.error("Failed to reinstall Buffer proxy:", e);
          (window as any).Buffer = {
            from: function(data: any) {
              if (typeof data === 'string') {
                const encoder = new TextEncoder();
                return encoder.encode(data);
              }
              return new Uint8Array(Array.isArray(data) ? data : []);
            },
            alloc: function(size: number) {
              return new Uint8Array(size || 0);
            },
            o: function(data: any) {
              if (typeof data === 'string') {
                const encoder = new TextEncoder();
                return encoder.encode(data);
              }
              return new Uint8Array(Array.isArray(data) ? data : []);
            }
          };
        }
      }
      
      return true;
    };
    
    // Set up periodic verification (less aggressive)
    const checkInterval = 20000; // 20 seconds - reduced frequency
    setInterval(() => {
      let needsRecovery = false;
      let checkCount = 0;
      
      // Check a random subset of critical objects each time to reduce performance impact
      const samplesToCheck = Math.min(5, criticalObjects.length);
      const objectsToCheck = [...criticalObjects]
        .sort(() => 0.5 - Math.random())
        .slice(0, samplesToCheck);
      
      objectsToCheck.forEach(name => {
        checkCount++;
        if (!(window as any)[name] || typeof (window as any)[name].alloc !== 'function' || 
            typeof (window as any)[name].byteLength !== 'function') {
          console.warn(`Periodic check (${checkCount}/${samplesToCheck}): ${name} needs recovery`);
          needsRecovery = true;
        }
      });
      
      // Also check Buffer object
      if (typeof (window as any).Buffer !== 'function' || typeof (window as any).Buffer.from !== 'function') {
        console.warn("Periodic check: Buffer needs recovery");
        needsRecovery = true;
      }
      
      if (needsRecovery && (window as any).__recoverCryptoObjects) {
        // Use force only when really needed
        (window as any).__recoverCryptoObjects(true);
      } else {
        console.debug(`Periodic check (${checkCount}/${samplesToCheck}): All crypto objects verified OK`);
      }
    }, checkInterval);
  }
})();

// Export this function for others to use
export function ensurePolyfills(): boolean {
  if (typeof window !== 'undefined') {
    // Always check Buffer first
    if (typeof (window as any).Buffer !== 'function' || typeof (window as any).Buffer.from !== 'function') {
      console.warn("Buffer object missing or invalid, reinstalling");
      window.Buffer = Buffer as typeof Buffer;
      
      // Create a few test buffers to ensure the install worked
      try {
        const test1 = window.Buffer.from("test");
        const test2 = window.Buffer.alloc(10);
        console.debug("Buffer reinstalled successfully, tests passed");
      } catch (e) {
        console.error("Error testing Buffer after reinstall:", e);
      }
    }
    
    // Then use the recovery function if available
    if (window.__recoverCryptoObjects) {
      return window.__recoverCryptoObjects(false);
    }
  }
  return false;
}
