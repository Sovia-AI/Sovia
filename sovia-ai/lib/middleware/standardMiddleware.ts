
import { AgentContext, MiddlewareFunction, Memory } from '../core/types';
import { createMemoryId } from '../utils/idGenerator';

/**
 * Logs request information
 */
export const logRequest: MiddlewareFunction = async (context, next) => {
  console.log(`[${new Date().toISOString()}] Received request from user ${context.userId}`);
  console.log(`Content: ${context.currentInput}`);
  
  await next();
  
  console.log(`[${new Date().toISOString()}] Finished processing request from user ${context.userId}`);
};

/**
 * Validates that the input meets requirements
 */
export const validateInput: MiddlewareFunction = async (context, next) => {
  if (!context.currentInput || context.currentInput.trim() === '') {
    throw new Error('Input cannot be empty');
  }
  
  if (context.currentInput.length > 4000) {
    throw new Error('Input is too long (max 4000 characters)');
  }
  
  await next();
};

/**
 * Loads user context information
 */
export const loadUserContext: MiddlewareFunction = async (context, next) => {
  try {
    // Load user information from the memory provider
    if (context.memoryProvider) {
      const userInfoMemories = await context.memoryProvider.getMemories({
        userId: context.userId,
        agentId: context.agentId,
        type: 'user_info',
        limit: 10
      });
      
      if (userInfoMemories.length > 0) {
        context.metadata = {
          ...context.metadata,
          userProfile: userInfoMemories.reduce((profile, memory) => {
            // Extract user properties from memories
            const content = memory.content.text;
            const [key, value] = content.split(':').map(s => s.trim());
            if (key && value) {
              return { ...profile, [key]: value };
            }
            return profile;
          }, {})
        };
      } else {
        // No user info found, create default profile
        context.metadata = {
          ...context.metadata,
          userProfile: {
            name: 'User',
            preferredLanguage: 'en',
            lastActive: new Date().toISOString()
          }
        };
      }
    }
  } catch (error) {
    console.error('Error loading user context:', error);
  }
  
  await next();
};

/**
 * Loads conversation memory
 */
export const loadConversationMemory: MiddlewareFunction = async (context, next) => {
  if (!context.memoryProvider) {
    console.warn('Memory provider not configured, skipping memory loading');
    await next();
    return;
  }

  try {
    // Load the last 10 conversation memories
    const memories = await context.memoryProvider.getMemories({
      userId: context.userId,
      agentId: context.agentId,
      roomId: context.roomId,
      type: 'conversation',
      limit: 10
    });
    
    context.memories = memories;
    
    // Also construct previous messages array from memories if needed
    if (!context.previousMessages && memories.length > 0) {
      context.previousMessages = memories
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map(memory => {
          const isUserMessage = memory.content.source === 'user';
          return {
            id: memory.id,
            role: isUserMessage ? 'user' : 'assistant',
            content: memory.content.text,
            createdAt: memory.createdAt
          };
        });
    }
  } catch (error) {
    console.error('Error loading conversation memory:', error);
  }
  
  await next();
};

/**
 * Creates a memory from the current input
 */
export const createMemoryFromInput: MiddlewareFunction = async (context, next) => {
  // Process the request first
  await next();
  
  // After processing, store the input as a memory
  if (!context.memoryProvider || !context.currentInput) {
    return;
  }
  
  try {
    // Store user message as a memory
    await context.memoryProvider.createMemory({
      userId: context.userId,
      agentId: context.agentId,
      roomId: context.roomId,
      content: {
        text: context.currentInput,
        source: 'user'
      },
      type: 'conversation'
    });
    
    console.log(`Created memory from input: ${context.currentInput.substring(0, 50)}...`);
  } catch (error) {
    console.error('Error creating memory from input:', error);
  }
};

/**
 * Routes the request to the appropriate handler
 */
export const router: MiddlewareFunction = async (context, next) => {
  // In a real implementation, this would route to different handlers
  // For demonstration, just continue the middleware chain
  await next();
};
