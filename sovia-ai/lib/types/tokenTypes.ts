
export interface TokenSocials {
  website: string;
  twitter: string;
  telegram: string;
  discord: string;
}

export interface TokenAdvanced {
  initialSupply: number;
  decimals: number;
  initialPrice?: number;
  mintAuthority?: string;
}

// Update TokenMetadata to make properties required that need to be required
export interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  socials: TokenSocials;
  advanced: TokenAdvanced;
}

// Create a form-specific version of TokenMetadata that allows optional fields
export interface TokenFormData {
  name: string;
  symbol: string;
  description: string;
  imageUrl?: string;
  socials: {
    website: string;
    twitter: string;
    telegram: string;
    discord: string;
  };
  advanced: {
    initialSupply: number;
    decimals: number;
    initialPrice?: number;
    mintAuthority?: string;
  };
}

export interface TokenCreationResponse {
  signature: string;
  mint: string;
  success: boolean;
  message?: string;
}
