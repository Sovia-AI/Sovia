
import { LLMProvider, GeminiProviderOptions } from './types';
import axios from 'axios';

export class GeminiProvider implements LLMProvider {
  private apiKey: string;
  private model: string;

  constructor(options: GeminiProviderOptions) {
    if (!options.apiKey) {
      throw new Error('Gemini API key is required');
    }
    
    this.apiKey = options.apiKey;
    this.model = options.model || 'gemini-1.5-pro';
    
    console.log(`GeminiProvider initialized with model: ${this.model}`);
  }

  async getTextFromLLM(params: any): Promise<string> {
    try {
      const systemPrompt = params.prompt || 'You are a helpful AI assistant.';
      const userMessages = params.context?.history || [];
      
      // Format messages for Gemini API
      let messages = [];
      
      // Add system prompt as first user message if not in history
      if (systemPrompt && !userMessages.some((m: any) => m.role === 'system')) {
        messages.push({ role: 'user', parts: [{ text: systemPrompt }] });
        if (messages.length === 1) {
          // If only system prompt, add a model response to set context
          messages.push({ role: 'model', parts: [{ text: 'I understand.' }] });
        }
      }
      
      // Add remaining messages
      for (const message of userMessages) {
        if (message.role === 'user') {
          messages.push({ role: 'user', parts: [{ text: message.content }] });
        } else if (message.role === 'assistant') {
          messages.push({ role: 'model', parts: [{ text: message.content }] });
        }
      }
      
      // If no messages or only system, add the prompt as a user message
      if ((messages.length === 0 || messages.length === 2) && params.prompt) {
        messages.push({ role: 'user', parts: [{ text: params.prompt }] });
      }
      
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`,
        {
          contents: messages,
          generationConfig: {
            temperature: params.temperature || 0.7,
            maxOutputTokens: params.maxTokens || 1000,
          }
        },
        {
          params: { key: this.apiKey },
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      return response.data.candidates[0]?.content?.parts[0]?.text || '';
    } catch (error: any) {
      console.error('Error in Gemini getTextFromLLM:', error);
      if (error.response) {
        console.error('Response error data:', error.response.data);
      }
      throw new Error(`Gemini API error: ${error.message || 'Unknown error'}`);
    }
  }

  async streamTextFromLLM(options: any): Promise<AsyncGenerator<string>> {
    // Implementation for streaming
    async function* generateTokens() {
      try {
        yield 'Gemini streaming not yet implemented';
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
    yield 'Gemini streaming not yet implemented';
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
