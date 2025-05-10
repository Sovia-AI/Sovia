
import axios from 'axios';

interface PetfinderAuth {
  access_token: string;
  expires_at: number; // Timestamp when token expires
}

interface PetfinderOptions {
  apiKey: string;
  secret: string;
}

interface AnimalSearchParams {
  type?: string;
  breed?: string;
  size?: string;
  gender?: string;
  age?: string;
  color?: string;
  coat?: string;
  status?: string;
  name?: string;
  organization?: string;
  good_with_children?: boolean;
  good_with_dogs?: boolean;
  good_with_cats?: boolean;
  house_trained?: boolean;
  declawed?: boolean;
  special_needs?: boolean;
  location?: string;
  distance?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

interface OrganizationSearchParams {
  name?: string;
  location?: string;
  distance?: number;
  state?: string;
  country?: string;
  query?: string;
  sort?: string;
  limit?: number;
  page?: number;
}

export class PetfinderService {
  private apiKey: string;
  private secret: string;
  private auth: PetfinderAuth | null = null;
  private baseUrl = 'https://api.petfinder.com/v2';
  private tokenRetryCount = 0;
  private maxTokenRetries = 3;
  
  constructor(options: PetfinderOptions) {
    this.apiKey = options.apiKey;
    this.secret = options.secret;
  }

  /**
   * Get an access token from the Petfinder API
   */
  private async getAccessToken(): Promise<string> {
    // Check if we already have a valid token
    if (this.auth && this.auth.expires_at > Date.now()) {
      return this.auth.access_token;
    }

    try {
      console.log('Requesting new Petfinder access token');
      const response = await axios.post('https://api.petfinder.com/v2/oauth2/token', 
        new URLSearchParams({
          'grant_type': 'client_credentials',
          'client_id': this.apiKey,
          'client_secret': this.secret
        }), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

      // Reset retry count on success
      this.tokenRetryCount = 0;
      
      // Store the token with expiration time
      this.auth = {
        access_token: response.data.access_token,
        // Set expiration to be 1 minute before actual expiration to be safe
        expires_at: Date.now() + (response.data.expires_in * 1000) - 60000
      };

      console.log('Successfully obtained Petfinder access token');
      return this.auth.access_token;
    } catch (error) {
      this.tokenRetryCount++;
      console.error(`Error getting Petfinder access token (attempt ${this.tokenRetryCount}):`, error);
      
      if (this.tokenRetryCount < this.maxTokenRetries) {
        console.log(`Retrying token request (${this.tokenRetryCount}/${this.maxTokenRetries})`);
        // Wait a bit before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.getAccessToken();
      }
      
      throw new Error('Failed to authenticate with Petfinder API after multiple attempts');
    }
  }

  /**
   * Make an authenticated API call to Petfinder
   */
  private async apiCall<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    let token;
    
    try {
      token = await this.getAccessToken();
    } catch (error) {
      console.error('Failed to get access token for Petfinder API call:', error);
      throw error;
    }
    
    try {
      console.log(`Making API call to ${endpoint} with params:`, params);
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error calling Petfinder API at ${endpoint}:`, error);
      
      if (axios.isAxiosError(error)) {
        // Handle token expiration - retry with new token
        if (error.response?.status === 401) {
          console.log('Token appears to be expired, clearing and retrying');
          this.auth = null; // Clear the token to force a refresh
          return this.apiCall(endpoint, params);
        }
        
        if (error.response?.data) {
          console.error('API response error data:', error.response.data);
        }
      }
      
      throw error;
    }
  }

  /**
   * Search for animals based on various criteria
   */
  public async searchAnimals(params: AnimalSearchParams = {}) {
    try {
      // Format location properly for API
      if (params.location) {
        // Standardize location format - remove extra spaces, commas
        params.location = this.formatLocation(params.location);
      }
      
      // Ensure we have appropriate fallbacks
      if (!params.limit) params.limit = 20;
      if (!params.distance && params.location) params.distance = 100;
      
      console.log('Searching for animals with params:', params);
      return await this.apiCall('/animals', params);
    } catch (error) {
      console.error('Error in searchAnimals:', error);
      
      // Check for specific location error
      if (axios.isAxiosError(error) && error.response?.data?.['invalid-params']?.some(
        (p: any) => p.path === 'location' && p.message.includes('Could not determine location')
      )) {
        return { 
          animals: [], 
          pagination: { total_count: 0, current_page: 1, total_pages: 0 },
          error: "location_not_found" 
        };
      }
      
      // Check for empty results from the API
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return { 
          animals: [], 
          pagination: { total_count: 0, current_page: 1, total_pages: 0 },
          error: "no_results" 
        };
      }
      
      // Return a minimal structure so the formatAnimalSearchResults can handle it
      return { 
        animals: [], 
        pagination: { total_count: 0, current_page: 1, total_pages: 0 },
        error: "api_error"
      };
    }
  }

  /**
   * Format location string to improve search success rate
   */
  private formatLocation(location: string): string {
    // Remove any extra spaces
    let formatted = location.trim();
    
    // Add state if it's just a major city name
    const majorCities: Record<string, string> = {
      'new york': 'New York, NY',
      'los angeles': 'Los Angeles, CA',
      'chicago': 'Chicago, IL',
      'houston': 'Houston, TX',
      'phoenix': 'Phoenix, AZ',
      'philadelphia': 'Philadelphia, PA',
      'san antonio': 'San Antonio, TX',
      'san diego': 'San Diego, CA',
      'dallas': 'Dallas, TX',
      'san jose': 'San Jose, CA',
      'austin': 'Austin, TX',
      'seattle': 'Seattle, WA',
      'boston': 'Boston, MA',
      'detroit': 'Detroit, MI',
      'denver': 'Denver, CO',
      'portland': 'Portland, OR',
      'miami': 'Miami, FL',
      'atlanta': 'Atlanta, GA'
    };
    
    const lowercaseLocation = formatted.toLowerCase();
    if (majorCities[lowercaseLocation]) {
      formatted = majorCities[lowercaseLocation];
    }
    
    // Ensure zip codes are properly formatted
    const zipMatch = formatted.match(/^\d{5}$/);
    if (zipMatch) {
      // It's a US ZIP code, which is already well-formatted
      return formatted;
    }
    
    return formatted;
  }

  /**
   * Get details for a specific animal by ID
   */
  public async getAnimal(id: number) {
    return this.apiCall(`/animals/${id}`);
  }

  /**
   * Get all available animal types
   */
  public async getAnimalTypes() {
    return this.apiCall('/types');
  }

  /**
   * Get details for a specific animal type
   */
  public async getAnimalType(type: string) {
    try {
      // Normalize the type parameter
      const normalizedType = type.toLowerCase();
      return await this.apiCall(`/types/${normalizedType}`);
    } catch (error) {
      console.error('Error in getAnimalType:', error);
      // Return a minimal structure
      return { type: { name: type, coats: [], colors: [], genders: [] } };
    }
  }

  /**
   * Get breeds for a specific animal type
   */
  public async getAnimalBreeds(type: string) {
    return this.apiCall(`/types/${type}/breeds`);
  }

  /**
   * Search for organizations based on various criteria
   */
  public async searchOrganizations(params: OrganizationSearchParams = {}) {
    try {
      // Format location properly for API
      if (params.location) {
        params.location = this.formatLocation(params.location);
      }
      
      return await this.apiCall('/organizations', params);
    } catch (error) {
      console.error('Error in searchOrganizations:', error);
      return { organizations: [], pagination: { total_count: 0, current_page: 1, total_pages: 0 } };
    }
  }

  /**
   * Get details for a specific organization by ID
   */
  public async getOrganization(id: string) {
    return this.apiCall(`/organizations/${id}`);
  }

  /**
   * Format animal search results into a readable HTML response with embedded images
   */
  public formatAnimalSearchResults(data: any): string {
    // Check for API errors
    if (data.error === "api_error") {
      return "I'm having trouble connecting to the pet adoption service. Please try again in a moment.";
    }
    
    // Check for location error
    if (data.error === "location_not_found") {
      return "I couldn't find any results for that location. Please try using a different city or include a state abbreviation (like 'Chicago, IL' or 'Seattle, WA').";
    }
    
    // Check for empty results
    if (!data || !data.animals || data.animals.length === 0) {
      return "No pets found matching your search criteria. The Petfinder database might not have listings in this area. Try searching with a different location (like 'Chicago, IL' or 'Los Angeles, CA') or different pet type.";
    }

    let result = `## 🐾 Found ${data.pagination.total_count} Adoptable Pets\n\n`;
    
    // Add information about the first 3-5 animals
    const displayCount = Math.min(5, data.animals.length);
    for (let i = 0; i < displayCount; i++) {
      const animal = data.animals[i];
      result += `### ${animal.name} - ${animal.type}\n`;
      result += `**Breed:** ${animal.breeds.primary}${animal.breeds.secondary ? ` / ${animal.breeds.secondary}` : ''}\n`;
      result += `**Age:** ${animal.age} • **Gender:** ${animal.gender} • **Size:** ${animal.size}\n`;
      
      // Add photo as a Markdown image for better compatibility
      if (animal.photos && animal.photos.length > 0) {
        result += `![Photo of ${animal.name}](${animal.photos[0].medium})\n\n`;
      }
      
      // Add description if available
      if (animal.description) {
        result += `${animal.description.substring(0, 150)}${animal.description.length > 150 ? '...' : ''}\n\n`;
      }
      
      // Add contact info
      result += `**Location:** ${animal.contact.address.city}${animal.contact.address.state ? `, ${animal.contact.address.state}` : ''}\n`;
      result += `**Status:** ${animal.status}\n\n`;
      
      // Add link to view more details (using markdown format)
      result += `[View ${animal.name}'s Full Profile](${animal.url})\n\n`;
      
      // Add separator between animals
      if (i < displayCount - 1) {
        result += `---\n\n`;
      }
    }
    
    // Add pagination info
    if (data.pagination.total_pages > 1) {
      result += `\n*Showing page ${data.pagination.current_page} of ${data.pagination.total_pages}*\n`;
    }
    
    // Add disclaimer
    result += `\n*Data provided by Petfinder. All adoption information should be confirmed with the organization directly.*`;
    
    return result;
  }

  /**
   * Format animal type information into a readable response
   */
  public formatAnimalTypeInfo(data: any): string {
    if (!data || !data.type) {
      return "No animal type information found.";
    }

    const type = data.type;
    let result = `## ${type.name}s Available for Adoption\n\n`;
    
    // Add general information about this animal type
    result += `Here's some information about adoptable ${type.name.toLowerCase()}s:\n\n`;
    
    // Add coat types if available
    if (type.coats && type.coats.length > 0) {
      result += `**Coat Types:** ${type.coats.join(', ')}\n\n`;
    }
    
    // Add colors if available
    if (type.colors && type.colors.length > 0) {
      result += `**Colors:** ${type.colors.join(', ')}\n\n`;
    }
    
    // Add genders if available
    if (type.genders && type.genders.length > 0) {
      result += `**Genders:** ${type.genders.join(', ')}\n\n`;
    }
    
    // Add search link
    result += `To find adoptable ${type.name.toLowerCase()}s, you can ask me about "${type.name}s available for adoption" or specify your location like "${type.name}s for adoption near New York".\n\n`;
    
    return result;
  }
  
  /**
   * Extract animal type from a search query
   */
  public static extractAnimalTypeFromQuery(query: string): string | null {
    if (!query) return null;
    
    // Common animal types to check for
    const animalTypes = [
      'dog', 'cat', 'rabbit', 'bird', 'guinea pig', 'hamster',
      'horse', 'barnyard', 'small & furry', 'scales, fins & other'
    ];
    
    const lowercaseQuery = query.toLowerCase();
    
    // First check for plural forms of animal types
    for (const animalType of animalTypes) {
      if (lowercaseQuery.includes(`${animalType}s`)) {
        return animalType;
      }
    }
    
    // Then check for singular forms
    for (const animalType of animalTypes) {
      if (lowercaseQuery.includes(animalType)) {
        return animalType;
      }
    }
    
    // Default to most common animal types for certain key terms
    if (lowercaseQuery.includes('adopt') || 
        lowercaseQuery.includes('shelter') || 
        lowercaseQuery.includes('pet')) {
      // If just asking about adoption without specifying a type, default to dogs
      return 'dog';
    }
    
    return null;
  }
  
  /**
   * Extract location from a search query
   */
  public static extractLocationFromQuery(query: string): string | null {
    if (!query) return null;
    
    // Try to match "in [location]" or "near [location]" pattern
    const locationMatchers = [
      /(?:in|near|around|at)\s+([a-zA-Z\s,]+)(?:\.|\?|!|$)/i,
      /(?:adoptable|available)\s+(?:pets|animals|cats|dogs|rabbits)\s+(?:in|near|around|at)\s+([a-zA-Z\s,]+)(?:\.|\?|!|$)/i,
      /(?:adoptable|available)\s+(?:in|near|around|at)\s+([a-zA-Z\s,]+)(?:\.|\?|!|$)/i,
      /(?:find|get|show me)\s+(?:pets|animals|cats|dogs|rabbits)\s+(?:in|near|around|at)\s+([a-zA-Z\s,]+)(?:\.|\?|!|$)/i,
      /(?:shelters|rescues)\s+(?:in|near|around|at)\s+([a-zA-Z\s,]+)(?:\.|\?|!|$)/i
    ];
    
    for (const pattern of locationMatchers) {
      const match = query.match(pattern);
      if (match && match[1]) {
        const location = match[1].trim();
        console.log(`Extracted location using pattern ${pattern}: "${location}"`);
        return location;
      }
    }
    
    // If we couldn't match with patterns, try to extract known city names
    const commonCities = ['new york', 'los angeles', 'chicago', 'houston', 'phoenix', 'philadelphia',
                         'san antonio', 'san diego', 'dallas', 'san jose', 'austin', 'jacksonville',
                         'fort worth', 'columbus', 'san francisco', 'charlotte', 'indianapolis',
                         'seattle', 'denver', 'boston'];
    
    const lowerQuery = query.toLowerCase();
    for (const city of commonCities) {
      if (lowerQuery.includes(city)) {
        console.log(`Extracted city name from query: "${city}"`);
        return city;
      }
    }
    
    return null;
  }
  
  /**
   * Determine if a query is related to pets/animals
   */
  public static isPetRelatedQuery(query: string): boolean {
    if (!query) return false;
    
    const petKeywords = [
      'adopt', 'pet', 'dog', 'cat', 'animal', 'rescue', 'shelter',
      'puppy', 'kitten', 'adoption', 'rabbits', 'rabbit', 'birds', 'bird',
      'hamster', 'guinea pig', 'petfinder', 'pet finder'
    ];
    
    const lowercaseQuery = query.toLowerCase();
    
    return petKeywords.some(keyword => {
      // Check if the keyword is present as a whole word
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      return regex.test(lowercaseQuery);
    });
  }
}
