#!/usr/bin/env node
import { Command } from 'commander';
import readline from 'readline';
import { DefaultAgentRuntime } from './lib/agent-studio/AgentRuntime';
import { MarketAnalysisAgent } from './lib/core/marketAnalysis';
import { AgentConfig } from './lib/agent-studio/types';
import { SQLiteMemoryProvider } from './lib/memory/SQLiteMemoryProvider';
import dotenv from 'dotenv';

// Load .env if present
try { dotenv.config(); } catch {}

const program = new Command();
program
  .name('sovia-github')
  .description('Sovia AI Backend CLI: agent chat, analysis, and integrations')
  .version('1.0.0');

// Default agent config (customize as needed)
const defaultAgentConfig: AgentConfig = {
  id: 'cli-agent',
  name: 'Sovia CLI Agent',
  description: 'A powerful AI agent for chat and analysis',
  provider: 'openai',
  model: 'gpt-4',
  systemPrompt: 'You are Sovia, an expert AI agent.',
  temperature: 0.7,
  maxTokens: 1024,
  capabilities: [],
  memoryEnabled: true,
  memoryConfig: { retentionPeriod: 30, maxMemories: 100 },
  middlewares: [],
  isPublic: false,
  userId: 'cli-user',
  createdAt: new Date(),
  updatedAt: new Date(),
};

program
  .command('chat')
  .description('Start an interactive chat session with the Sovia agent')
  .action(async () => {
    const runtime = new DefaultAgentRuntime();
    const memoryProvider = new SQLiteMemoryProvider('sovia-cli-memory');
    const agent = await runtime.initialize({
      ...defaultAgentConfig,
      apiKey: process.env.OPENAI_API_KEY || '',
    }, { memoryProvider, sessionId: 'cli-session' });

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log('Sovia CLI Agent: Type your message and press Enter. Type "exit" to quit.');
    let currentAgent = agent;
    const prompt = () => rl.question('You: ', async (input) => {
      if (input.trim().toLowerCase() === 'exit') {
        rl.close();
        process.exit(0);
      }
      const { response, updatedInstance } = await runtime.sendMessage(currentAgent, input);
      console.log('Sovia:', response);
      currentAgent = updatedInstance;
      prompt();
    });
    prompt();
  });

program
  .command('analyze')
  .description('Run a one-off market/token analysis')
  .requiredOption('-q, --query <query>', 'Analysis query (e.g., "analyze SOL")')
  .action(async (opts) => {
    const agent = new MarketAnalysisAgent();
    const result = await agent.handleQuery(opts.query);
    console.log(result);
  });

program.parseAsync(process.argv); 