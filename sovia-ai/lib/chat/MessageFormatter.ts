
import { 
  getRandomElement, 
  getRandomConnector,
  getRandomInsight,
  getRandomTimeReference,
  getRandomConfidenceLevel,
  getRandomTransition,
  getRandomPersonalOpener,
  enhanceAnalysisWithPersonality
} from '@/lib/personality/MarketPersonality';

// Types for formatting options
export interface FormattingOptions {
  traderPersonality?: 'expert' | 'casual' | 'technical' | 'educational';
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  confidence?: number; // 0-1
  useEmojis?: boolean;
  technicalLevel?: number; // 1-5
}

// Segmentation types for multi-part responses
export interface ResponseSegment {
  type: 'intro' | 'analysis' | 'technical' | 'summary' | 'advice' | 'question' | 'followup';
  content: string;
}

// Default segmented response structure
export const defaultSegments: ResponseSegment[] = [
  { type: 'intro', content: '' },
  { type: 'analysis', content: '' },
  { type: 'technical', content: '' },
  { type: 'summary', content: '' },
  { type: 'advice', content: '' }
];

// Emojis by context
const emojis = {
  bullish: ['🚀', '📈', '💰', '🔥', '💎', '🌕', '✅', '💪'],
  bearish: ['📉', '🔻', '⚠️', '🛑', '🧸', '❌', '👇'],
  neutral: ['⚖️', '〽️', '➡️', '🔄', '📊', '👀', '🤔'],
  technical: ['📈', '📊', '📉', '🔍', '🧮', '⚙️', '🔢'],
  tokens: ['🪙', '💰', '💸', '🏦', '💱']
};

// Follow-up questions by topic
const followUpQuestions = {
  analysis: [
    "Would you like me to explain any particular part of this analysis in more detail?",
    "Is there a specific aspect of this token that you'd like to know more about?",
    "Would you like to see how this compares to another token?",
    "Shall I track this token and notify you about significant changes?"
  ],
  price: [
    "Would you like to see the support and resistance levels for this token?",
    "Are you interested in a price prediction based on this analysis?",
    "Would you like to know about potential entry or exit points?"
  ],
  technical: [
    "Would you like me to explain any of these technical indicators?",
    "Should I focus more on short-term or long-term indicators?",
    "Would you like a simpler explanation of what this technical analysis means?"
  ],
  tokens: [
    "Would you like to see some similar tokens that might interest you?",
    "Are you looking for alternatives with similar performance characteristics?",
    "Would you like to track this token's performance over time?"
  ]
};

// Transition phrases for segmented responses
const transitionPhrases = {
  toTechnical: [
    "Diving into the technical indicators,",
    "Looking at the chart patterns,",
    "Taking a closer look at the technicals,",
    "From a technical analysis perspective,"
  ],
  toSummary: [
    "To sum it up,",
    "Bottom line,",
    "The key takeaway here is",
    "In a nutshell,"
  ],
  toAdvice: [
    "If you're considering a move here,",
    "As for what this means for traders,",
    "For anyone looking to take action,",
    "My take on this situation is"
  ]
};

export class MessageFormatter {
  // Format a basic text response with personality
  static formatBasicResponse(text: string, options: FormattingOptions = {}): string {
    let formattedText = text;
    
    // Add random conversational elements
    if (Math.random() > 0.7) {
      const opener = getRandomPersonalOpener();
      formattedText = formattedText.replace(/^([A-Za-z])/m, `${opener} $1`);
    }
    
    // Add time references occasionally
    if (Math.random() > 0.8) {
      const timeRef = getRandomTimeReference();
      formattedText = formattedText.replace(/\.$/, `, at least ${timeRef}.`);
    }
    
    // Add confidence level modifiers
    if (options.confidence !== undefined) {
      const confidenceText = getRandomConfidenceLevel();
      if (options.confidence < 0.4 && Math.random() > 0.5) {
        formattedText = formattedText.replace(/\b(is|are|will|has|have)\b/i, match => {
          return `might ${match === 'is' ? 'be' : match === 'are' ? 'be' : match}`;
        });
      } else if (options.confidence > 0.8 && Math.random() > 0.5) {
        formattedText = formattedText.replace(/\b(might|could|may|possibly)\b/i, 'will likely');
      }
    }
    
    // Add emojis if enabled
    if (options.useEmojis) {
      const type = options.sentiment || 'neutral';
      const emoji = getRandomElement(emojis[type]);
      
      // Add emoji at start or end randomly
      if (Math.random() > 0.5) {
        formattedText = `${emoji} ${formattedText}`;
      } else {
        formattedText = `${formattedText} ${emoji}`;
      }
    }
    
    return formattedText;
  }
  
  // Format a segmented analysis response
  static formatAnalysisResponse(segments: ResponseSegment[], options: FormattingOptions = {}): string {
    const formattedSegments = segments.map(segment => {
      if (!segment.content.trim()) return '';
      
      let content = segment.content;
      
      // Format different segments differently
      switch(segment.type) {
        case 'intro':
          content = this.formatBasicResponse(content, { 
            ...options, 
            useEmojis: true 
          });
          break;
          
        case 'technical':
          // Add technical transition if not already there
          if (!content.startsWith("Diving") && !content.startsWith("Looking") && !content.startsWith("From a technical")) {
            content = `${getRandomElement(transitionPhrases.toTechnical)} ${content}`;
          }
          break;
          
        case 'summary':
          // Add summary transition
          if (!content.startsWith("To sum") && !content.startsWith("Bottom") && !content.startsWith("In a nutshell")) {
            content = `${getRandomElement(transitionPhrases.toSummary)} ${content}`;
          }
          break;
          
        case 'advice':
          // Add advice transition
          if (!content.startsWith("If you're") && !content.startsWith("As for") && !content.startsWith("My take")) {
            content = `${getRandomElement(transitionPhrases.toAdvice)} ${content}`;
          }
          break;
      }
      
      return content;
    }).filter(Boolean);
    
    return formattedSegments.join('\n\n');
  }
  
  // Format crypto analysis with token info and sentiment
  static formatCryptoAnalysis(
    text: string, 
    token: string,
    sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral',
    options: FormattingOptions = {}
  ): string {
    const personality = options.traderPersonality || 'casual';
    
    // Add token emphasis
    const tokenRegex = new RegExp(`\\b${token}\\b`, 'gi');
    text = text.replace(tokenRegex, `**${token}**`);
    
    // Enhance with personality traits
    text = enhanceAnalysisWithPersonality(text, personality, sentiment);
    
    // Add emoji if enabled
    if (options.useEmojis !== false) {
      const emoji = getRandomElement(
        sentiment === 'bullish' ? emojis.bullish : 
        sentiment === 'bearish' ? emojis.bearish : 
        emojis.neutral
      );
      
      // Add emoji to first line
      const lines = text.split('\n');
      lines[0] = `${emoji} ${lines[0]}`;
      text = lines.join('\n');
    }
    
    return text;
  }
  
  // Add follow-up question to the end of a response
  static addFollowUpQuestion(text: string, originalQuery: string): string {
    let category: keyof typeof followUpQuestions = 'analysis';
    
    // Determine appropriate category of follow-up
    if (/price|worth|value|cost|dollar|usd/i.test(originalQuery)) {
      category = 'price';
    } else if (/technical|chart|indicator|pattern|trend/i.test(originalQuery)) {
      category = 'technical';
    } else if (/token|coin|crypto|asset/i.test(originalQuery)) {
      category = 'tokens';
    }
    
    const question = getRandomElement(followUpQuestions[category]);
    return `${text}\n\n${question}`;
  }
}
