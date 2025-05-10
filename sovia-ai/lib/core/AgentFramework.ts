
import { AgentContext, AgentFrameworkOptions, MiddlewareFunction, Request, Response, Message } from './types';
import { createRequestId } from '../utils/idGenerator';
import { MarketAnalysisAgent } from './marketAnalysis';
import { PetHandler } from '../handlers/PetHandler';
import { PetfinderService } from '../integrations/PetfinderService';

export class AgentFramework {
  private middlewares: MiddlewareFunction[] = [];
  private marketAnalyzer: MarketAnalysisAgent;
  private petHandler: PetHandler;
  private petfinderService: PetfinderService;

  constructor(options: AgentFrameworkOptions) {
    this.marketAnalyzer = new MarketAnalysisAgent();
    
    // Initialize PetFinder service
    this.petfinderService = new PetfinderService({
      apiKey: process.env.PETFINDER_API_KEY || 'API_KEY',
      secret: process.env.PETFINDER_SECRET || 'SECRET'
    });
    
    // Initialize PetHandler with PetfinderService
    this.petHandler = new PetHandler(this.petfinderService);
  }

  public use(middleware: MiddlewareFunction): void {
    this.middlewares.push(middleware);
  }

  public async handleRequest(request: Request, response: Response): Promise<void> {
    const context: AgentContext = {
      userId: request.userId,
      agentId: request.agentId,
      history: [],
      lastToken: undefined,
      response: undefined,
      marketContext: {}
    };

    try {
      // Create middleware chain
      const executeMiddleware = async (index: number): Promise<void> => {
        if (index < this.middlewares.length) {
          await this.middlewares[index](context, async () => {
            await executeMiddleware(index + 1);
          });
        }
      };

      // Start middleware chain
      await executeMiddleware(0);
      
      // If no middleware handled the request, check if it's a pet-related query
      if (!context.response) {
        const isPetQuery = PetfinderService.isPetRelatedQuery(request.content);
        
        if (isPetQuery) {
          try {
            console.log('Processing pet-related query:', request.content);
            const petResponse = await this.petHandler.handlePetCommand(request.content);
            if (petResponse) {
              context.response = petResponse;
            }
          } catch (error) {
            console.error('Error processing pet query:', error);
          }
        }
      }

      // If still no response, try market analysis
      if (!context.response) {
        try {
          const analysis = await this.marketAnalyzer.handleQuery(request.content);
          if (analysis) {
            context.response = analysis;
            
            // Update market context
            if (context.lastToken) {
              context.marketContext = {
                ...context.marketContext,
                lastAnalyzedToken: context.lastToken,
                lastAnalysisTimestamp: Date.now()
              };
            }
          }
        } catch (error) {
          console.error('Error in market analysis:', error);
        }
      }

      // If still no response, provide a default one
      if (!context.response) {
        context.response = "I'm not sure how to help with that. Could you try rephrasing your question? If you're asking about a specific token, please provide its name or address. 🤔";
      }

      // Update conversation history
      context.history.push(
        { role: 'user', content: request.content } as Message,
        { role: 'assistant', content: context.response } as Message
      );

      // Send the response
      await response.send(context.response);

    } catch (error) {
      console.error('Error handling request:', error);
      await response.error(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }

  public async start(): Promise<void> {
    console.log('Agent framework started');
    // In a real implementation, this might start servers or other services
  }
}
