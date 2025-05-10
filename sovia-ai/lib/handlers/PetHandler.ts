
import { PetfinderService } from "@/lib/integrations/PetfinderService";
import { extractLocationFromQuery, extractAnimalTypeFromQuery } from "@/lib/utils/CommandParser";

// Interface for organization search results
interface OrganizationSearchResult {
  organizations: Array<{
    name: string;
    address: {
      address1?: string;
      city: string;
      state: string;
      postcode: string;
    };
    phone?: string;
    email?: string;
    website?: string;
    mission?: string;
  }>;
  pagination: {
    total_count: number;
    current_page: number;
    total_pages: number;
  };
}

// Animal search parameters interface
interface AnimalSearchParams {
  type?: string;
  location?: string;
  status?: string;
  size?: string;
  gender?: string;
  age?: string;
  good_with_children?: boolean;
  good_with_dogs?: boolean;
  good_with_cats?: boolean;
  limit?: number;
  page?: number;
  sort?: string;
  distance?: number;
}

export class PetHandler {
  private petfinderService: PetfinderService;

  constructor(petfinderService: PetfinderService) {
    this.petfinderService = petfinderService;
  }

  /**
   * Handle pet-related commands and queries
   */
  async handlePetCommand(params: string): Promise<string> {
    try {
      // Better logging
      console.log(`Processing pet adoption command with params: "${params}"`);
      
      // Extract animal type and location from params
      let animalType = extractAnimalTypeFromQuery(params) || PetfinderService.extractAnimalTypeFromQuery(params);
      let location = extractLocationFromQuery(params) || PetfinderService.extractLocationFromQuery(params);
      
      console.log(`Extracted: type=${animalType || 'any'}, location=${location || 'not specified'}`);
      
      // If asking about dog breeds or similar generic pet info
      const breedInfoMatch = /\b(tell|about|info|information|types)\b.*\b(dog|cat|pet)\b.*\b(breed|type)s?\b/i.test(params);
      if (breedInfoMatch || (animalType && !location && params.includes('breed'))) {
        const animalToLookup = animalType || 'dog';
        try {
          const typeInfo = await this.petfinderService.getAnimalType(animalToLookup);
          return this.petfinderService.formatAnimalTypeInfo(typeInfo);
        } catch (error) {
          console.error('Error getting animal type info:', error);
          // Improved fallback content for breed information
          if (animalToLookup === 'dog') {
            return `## Dogs Available for Adoption

Here's some information about adoptable dogs:

**Popular Dog Breeds:**
- Labrador Retriever: Friendly, outgoing, high energy, great family pets
- German Shepherd: Intelligent, versatile, loyal, protective
- Golden Retriever: Intelligent, friendly, devoted, excellent with children
- Bulldog: Calm, courageous, friendly, dignified
- Beagle: Friendly, curious, merry, excellent with children
- Poodle: Intelligent, active, alert, excellent for those with allergies
- Siberian Husky: Outgoing, mischievous, loyal, good with families
- Dachshund: Clever, spunky, courageous, good for apartments
- Corgi: Affectionate, smart, alert, responsive to training
- Chihuahua: Charming, graceful, sassy, suited for apartment living

When adopting a dog, consider your lifestyle, living situation, and activity level to find the perfect match.

To find adoptable dogs near you, try asking about "dogs for adoption near [your location]".`;
          } else if (animalToLookup === 'cat') {
            return `## Cats Available for Adoption

Here's some information about adoptable cats:

**Popular Cat Breeds:**
- Maine Coon: Gentle giants, friendly, great with families
- Siamese: Vocal, social, affectionate, intelligent
- Ragdoll: Relaxed, gentle, sociable, gets along with everyone
- Persian: Sweet, quiet, decorative, needs regular grooming
- Bengal: Active, energetic, playful, needs stimulation
- Abyssinian: Playful, curious, highly intelligent, needs interaction
- Sphynx: Hairless, affectionate, mischievous, energetic
- Scottish Fold: Sweet-tempered, adaptable, enjoys company
- British Shorthair: Easygoing, calm, independent, low maintenance
- American Shorthair: Adaptable, good-natured, excellent mousers

When adopting a cat, consider their personality, grooming needs, and whether they'll get along with existing pets or children.

To find adoptable cats near you, try asking about "cats for adoption near [your location]".`;
          } else {
            return `Here's some basic information about ${animalToLookup} breeds and adoption:

When adopting a pet, consider your lifestyle, living situation, and the specific needs of the animal. Each breed has its own characteristics, temperament, and care requirements.

To find adoptable ${animalToLookup}s near you, try asking about "${animalToLookup}s for adoption near [your location]".`;
          }
        }
      }
      
      // Check for shelter search pattern
      const shelterMatch = /\b(shelter|shelters|rescue|rescues|adoption center)\b.*\b(near|in|at|around|close to)\b/i.test(params);
      if (shelterMatch && location) {
        try {
          const orgParams = {
            location: location,
            limit: 5,
            distance: 100
          };
          
          const orgResults = await this.petfinderService.searchOrganizations(orgParams) as OrganizationSearchResult;
          if (orgResults.organizations && orgResults.organizations.length > 0) {
            let result = `## 🏠 Animal Shelters near ${location}\n\n`;
            
            orgResults.organizations.forEach((org) => {
              result += `### ${org.name}\n`;
              result += `**Address:** ${org.address.address1 || ''} ${org.address.city}, ${org.address.state} ${org.address.postcode}\n`;
              result += `**Phone:** ${org.phone || 'Not provided'}\n`;
              result += `**Email:** ${org.email || 'Not provided'}\n\n`;
              if (org.website) result += `[Visit Website](${org.website})\n\n`;
              if (org.mission) result += `"${org.mission.substring(0, 150)}${org.mission.length > 150 ? '...' : ''}"\n\n`;
              result += `---\n\n`;
            });
            
            result += `Found ${orgResults.pagination.total_count} shelters in total. Showing the first ${orgResults.organizations.length}.`;
            return result;
          } else {
            return `I couldn't find any animal shelters near ${location}. Please try a different location.`;
          }
        } catch (error) {
          console.error('Error searching organizations:', error);
          return `I had trouble finding shelters near ${location}. Please try a different location.`;
        }
      }
      
      if (!animalType && !location && !this.extractSearchParameters(params).hasAnyParameter) {
        return "Please provide more details for your pet search. Example: 'dogs near Chicago' or 'cats in New York' or 'small dogs available for adoption' or 'young cats that are good with children'";
      }
      
      // Build search parameters from the query
      const searchParams = this.buildAnimalSearchParams(params, animalType, location);
      
      console.log(`Searching for adoptable pets with params:`, searchParams);
      
      try {
        const searchResults = await this.petfinderService.searchAnimals(searchParams);
        const formattedResults = this.petfinderService.formatAnimalSearchResults(searchResults);
        return formattedResults;
      } catch (error) {
        console.error('Error searching for pets:', error);
        
        // Improved error response with more helpful guidance and pet-specific content
        let errorResponse = `## Adoption Search Results

I'm currently having difficulty connecting to the pet adoption service. This could be due to temporary API issues.

`;

        if (animalType) {
          errorResponse += `### ${animalType.charAt(0).toUpperCase() + animalType.slice(1)}s Available for Adoption\n\n`;
          
          if (animalType.toLowerCase() === 'dog') {
            errorResponse += `While I'm working on fixing the connection, here are some tips for adopting dogs:

- Consider the dog's energy level and how it matches your lifestyle
- Think about space requirements - some breeds need more room to run
- Factor in grooming needs - some dogs require regular professional grooming
- Consider training needs - some breeds are easier to train than others
- Puppy or adult? Puppies need more time and training, while adult dogs may already have some training

Popular dog breeds in ${location || 'most areas'} include Labrador Retrievers, German Shepherds, Golden Retrievers, and mixed breeds which often make wonderful pets.`;
          } else if (animalType.toLowerCase() === 'cat') {
            errorResponse += `While I'm working on fixing the connection, here are some tips for adopting cats:

- Consider the cat's personality - some are more independent while others are very social
- Think about your living situation - most cats do well in apartments but appreciate vertical spaces
- Factor in grooming needs - long-haired cats require more grooming
- Consider age - kittens are playful and energetic while adult cats have established personalities
- One or multiple? Some cats prefer being the only pet while others enjoy companionship

Popular cat breeds in ${location || 'most areas'} include Domestic Shorthairs, Maine Coons, Siamese, and Ragdolls.`;
          } else {
            errorResponse += `While I'm working on fixing the connection, here are some general pet adoption tips:

- Research the specific needs of the type of pet you're interested in
- Consider adoption fees, which typically cover initial vaccinations and spaying/neutering
- Prepare your home before bringing your new pet home
- Schedule a vet visit shortly after adoption
- Give your new pet time to adjust to their new environment`;
          }
        } else {
          errorResponse += `While I'm working on fixing the connection, here are some general pet adoption tips:

- Research the specific needs of the type of pet you're interested in
- Visit local shelters to meet available pets in person
- Consider adoption fees, which typically cover initial vaccinations and spaying/neutering
- Prepare your home before bringing your new pet home
- Schedule a vet visit shortly after adoption`;
        }
        
        errorResponse += `\n\nIn the meantime, you might try searching "${animalType || 'pets'} for adoption in ${location || 'your area'}" on sites like:
- Petfinder.com
- Adopt-a-Pet.com
- ASPCA.org
- Your local animal shelter websites

Please try your search again later when our connection to the pet adoption database is restored.`;
        
        return errorResponse;
      }
    } catch (error) {
      console.error('Error processing pet adoption query:', error);
      return "I encountered an issue while searching for adoptable pets. Please try again with a different query format.";
    }
  }

  /**
   * Extract search parameters from the query text
   */
  private extractSearchParameters(query: string): {
    size?: string;
    age?: string;
    gender?: string;
    goodWith?: { children?: boolean; dogs?: boolean; cats?: boolean };
    hasAnyParameter: boolean;
  } {
    const result = {
      hasAnyParameter: false
    } as any;

    // Size matchers
    if (/\b(small|tiny|little)\b/i.test(query)) {
      result.size = "small";
      result.hasAnyParameter = true;
    } else if (/\b(medium|mid-sized|average)\b/i.test(query)) {
      result.size = "medium";
      result.hasAnyParameter = true;
    } else if (/\b(large|big)\b/i.test(query)) {
      result.size = "large";
      result.hasAnyParameter = true;
    } else if (/\b(extra large|giant|xl|extra-large|huge)\b/i.test(query)) {
      result.size = "xlarge";
      result.hasAnyParameter = true;
    }

    // Age matchers
    if (/\b(baby|babies|infant|newborn|young puppy|young kitten)\b/i.test(query)) {
      result.age = "baby";
      result.hasAnyParameter = true;
    } else if (/\b(young|puppy|kitten|juvenile)\b/i.test(query)) {
      result.age = "young";
      result.hasAnyParameter = true;
    } else if (/\b(adult|grown|mature)\b/i.test(query)) {
      result.age = "adult";
      result.hasAnyParameter = true;
    } else if (/\b(senior|elderly|older|aging|aged)\b/i.test(query)) {
      result.age = "senior";
      result.hasAnyParameter = true;
    }

    // Gender matchers
    if (/\b(male|boy|boys)\b/i.test(query)) {
      result.gender = "male";
      result.hasAnyParameter = true;
    } else if (/\b(female|girl|girls)\b/i.test(query)) {
      result.gender = "female";
      result.hasAnyParameter = true;
    }

    // Good with matchers
    result.goodWith = {};
    if (/\b(good with kids|good with children|child-friendly|kid-friendly|family-friendly)\b/i.test(query)) {
      result.goodWith.children = true;
      result.hasAnyParameter = true;
    }
    if (/\b(good with dogs|dog-friendly)\b/i.test(query)) {
      result.goodWith.dogs = true;
      result.hasAnyParameter = true;
    }
    if (/\b(good with cats|cat-friendly)\b/i.test(query)) {
      result.goodWith.cats = true;
      result.hasAnyParameter = true;
    }

    return result;
  }

  /**
   * Build complete search parameters for animal search
   */
  private buildAnimalSearchParams(query: string, animalType: string | null, location: string | null): AnimalSearchParams {
    const extractedParams = this.extractSearchParameters(query);
    
    const searchParams: AnimalSearchParams = {
      status: 'adoptable',
      limit: 5
    };

    // Add animal type if provided
    if (animalType) {
      searchParams.type = animalType;
    } else {
      // If no animal type specified but query mentions pets, default to dog
      if (/\b(pet|pets|animal|animals)\b/i.test(query)) {
        searchParams.type = 'Dog';
      }
    }

    // Add location if provided
    if (location) {
      searchParams.location = location;
      searchParams.distance = 100; // Default 100 miles radius
    }

    // Add extracted parameters
    if (extractedParams.size) {
      searchParams.size = extractedParams.size;
    }
    
    if (extractedParams.age) {
      searchParams.age = extractedParams.age;
    }
    
    if (extractedParams.gender) {
      searchParams.gender = extractedParams.gender;
    }
    
    if (extractedParams.goodWith) {
      if (extractedParams.goodWith.children) {
        searchParams.good_with_children = true;
      }
      
      if (extractedParams.goodWith.dogs) {
        searchParams.good_with_dogs = true;
      }
      
      if (extractedParams.goodWith.cats) {
        searchParams.good_with_cats = true;
      }
    }

    return searchParams;
  }

  /**
   * Check if a message matches pet patterns
   */
  static matchesPetPatterns(message: string, patterns: RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(message));
  }
}
