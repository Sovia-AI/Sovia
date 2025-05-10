
import axios from 'axios';

export class SolscanService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = 'https://public-api.solscan.io/token';
  }

  /**
   * Fetch token holders data from Solscan
   * @param tokenAddress The token address to fetch holders data for
   * @returns Token holders data from Solscan
   */
  async fetchTokenHolders(tokenAddress: string) {
    try {
      console.log(`Fetching Solscan data for address: ${tokenAddress}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Return mock data
      return {
        holders: Math.floor(Math.random() * 50000),
        largestHolders: [
          { address: '3FZbgi29cpjq2f139..', amount: Math.random() * 1000000, percentage: Math.random() * 10 },
          { address: '7Zj4Qh1pLqtfH97a..', amount: Math.random() * 500000, percentage: Math.random() * 5 },
          { address: '9KkMdgDx8ULoe21N..', amount: Math.random() * 100000, percentage: Math.random() * 3 }
        ],
        holderDistribution: {
          whales: Math.random() * 20,
          large: Math.random() * 30,
          medium: Math.random() * 25,
          small: Math.random() * 25
        }
      };
    } catch (error) {
      console.error('Error fetching token holders from Solscan:', error);
      return null;
    }
  }
}
