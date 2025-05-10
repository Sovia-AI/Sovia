
export interface MemoryProvider {
  createMemory: (memory: any) => Promise<any>;
  getMemories: (query: any) => Promise<any[]>;
  deleteMemory: (id: string) => Promise<boolean>;
  clearMemories: (userId: string, agentId: string, roomId?: string) => Promise<number>;
}
