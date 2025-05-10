
import { PumpFunService } from "@/lib/services/PumpFunService";
import { TokenMetadata, TokenCreationResponse } from "@/lib/types/tokenTypes";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";

export class TokenCreationHandler {
  private pumpFunService: PumpFunService;

  constructor(pumpFunService: PumpFunService) {
    this.pumpFunService = pumpFunService;
  }

  /**
   * Create a token with enhanced metadata
   */
  async createToken(tokenData: TokenMetadata): Promise<TokenCreationResponse> {
    try {
      // Prepare metadata URI with all the additional metadata
      const metadata = {
        name: tokenData.name,
        symbol: tokenData.symbol,
        description: tokenData.description,
        image: tokenData.imageUrl,
        socials: tokenData.socials,
        properties: {
          ...tokenData.advanced
        }
      };

      console.log("Creating token with metadata:", metadata);
      
      // Generate metadata URI (in a real implementation, this would upload to Arweave or similar)
      const metadataUri = "https://arweave.net/placeholder";
      
      // Create token onchain 
      // Note: In a real implementation, we would use the wallet from context to sign transactions
      const walletAddress = "placeholder"; // This will be replaced with actual wallet.publicKey.toString()
      
      // Call the service to create the token
      // Use the createTokenTransaction method instead since createToken doesn't exist
      const result = await this.pumpFunService.createTokenTransaction(
        walletAddress,
        tokenData.name,
        tokenData.symbol,
        metadataUri
      );
      
      console.log("Token created:", result);
      
      // Return the response
      return {
        signature: result.signature,
        mint: result.mint,
        success: true
      };
    } catch (error) {
      console.error("Error creating token:", error);
      return {
        signature: "",
        mint: "",
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
}

// React hook for using the token creation functionality
export function useTokenCreation() {
  const pumpFunService = new PumpFunService();
  const tokenCreationHandler = new TokenCreationHandler(pumpFunService);
  const wallet = useWallet();

  const createToken = async (tokenData: TokenMetadata): Promise<TokenCreationResponse> => {
    if (!wallet.connected || !wallet.publicKey) {
      toast.error("Wallet not connected");
      throw new Error("Wallet not connected");
    }

    try {
      toast.loading("Creating your token...");
      const result = await tokenCreationHandler.createToken(tokenData);
      
      if (result.success) {
        toast.success("Token created successfully!");
      } else {
        toast.error(`Failed to create token: ${result.message || "Unknown error"}`);
      }
      
      return result;
    } catch (error) {
      console.error("Error in createToken:", error);
      toast.error(`Error creating token: ${error instanceof Error ? error.message : "Unknown error"}`);
      throw error;
    }
  };

  return { createToken };
}
