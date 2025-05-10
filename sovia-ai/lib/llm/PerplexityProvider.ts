
import { LLMProvider, PerplexityProviderOptions } from './types';
import axios from 'axios';

export class PerplexityProvider implements LLMProvider {
  private apiKey: string;
  private model: string;

  constructor(options: PerplexityProviderOptions) {
    if (!options.apiKey) {
      throw new Error('Perplexity API key is required');
    }
    
    this.apiKey = options.apiKey;
    this.model = options.model || 'llama-3.1-sonar-small-128k-online';
    
    console.log(`PerplexityProvider initialized with model: ${this.model}`);
  }

  async getTextFromLLM(params: any): Promise<string> {
    try {
      const systemPrompt = params.prompt || 'You are a helpful AI assistant.';
      const userMessages = params.context?.history || [];
      
      // Format messages for Perplexity API
      let messages = userMessages.map((m: any) => ({
        role: m.role,
        content: m.content
      }));
      
      // Add system prompt if not already in messages
      if (!messages.some((m: any) => m.role === 'system')) {
        messages.unshift({ role: 'system', content: systemPrompt });
      }
      
      // If no messages, add the prompt as a user message
      if (messages.length === 0 && params.prompt) {
        messages = [
          { role: 'system', content: 'Be precise and concise.' },
          { role: 'user', content: params.prompt }
        ];
      }
      
      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model: this.model,
          messages,
          temperature: params.temperature || 0.7,
          max_tokens: params.maxTokens || 1000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.choices[0]?.message?.content || '';
    } catch (error: any) {
      console.error('Error in Perplexity getTextFromLLM:', error);
      if (error.response) {
        console.error('Response error data:', error.response.data);
      }
      throw new Error(`Perplexity API error: ${error.message || 'Unknown error'}`);
    }
  }

  async streamTextFromLLM(options: any): Promise<AsyncGenerator<string>> {
    // Implementation for streaming
    async function* generateTokens() {
      try {
        yield 'Perplexity streaming not yet implemented';
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
    yield 'Perplexity streaming not yet implemented';
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
