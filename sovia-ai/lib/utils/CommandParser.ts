
/**
 * Extract command and params from a message that starts with '/'
 */
export function extractCommandAndParams(input: string): { command: string | null, params: string | null } {
  if (!input.startsWith('/')) {
    return { command: null, params: null };
  }
  
  const parts = input.trim().split(/\s+/);
  const command = parts[0].substring(1).toLowerCase(); // Command itself is case insensitive
  const params = parts.length > 1 ? parts.slice(1).join(' ') : null;
  
  console.log(`Extracted command: ${command}, params: ${params || 'none'}`);
  return { command, params };
}

/**
 * Extract location from queries like "Find X near Y" or "X in Y"
 */
export function extractLocationFromQuery(query: string): string | null {
  if (!query) return null;
  
  // Common location extraction patterns
  const locationPatterns = [
    /(?:in|near|around|at|close to)\s+([a-zA-Z\s,]+)(?:\.|\?|!|$)/i,
    /(?:adoptable|available)\s+(?:pets|animals|cats|dogs|rabbits)\s+(?:in|near|around|at|close to)\s+([a-zA-Z\s,]+)(?:\.|\?|!|$)/i,
    /(?:find|get|show me|search for)\s+(?:pets|animals|cats|dogs|rabbits)\s+(?:in|near|around|at|close to)\s+([a-zA-Z\s,]+)(?:\.|\?|!|$)/i,
    /(?:shelters|rescues|adoption centers)\s+(?:in|near|around|at|close to)\s+([a-zA-Z\s,]+)(?:\.|\?|!|$)/i,
    /(?:in|near|around|at|close to)\s+([a-zA-Z\s,]+?)\s+(?:area|region|zip code|vicinity)/i,
    /(?:weather|forecast|temperature|rain|snow|sunny|cloudy|humidity|wind)\s+(?:in|at|for|near)\s+([a-zA-Z\s,]+)(?:\.|\?|!|$)/i,
    /(?:sunrise|sunset|moonrise|moonset|astronomy|astronomical)\s+(?:in|at|for|near)\s+([a-zA-Z\s,]+)(?:\.|\?|!|$)/i,
    /(?:forecast|prediction|outlook|expected|upcoming)\s+(?:in|at|for|near)\s+([a-zA-Z\s,]+)(?:\.|\?|!|$)/i,
    /(?:weather|forecast|temperature|rain|snow|sunny|cloudy|humidity|wind)\s+(?:for)\s+([a-zA-Z\s,]+)(?:\.|\?|!|$)/i,
  ];
  
  for (const pattern of locationPatterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      const location = match[1].trim();
      if (location.length >= 2 && !isCommonWord(location)) {
        console.log(`Extracted location: "${location}" using CommandParser`);
        return location;
      }
    }
  }
  
  // Check for ZIP code pattern
  const zipMatch = query.match(/\b\d{5}\b/);
  if (zipMatch) {
    console.log(`Extracted ZIP code: "${zipMatch[0]}" using CommandParser`);
    return zipMatch[0];
  }
  
  // Check for "City, State" pattern
  const cityStateMatch = query.match(/\b([a-zA-Z\s]+),\s*([A-Z]{2})\b/i);
  if (cityStateMatch) {
    const location = cityStateMatch[0].trim();
    console.log(`Extracted city/state: "${location}" using CommandParser`);
    return location;
  }
  
  // Handle simple location queries like "Tokyo weather" or "weather Tokyo"
  const simpleLocationPatterns = [
    /^([a-zA-Z\s,]+)\s+(?:weather|forecast|temperature)/i,
    /(?:weather|forecast|temperature)\s+([a-zA-Z\s,]+)$/i,
    /^([a-zA-Z\s,]+)\s+(?:\d+)-day/i, // Match "Paris 5-day" patterns
  ];
  
  for (const pattern of simpleLocationPatterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      const location = match[1].trim();
      if (location.length >= 2 && !isCommonWord(location)) {
        console.log(`Extracted location from simple pattern: "${location}" using CommandParser`);
        return location;
      }
    }
  }
  
  return null;
}

/**
 * Extract animal type from queries like "Find X near Y" or "X for adoption"
 */
export function extractAnimalTypeFromQuery(query: string): string | null {
  if (!query) return null;
  
  // List of common animal types with singular and plural forms
  const animalTypeMap = {
    'dog': 'dog',
    'dogs': 'dog',
    'puppy': 'dog',
    'puppies': 'dog',
    'cat': 'cat',
    'cats': 'cat',
    'kitten': 'cat',
    'kittens': 'cat',
    'rabbit': 'rabbit',
    'rabbits': 'rabbit',
    'bunny': 'rabbit',
    'bunnies': 'rabbit',
    'bird': 'bird',
    'birds': 'bird',
    'guinea pig': 'small-furry',
    'guinea pigs': 'small-furry',
    'hamster': 'small-furry',
    'hamsters': 'small-furry',
    'gerbil': 'small-furry',
    'gerbils': 'small-furry',
    'mouse': 'small-furry',
    'mice': 'small-furry',
    'rat': 'small-furry',
    'rats': 'small-furry',
    'ferret': 'small-furry',
    'ferrets': 'small-furry',
    'horse': 'horse',
    'horses': 'horse',
    'pig': 'barnyard',
    'pigs': 'barnyard',
    'barnyard': 'barnyard',
    'reptile': 'scales-fins-other',
    'reptiles': 'scales-fins-other',
    'snake': 'scales-fins-other',
    'snakes': 'scales-fins-other',
    'lizard': 'scales-fins-other',
    'lizards': 'scales-fins-other',
    'turtle': 'scales-fins-other',
    'turtles': 'scales-fins-other',
    'fish': 'scales-fins-other'
  };
  
  const lowercaseQuery = query.toLowerCase();
  
  // Check for specific animal types in the query
  for (const [term, animalType] of Object.entries(animalTypeMap)) {
    // Check for exact matches with word boundaries
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    if (regex.test(lowercaseQuery)) {
      console.log(`Extracted animal type: "${animalType}" from "${term}" using CommandParser`);
      return animalType;
    }
  }
  
  // Check for specific pet-related phrases
  if (/\b(pet|pets|animal|animals)\b/i.test(lowercaseQuery) && 
     !/\b(cat|dog|bird|rabbit)\b/i.test(lowercaseQuery)) {
    // If just asking about general pets without specifying a type, default to dogs
    console.log(`Detected general pet query, defaulting to "dog" using CommandParser`);
    return 'dog';
  }
  
  return null;
}

/**
 * Extract forecast days from weather queries
 */
export function extractForecastDaysFromQuery(query: string): number | null {
  if (!query) return null;
  
  // Check for specific day counts in the message
  const dayMatch = query.match(/\b(3|4|5|6|7|8|9|10|14)(?:\s+|-)?day(?:s)?\b/i);
  if (dayMatch && dayMatch[1]) {
    return parseInt(dayMatch[1], 10);
  }
  
  // Check for "next week" or similar phrases
  if (/\bnext week\b/i.test(query)) {
    return 7;
  }
  
  // Check for "extended" or "long-term" forecast
  if (/\b(extended|long-term|long term)\b/i.test(query)) {
    return 10;
  }
  
  return null;
}

/**
 * Helper function to check if a word is too common to be a location
 */
function isCommonWord(word: string): boolean {
  const commonWords = [
    'the', 'a', 'an', 'me', 'my', 'your', 'their', 'who', 'what', 'where', 
    'when', 'why', 'how', 'which', 'this', 'that', 'these', 'those', 'and', 
    'but', 'or', 'so', 'because', 'if', 'info', 'information', 'tell', 'more'
  ];
  
  return commonWords.includes(word.toLowerCase().trim());
}
