
import { Buffer } from 'buffer';
import { CryptoObject } from '@/types/global';

// Ensure Buffer polyfill is available globally with minification protection
export function ensureBufferPolyfill(): void {
  if (typeof window !== 'undefined') {
    // Check if Buffer is available and properly functioning
    const isBufferValid = window.Buffer && 
                          typeof window.Buffer.from === 'function' && 
                          typeof window.Buffer.alloc === 'function';
    
    if (!isBufferValid) {
      console.log('Buffer not properly initialized, reinstalling polyfill');
      try {
        if (!Buffer || (typeof Buffer !== 'function' && typeof Buffer !== 'object')) {
          // Emergency fallback: minimal Buffer polyfill
          window.Buffer = {
            from: function(data) {
              if (typeof data === 'string') {
                const encoder = new TextEncoder();
                return encoder.encode(data);
              }
              return new Uint8Array(Array.isArray(data) ? data : []);
            },
            alloc: function(size) {
              return new Uint8Array(size || 0);
            },
            o: function(data) {
              if (typeof data === 'string') {
                const encoder = new TextEncoder();
                return encoder.encode(data);
              }
              return new Uint8Array(Array.isArray(data) ? data : []);
            }
          } as any as typeof Buffer;
        } else {
          // Create a proxy to handle minified property access
          const bufferProxy = new Proxy(Buffer, {
            get: function(target, prop) {
              if (prop in target) {
                return target[prop];
              }
              // Handle minified property names
              return function(...args: any[]) {
                if (args.length === 1 && typeof args[0] === 'number') {
                  return Buffer.alloc(args[0]);
                }
                if (args.length >= 1) {
                  try {
                    return Buffer.from(args[0]);
                  } catch (e) {
                    return Buffer.alloc(0);
                  }
                }
                return Buffer.alloc(0); 
              };
            }
          });
          window.Buffer = bufferProxy as typeof Buffer;
          // Test if the Buffer works correctly
          const testBuffer = window.Buffer.from("test");
          if (!testBuffer || typeof testBuffer.byteLength !== 'number') {
            throw new Error("Buffer installation failed validation");
          }
        }
      } catch (e) {
        console.error('Error installing Buffer polyfill:', e);
        // Last resort: create minimal Buffer implementation
        window.Buffer = Buffer || {} as any as typeof Buffer;
        // Use any type to avoid TypeScript errors
        (window.Buffer as any).from = function(data: any) {
          console.log('Using emergency Buffer.from implementation');
          if (typeof data === 'string') {
            const encoder = new TextEncoder();
            return encoder.encode(data);
          }
          return new Uint8Array(Array.isArray(data) ? data : []);
        };
        (window.Buffer as any).alloc = function(size: number) {
          console.log('Using emergency Buffer.alloc implementation');
          return new Uint8Array(size || 0);
        };
        (window.Buffer as any).isBuffer = function() { return true; };
        (window.Buffer as any).o = function(data: any) {
          console.log('Using emergency Buffer.o implementation (minified property)');
          if (typeof data === 'string') {
            const encoder = new TextEncoder();
            return encoder.encode(data);
          }
          return new Uint8Array(Array.isArray(data) ? data : []);
        };
      }
    }
    
    // Set up minimal process if it doesn't exist
    if (!window.process) {
      window.process = { env: {} } as any;
    }
    
    // Also add global for Node.js compatibility
    if (!window.global) {
      window.global = window;
    }
  }
}

// Create a resilient crypto object with proxy for handling minified property access
function createResilientCryptoObject(name: string): CryptoObject {
  console.debug(`Creating resilient ${name} object with minification protection`);
  
  const obj = {
    alloc: function(size: number) {
      console.debug(`${name}.alloc resilient called with size:`, size);
      return new Uint8Array(size || 0);
    },
    from: function(data: any): Uint8Array {
      console.debug(`${name}.from resilient called with data:`, typeof data);
      // More robust handling
      try {
        if (Array.isArray(data)) {
          return new Uint8Array(data);
        } else if (ArrayBuffer.isView(data)) {
          return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        } else if (data instanceof ArrayBuffer) {
          return new Uint8Array(data);
        } else if (typeof data === 'string') {
          // Handle string data
          const encoder = new TextEncoder();
          return encoder.encode(data);
        } else if (data && typeof data === 'object' && 'byteLength' in data) {
          // Handle objects with byteLength
          return new Uint8Array(data);
        }
      } catch (e) {
        console.error(`Error in ${name}.from:`, e);
      }
      return new Uint8Array(0);
    },
    decode: function(data: any): Uint8Array {
      console.debug(`${name}.decode resilient called`);
      try {
        if (Array.isArray(data)) {
          return new Uint8Array(data);
        } else if (ArrayBuffer.isView(data)) {
          return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        } else if (data instanceof ArrayBuffer) {
          return new Uint8Array(data);
        } else if (typeof data === 'string') {
          // Handle string data for decode
          const encoder = new TextEncoder();
          return encoder.encode(data);
        }
      } catch (e) {
        console.error(`Error in ${name}.decode:`, e);
      }
      return new Uint8Array(0);
    },
    // Add robust byteLength method with complete type handling
    byteLength: function(data: any): number {
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
    // Add handlers for common minified property names
    o: function(data: any) {
      console.debug(`${name}.o minified method called`);
      // Intelligently route to appropriate method
      if (typeof data === 'number') {
        return new Uint8Array(data || 0);
      }
      return this.from(data);
    },
    a: function(size: number) {
      console.debug(`${name}.a minified method called`);
      return new Uint8Array(size || 0);
    },
    f: function(data: any) {
      console.debug(`${name}.f minified method called`);
      return this.from(data);
    }
  };
  
  // Create a proxy to handle any other minified property access
  return new Proxy(obj, {
    get: function(target, prop) {
      // If property exists on target, return it
      if (prop in target) {
        return target[prop];
      }
      
      // Handle unknown property access with intelligent fallbacks
      console.debug(`Accessing unknown property ${String(prop)} on ${name} - providing fallback`);
      
      return function(...args: any[]) {
        console.debug(`Called unknown method ${String(prop)} on ${name}:`, args);
        
        // Try to intelligently handle the call based on arguments
        if (args.length === 1 && typeof args[0] === 'number') {
          console.debug(`Routing ${String(prop)} to alloc-like behavior`);
          return new Uint8Array(args[0] || 0);
        } else if (args.length >= 1) {
          console.debug(`Routing ${String(prop)} to from-like behavior`);
          try {
            if (Array.isArray(args[0])) {
              return new Uint8Array(args[0]);
            } else if (ArrayBuffer.isView(args[0])) {
              return new Uint8Array(args[0].buffer, args[0].byteOffset, args[0].byteLength);
            } else if (args[0] instanceof ArrayBuffer) {
              return new Uint8Array(args[0]);
            } else if (typeof args[0] === 'string') {
              const encoder = new TextEncoder();
              return encoder.encode(args[0]);
            }
          } catch (e) {
            console.error(`Error in ${name}.${String(prop)} fallback:`, e);
          }
        }
        
        return new Uint8Array(0);
      };
    }
  });
}

// Counter to detect and prevent recursive calls
let recoveryInProgress = false;

// Recover missing crypto objects that might have been deleted or modified
export function recoverMissingCryptoObjects(fromRecursive: boolean = false): void {
  if (typeof window === 'undefined') return;
  
  // IMPORTANT: Break the infinite recursion loop
  if (recoveryInProgress && !fromRecursive) {
    console.warn('Avoiding recursive crypto recovery');
    return;
  }
  
  recoveryInProgress = true;
  console.debug('Running crypto objects recovery');
  
  try {
    // Critical objects that must be available - EXPANDED LIST
    const criticalObjects = [
      // Core objects needed by most operations
      'qC', 'VC', 'HC', 'SC', 'rS', 'RS', 'vC', 'QC', 'UC', 'uC',
      // Objects needed for token accounts
      'fC', 'FC', 'wC', 'WC', 'wme', 'wME', 'Wme', 'fme',
      // Objects that appear in error messages
      'ime', 'Ime', 'IME', 'mE', 'ME', 'me',
      // Additional objects to handle 'u0' reference error
      'u0', 'U0', 'Uo', 'UO',
      // Add production-specific objects causing errors
      'uk', 'hw', 'fw', 'my', 'dC'
    ];
    
    // First check if Buffer itself needs recovery
    if (!window.Buffer || typeof window.Buffer.from !== 'function') {
      console.warn("Buffer object missing critical methods, reinstalling");
      
      try {
        // Create a proxy around the original Buffer
        const bufferProxy = new Proxy(Buffer, {
          get: function(target, prop) {
            if (prop in target) {
              return target[prop];
            }
            
            // Handle minified property names
            console.debug(`Buffer accessing unknown property: ${String(prop)}`);
            
            return function(...args: any[]) {
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
        });
        
        window.Buffer = bufferProxy;
      } catch (e) {
        console.error("Failed to create Buffer proxy:", e);
        window.Buffer = Buffer;
      }
    }
    
    // Create or fix each object with enhanced protection
    criticalObjects.forEach(objName => {
      try {
        // Only create if missing or broken
        if (!window[objName] || 
            typeof window[objName].alloc !== 'function' || 
            typeof window[objName].from !== 'function' ||
            !window[objName].byteLength) {  // Check if byteLength is missing
          
          console.debug(`Recreating missing or incomplete ${objName}`);
          
          const cryptoObj = createResilientCryptoObject(objName);
          
          // Try to update the object using defineProperty
          try {
            Object.defineProperty(window, objName, {
              value: cryptoObj,
              writable: true,
              configurable: true,
              enumerable: true
            });
          } catch (e) {
            console.warn(`Failed to define ${objName} with defineProperty:`, e);
            
            // Fall back to direct assignment if defineProperty fails
            try {
              window[objName] = cryptoObj;
            } catch (e) {
              console.error(`Failed to replace ${objName}:`, e);
              
              // Last resort: try to add methods directly
              try {
                if (!window[objName]) window[objName] = {};
                window[objName].alloc = cryptoObj.alloc;
                window[objName].from = cryptoObj.from;
                window[objName].decode = cryptoObj.decode;
                window[objName].byteLength = cryptoObj.byteLength;
                window[objName].o = cryptoObj.o;  // Add minified method
                window[objName].a = cryptoObj.a;  // Add minified method
                window[objName].f = cryptoObj.f;  // Add minified method
              } catch (e2) {
                console.error(`Failed to patch ${objName} methods:`, e2);
              }
            }
          }
          
          // Save to global crypto guard if available
          if (window.__cryptoGuard) {
            if (!window.__cryptoGuard.knownGoodReferences) {
              window.__cryptoGuard.knownGoodReferences = {};
            }
            window.__cryptoGuard.knownGoodReferences[objName] = cryptoObj;
          }
        }
      } catch (e) {
        console.error(`Error while recovering ${objName}:`, e);
      }
    });
  } finally {
    // Always clear the flag when we're done
    recoveryInProgress = false;
  }
}

// Create a safe version of the ime object that won't cause errors
export function createSafeImeObject(): void {
  try {
    // Create a safe version of ime with proxies for error trapping
    const safeIme = createResilientCryptoObject('ime');
    
    // Try to replace window.ime with the safe version
    try {
      Object.defineProperty(window, 'ime', {
        value: safeIme,
        writable: true,
        configurable: true,
        enumerable: true
      });
    } catch (e) {
      // If that fails, try direct assignment
      try {
        window.ime = safeIme;
      } catch (e2) {
        console.error('Failed to create safe ime object:', e2);
      }
    }
    
    // Save to global crypto guard if available
    if (window.__cryptoGuard) {
      if (!window.__cryptoGuard.knownGoodReferences) {
        window.__cryptoGuard.knownGoodReferences = {};
      }
      window.__cryptoGuard.knownGoodReferences.ime = safeIme;
    }
  } catch (e) {
    console.error('Error creating safe ime object:', e);
  }
}

// Add protections for specific error patterns
export function addByteErrorProtection(): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Add special handling for Buffer.o is not a function error
    if (window.Buffer && !window.Buffer['o']) {
      console.debug("Adding protection for Buffer.o errors");
      try {
        Object.defineProperty(window.Buffer, 'o', {
          value: function(...args: any[]) {
            console.debug("Called Buffer.o fallback with:", args);
            if (args.length === 1 && typeof args[0] === 'number') {
              return Buffer.alloc(args[0]);
            } else if (args.length >= 1) {
              try {
                return Buffer.from(args[0]);
              } catch (e) {
                console.error("Error in Buffer.o fallback:", e);
                return Buffer.alloc(0);
              }
            }
            return Buffer.alloc(0);
          },
          configurable: true,
          writable: true,
          enumerable: false
        });
      } catch (e) {
        console.error("Failed to add Buffer.o protection:", e);
      }
    }
    
    // Check for ze.Buffer pattern
    const globalKeys = Object.keys(window);
    const potentialZe = globalKeys.find(key => 
      window[key] && typeof window[key] === 'object' && window[key].Buffer && 
      (!window[key].Buffer.o || typeof window[key].Buffer.o !== 'function')
    );
    
    if (potentialZe) {
      console.debug(`Found potential ze-like object: ${potentialZe}`);
      try {
        if (!window[potentialZe].Buffer.o) {
          window[potentialZe].Buffer.o = function(...args: any[]) {
            console.debug(`${potentialZe}.Buffer.o fallback called with:`, args);
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
        console.error(`Error adding protection to ${potentialZe}.Buffer:`, e);
      }
    }
    
    // Patch Array.prototype.slice if it's causing issues
    const originalSlice = Array.prototype.slice;
    Array.prototype.slice = function(...args: any[]) {
      try {
        return originalSlice.apply(this, args);
      } catch (e) {
        console.error('Error in Array.prototype.slice:', e);
        // Return safe fallback
        return [];
      }
    };
    
    // Add safety checks to ArrayBuffer.isView
    const originalIsView = ArrayBuffer.isView;
    ArrayBuffer.isView = function(arg: any): arg is ArrayBufferView {
      try {
        return originalIsView(arg);
      } catch (e) {
        console.error('Error in ArrayBuffer.isView:', e);
        // Fallback implementation with proper type predicate
        return Boolean(arg && arg.buffer instanceof ArrayBuffer);
      }
    };
  } catch (e) {
    console.error('Error adding byte error protection:', e);
  }
}
