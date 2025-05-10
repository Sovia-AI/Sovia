
import { AgentConfig, AgentProvider, AgentModel } from './types';
import { v4 as uuidv4 } from 'uuid';

export class AgentFactory {
  static createDefaultConfig(userId: string): AgentConfig {
    return {
      id: uuidv4(),
      name: "New Agent",
      description: "A helpful AI assistant",
      createdAt: new Date(),
      updatedAt: new Date(),
      provider: "openai" as AgentProvider,
      model: "gpt-4o-mini",
      systemPrompt: "You are a helpful AI assistant. Answer questions accurately and concisely.",
      temperature: 0.7,
      maxTokens: 2000,
      capabilities: [
        {
          id: "general_knowledge",
          name: "General Knowledge",
          description: "Basic question answering and knowledge retrieval",
          enabled: true
        },
        {
          id: "crypto_analysis",
          name: "Crypto Analysis",
          description: "Cryptocurrency market and technical analysis",
          enabled: false
        },
        {
          id: "token_lookup",
          name: "Token Lookup",
          description: "Look up token information by symbol or address",
          enabled: false
        },
        {
          id: "weather_forecast",
          name: "Weather Forecast",
          description: "Current conditions and forecasts",
          enabled: false
        },
        {
          id: "astronomy_data",
          name: "Astronomy Data",
          description: "Sun/moon information and astronomical events",
          enabled: false
        },
        {
          id: "pet_finder",
          name: "Pet Finder",
          description: "Find adoptable pets by location and preferences",
          enabled: false
        },
        {
          id: "breed_info",
          name: "Breed Information",
          description: "Details about different animal breeds",
          enabled: false
        }
      ],
      personality: {
        tone: "friendly",
        style: "concise",
        traits: ["helpful", "informative"]
      },
      memoryEnabled: true,
      memoryConfig: {
        retentionPeriod: 30,
        maxMemories: 100
      },
      middlewares: ["core"],
      isPublic: false,
      userId
    };
  }

  static createCryptoAnalystAgent(userId: string): AgentConfig {
    return {
      id: uuidv4(),
      name: "Crypto Analyst",
      description: "Specialized in cryptocurrency market analysis",
      avatar: "/lovable-uploads/4432b8c9-8790-464a-bd2a-da17b6889717.png",
      createdAt: new Date(),
      updatedAt: new Date(),
      provider: "openai" as AgentProvider,
      model: "gpt-4o-mini",
      systemPrompt: 
        "You are a cryptocurrency market analyst specializing in technical analysis. " +
        "Provide insights on market trends, price movements, and technical indicators. " +
        "Always include relevant data like RSI, MACD, and support/resistance levels in your answers. " +
        "Be concise and focus on actionable insights.",
      temperature: 0.5,
      maxTokens: 2000,
      capabilities: [
        {
          id: "crypto_analysis",
          name: "Crypto Analysis",
          description: "Cryptocurrency market and technical analysis",
          enabled: true
        },
        {
          id: "token_lookup",
          name: "Token Lookup",
          description: "Look up token information by symbol or address",
          enabled: true
        }
      ],
      personality: {
        tone: "professional",
        style: "analytical",
        traits: ["precise", "data-driven", "insightful"]
      },
      memoryEnabled: true,
      memoryConfig: {
        retentionPeriod: 7,
        maxMemories: 50
      },
      middlewares: ["core", "market_analysis"],
      isPublic: false,
      userId
    };
  }

  static createWeatherAssistantAgent(userId: string): AgentConfig {
    return {
      id: uuidv4(),
      name: "Weather Assistant",
      description: "Provides weather forecasts and information",
      avatar: "/lovable-uploads/c142798c-eaff-41c8-a5be-0e7e126cf332.png", 
      createdAt: new Date(),
      updatedAt: new Date(),
      provider: "openai" as AgentProvider,
      model: "gpt-4o-mini",
      systemPrompt: 
        "You are a weather assistant that provides accurate weather forecasts and information. " +
        "When asked about the weather, always provide temperature, feels-like temperature, " +
        "humidity, wind speed, and conditions. Include tomorrow's forecast when relevant. " +
        "Be friendly and concise in your responses.",
      temperature: 0.6,
      maxTokens: 1500,
      capabilities: [
        {
          id: "weather_forecast",
          name: "Weather Forecast",
          description: "Current conditions and forecasts",
          enabled: true
        },
        {
          id: "astronomy_data",
          name: "Astronomy Data",
          description: "Sun/moon information and astronomical events",
          enabled: true
        }
      ],
      personality: {
        tone: "friendly",
        style: "conversational",
        traits: ["helpful", "informative", "concise"]
      },
      memoryEnabled: true,
      memoryConfig: {
        retentionPeriod: 3,
        maxMemories: 30
      },
      middlewares: ["core", "weather"],
      isPublic: false,
      userId
    };
  }

  static createPetAdoptionAgent(userId: string): AgentConfig {
    return {
      id: uuidv4(),
      name: "Pet Adoption Assistant",
      description: "Helps with pet adoption and animal information",
      avatar: "/lovable-uploads/c2502dce-3d40-438b-8b81-b3fd8976fc0c.png",
      createdAt: new Date(),
      updatedAt: new Date(),
      provider: "openai" as AgentProvider,
      model: "gpt-4o-mini",
      systemPrompt: 
        "You are a pet adoption assistant that helps people find adoptable pets and provides information " +
        "about different animal breeds, care requirements, and adoption processes. Be warm, supportive, " +
        "and encouraging while maintaining accuracy in your information.",
      temperature: 0.7,
      maxTokens: 1800,
      capabilities: [
        {
          id: "pet_finder",
          name: "Pet Finder",
          description: "Find adoptable pets by location and preferences",
          enabled: true
        },
        {
          id: "breed_info",
          name: "Breed Information",
          description: "Details about different animal breeds",
          enabled: true
        }
      ],
      personality: {
        tone: "warm",
        style: "supportive",
        traits: ["compassionate", "knowledgeable", "encouraging"]
      },
      memoryEnabled: true,
      memoryConfig: {
        retentionPeriod: 14,
        maxMemories: 40
      },
      middlewares: ["core", "pet_adoption"],
      isPublic: false,
      userId
    };
  }
}
