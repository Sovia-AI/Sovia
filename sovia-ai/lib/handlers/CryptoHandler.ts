
import { AnalysisConnector } from "@/lib/services/AnalysisConnector";

export class CryptoHandler {
  private analysisConnector: AnalysisConnector;

  constructor(analysisConnector: AnalysisConnector) {
    this.analysisConnector = analysisConnector;
  }

  /**
   * Handle crypto-related commands and queries
   */
  async handleCryptoCommand(params: string): Promise<string> {
    try {
      console.log(`Processing crypto command with params: ${params}`);
      
      // Let the AnalysisConnector handle the token extraction and analysis
      const response = await this.analysisConnector.analyzeQuery(params);
      
      if (response) {
        return response;
      }
      
      return `I couldn't find any information for "${params}". Please try another token symbol or address.`;
    } catch (error) {
      console.error('Error processing crypto command:', error);
      return `Sorry, I encountered an error analyzing "${params}": ${error.message}. Please try again with a different query.`;
    }
  }

  /**
   * Check if a message matches crypto patterns
   */
  static matchesCryptoPatterns(message: string, patterns: RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(message));
  }
}
