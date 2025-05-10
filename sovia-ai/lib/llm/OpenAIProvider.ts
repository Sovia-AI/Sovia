import { LLMProvider, Message, GenerateOptions, GenerateResponse, OpenAIProviderOptions } from './types';
import OpenAI from 'openai';
import { ensureBufferPolyfill, recoverMissingCryptoObjects, createSafeImeObject } from '../utils/bufferPolyfill';
import { ensurePolyfills } from '../utils/polyfill-init';
import { toast } from 'sonner';

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;
  private maxRetries: number;
  private isProduction: boolean;

  constructor(options: OpenAIProviderOptions) {
    // Ensure we're using the provided API key
    if (!options.apiKey) {
      throw new Error('OpenAI API key is required');
    }
    
    // Check if we're in production mode
    this.isProduction = process.env.NODE_ENV === 'production' || 
                        window.location.hostname.includes('.app');
    
    // Always ensure polyfills before client creation - uses our new function
    if (typeof window !== 'undefined') {
      ensurePolyfills();
    }
    
    // Force explicit creation of critical objects for OpenAI
    this.ensureCriticalObjects();
    
    try {
      // Create the OpenAI client
      this.client = new OpenAI({ 
        apiKey: options.apiKey,
        dangerouslyAllowBrowser: options.dangerouslyAllowBrowser || true
      });
      
      // Monkey-patch the OpenAI client to add resilience
      this.patchOpenAIClient();
    } catch (e) {
      console.error('Failed to create OpenAI client:', e);
      toast.error('Failed to initialize AI chat functionality', { 
        description: 'We encountered an error setting up the chat service.'
      });
      
      // Create a minimal client that will fail gracefully
      this.client = {
        chat: {
          completions: {
            create: () => Promise.reject('OpenAI client creation failed')
          }
        }
      } as any;
    }
    
    this.model = options.model || 'gpt-4o-mini';
    this.maxRetries = this.isProduction ? 5 : 3; // More retries in production
    console.log(`OpenAIProvider initialized with model: ${this.model}, production mode: ${this.isProduction}`);
  }

  // Force create all critical objects needed by OpenAI
  private ensureCriticalObjects(): void {
    if (typeof window === 'undefined') return;
    
    // These are the specific objects that cause issues in production
    const criticalObjects = ['hw', 'uk', 'fw', 'my', 'dC'];
    
    criticalObjects.forEach(name => {
      this.ensureCryptoObject(name);
    });
  }

  // Patch OpenAI client for better error handling in production
  private patchOpenAIClient(): void {
    if (!this.client) return;
    
    try {
      // Store the original create method
      const originalCreate = this.client.chat.completions.create;
      const self = this;
      
      // Replace with our wrapped version that preserves the return type
      this.client.chat.completions.create = ((...args: any[]) => {
        // Always ensure crypto objects exist before making API call
        self.prepareForApiCall();
        
        try {
          // Call the original method with the original context and arguments
          return originalCreate.apply(self.client.chat.completions, args);
        } catch (e) {
          console.error('Error in OpenAI API call:', e);
          
          // Handle specific byteLength errors with more robust recovery
          if (e?.message && (
            e.message.includes('byteLength is not a function') || 
            e.message.includes('hw.byteLength') ||
            e.message.includes('fw.byteLength') ||
            e.message.includes('my.byteLength') ||
            e.message.includes('dC.byteLength')
          )) {
            console.log('Detected byteLength error, attempting recovery...');
            
            // Try to use the global recovery function with force flag
            if (typeof window.__recoverCryptoObjects === 'function') {
              window.__recoverCryptoObjects(true);
            } else {
              // Fallback to direct recovery
              recoverMissingCryptoObjects(true);
            }
            
            // Also ensure critical objects directly
            self.ensureCriticalObjects();
            
            // Try again after recovery
            return originalCreate.apply(self.client.chat.completions, args);
          }
          
          throw e;
        }
      }) as typeof originalCreate; // Cast to preserve the original function type
      
      console.log('Successfully patched OpenAI client for resilience');
    } catch (e) {
      console.error('Failed to patch OpenAI client:', e);
    }
  }

  // Enhanced crypto object creation with better error logging for production
  private ensureCryptoObject(name: string): void {
    if (typeof window === 'undefined') return;
    
    if (!window[name] || typeof window[name].from !== 'function' || 
        typeof window[name].byteLength !== 'function') {
      
      console.debug(`Creating missing ${name} object in OpenAIProvider (production: ${this.isProduction})`);
      
      // Create object with all required methods
      const cryptoObj = {
        alloc: function alloc(size: number) { 
          console.debug(`${name}.alloc called with size:`, size);
          return new Uint8Array(size || 0); 
        },
        from: function from(data: any) {
          console.debug(`${name}.from called with data type:`, typeof data);
          if (Array.isArray(data)) return new Uint8Array(data);
          if (data instanceof Uint8Array) return data;
          if (typeof data === 'string') {
            const encoder = new TextEncoder();
            return encoder.encode(data);
          }
          if (data && typeof data === 'object' && 'byteLength' in data) {
            return new Uint8Array(data);
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
              return encoder.encode(data).length;
            }
          } catch (e) {
            console.error(`Error in ${name}.byteLength:`, e);
          }
          return 0;
        },
        decode: function decode(data: any) {
          console.debug(`${name}.decode called`);
          if (Array.isArray(data)) return new Uint8Array(data);
          if (data instanceof Uint8Array) return data;
          if (typeof data === 'string') {
            const encoder = new TextEncoder();
            return encoder.encode(data);
          }
          return new Uint8Array(0);
        }
      };
      
      // Use Object.defineProperty in production for better protection
      if (this.isProduction) {
        try {
          Object.defineProperty(window, name, {
            value: cryptoObj,
            writable: true,
            configurable: true,
            enumerable: true
          });
        } catch (e) {
          console.error(`Failed to define ${name} with defineProperty:`, e);
          window[name] = cryptoObj;
        }
      } else {
        window[name] = cryptoObj;
      }
      
      // Save to known good references if possible
      if (window.__cryptoGuard) {
        window.__cryptoGuard.knownGoodReferences[name] = { ...cryptoObj };
      }
    }
  }
  
  // Enhanced preparation for API calls with production-specific checks
  private prepareForApiCall(): void {
    if (typeof window === 'undefined') return;
    
    // First try to use the global recovery function
    if (typeof window.__recoverCryptoObjects === 'function') {
      window.__recoverCryptoObjects(false); // Don't force if not needed
    }
    
    // Ensure all critical objects exist - directly create these as they 
    // are known to cause issues in production builds
    ['hw', 'uk', 'fw', 'my', 'dC', 'qC', 'VC'].forEach(name => 
      this.ensureCryptoObject(name)
    );
    
    // Ensure Buffer is available
    if (!window.Buffer || typeof window.Buffer.from !== 'function') {
      try {
        const { Buffer } = require('buffer');
        // Use Object.defineProperty for better protection in production
        if (this.isProduction) {
          Object.defineProperty(window, 'Buffer', {
            value: Buffer,
            writable: true,
            configurable: true,
            enumerable: true
          });
        } else {
          window.Buffer = Buffer;
        }
      } catch (e) {
        console.error('Failed to re-install Buffer:', e);
      }
    }
  }

  async getTextFromLLM(params: any): Promise<string> {
    // Always prepare before API call
    this.prepareForApiCall();
    
    // Final fallback response if all else fails
    const fallbackResponse = "I'm having trouble accessing my language processing capabilities right now. Let me answer your question based on what I already know.";
    
    try {
      // In production, add extra preparation
      if (this.isProduction) {
        // Ensure Buffer is ready before making API call
        ensureBufferPolyfill();
      }
      
      const messages = [
        { role: 'system', content: params.prompt || 'You are a helpful assistant.' },
        ...(params.context?.history || []).map((m: any) => ({ role: m.role, content: m.content }))
      ];
      
      console.log(`Calling OpenAI with model: ${params.modelId || this.model}`);
      
      let lastError: Error | null = null;
      let retries = 0;
      
      while (retries <= this.maxRetries) {
        try {
          this.prepareForApiCall(); // Ensure objects before each retry
          
          const response = await this.client.chat.completions.create({
            model: params.modelId || this.model,
            messages: messages as any,
            temperature: params.temperature || 0.7,
            max_tokens: params.maxTokens || 500
          });

          return response.choices[0]?.message?.content || '';
        } catch (error: any) {
          lastError = error;
          console.error(`OpenAI API error (attempt ${retries + 1}):`, error);
          
          // More aggressive recovery in production
          if (this.isProduction && typeof window.__recoverCryptoObjects === 'function') {
            window.__recoverCryptoObjects(true);
          } else {
            // Direct recovery as fallback
            recoverMissingCryptoObjects(true);
            createSafeImeObject();
          }
          
          retries++;
          
          // Add exponential backoff with longer times in production
          if (retries <= this.maxRetries) {
            const backoffTime = Math.pow(2, retries) * (this.isProduction ? 500 : 300);
            console.log(`Retrying in ${backoffTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
          }
        }
      }
      
      // If we've exhausted retries, throw the last error
      if (lastError) {
        throw lastError;
      }
      
      return fallbackResponse;
    } catch (error: any) {
      console.error('Error in OpenAI getTextFromLLM:', error);
      
      return `${fallbackResponse} ${error.message ? 'Error details: ' + error.message : ''}`;
    }
  }

  async streamTextFromLLM(options: any): Promise<AsyncGenerator<string>> {
    // Ensure Buffer polyfill is available
    ensureBufferPolyfill();
    
    // Recover any missing crypto objects
    if (typeof window !== 'undefined') {
      recoverMissingCryptoObjects();
      createSafeImeObject();
    }
    
    const messages = [
      { role: 'system', content: options.context.prompt || 'You are a helpful assistant.' },
      ...options.context.history.map((m: any) => ({ role: m.role, content: m.content }))
    ];

    try {
      const stream = await this.client.chat.completions.create({
        model: options.modelId || this.model,
        messages,
        stream: true,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 500
      });

      async function* generateTokens() {
        try {
          for await (const chunk of stream) {
            if (chunk.choices[0]?.delta?.content) {
              yield chunk.choices[0].delta.content;
            }
          }
        } catch (error: any) {
          console.error('Stream error:', error);
          
          // Handle specific errors
          if (error.message && error.message.includes('byteLength is not a function')) {
            yield '\nI encountered an internal error processing your request. Let me try a different approach.';
          } else {
            yield `\nError: ${error.message || 'Unknown streaming error'}`;
          }
        }
      }

      return generateTokens();
    } catch (error: any) {
      console.error('Error creating stream:', error);
      
      // Return a generator that yields an error message
      async function* errorGenerator() {
        yield `I'm having trouble accessing my language processing capabilities right now. Let me try a different approach to answer your question.`;
      }
      
      return errorGenerator();
    }
  }

  async complete(prompt: string): Promise<string> {
    try {
      // Ensure Buffer polyfill is available
      ensureBufferPolyfill();
      
      // Recover any missing crypto objects
      if (typeof window !== 'undefined') {
        recoverMissingCryptoObjects();
      }
      
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }] as any, // Cast to any
      });
      return response.choices[0]?.message?.content || '';
    } catch (error: any) {
      console.error('Error in OpenAI completion:', error);
      return `I'm having trouble processing that request. ${error.message || 'Unknown error'}`;
    }
  }

  async generateResponse(options: GenerateOptions): Promise<GenerateResponse> {
    try {
      // Ensure Buffer polyfill is available
      ensureBufferPolyfill();
      
      // Recover any missing crypto objects
      if (typeof window !== 'undefined') {
        recoverMissingCryptoObjects();
      }
      
      console.log(`Generating response with OpenAI model: ${options.model || this.model}`);
      console.log(`Messages count: ${options.messages.length}`);
      
      let response;
      let retries = 0;
      const maxRetries = this.maxRetries;
      
      while (retries <= maxRetries) {
        try {
          response = await this.client.chat.completions.create({
            model: options.model || this.model,
            messages: options.messages as any, // Cast to any to bypass type checking
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 500
          });
          break;
        } catch (error: any) {
          console.error(`API error (attempt ${retries + 1}):`, error);
          
          // Specific handling for byteLength errors
          if (error.message && error.message.includes('byteLength')) {
            if (typeof window !== 'undefined') {
              recoverMissingCryptoObjects();
              createSafeImeObject();
            }
          }
          
          retries++;
          
          if (retries > maxRetries) {
            throw error;
          }
          
          // Add exponential backoff
          const backoffTime = Math.pow(2, retries) * 300;
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      }

      if (!response) {
        throw new Error('Failed to generate response after retries');
      }

      return {
        content: response.choices[0]?.message?.content || '',
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0
        }
      };
    } catch (error: any) {
      console.error('Error in OpenAI generateResponse:', error);
      throw new Error(`OpenAI API error: ${error.message || 'Unknown error'}`);
    }
  }

  async *stream(prompt: string): AsyncGenerator<string> {
    try {
      // Ensure Buffer polyfill is available
      ensureBufferPolyfill();
      
      // Recover any missing crypto objects
      if (typeof window !== 'undefined') {
        recoverMissingCryptoObjects();
      }
      
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        stream: true
      });

      for await (const chunk of stream) {
        if (chunk.choices[0]?.delta?.content) {
          yield chunk.choices[0].delta.content;
        }
      }
    } catch (error: any) {
      console.error('Error in OpenAI stream:', error);
      yield `I'm having trouble processing that request right now. ${error.message || ''}`;
    }
  }
}
