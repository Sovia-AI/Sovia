
import { Message } from "@/lib/llm/types";
import { MemoryProvider } from "@/lib/memory/types";

export type AgentProvider = "openai" | "anthropic" | "perplexity" | "gemini" | "llama";
export type AgentModel = string;

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface AgentPersonality {
  tone: string;
  style: string;
  traits: string[];
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  provider: AgentProvider;
  model: AgentModel;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  capabilities: AgentCapability[];
  personality?: AgentPersonality;
  memoryEnabled: boolean;
  memoryConfig?: {
    retentionPeriod: number; // in days
    maxMemories: number;
  };
  middlewares: string[];
  isPublic: boolean;
  userId: string;
  apiKey?: string;
  tools?: string[]; // Added the tools property as an optional string array
}

export interface AgentInstance {
  config: AgentConfig;
  status: "idle" | "thinking" | "responding" | "error";
  history: Message[];
  error?: string;
}

export interface AgentRunOptions {
  memoryProvider?: MemoryProvider;
  sessionId?: string;
  enableStreaming?: boolean;
}

export interface AgentRepository {
  getAgents(): Promise<AgentConfig[]>;
  getAgentById(id: string): Promise<AgentConfig | null>;
  saveAgent(config: AgentConfig): Promise<AgentConfig>;
  updateAgent(id: string, updates: Partial<AgentConfig>): Promise<AgentConfig>;
  deleteAgent(id: string): Promise<boolean>;
}

export interface AgentRuntime {
  initialize(config: AgentConfig, options?: AgentRunOptions): Promise<AgentInstance>;
  sendMessage(instance: AgentInstance, content: string): Promise<{
    response: string;
    updatedInstance: AgentInstance;
  }>;
  streamMessage(
    instance: AgentInstance,
    content: string,
    onToken: (token: string) => void,
    onComplete: (response: string, updatedInstance: AgentInstance) => void
  ): Promise<void>;
  resetConversation(instance: AgentInstance): Promise<AgentInstance>;
}

export interface CapabilityService {
  id: string;
  name: string;
  description: string;
  initialize(): Promise<void>;
  handleRequest(instance: AgentInstance, message: string): Promise<string | null>;
}
