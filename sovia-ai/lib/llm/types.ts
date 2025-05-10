// LLM Provider Types

export interface Message {
  id?: string; // Make id optional by adding ? 
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface GenerateOptions {
  model?: string;
  messages: { role: string; content: string }[];
  temperature?: number;
  maxTokens?: number;
  context?: any;
}

export interface GenerateResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface OpenAIProviderOptions {
  apiKey: string;
  model?: string;
  dangerouslyAllowBrowser?: boolean;
  maxRetries?: number; // Add maxRetries property
}

export interface AnthropicProviderOptions {
  apiKey: string;
  model?: string;
  baseUrl?: string; // Add missing properties
  maxRetries?: number;
  requestTimeout?: number;
}

export interface PerplexityProviderOptions {
  apiKey: string;
  model?: string;
}

export interface GeminiProviderOptions {
  apiKey: string;
  model?: string;
}

export interface LlamaProviderOptions {
  model?: string;
}

export interface LLMProvider {
  getTextFromLLM: (params: any) => Promise<string>;
  streamTextFromLLM: (options: any) => Promise<AsyncGenerator<string>>;
  complete: (prompt: string) => Promise<string>;
  generateResponse: (options: GenerateOptions) => Promise<GenerateResponse>;
  stream: (prompt: string) => AsyncGenerator<string>;
}
