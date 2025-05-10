
import { v4 as uuidv4 } from 'uuid';
import { AgentConfig, AgentRepository } from './types';

/**
 * LocalStorageAgentRepository implements AgentRepository using browser localStorage
 */
export class LocalStorageAgentRepository implements AgentRepository {
  private readonly STORAGE_KEY = 'taigu-agent-studio-agents';

  private getStoredAgents(): AgentConfig[] {
    const storedData = localStorage.getItem(this.STORAGE_KEY);
    if (!storedData) {
      return [];
    }

    try {
      const parsed = JSON.parse(storedData);
      
      // Convert date strings back to Date objects
      return parsed.map((agent: any) => ({
        ...agent,
        createdAt: new Date(agent.createdAt),
        updatedAt: new Date(agent.updatedAt)
      }));
    } catch (error) {
      console.error('Error parsing stored agents:', error);
      return [];
    }
  }

  private saveStoredAgents(agents: AgentConfig[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(agents));
  }

  async getAgents(): Promise<AgentConfig[]> {
    return this.getStoredAgents();
  }

  async getAgentById(id: string): Promise<AgentConfig | null> {
    const agents = this.getStoredAgents();
    const agent = agents.find(a => a.id === id);
    return agent || null;
  }

  async saveAgent(config: AgentConfig): Promise<AgentConfig> {
    const agents = this.getStoredAgents();
    
    // Create new agent if id doesn't exist
    if (!config.id) {
      const newAgent: AgentConfig = {
        ...config,
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      agents.push(newAgent);
      this.saveStoredAgents(agents);
      return newAgent;
    }
    
    // Update existing agent
    const existingIndex = agents.findIndex(a => a.id === config.id);
    if (existingIndex >= 0) {
      const updatedAgent: AgentConfig = {
        ...config,
        updatedAt: new Date()
      };
      
      agents[existingIndex] = updatedAgent;
      this.saveStoredAgents(agents);
      return updatedAgent;
    }
    
    // If we're here, it means an ID was provided but not found
    // Add as a new agent with the provided ID
    const newAgent: AgentConfig = {
      ...config,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    agents.push(newAgent);
    this.saveStoredAgents(agents);
    return newAgent;
  }

  async updateAgent(id: string, updates: Partial<AgentConfig>): Promise<AgentConfig> {
    const agents = this.getStoredAgents();
    const existingIndex = agents.findIndex(a => a.id === id);
    
    if (existingIndex < 0) {
      throw new Error(`Agent with id ${id} not found`);
    }
    
    const updatedAgent: AgentConfig = {
      ...agents[existingIndex],
      ...updates,
      id, // Ensure ID remains unchanged
      updatedAt: new Date()
    };
    
    agents[existingIndex] = updatedAgent;
    this.saveStoredAgents(agents);
    return updatedAgent;
  }

  async deleteAgent(id: string): Promise<boolean> {
    const agents = this.getStoredAgents();
    const initialLength = agents.length;
    
    const filteredAgents = agents.filter(a => a.id !== id);
    this.saveStoredAgents(filteredAgents);
    
    return filteredAgents.length < initialLength;
  }
}
