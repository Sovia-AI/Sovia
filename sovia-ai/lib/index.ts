
/**
 * Main TAIGU Framework Exports
 */

// Core exports
export { BaseAgent } from './core/BaseAgent';
export { AgentFramework } from './core/AgentFramework';
export type {
  Character,
  MessageExample,
  CharacterStyle,
  AgentContext,
  Memory,
  Message,
  Request,
  Response,
  Route,
  MiddlewareFunction,
  AgentFrameworkOptions,
  MemoryProvider,
  ModelProvider
} from './core/types';

// Memory management
export { MemoryManager } from './memory/MemoryManager';
export { SQLiteMemoryProvider } from './memory/SQLiteMemoryProvider';

// LLM providers
export { OpenAIProvider } from './llm/OpenAIProvider';
export { AnthropicProvider } from './llm/AnthropicProvider';
export { PerplexityProvider } from './llm/PerplexityProvider';
export { GeminiProvider } from './llm/GeminiProvider';

// Middleware
export {
  logRequest,
  validateInput,
  loadUserContext,
  loadConversationMemory,
  createMemoryFromInput,
  router
} from './middleware/standardMiddleware';

// Integrations
export { WeatherService } from './integrations/WeatherService';
// Change to export type for CryptoService
export type { CryptoService } from './integrations/CryptoService';
export { RadiumService } from './integrations/RadiumService';
export { TwitterClient } from './integrations/TwitterClient';

// Plugins
export { ShopifyPlugin } from './plugins/ShopifyPlugin';

// Utils
export {
  createRequestId,
  createMemoryId,
  createMessageId
} from './utils/idGenerator';
