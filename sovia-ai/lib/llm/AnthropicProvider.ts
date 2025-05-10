
import { LLMProvider, AnthropicProviderOptions } from './types';
import axios from 'axios';

export class AnthropicProvider implements LLMProvider {
  private apiKey: string;
  private model: string;
  private baseUrl: string;
  private maxRetries: number;
  private requestTimeout: number;

  constructor(options: AnthropicProviderOptions) {
    if (!options.apiKey) {
      throw new Error('Anthropic API key is required');
    }
    
    this.apiKey = options.apiKey;
    this.model = options.model || 'claude-3-haiku-20240307';
    this.baseUrl = options.baseUrl || 'https://api.anthropic.com/v1';
    this.maxRetries = options.maxRetries || 3;
    this.requestTimeout = options.requestTimeout || 30000;
    
    console.log(`AnthropicProvider initialized with model: ${this.model}`);
  }

  async getTextFromLLM(params: any): Promise<string> {
    try {
      const systemPrompt = params.prompt || 'You are Claude, a helpful AI assistant.';
      const userMessages = params.context?.history || [];
      
      // Format messages for Anthropic API
      const messages = userMessages.map((m: any) => ({
        role: m.role,
        content: m.content
      }));
      
      // Add system prompt if not already in messages
      if (!messages.some((m: any) => m.role === 'system')) {
        messages.unshift({ role: 'system', content: systemPrompt });
      }
      
      const response = await axios.post(
        `${this.baseUrl}/messages`,
        {
          model: this.model,
          messages,
          max_tokens: params.maxTokens || 1000,
          temperature: params.temperature || 0.7
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          },
          timeout: this.requestTimeout
        }
      );
      
      return response.data.content[0]?.text || '';
    } catch (error: any) {
      console.error('Error in Anthropic getTextFromLLM:', error);
      if (error.response) {
        console.error('Response error data:', error.response.data);
      }
      throw new Error(`Anthropic API error: ${error.message || 'Unknown error'}`);
    }
  }

  async streamTextFromLLM(options: any): Promise<AsyncGenerator<string>> {
    // Implementation for streaming from Anthropic
    async function* generateTokens() {
      try {
        yield 'Anthropic streaming not yet implemented';
      } catch (error: any) {
        console.error('Stream error:', error);
        yield `\nError: ${error.message || 'Unknown streaming error'}`;
      }
    }
    
    return generateTokens();
  }

  // Add required methods to satisfy LLMProvider interface
  async complete(prompt: string): Promise<string> {
    return this.getTextFromLLM({ prompt });
  }
  
  async *stream(prompt: string): AsyncGenerator<string> {
    yield 'Anthropic streaming not yet implemented';
  }
  
  async generateResponse(options: any): Promise<any> {
    const response = await this.getTextFromLLM(options);
    return {
      content: response,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      }
    };
  }
}
