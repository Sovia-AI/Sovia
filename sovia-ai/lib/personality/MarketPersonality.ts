/**
 * Market Personality Module
 * 
 * Helper functions and content generators for creating personality-driven
 * market analysis responses
 */

// Helper function to get random element from array
export function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Connectors for joining phrases
export function getRandomConnector(): string {
  return getRandomElement([
    "also",
    "additionally",
    "furthermore",
    "moreover",
    "plus",
    "what's more",
    "on top of that"
  ]);
}

// Random market insights
export function getRandomInsight(): string {
  return getRandomElement([
    "I'm noticing",
    "I've observed",
    "I'm seeing",
    "it's worth noting",
    "interestingly",
    "notably"
  ]);
}

// Time references for adding recency
export function getRandomTimeReference(): string {
  return getRandomElement([
    "in the current market",
    "right now",
    "at this moment",
    "in today's conditions",
    "in the present environment",
    "given recent developments"
  ]);
}

// Confidence level expressions
export function getRandomConfidenceLevel(): string {
  return getRandomElement([
    "I'm fairly certain",
    "I'm pretty confident",
    "it seems likely",
    "it appears that",
    "the data suggests",
    "indicators point to"
  ]);
}

// Transition phrases
export function getRandomTransition(): string {
  return getRandomElement([
    "Moving on to",
    "Regarding",
    "With respect to",
    "Turning to",
    "Shifting focus to",
    "Looking at"
  ]);
}

// Personal openers for conversational tone
export function getRandomPersonalOpener(): string {
  return getRandomElement([
    "I think",
    "In my view,",
    "From what I can see,",
    "My analysis shows",
    "Based on what I'm seeing,"
  ]);
}

// Create a personalized introduction for a token analysis
export function createPersonalizedIntro(tokenName: string, tokenSymbol: string): string {
  const intros = [
    `Let's look at ${tokenName} (${tokenSymbol}) in the current market context.`,
    `Here's my analysis of ${tokenName} (${tokenSymbol}) based on the latest data.`,
    `I've analyzed ${tokenName} (${tokenSymbol}), and here's what I'm seeing.`,
    `Looking at ${tokenName} (${tokenSymbol}), there are several interesting aspects to consider.`,
    `Let me break down the key metrics for ${tokenName} (${tokenSymbol}) for you.`
  ];
  
  return getRandomElement(intros);
}

// Create a personalized conclusion for a token analysis
export function createPersonalizedConclusion(tokenSymbol: string): string {
  const conclusions = [
    `That's the current picture for ${tokenSymbol}. Keep in mind that market conditions can change rapidly.`,
    `This concludes my analysis of ${tokenSymbol}. Remember to do your own research before making any decisions.`,
    `Based on these factors, ${tokenSymbol} shows the patterns I've outlined above. Always consider the broader market context.`,
    `That's my take on ${tokenSymbol} with the information available right now. Markets are dynamic, so stay informed.`,
    `This analysis of ${tokenSymbol} represents a snapshot of current conditions. The crypto market is highly volatile, so continue monitoring developments.`
  ];
  
  return getRandomElement(conclusions);
}

// Personalized pattern descriptions
export function getPersonalizedPatternDescription(
  pattern: string,
  personality: 'expert' | 'casual' | 'technical' | 'educational' = 'casual'
): string {
  const patternDescriptions: Record<string, Record<string, string>> = {
    'bullish': {
      'expert': 'a confirmed bullish pattern indicating positive momentum',
      'casual': 'a good sign that prices might go up',
      'technical': 'a technical confirmation of upward price trajectory',
      'educational': 'a bullish pattern, which typically signals potential price increases'
    },
    'bearish': {
      'expert': 'a clear bearish formation suggesting downside risk',
      'casual': 'a warning sign that prices might drop',
      'technical': 'a technical indication of negative price pressure',
      'educational': 'a bearish pattern, which often indicates potential price decreases'
    },
    // Add more patterns as needed
  };
  
  if (patternDescriptions[pattern]?.[personality]) {
    return patternDescriptions[pattern][personality];
  }
  
  // Default descriptions if specific one not found
  const defaults = {
    'expert': `a significant ${pattern} pattern`,
    'casual': `a ${pattern} pattern that's worth noting`,
    'technical': `a confirmed ${pattern} technical formation`,
    'educational': `what we call a ${pattern} pattern, which is important because`
  };
  
  return defaults[personality] || `a ${pattern} pattern`;
}

// Personalized indicator descriptions
export function getPersonalizedIndicatorName(
  indicator: string,
  personality: 'expert' | 'casual' | 'technical' | 'educational' = 'casual'
): string {
  const indicatorDescriptions: Record<string, Record<string, string>> = {
    'RSI': {
      'expert': 'Relative Strength Index',
      'casual': 'RSI (which measures buying/selling pressure)',
      'technical': 'RSI indicator values',
      'educational': 'RSI (Relative Strength Index, which measures overbought/oversold conditions)'
    },
    'MACD': {
      'expert': 'MACD',
      'casual': 'MACD (a trend indicator)',
      'technical': 'MACD signal crossovers',
      'educational': 'MACD (Moving Average Convergence Divergence, which shows trend momentum)'
    },
    // Add more indicators as needed
  };
  
  if (indicatorDescriptions[indicator]?.[personality]) {
    return indicatorDescriptions[indicator][personality];
  }
  
  return indicator;
}

// Trader personality profiles
export const traderPersonality = {
  expert: {
    responseStyle: "formal and analytical",
    vocabularyLevel: "advanced",
    usesData: true,
    usesTechnicalTerms: true
  },
  casual: {
    responseStyle: "conversational and friendly",
    vocabularyLevel: "everyday",
    usesData: false,
    usesTechnicalTerms: false
  },
  technical: {
    responseStyle: "precise and data-focused",
    vocabularyLevel: "technical",
    usesData: true,
    usesTechnicalTerms: true
  },
  educational: {
    responseStyle: "explanatory and supportive",
    vocabularyLevel: "mixed with explanations",
    usesData: true,
    usesTechnicalTerms: false
  }
};

// Function to enhance crypto analysis with personality
export function enhanceAnalysisWithPersonality(
  analysis: string,
  tokenSymbol: string,
  sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral',
  personalityType: 'expert' | 'casual' | 'technical' | 'educational' = 'casual'
): string {
  if (personalityType === 'expert') {
    // Add formal, expert phrasing
    if (sentiment === 'bullish') {
      analysis = analysis.replace(
        /(positive|bullish|upward|increase)/gi,
        match => `notably ${match}`
      );
    } else if (sentiment === 'bearish') {
      analysis = analysis.replace(
        /(negative|bearish|downward|decrease)/gi,
        match => `significantly ${match}`
      );
    }
  }
  else if (personalityType === 'casual') {
    // Make it more conversational
    analysis = analysis
      .replace(/technical analysis/gi, 'chart patterns')
      .replace(/indicators suggest/gi, 'signs show')
      .replace(/market sentiment/gi, 'market mood');
  }
  else if (personalityType === 'technical') {
    // Emphasize data and metrics
    analysis = analysis
      .replace(/I think/gi, 'The data indicates')
      .replace(/looks like/gi, 'metrics suggest')
      .replace(/seems to be/gi, 'technically appears to be');
  }
  else if (personalityType === 'educational') {
    // Add explanatory phrases
    analysis = analysis
      .replace(/\b(RSI|MACD|EMA)\b/gi, match => `${match} (a technical indicator)`)
      .replace(/support level/gi, 'support level (price floor)')
      .replace(/resistance level/gi, 'resistance level (price ceiling)');
  }
  
  return analysis;
}
