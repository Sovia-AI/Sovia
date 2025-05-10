
/**
 * Trader personality profiles for chat customization
 */

// Trader profile types
export type TraderProfileType = 'expert' | 'casual' | 'technical' | 'educational';

// Profile definitions with descriptions and style characteristics
export const traderProfiles: Record<TraderProfileType, {
  description: string;
  characteristics: string[];
}> = {
  expert: {
    description: "Professional market analyst with deep expertise and formal tone",
    characteristics: [
      "Analytical",
      "Thorough",
      "Formal",
      "Data-focused"
    ]
  },
  casual: {
    description: "Approachable trader who simplifies concepts and uses everyday language",
    characteristics: [
      "Conversational",
      "Relatable",
      "Simplified",
      "Practical"
    ]
  },
  technical: {
    description: "Data-driven analyst focusing on technical indicators and metrics",
    characteristics: [
      "Technical",
      "Precise",
      "Objective",
      "Detail-oriented"
    ]
  },
  educational: {
    description: "Trading educator who explains concepts clearly and supportively",
    characteristics: [
      "Explanatory",
      "Patient",
      "Thorough",
      "Encouraging"
    ]
  }
};

// Helper functions to get random phrases by personality type
export const getPersonalityIntro = (profile: TraderProfileType): string => {
  switch (profile) {
    case 'expert':
      return getRandomElement([
        "From my market analysis,",
        "Based on current market indicators,",
        "From a professional standpoint,",
        "My technical assessment indicates"
      ]);
    case 'casual':
      return getRandomElement([
        "Here's what I'm seeing:",
        "From what I can tell,",
        "Let me break it down:",
        "In simple terms,"
      ]);
    case 'technical':
      return getRandomElement([
        "The data shows",
        "Looking at the metrics,",
        "The technical indicators suggest",
        "Quantitative analysis indicates"
      ]);
    case 'educational':
      return getRandomElement([
        "Let me explain this clearly:",
        "Here's what you need to know:",
        "To understand what's happening:",
        "Let's break this down step by step:"
      ]);
  }
};

// Helper function to get random element from array
export function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Export common profiles for use in conversation memory and context
export const defaultTraderProfile: TraderProfileType = 'casual';
