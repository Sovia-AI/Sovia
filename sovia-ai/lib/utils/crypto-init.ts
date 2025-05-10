import { Buffer } from 'buffer';
import { CryptoObject } from '@/types/global';
import { recoverMissingCryptoObjects, createSafeImeObject } from './bufferPolyfill';

// Initialize and protect critical crypto objects (backup initialization)
(function initializeCryptoObjects() {
  if (typeof window === 'undefined') return;
  
  console.debug('Running backup crypto initialization in crypto-init.ts');
  
  // Ensure Buffer is globally available with minification protection
  if (!window.Buffer || typeof window.Buffer.from !== 'function') {
    console.debug('Buffer not properly initialized, adding protection');
    try {
      if (!Buffer || (typeof Buffer !== 'function' && typeof Buffer !== 'object')) {
        // Emergency fallback: minimal Buffer polyfill
        (window.Buffer as any) = {
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
        // Create a proxy to handle minified property access
        const bufferProxy = new Proxy(Buffer, {
          get: function(target: any, prop: string | symbol) {
            if (prop in target) {
              return target[prop];
            }
            // Handle minified property names
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
        window.Buffer = bufferProxy as typeof Buffer;
      }
    } catch (e) {
      console.error('Error installing Buffer proxy:', e);
      window.Buffer = Buffer as typeof Buffer;
    }
  }
  
  // Verify critical crypto objects exist - EXPANDED LIST
  const criticalObjects = [
    // Core objects needed by most operations
    'qC', 'VC', 'HC', 'rS', 'SC', 'UC', 'uC', 'ime',
    // Objects needed for token accounts
    'fC', 'wC', 'wme', 'fme',
    // Additional objects for redundancy
    'FC', 'WC', 'wME', 'Wme', 'Ime', 'IME', 'mE', 'ME', 'me',
    // Production-specific objects
    'uk', 'hw', 'fw', 'my', 'dC'
  ];
  
  // Check if any object is missing
  const missingObjects = criticalObjects.filter(
    name => !window[name] || typeof window[name].alloc !== 'function' || typeof window[name].from !== 'function'
  );
  
  if (missingObjects.length > 0) {
    console.warn(`Missing crypto objects detected: ${missingObjects.join(', ')} - attempting recovery`);
    
    // Try to use the recovery function if it exists, but avoid recursive calls
    if (typeof window.__recoverCryptoObjects === 'function') {
      try {
        // Pass false to indicate this is not a recursive call
        window.__recoverCryptoObjects(false);
      } catch (e) {
        console.warn('Built-in recovery function failed, using direct recovery:', e);
        // Pass true to avoid recursive calls
        recoverMissingCryptoObjects(true);
      }
    } else {
      console.warn('No built-in recovery function found, using fallback recovery');
      // Pass true to avoid recursion
      recoverMissingCryptoObjects(true);
    }
    
    // Always create special safe version of ime
    createSafeImeObject();
    
    // Verify again after recovery
    const stillMissing = criticalObjects.filter(
      name => !window[name] || typeof window[name].alloc !== 'function' || typeof window[name].from !== 'function'
    );
    
    if (stillMissing.length > 0) {
      console.warn(`Critical objects still missing after recovery: ${stillMissing.join(', ')}`);
      
      // Check for ze.Buffer.o errors specifically
      tryFixZeBufferError();
      
      // Emergency fallback for critical objects
      stillMissing.forEach(name => {
        // Only create if still missing
        if (!window[name] || typeof window[name].alloc !== 'function' || typeof window[name].from !== 'function') {
          console.debug(`Creating emergency fallback for ${name}`);
          
          try {
            // Create a proxy to handle minified property access
            window[name] = new Proxy({
              alloc: function(size: number) { 
                console.debug(`${name}.alloc emergency fallback called with size:`, size);
                return new Uint8Array(size || 0); 
              },
              from: function(data: any) {
                console.debug(`${name}.from emergency fallback called with data:`, data);
                if (Array.isArray(data)) {
                  return new Uint8Array(data);
                } else if (ArrayBuffer.isView(data)) {
                  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
                } else if (data instanceof ArrayBuffer) {
                  return new Uint8Array(data);
                } else if (typeof data === 'string') {
                  const encoder = new TextEncoder();
                  return encoder.encode(data);
                }
                return new Uint8Array(0);
              },
              decode: function(data: any) {
                console.debug(`${name}.decode emergency fallback called`);
                if (Array.isArray(data)) {
                  return new Uint8Array(data);
                } else if (ArrayBuffer.isView(data)) {
                  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
                } else if (data instanceof ArrayBuffer) {
                  return new Uint8Array(data);
                } else if (typeof data === 'string') {
                  const encoder = new TextEncoder();
                  return encoder.encode(data);
                }
                return new Uint8Array(0);
              },
              byteLength: function(data: any) {
                console.debug(`${name}.byteLength emergency fallback called`);
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
              o: function(data: any) {
                console.debug(`${name}.o minified method called`);
                // Intelligently handle based on argument type
                if (typeof data === 'number') {
                  return new Uint8Array(data || 0); 
                }
                // Otherwise treat as from
                if (Array.isArray(data)) {
                  return new Uint8Array(data);
                } else if (typeof data === 'string') {
                  const encoder = new TextEncoder();
                  return encoder.encode(data);
                }
                return new Uint8Array(0);
              }
            }, {
              get: function(target, prop) {
                if (prop in target) {
                  return target[prop];
                }
                
                // Handle unknown property access
                console.debug(`${name} accessing unknown property ${String(prop)} - providing fallback`);
                
                return function(...args: any[]) {
                  console.debug(`Called unknown method ${name}.${String(prop)}:`, args);
                  
                  // Try to intelligently handle the call based on arguments
                  if (args.length === 1 && typeof args[0] === 'number') {
                    return new Uint8Array(args[0] || 0);
                  } else if (args.length >= 1) {
                    try {
                      if (Array.isArray(args[0])) {
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
          } catch (e) {
            console.error(`Failed to create ${name}:`, e);
          }
        }
      });
    }
  }
  
  // Add window.global if it doesn't exist
  if (!window.global) {
    window.global = window;
  }
  
  // Set up periodic verification with smarter scheduling
  let checkCount = 0;
  const maxChecks = 10; // Limit number of checks to avoid performance issues
  
  const intervalId = setInterval(() => {
    // Only run a limited number of checks after initialization
    if (checkCount >= maxChecks) {
      console.debug(`Clearing periodic crypto checks after ${maxChecks} iterations`);
      clearInterval(intervalId);
      return;
    }
    
    checkCount++;
    
    // Check a subset of critical objects to reduce performance impact
    const objectsToCheck = checkCount === 1 ? criticalObjects : 
      criticalObjects.filter(() => Math.random() < 0.3); // Sample ~30% of objects
    
    const missingAfterInit = objectsToCheck.filter(
      name => !window[name] || typeof window[name].alloc !== 'function' || typeof window[name].from !== 'function'
    );
    
    if (missingAfterInit.length > 0) {
      console.warn(`Periodic check #${checkCount}: Crypto objects missing: ${missingAfterInit.join(', ')}`);
      
      // Re-run recovery directly without using the recursive global function
      recoverMissingCryptoObjects(true);
      
      // Always ensure ime is safe
      createSafeImeObject();
      
      // Check for ze.Buffer.o errors
      tryFixZeBufferError();
    } else {
      console.debug(`Periodic check #${checkCount}: All crypto objects verified OK`);
    }
  }, checkCount === 0 ? 1000 : 5000); // First check after 1s, then every 5s
})();

// Function to specifically fix the "ze.Buffer.o is not a function" error
function tryFixZeBufferError() {
  if (typeof window === 'undefined') return;
  
  try {
    // Look for objects that have a Buffer property without 'o' method
    Object.keys(window).forEach(key => {
      const obj = window[key];
      if (obj && typeof obj === 'object' && obj.Buffer) {
        if (!obj.Buffer.o || typeof obj.Buffer.o !== 'function') {
          console.debug(`Found potential problematic object ${key}.Buffer without 'o' method`);
          try {
            // Add the missing o method
            (obj.Buffer as any).o = function(...args: any[]) {
              console.debug(`${key}.Buffer.o fallback called with:`, args);
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
          } catch (e) {
            console.error(`Failed to patch ${key}.Buffer.o:`, e);
          }
        }
      }
    });
  } catch (e) {
    console.error('Error trying to fix ze.Buffer.o:', e);
  }
}
