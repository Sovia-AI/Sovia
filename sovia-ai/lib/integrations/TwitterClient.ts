import { BaseAgent } from '../core/BaseAgent';
import { AgentContext } from '../core/types';

interface TwitterClientOptions {
  username: string;
  apiKey: string;
  apiSecretKey: string;
  accessToken: string;
  accessTokenSecret: string;
  bearerToken: string;
  retryLimit?: number;
  postIntervalHours?: number;
  pollingInterval?: number; // minutes
  dryRun?: boolean;
}

interface TwitterMention {
  id: string;
  text: string;
  username: string;
  createdAt: Date;
}

interface TwitterErrorResponse {
  errors?: { message: string; code: number }[];
  detail?: string;
}

type PostHandlerFunction = (context: AgentContext) => Promise<string>;
type MentionHandlerFunction = (mention: TwitterMention, context: AgentContext) => Promise<string>;

export class TwitterClient {
  private agent: BaseAgent;
  private options: TwitterClientOptions;
  private postHandler: PostHandlerFunction | null = null;
  private mentionHandler: MentionHandlerFunction | null = null;
  private isRunning = false;
  private postTimer: NodeJS.Timeout | null = null;
  private pollTimer: NodeJS.Timeout | null = null;
  private lastSeenMentionId: string | null = null;
  private apiBaseUrl = 'https://api.twitter.com/2';
  
  constructor(agent: BaseAgent, options: TwitterClientOptions) {
    this.agent = agent;
    this.options = {
      ...options,
      retryLimit: options.retryLimit || 3,
      postIntervalHours: options.postIntervalHours || 4,
      pollingInterval: options.pollingInterval || 5,
      dryRun: options.dryRun || false
    };
  }
  
  setPostHandler(handler: PostHandlerFunction): void {
    this.postHandler = handler;
  }
  
  setMentionHandler(handler: MentionHandlerFunction): void {
    this.mentionHandler = handler;
  }
  
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Twitter client is already running');
      return;
    }
    
    if (!this.postHandler) {
      console.warn('No post handler set. Tweets will not be posted automatically.');
    }
    
    if (!this.mentionHandler) {
      console.warn('No mention handler set. Mentions will not be responded to.');
    }
    
    try {
      console.log('Starting Twitter client...');
      
      // Validate Twitter API credentials by making a test call
      if (!this.options.dryRun) {
        await this.validateCredentials();
        console.log(`Authentication successful as ${this.options.username}`);
        
        // Set up scheduled posting
        const postIntervalMs = this.options.postIntervalHours! * 60 * 60 * 1000;
        this.postTimer = setInterval(() => this.createScheduledPost(), postIntervalMs);
        console.log(`Scheduled posts every ${this.options.postIntervalHours} hours`);
        
        // Set up mention polling
        const pollingIntervalMs = this.options.pollingInterval! * 60 * 1000;
        this.pollTimer = setInterval(() => this.checkMentions(), pollingIntervalMs);
        console.log(`Checking for mentions every ${this.options.pollingInterval} minutes`);
      } else {
        console.log('Running in dry-run mode. No actual posts or responses will be made.');
      }
      
      this.isRunning = true;
      console.log('Twitter client started successfully');
    } catch (error) {
      console.error('Failed to start Twitter client:', error);
      throw new Error(`Failed to start Twitter client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }
    
    if (this.postTimer) {
      clearInterval(this.postTimer);
      this.postTimer = null;
    }
    
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    
    this.isRunning = false;
    console.log('Twitter client stopped');
  }
  
  async createPost(content: string): Promise<string> {
    if (content.length > 280) {
      throw new Error(`Tweet too long: ${content.length} characters (max 280)`);
    }
    
    console.log(`Creating tweet: ${content}`);
    
    if (this.options.dryRun) {
      console.log('[DRY RUN] Tweet would be posted:', content);
      return `dry-run-tweet-id-${Date.now()}`;
    }
    
    // Create tweet via Twitter API
    try {
      const url = `${this.apiBaseUrl}/tweets`;
      const body = JSON.stringify({ text: content });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.options.bearerToken}`
        },
        body
      });
      
      if (!response.ok) {
        const errorData: TwitterErrorResponse = await response.json();
        const errorMessage = this.formatTwitterError(errorData);
        throw new Error(`Twitter API Error: ${errorMessage}`);
      }
      
      const data = await response.json();
      console.log(`Tweet created with ID: ${data.data.id}`);
      
      return data.data.id;
    } catch (error) {
      console.error('Error creating tweet:', error);
      throw new Error(`Failed to create tweet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async replyToTweet(tweetId: string, content: string): Promise<string> {
    if (content.length > 280) {
      throw new Error(`Reply too long: ${content.length} characters (max 280)`);
    }
    
    console.log(`Replying to tweet ${tweetId}: ${content}`);
    
    if (this.options.dryRun) {
      console.log(`[DRY RUN] Reply would be posted to ${tweetId}:`, content);
      return `dry-run-reply-id-${Date.now()}`;
    }
    
    // Create reply via Twitter API
    try {
      const url = `${this.apiBaseUrl}/tweets`;
      const body = JSON.stringify({ 
        text: content,
        reply: { in_reply_to_tweet_id: tweetId }
      });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.options.bearerToken}`
        },
        body
      });
      
      if (!response.ok) {
        const errorData: TwitterErrorResponse = await response.json();
        const errorMessage = this.formatTwitterError(errorData);
        throw new Error(`Twitter API Error: ${errorMessage}`);
      }
      
      const data = await response.json();
      console.log(`Reply created with ID: ${data.data.id}`);
      
      return data.data.id;
    } catch (error) {
      console.error('Error creating reply:', error);
      throw new Error(`Failed to create reply: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private async validateCredentials(): Promise<void> {
    try {
      // Try to get user information to validate credentials
      const url = `${this.apiBaseUrl}/users/me`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.options.bearerToken}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Twitter API Error: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('Authentication validation failed:', error);
      throw new Error('Twitter API authentication failed. Please check your credentials.');
    }
  }
  
  private async createScheduledPost(): Promise<void> {
    if (!this.postHandler) {
      console.warn('No post handler set. Skipping scheduled post.');
      return;
    }
    
    try {
      const agentId = this.agent.character.agentId;
      const userId = `twitter_${this.options.username}`;
      
      const context: AgentContext = {
        userId: userId || 'anonymous',
        agentId: agentId,
        memoryProvider: undefined,
        history: [] // Add missing required history property
      };
      
      const content = await this.postHandler(context);
      
      if (content) {
        await this.createPost(content);
      } else {
        console.log('Post handler returned empty content. No tweet created.');
      }
    } catch (error) {
      console.error('Error creating scheduled post:', error);
    }
  }
  
  private async checkMentions(): Promise<void> {
    if (!this.mentionHandler) {
      return;
    }
    
    try {
      const url = `${this.apiBaseUrl}/users/by/username/${this.options.username}/mentions`;
      const params = new URLSearchParams({
        'max_results': '10',
        'tweet.fields': 'created_at',
        'expansions': 'author_id'
      });
      
      if (this.lastSeenMentionId) {
        params.append('since_id', this.lastSeenMentionId);
      }
      
      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.options.bearerToken}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Twitter API Error: ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      
      if (!data.data || data.data.length === 0) {
        return; // No new mentions
      }
      
      console.log(`Found ${data.data.length} new mentions`);
      
      // Create a map of user IDs to usernames
      const userMap = new Map();
      if (data.includes && data.includes.users) {
        data.includes.users.forEach((user: any) => {
          userMap.set(user.id, user.username);
        });
      }
      
      // Process mentions in chronological order (oldest first)
      const sortedMentions = [...data.data].sort((a, b) => {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
      
      for (const mention of sortedMentions) {
        // Update last seen mention ID to most recent one
        if (!this.lastSeenMentionId || mention.id > this.lastSeenMentionId) {
          this.lastSeenMentionId = mention.id;
        }
        
        const username = userMap.get(mention.author_id) || 'unknown_user';
        
        await this.processMention({
          id: mention.id,
          text: mention.text,
          username: username,
          createdAt: new Date(mention.created_at)
        });
      }
    } catch (error) {
      console.error('Error checking mentions:', error);
    }
  }
  
  private async processMention(mention: TwitterMention): Promise<void> {
    if (!this.mentionHandler) {
      return;
    }
    
    try {
      const agentId = this.agent.character.agentId;
      const userId = `twitter_${mention.username}`;
      
      const context: AgentContext = {
        userId: userId || 'anonymous',
        agentId: agentId,
        currentInput: mention.text,
        memoryProvider: undefined,
        history: [] // Add missing required history property
      };
      
      const response = await this.mentionHandler(mention, context);
      
      if (response) {
        await this.replyToTweet(mention.id, response);
      }
    } catch (error) {
      console.error(`Error processing mention ${mention.id}:`, error);
    }
  }
  
  private formatTwitterError(errorData: TwitterErrorResponse): string {
    if (errorData.errors && errorData.errors.length > 0) {
      const error = errorData.errors[0];
      return `${error.message} (code: ${error.code})`;
    } else if (errorData.detail) {
      return errorData.detail;
    } else {
      return 'Unknown Twitter API error';
    }
  }
}
