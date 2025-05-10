
import { WeatherService, WeatherOptions } from "@/lib/integrations/WeatherService";

export class WeatherHandler {
  private weatherService: WeatherService;

  constructor(weatherService: WeatherService) {
    this.weatherService = weatherService;
  }

  /**
   * Handle weather-related commands and queries
   */
  async handleWeatherCommand(location: string): Promise<string> {
    try {
      console.log(`Fetching weather data for: ${location}`);
      const options: WeatherOptions = {
        location,
        days: 3,
        aqi: true
      };
      return await this.weatherService.getCurrentWeather(options);
    } catch (error) {
      console.error('Error getting weather:', error);
      return "Sorry, I couldn't get the weather information right now. Please try again later! 🌦️";
    }
  }

  /**
   * Handle forecast-related commands and queries
   */
  async handleForecastCommand(location: string, days: number = 5): Promise<string> {
    try {
      console.log(`Fetching ${days} day forecast for: ${location}`);
      return await this.weatherService.getDetailedForecast(location, days);
    } catch (error) {
      console.error('Error getting forecast:', error);
      return `Sorry, I couldn't get the ${days}-day forecast information right now. Please try again later! 🌦️`;
    }
  }

  /**
   * Handle astronomy-related commands and queries
   */
  async handleAstronomyCommand(location: string): Promise<string> {
    try {
      console.log(`Fetching astronomy data for: ${location}`);
      return await this.weatherService.getAstronomyInfo(location);
    } catch (error) {
      console.error('Error getting astronomy data:', error);
      return "Sorry, I couldn't get the astronomy information right now. Please try again with a valid location! 🌙";
    }
  }

  /**
   * Check if a message matches weather patterns
   */
  static matchesWeatherPatterns(message: string, patterns: RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(message));
  }

  /**
   * Check if a message matches astronomy patterns
   */
  static matchesAstronomyPatterns(message: string, patterns: RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(message));
  }
  
  /**
   * Check if a message matches forecast patterns
   */
  static matchesForecastPatterns(message: string): boolean {
    const forecastPatterns = [
      /\b(?:forecast|prediction|outlook|expected|upcoming|next few days)\b/i,
      /\b(?:weather|temperature|rain|snow|precipitation)\b.*\b(?:tomorrow|next few days|upcoming|next week)\b/i,
      /\b(?:will it rain|will it snow|how cold|how hot)\b.*\b(?:tomorrow|next few days|next week)\b/i,
      /\b(?:3|4|5|6|7|8|9|10)(?:\s+|-)?day(?:s)?\s+(?:forecast|weather|outlook)\b/i,
      /\b(?:forecast|prediction).*\b(?:for|in)\b\s+([a-zA-Z\s,]+)(?:\.|\?|!|$)/i,
    ];
    return forecastPatterns.some(pattern => pattern.test(message));
  }
  
  /**
   * Extract number of forecast days from query
   */
  static extractForecastDays(message: string): number {
    // Default to 5 days if no specific day count is found
    let days = 5;
    
    // Check for specific day counts in the message
    const dayMatch = message.match(/\b(3|4|5|6|7|8|9|10|14)(?:\s+|-)?day(?:s)?\b/i);
    if (dayMatch && dayMatch[1]) {
      days = parseInt(dayMatch[1], 10);
    }
    
    // Make sure it's within valid range (1-14)
    return Math.min(Math.max(days, 1), 14);
  }
}
