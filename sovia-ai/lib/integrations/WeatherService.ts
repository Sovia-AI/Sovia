
import { WEATHERAPI_KEY } from '../config/apiKeys';

export interface WeatherOptions {
  location: string;
  days?: number;
  aqi?: boolean;
  lang?: string;
}

export interface HistoricalWeatherOptions {
  location: string;
  date: string; // Format: YYYY-MM-DD
  hour?: number;
}

export interface AstronomyOptions {
  location: string;
  date?: string; // Format: YYYY-MM-DD
}

export interface SearchOptions {
  query: string;
}

export interface ForecastOptions {
  location: string;
  days: number;
  aqi?: boolean;
  alerts?: boolean;
}

interface WeatherResponse {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    tz_id: string;
    localtime_epoch: number;
    localtime: string;
  };
  current: {
    last_updated_epoch: number;
    last_updated: string;
    temp_c: number;
    temp_f: number;
    is_day: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    wind_mph: number;
    wind_kph: number;
    wind_degree: number;
    wind_dir: string;
    pressure_mb: number;
    pressure_in: number;
    precip_mm: number;
    precip_in: number;
    humidity: number;
    cloud: number;
    feelslike_c: number;
    feelslike_f: number;
    vis_km: number;
    vis_miles: number;
    uv: number;
    gust_mph: number;
    gust_kph: number;
    air_quality?: {
      co: number;
      no2: number;
      o3: number;
      so2: number;
      pm2_5: number;
      pm10: number;
      'us-epa-index': number;
      'gb-defra-index': number;
    };
  };
  forecast?: {
    forecastday: Array<{
      date: string;
      date_epoch: number;
      day: {
        maxtemp_c: number;
        maxtemp_f: number;
        mintemp_c: number;
        mintemp_f: number;
        avgtemp_c: number;
        avgtemp_f: number;
        maxwind_mph: number;
        maxwind_kph: number;
        totalprecip_mm: number;
        totalprecip_in: number;
        totalsnow_cm: number;
        avgvis_km: number;
        avgvis_miles: number;
        avghumidity: number;
        daily_will_it_rain: number;
        daily_chance_of_rain: number;
        daily_will_it_snow: number;
        daily_chance_of_snow: number;
        condition: {
          text: string;
          icon: string;
          code: number;
        };
        uv: number;
      };
      astro: {
        sunrise: string;
        sunset: string;
        moonrise: string;
        moonset: string;
        moon_phase: string;
        moon_illumination: string;
        is_moon_up: number;
        is_sun_up: number;
      };
      hour: Array<{
        time_epoch: number;
        time: string;
        temp_c: number;
        temp_f: number;
        is_day: number;
        condition: {
          text: string;
          icon: string;
          code: number;
        };
        wind_mph: number;
        wind_kph: number;
        wind_degree: number;
        wind_dir: string;
        pressure_mb: number;
        pressure_in: number;
        precip_mm: number;
        precip_in: number;
        humidity: number;
        cloud: number;
        feelslike_c: number;
        feelslike_f: number;
        windchill_c: number;
        windchill_f: number;
        heatindex_c: number;
        heatindex_f: number;
        dewpoint_c: number;
        dewpoint_f: number;
        will_it_rain: number;
        chance_of_rain: number;
        will_it_snow: number;
        chance_of_snow: number;
        vis_km: number;
        vis_miles: number;
        gust_mph: number;
        gust_kph: number;
        uv: number;
      }>;
    }>;
  };
}

interface AstronomyResponse {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    tz_id: string;
    localtime_epoch: number;
    localtime: string;
  };
  astronomy: {
    astro: {
      sunrise: string;
      sunset: string;
      moonrise: string;
      moonset: string;
      moon_phase: string;
      moon_illumination: string;
      is_moon_up: number;
      is_sun_up: number;
    };
  };
}

interface LocationSearchResponse {
  id: number;
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  url: string;
}

export class WeatherService {
  private apiKey: string;
  private baseUrl: string = 'https://api.weatherapi.com/v1';
  private mockMode: boolean = false;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || WEATHERAPI_KEY;
    
    // Only enable mock mode if no API key is provided
    if (!this.apiKey) {
      console.warn("WeatherService initialized without API key - enabling mock mode");
      this.mockMode = true;
    }
  }

  /**
   * Fetch current weather and optional forecast data for a location
   */
  async getWeatherData(city: string, days: number = 1): Promise<any> {
    try {
      // Return mock data if in mock mode
      if (this.mockMode) {
        return this.getMockWeatherData(city);
      }
      
      console.log(`Fetching weather data for ${city} with WeatherAPI.com`);
      const encodedCity = encodeURIComponent(city);
      const url = `${this.baseUrl}/forecast.json?key=${this.apiKey}&q=${encodedCity}&days=${days}&aqi=yes`;
      
      const response = await fetch(url, { 
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Weather API error ${response.status}: ${errorText}`);
        throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      
      // Only fallback to mock data in development or if explicitly in mock mode
      if (this.mockMode || import.meta.env.DEV) {
        console.warn('Falling back to mock weather data due to API error');
        return this.getMockWeatherData(city);
      }
      
      throw error;
    }
  }

  // Mock data for when API is unavailable
  private getMockWeatherData(city: string): any {
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0];
    const temp = Math.floor(Math.random() * 15) + 70; // Random temp between 70-85°F
    
    return {
      location: {
        name: city,
        region: "",
        country: "United States",
        lat: 25.76,
        lon: -80.19,
        tz_id: "America/New_York",
        localtime_epoch: Math.floor(Date.now() / 1000),
        localtime: new Date().toLocaleTimeString()
      },
      current: {
        temp_c: ((temp - 32) * 5/9).toFixed(1),
        temp_f: temp,
        condition: {
          text: "Partly cloudy",
          icon: "//cdn.weatherapi.com/weather/64x64/day/116.png",
          code: 1003
        },
        humidity: Math.floor(Math.random() * 30) + 50,
        cloud: Math.floor(Math.random() * 50),
        feelslike_c: ((temp - 32) * 5/9).toFixed(1),
        feelslike_f: temp,
        uv: 6,
        wind_mph: Math.floor(Math.random() * 10) + 5,
        wind_kph: (Math.floor(Math.random() * 10) + 5) * 1.6,
        wind_dir: "ENE"
      },
      forecast: {
        forecastday: [
          {
            date: formattedDate,
            day: {
              maxtemp_c: ((temp + 3 - 32) * 5/9).toFixed(1),
              maxtemp_f: temp + 3,
              mintemp_c: ((temp - 10 - 32) * 5/9).toFixed(1),
              mintemp_f: temp - 10,
              condition: {
                text: "Partly cloudy",
                icon: "//cdn.weatherapi.com/weather/64x64/day/116.png",
                code: 1003
              },
              daily_chance_of_rain: 20
            },
            astro: {
              sunrise: "06:45 AM",
              sunset: "08:15 PM",
              moonrise: "09:30 PM",
              moonset: "07:15 AM",
              moon_phase: "Waxing Gibbous",
              moon_illumination: "75"
            }
          }
        ]
      }
    };
  }

  /**
   * Get real-time current weather information
   */
  async getRealtimeWeather(location: string): Promise<any> {
    try {
      // Return mock data if in mock mode
      if (this.mockMode) {
        const mockData = this.getMockWeatherData(location);
        return { location: mockData.location, current: mockData.current };
      }
      
      const encodedLocation = encodeURIComponent(location);
      const url = `${this.baseUrl}/current.json?key=${this.apiKey}&q=${encodedLocation}&aqi=yes`;
      
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching realtime weather:', error);
      // Fallback to mock data
      const mockData = this.getMockWeatherData(location);
      return { location: mockData.location, current: mockData.current };
    }
  }

  /**
   * Get weather forecast for up to 14 days
   */
  async getForecast(options: ForecastOptions): Promise<any> {
    try {
      if (!this.apiKey) {
        throw new Error("Weather API key is missing");
      }

      const { location, days, aqi = false, alerts = false } = options;
      
      if (days < 1 || days > 14) {
        throw new Error("Forecast days must be between 1 and 14");
      }
      
      const encodedLocation = encodeURIComponent(location);
      const url = `${this.baseUrl}/forecast.json?key=${this.apiKey}&q=${encodedLocation}&days=${days}&aqi=${aqi ? 'yes' : 'no'}&alerts=${alerts ? 'yes' : 'no'}`;
      
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching forecast:', error);
      throw error;
    }
  }

  /**
   * Get historical weather data for a specific date
   */
  async getHistoricalWeather(options: HistoricalWeatherOptions): Promise<any> {
    try {
      if (!this.apiKey) {
        throw new Error("Weather API key is missing");
      }

      const { location, date, hour } = options;
      
      // Validate date format: YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error("Date must be in the format YYYY-MM-DD");
      }
      
      const encodedLocation = encodeURIComponent(location);
      let url = `${this.baseUrl}/history.json?key=${this.apiKey}&q=${encodedLocation}&dt=${date}`;
      
      if (hour !== undefined && hour >= 0 && hour <= 23) {
        url += `&hour=${hour}`;
      }
      
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching historical weather:', error);
      throw error;
    }
  }

  /**
   * Get astronomy information for a location and date
   */
  async getAstronomy(options: AstronomyOptions): Promise<AstronomyResponse> {
    try {
      if (!this.apiKey) {
        throw new Error("Weather API key is missing");
      }

      const { location, date = new Date().toISOString().split('T')[0] } = options;
      
      const encodedLocation = encodeURIComponent(location);
      const url = `${this.baseUrl}/astronomy.json?key=${this.apiKey}&q=${encodedLocation}&dt=${date}`;
      
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching astronomy data:', error);
      throw error;
    }
  }

  /**
   * Search for locations by name or coordinates
   */
  async searchLocation(options: SearchOptions): Promise<LocationSearchResponse[]> {
    try {
      if (!this.apiKey) {
        throw new Error("Weather API key is missing");
      }

      const { query } = options;
      
      if (!query || query.trim().length < 3) {
        throw new Error("Search query must be at least 3 characters");
      }
      
      const encodedQuery = encodeURIComponent(query);
      const url = `${this.baseUrl}/search.json?key=${this.apiKey}&q=${encodedQuery}`;
      
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching location:', error);
      throw error;
    }
  }

  /**
   * Enhanced weather report with formatted response for user queries
   */
  async getCurrentWeather(options: WeatherOptions): Promise<string> {
    try {
      const { location, days = 1, aqi = false } = options;
      
      if (!location || typeof location !== 'string' || location.trim() === '') {
        return "Please provide a valid location name.";
      }
      
      let data;
      
      // Check if we're using mock mode
      if (this.mockMode) {
        data = this.getMockWeatherData(location);
        console.log("Using mock weather data for:", location);
      } else {
        data = await this.getWeatherData(location, days);
      }
      
      if (!data || !data.current || !data.current.condition) {
        return `Sorry, I couldn't retrieve the weather information for "${location}". The data format was unexpected.`;
      }
      
      const { current, location: locationData, forecast } = data;
      
      // Build a comprehensive weather response
      let response = `The current weather in ${locationData.name}, ${locationData.country} is ${current.condition.text.toLowerCase()} with a temperature of ${current.temp_c}°C (${current.temp_f}°F).\n`;
      response += `Feels like: ${current.feelslike_c}°C (${current.feelslike_f}°F)\n`;
      response += `Humidity: ${current.humidity}%\n`;
      response += `Wind: ${current.wind_kph} km/h ${current.wind_dir}\n`;
      
      // Add UV index with rating
      let uvRating = 'Low';
      if (current.uv >= 3 && current.uv < 6) uvRating = 'Moderate';
      else if (current.uv >= 6 && current.uv < 8) uvRating = 'High';
      else if (current.uv >= 8 && current.uv < 11) uvRating = 'Very High';
      else if (current.uv >= 11) uvRating = 'Extreme';
      
      response += `UV Index: ${current.uv} (${uvRating})\n`;
      
      // Add air quality data if available
      if (current.air_quality) {
        let aqiRating = 'Good';
        const aqiIndex = current.air_quality['us-epa-index'];
        
        if (aqiIndex === 2) aqiRating = 'Moderate';
        else if (aqiIndex === 3) aqiRating = 'Unhealthy for sensitive groups';
        else if (aqiIndex === 4) aqiRating = 'Unhealthy';
        else if (aqiIndex === 5) aqiRating = 'Very Unhealthy';
        else if (aqiIndex === 6) aqiRating = 'Hazardous';
        
        response += `Air Quality: ${aqiRating}\n`;
      }
      
      // Add forecast data if available
      if (forecast && forecast.forecastday.length > 0) {
        const tomorrow = forecast.forecastday[0];
        response += `\nForecast for tomorrow: ${tomorrow.day.condition.text} with a high of ${tomorrow.day.maxtemp_c}°C (${tomorrow.day.maxtemp_f}°F) and a low of ${tomorrow.day.mintemp_c}°C (${tomorrow.day.mintemp_f}°F). `;
        response += `There's a ${tomorrow.day.daily_chance_of_rain}% chance of rain.`;
      }
      
      // Add astronomical data if first day is available
      try {
        if (forecast && forecast.forecastday.length > 0) {
          const today = forecast.forecastday[0];
          if (today.astro) {
            response += `\n\nSunrise: ${today.astro.sunrise} | Sunset: ${today.astro.sunset}`;
          }
        }
      } catch (e) {
        // Fail silently for astro data
      }
      
      // Add note if using mock data
      if (this.mockMode) {
        response += "\n\n(Note: This is simulated weather data as the weather service is temporarily unavailable)";
      }
      
      return response;
    } catch (error) {
      console.error('Error getting current weather:', error);
      
      // Provide more specific error message based on the type of error
      if (error.message && error.message.includes('Weather API error: 404')) {
        return `Sorry, I couldn't find weather information for "${options.location}". Please check the location name and try again.`;
      } else if (error.message && error.message.includes('Weather API error: 401')) {
        return `Weather service is temporarily unavailable due to authentication issues. Please try again later.`;
      }
      
      // Fallback to mock data message
      return this.getMockWeatherResponse(options.location);
    }
  }

  /**
   * Get mock weather response when API fails
   */
  private getMockWeatherResponse(location: string): string {
    const mockData = this.getMockWeatherData(location);
    const { current, location: locationData } = mockData;
    
    let response = `The current weather in ${locationData.name}, ${locationData.country} is ${current.condition.text.toLowerCase()} with a temperature of ${current.temp_c}°C (${current.temp_f}°F).\n`;
    response += `Humidity: ${current.humidity}%\n`;
    response += `Wind: ${current.wind_kph} km/h ${current.wind_dir}\n`;
    
    if (mockData.forecast && mockData.forecast.forecastday.length > 0) {
      const tomorrow = mockData.forecast.forecastday[0];
      response += `\nForecast: ${tomorrow.day.condition.text} with a high of ${tomorrow.day.maxtemp_f}°F and a ${tomorrow.day.daily_chance_of_rain}% chance of rain.`;
    }
    
    response += "\n\n(Note: This is simulated weather data as the weather service is temporarily unavailable)";
    
    return response;
  }

  /**
   * Get astronomy information in a user-friendly format
   */
  async getAstronomyInfo(location: string, date?: string): Promise<string> {
    try {
      const astronomyData = await this.getAstronomy({ location, date });
      
      if (!astronomyData || !astronomyData.astronomy || !astronomyData.astronomy.astro) {
        return `Sorry, I couldn't retrieve astronomical information for "${location}"`;
      }
      
      const { location: locationData, astronomy } = astronomyData;
      const { astro } = astronomy;
      
      let response = `Astronomical information for ${locationData.name}, ${locationData.country} on ${date || 'today'}:\n\n`;
      response += `🌅 Sunrise: ${astro.sunrise}\n`;
      response += `🌇 Sunset: ${astro.sunset}\n`;
      response += `🌝 Moonrise: ${astro.moonrise}\n`;
      response += `🌚 Moonset: ${astro.moonset}\n`;
      response += `🌓 Moon phase: ${astro.moon_phase}\n`;
      response += `✨ Moon illumination: ${astro.moon_illumination}%\n`;
      
      return response;
    } catch (error) {
      console.error('Error getting astronomy info:', error);
      return `Sorry, I couldn't retrieve astronomical information for "${location}". Please try again later.`;
    }
  }

  /**
   * Get a multi-day detailed forecast in a user-friendly format
   */
  async getDetailedForecast(location: string, days: number = 3): Promise<string> {
    try {
      if (days < 1 || days > 10) {
        days = Math.min(Math.max(days, 1), 10); // Clamp between 1-10
      }
      
      const forecastData = await this.getForecast({
        location,
        days,
        aqi: true,
        alerts: true
      });
      
      if (!forecastData || !forecastData.forecast || !forecastData.forecast.forecastday) {
        return `Sorry, I couldn't retrieve the forecast for "${location}".`;
      }
      
      const { location: locationData, forecast, current, alerts } = forecastData;
      
      let response = `${days}-day forecast for ${locationData.name}, ${locationData.country}:\n\n`;
      
      // Current conditions
      response += `Current conditions: ${current.condition.text}, ${current.temp_c}°C (${current.temp_f}°F)\n\n`;
      
      // Forecast for each day
      forecast.forecastday.forEach((day: any, index: number) => {
        const date = new Date(day.date);
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
        
        response += `${index === 0 ? 'Today' : dayOfWeek} (${day.date}):\n`;
        response += `  • Condition: ${day.day.condition.text}\n`;
        response += `  • Min/Max: ${day.day.mintemp_c}°C to ${day.day.maxtemp_c}°C (${day.day.mintemp_f}°F to ${day.day.maxtemp_f}°F)\n`;
        response += `  • Chance of rain: ${day.day.daily_chance_of_rain}%\n`;
        response += `  • Humidity: ${day.day.avghumidity}%\n\n`;
      });
      
      // Weather alerts if any
      if (alerts && alerts.alert && alerts.alert.length > 0) {
        response += `⚠️ Weather Alerts: ${alerts.alert.length} active alert(s)\n`;
        alerts.alert.forEach((alert: any, index: number) => {
          response += `  ${index + 1}. ${alert.headline}\n`;
        });
      }
      
      return response;
    } catch (error) {
      console.error('Error getting detailed forecast:', error);
      return `Sorry, I couldn't retrieve the detailed forecast for "${location}". Please try again later.`;
    }
  }

  // Helper method to extract location from weather query
  static extractLocationFromQuery(query: string): string | null {
    if (typeof query !== 'string') {
      console.error("Query must be a string in extractLocationFromQuery");
      return null;
    }
    
    // Common words that should not be treated as locations
    const commonWords = [
      'tree', 'trees', 'weather', 'forecast', 'rain', 'cloud', 'snow', 'sunny',
      'storm', 'temperature', 'climate', 'what', 'how', 'when', 'where', 'why',
      'is', 'the', 'a', 'an', 'my', 'your', 'our', 'their', 'his', 'her', 'its',
      'this', 'that', 'these', 'those', 'there', 'here', 'who', 'whom', 'which',
      'whose', 'whats', "what's", 'tell', 'me', 'about', 'macd', 'turtle', 'turtles',
      // Added crypto-related terms to avoid misinterpretation
      'sol', 'solana', 'btc', 'eth', 'bitcoin', 'ethereum', 'token', 'crypto', 'coin', 'buying',
      'level', 'price', 'target', 'entry', 'support', 'resistance', 'chart', 'technical', 'analysis',
      'bullish', 'bearish', 'market', 'trading', 'buy', 'sell', 'hodl', 'pump', 'dump', 'dip',
      'profit', 'loss', 'bonk', 'jup', 'jupiter', 'memecoin', 'best', 'good', 'wen'
    ];
    
    // Check for crypto-specific query patterns - if found, return null immediately
    const cryptoPatterns = [
      /best.*(buying|entry|price)/i,
      /(buying|entry).*(level|point|price|target)/i,
      /\$(sol|btc|eth|bonk|jup)/i,
      /\b(sol|btc|eth|bonk|jup|solana|bitcoin|ethereum)\b/i,
      /(price|support|resistance)/i
    ];
    
    if (cryptoPatterns.some(pattern => pattern.test(query))) {
      console.log("Query appears to be crypto-related, not weather-related");
      return null;
    }
    
    // Check for /weather command pattern
    if (query.startsWith('/weather ')) {
      const location = query.substring(9).trim();
      if (location.length > 0) {
        return location;
      }
    }
    
    // Try to match "in [location]" pattern
    const inLocationMatch = query.match(/\b(?:weather|temperature|forecast|rain|snow|sunny|cloudy|humidity|wind).*?\b(?:in|at|for)\b\s+([a-zA-Z\s,]+)(?:\.|\?|!|$)/i);
    
    if (inLocationMatch && inLocationMatch[1]) {
      const location = inLocationMatch[1].trim();
      if (!commonWords.includes(location.toLowerCase())) {
        return location;
      }
    }
    
    // Try to match if location is at the beginning of the sentence
    const locationAtBeginningMatch = query.match(/^([a-zA-Z\s,]+)(?:\s+weather|\s+forecast|\s+temperature)(?:\.|\?|!|$)/i);
    
    if (locationAtBeginningMatch && locationAtBeginningMatch[1]) {
      const location = locationAtBeginningMatch[1].trim();
      if (!commonWords.includes(location.toLowerCase())) {
        return location;
      }
    }
    
    // Try to match if location is at the end of sentence
    const locationAtEndMatch = query.match(/\b(?:weather|temperature|forecast|rain|snow|sunny|cloudy|humidity|wind).*?\b(?:in|at|for)?\s+(.+?)(?:\.|\?|!|$)/i);
    
    if (locationAtEndMatch && locationAtEndMatch[1]) {
      const location = locationAtEndMatch[1].trim();
      if (!commonWords.includes(location.toLowerCase())) {
        return location;
      }
    }
    
    // Try to match "weather in [location]" pattern
    const directLocationMatch = query.match(/weather\s+(?:for|at|in)?\s+([a-zA-Z\s,]+)(?:\.|\?|!|$)/i);
    
    if (directLocationMatch && directLocationMatch[1]) {
      const location = directLocationMatch[1].trim();
      if (!commonWords.includes(location.toLowerCase())) {
        return location;
      }
    }

    // Match plain city names when only the city is mentioned
    const plainCityMatch = query.match(/^([a-zA-Z\s,]+)$/i);
    
    if (plainCityMatch && plainCityMatch[1]) {
      const location = plainCityMatch[1].trim();
      if (!commonWords.includes(location.toLowerCase()) && 
          location.length > 3 && // Avoid short words
          !/^what|^how|^why|^when|^where|^who|^tell/i.test(location)) { // Avoid question words
        return location;
      }
    }
    
    return null;
  }
}
