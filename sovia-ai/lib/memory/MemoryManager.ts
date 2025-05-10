
import { Memory, MemoryProvider } from '../core/types';

interface MemoryManagerOptions {
  provider: MemoryProvider;
  maxMemories?: number;
  memoryRetentionDays?: number;
}

export class MemoryManager {
  private provider: MemoryProvider;
  private maxMemories: number;
  private memoryRetentionDays: number;

  constructor(options: MemoryManagerOptions) {
    this.provider = options.provider;
    this.maxMemories = options.maxMemories || 100;
    this.memoryRetentionDays = options.memoryRetentionDays || 30;
  }

  /**
   * Add a new memory to the store
   */
  async createMemory(memoryData: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>): Promise<Memory> {
    return this.provider.createMemory(memoryData);
  }

  /**
   * Get memories based on query parameters
   */
  async getMemories(query: any): Promise<Memory[]> {
    return this.provider.getMemories(query);
  }

  /**
   * Delete a memory by ID
   */
  async deleteMemory(id: string): Promise<boolean> {
    return this.provider.deleteMemory(id);
  }

  /**
   * Clear memories for a specific user and agent combination
   */
  async clearMemories(userId: string, agentId: string, roomId?: string): Promise<number> {
    return this.provider.clearMemories(userId, agentId, roomId);
  }
}
