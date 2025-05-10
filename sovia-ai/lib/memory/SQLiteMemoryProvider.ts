
import { Memory, MemoryProvider } from '../core/types';

export class SQLiteMemoryProvider implements MemoryProvider {
  private dbName: string;
  private memories: Memory[] = [];
  private nextId = 1;

  constructor(dbName: string) {
    this.dbName = dbName;
    console.log(`Initializing SQLiteMemoryProvider with database: ${dbName}`);
    // In a real implementation, this would initialize the SQLite database
  }

  async createMemory(memoryData: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>): Promise<Memory> {
    // Generate a new memory with ID and timestamps
    const newMemory: Memory = {
      ...memoryData,
      id: `mem_${this.nextId++}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add to in-memory store
    this.memories.push(newMemory);
    
    return newMemory;
  }

  async getMemories(query: any): Promise<Memory[]> {
    // Simple filtering based on query parameters
    return this.memories.filter(mem => {
      if (query.userId && mem.userId !== query.userId) return false;
      if (query.agentId && mem.agentId !== query.agentId) return false;
      if (query.type && mem.type !== query.type) return false;
      return true;
    });
  }

  async deleteMemory(id: string): Promise<boolean> {
    const initialLength = this.memories.length;
    this.memories = this.memories.filter(mem => mem.id !== id);
    return this.memories.length < initialLength;
  }

  async clearMemories(userId: string, agentId: string, roomId?: string): Promise<number> {
    const initialLength = this.memories.length;
    this.memories = this.memories.filter(mem => {
      if (mem.userId !== userId) return true;
      if (mem.agentId !== agentId) return true;
      if (roomId && mem.roomId !== roomId) return true;
      return false;
    });
    return initialLength - this.memories.length;
  }
}
