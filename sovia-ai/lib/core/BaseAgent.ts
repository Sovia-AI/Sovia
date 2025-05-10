
import { Character, AgentContext, Request, Response, Route } from './types';
import { OpenAIProvider } from '../llm/OpenAIProvider';
import { AnthropicProvider } from '../llm/AnthropicProvider';
import { PerplexityProvider } from '../llm/PerplexityProvider';
import { GeminiProvider } from '../llm/GeminiProvider';
import { LlamaProvider } from '../llm/LlamaProvider';
import { getApiKeyFromTemporaryStorage } from '../config/apiKeys';
import { 
  OpenAIProviderOptions, 
  AnthropicProviderOptions,
  PerplexityProviderOptions,
  GeminiProviderOptions,
  LlamaProviderOptions,
  LLMProvider
} from '../llm/types';

export class BaseAgent {
  character: Character;
  llmProvider: 'openai' | 'anthropic' | 'perplexity' | 'gemini' | 'llama';
  
  constructor(character: Character, llmProvider: 'openai' | 'anthropic' | 'perplexity' | 'gemini' | 'llama' = 'openai') {
    this.character = character;
    this.llmProvider = llmProvider;
  }

  async handleRequest(req: Request, res: Response): Promise<void> {
    const llm = this.getLLMProvider();
    const prompt = this.buildPrompt(req.body.message);

    try {
      const result = await llm.getTextFromLLM({
        prompt,
        temperature: 0.7,
        maxTokens: 2000,
      });
      await res.send(result);
    } catch (error: any) {
      console.error("LLM call failed:", error);
      await res.error(`LLM call failed: ${error.message}`);
    }
  }

  buildPrompt(userMessage: string): string {
    return `${this.character.systemPrompt}\n\n${userMessage}`;
  }

  getLLMProvider(): LLMProvider {
    switch (this.llmProvider) {
      case 'openai':
        const openAiApiKey = getApiKeyFromTemporaryStorage('openai') || process.env.OPENAI_API_KEY;
        if (!openAiApiKey) {
          throw new Error('OpenAI API key is required.');
        }
        return new OpenAIProvider({ apiKey: openAiApiKey });
      case 'anthropic':
        const anthropicApiKey = getApiKeyFromTemporaryStorage('anthropic') || process.env.ANTHROPIC_API_KEY;
        if (!anthropicApiKey) {
          throw new Error('Anthropic API key is required.');
        }
        return new AnthropicProvider({ apiKey: anthropicApiKey });
      case 'perplexity':
        const perplexityApiKey = getApiKeyFromTemporaryStorage('perplexity') || process.env.PERPLEXITY_API_KEY;
        if (!perplexityApiKey) {
          throw new Error('Perplexity API key is required.');
        }
        return new PerplexityProvider({ apiKey: perplexityApiKey });
      case 'gemini':
        const geminiApiKey = getApiKeyFromTemporaryStorage('gemini') || process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
          throw new Error('Gemini API key is required.');
        }
        return new GeminiProvider({ apiKey: geminiApiKey });
      case 'llama':
        return new LlamaProvider({});
      default:
        throw new Error(`Invalid LLM provider: ${this.llmProvider}`);
    }
  }
  
  // Add getCharacter method to fix TwitterClient errors
  getCharacter(): Character {
    return this.character;
  }
}
