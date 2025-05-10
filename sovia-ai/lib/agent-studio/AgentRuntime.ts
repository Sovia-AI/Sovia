
import { AgentConfig, AgentInstance, AgentRunOptions, AgentRuntime, AgentProvider } from './types';
import { Message } from '@/lib/llm/types';
import { OpenAIProvider } from '@/lib/llm/OpenAIProvider';
import { AnthropicProvider } from '@/lib/llm/AnthropicProvider';
import { PerplexityProvider } from '@/lib/llm/PerplexityProvider';
import { GeminiProvider } from '@/lib/llm/GeminiProvider';
import { LlamaProvider } from '@/lib/llm/LlamaProvider';
import { MemoryManager } from '@/lib/memory/MemoryManager';
import { SQLiteMemoryProvider } from '@/lib/memory/SQLiteMemoryProvider';
import { getApiKeyFromTemporaryStorage } from '@/lib/config/apiKeys';
import { AnthropicProviderOptions, PerplexityProviderOptions, GeminiProviderOptions } from '@/lib/llm/types';

export class DefaultAgentRuntime implements AgentRuntime {
  private memoryManager: MemoryManager | null = null;
  
  private getProvider(config: AgentConfig) {
    // Get API key from session storage or config
    let apiKey = config.apiKey || '';
    
    // If no API key provided directly, try to get it from session storage
    if (!apiKey) {
      const storedApiKey = getApiKeyFromTemporaryStorage(config.provider);
      if (storedApiKey) {
        apiKey = storedApiKey;
      }
    }
    
    // If no API key is provided and one is required, log a warning
    if (!apiKey && config.provider !== 'llama') {
      console.warn(`No API key provided for ${config.provider}. API calls will likely fail.`);
    }
    
    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider({
          apiKey: apiKey,
          model: config.model,
          dangerouslyAllowBrowser: true
        });
      case 'anthropic':
        return new AnthropicProvider({
          apiKey: apiKey,
          model: config.model || 'claude-3-opus-20240229'
        });
      case 'perplexity':
        return new PerplexityProvider({
          apiKey: apiKey,
          model: config.model || 'llama-3.1-sonar-small-128k-online'
        });
      case 'gemini':
        return new GeminiProvider({
          apiKey: apiKey,
          model: config.model || 'gemini-pro'
        });
      case 'llama':
        return new LlamaProvider({
          model: config.model || 'llama-3.1-8b-instruct',
          endpoint: apiKey || 'https://api.llama-api.com'
        });
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  async initialize(config: AgentConfig, options?: AgentRunOptions): Promise<AgentInstance> {
    // Initialize memory if enabled
    if (config.memoryEnabled && options?.memoryProvider) {
      this.memoryManager = new MemoryManager({
        provider: options.memoryProvider,
        maxMemories: config.memoryConfig?.maxMemories || 100,
        memoryRetentionDays: config.memoryConfig?.retentionPeriod || 30
      });
    }

    // Create initial system message
    const systemMessage: Message = {
      role: 'system',
      content: config.systemPrompt
    };

    // Return initialized agent instance
    return {
      config,
      status: 'idle',
      history: [systemMessage]
    };
  }

  async sendMessage(
    instance: AgentInstance,
    content: string
  ): Promise<{ response: string; updatedInstance: AgentInstance }> {
    try {
      // Update instance status
      const updatedInstance: AgentInstance = {
        ...instance,
        status: 'thinking'
      };

      // Add user message to history
      const userMessage: Message = { role: 'user', content };
      updatedInstance.history = [...updatedInstance.history, userMessage];

      // Get the appropriate provider
      const provider = this.getProvider(instance.config);

      // Prepare messages for LLM
      const messages = updatedInstance.history.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Get response from LLM
      const llmResponse = await provider.generateResponse({
        messages,
        temperature: instance.config.temperature,
        maxTokens: instance.config.maxTokens
      });

      // Add assistant response to history
      const assistantMessage: Message = {
        role: 'assistant',
        content: llmResponse.content
      };
      
      updatedInstance.history = [...updatedInstance.history, assistantMessage];
      updatedInstance.status = 'idle';

      // Store in memory if enabled
      if (this.memoryManager && instance.config.memoryEnabled) {
        await this.memoryManager.createMemory({
          userId: instance.config.userId,
          agentId: instance.config.id,
          content: {
            text: content,
            source: 'user'
          },
          type: 'message'
        });

        await this.memoryManager.createMemory({
          userId: instance.config.userId,
          agentId: instance.config.id,
          content: {
            text: llmResponse.content,
            source: 'assistant'
          },
          type: 'message'
        });
      }

      return {
        response: llmResponse.content,
        updatedInstance
      };
    } catch (error) {
      console.error('Error in agent runtime:', error);
      
      const errorInstance: AgentInstance = {
        ...instance,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
      
      return {
        response: 'I encountered an error while processing your request. Please try again later.',
        updatedInstance: errorInstance
      };
    }
  }

  async streamMessage(
    instance: AgentInstance,
    content: string,
    onToken: (token: string) => void,
    onComplete: (response: string, updatedInstance: AgentInstance) => void
  ): Promise<void> {
    try {
      // Update instance status
      const updatedInstance: AgentInstance = {
        ...instance,
        status: 'thinking'
      };

      // Add user message to history
      const userMessage: Message = { role: 'user', content };
      updatedInstance.history = [...updatedInstance.history, userMessage];

      // Get the appropriate provider
      const provider = this.getProvider(instance.config);
      
      // We need the provider to have the stream method
      if (!provider.stream) {
        throw new Error(`Provider ${instance.config.provider} does not support streaming`);
      }

      // Prepare the prompt
      const prompt = updatedInstance.history.map(msg => 
        `${msg.role === 'system' ? 'System: ' : msg.role === 'user' ? 'User: ' : 'Assistant: '}${msg.content}`
      ).join('\n\n');

      // Start streaming
      let fullResponse = '';
      const stream = await provider.stream(prompt);

      for await (const token of stream) {
        fullResponse += token;
        onToken(token);
      }

      // Add assistant response to history
      const assistantMessage: Message = {
        role: 'assistant',
        content: fullResponse
      };
      
      updatedInstance.history = [...updatedInstance.history, assistantMessage];
      updatedInstance.status = 'idle';

      // Store in memory if enabled
      if (this.memoryManager && instance.config.memoryEnabled) {
        await this.memoryManager.createMemory({
          userId: instance.config.userId,
          agentId: instance.config.id,
          content: {
            text: content,
            source: 'user'
          },
          type: 'message'
        });

        await this.memoryManager.createMemory({
          userId: instance.config.userId,
          agentId: instance.config.id,
          content: {
            text: fullResponse,
            source: 'assistant'
          },
          type: 'message'
        });
      }

      // Call onComplete with the full response and updated instance
      onComplete(fullResponse, updatedInstance);
    } catch (error) {
      console.error('Error in agent runtime streaming:', error);
      
      const errorInstance: AgentInstance = {
        ...instance,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
      
      onComplete(
        'I encountered an error while processing your request. Please try again later.',
        errorInstance
      );
    }
  }

  async resetConversation(instance: AgentInstance): Promise<AgentInstance> {
    // Keep only the system message
    const systemMessage = instance.history.find(msg => msg.role === 'system');
    
    if (!systemMessage) {
      throw new Error('System message not found in conversation history');
    }
    
    return {
      ...instance,
      status: 'idle',
      history: [systemMessage],
      error: undefined
    };
  }
}
