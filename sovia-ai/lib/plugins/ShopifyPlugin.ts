
/**
 * Fully functional ShopifyPlugin for TAIGU framework
 * Integrates with Shopify Storefront API for product search and cart management
 */

interface ShopifyPluginOptions {
  storefrontAccessToken: string;
  shopDomain: string;
  apiVersion?: string;
}

interface ShopifyProduct {
  id: string;
  variantId: string;
  title: string;
  description: string;
  price: string;
  currencyCode: string;
  compareAtPrice?: string;
  availableForSale: boolean;
  imageUrl?: string;
}

interface ShopifyCart {
  id: string;
  items: ShopifyCartItem[];
  totalAmount: string;
  currencyCode: string;
  totalQuantity: number;
  checkoutUrl: string;
}

interface ShopifyCartItem {
  id: string;
  variantId: string;
  title: string;
  quantity: number;
  price: string;
}

interface AddToCartResult {
  success: boolean;
  cart?: ShopifyCart;
  item?: {
    title: string;
  };
  error?: string;
}

interface RemoveFromCartResult {
  success: boolean;
  cart?: ShopifyCart;
  item?: {
    title: string;
  };
  error?: string;
}

export class ShopifyPlugin {
  private storefrontAccessToken: string;
  private shopDomain: string;
  private apiVersion: string;
  private endpoint: string;
  private carts: Map<string, ShopifyCart>;
  
  constructor(options: ShopifyPluginOptions) {
    this.storefrontAccessToken = options.storefrontAccessToken;
    this.shopDomain = options.shopDomain;
    this.apiVersion = options.apiVersion || '2023-10';
    this.endpoint = `https://${this.shopDomain}/api/${this.apiVersion}/graphql.json`;
    this.carts = new Map();
  }

  /**
   * Search for products in the Shopify store
   */
  async searchProducts(query: string, options?: { limit?: number }): Promise<ShopifyProduct[]> {
    console.log(`Searching for products matching: "${query}"`);
    const limit = options?.limit || 10;
    
    try {
      const graphqlQuery = `
        query SearchProducts($query: String!, $first: Int!) {
          products(first: $first, query: $query) {
            edges {
              node {
                id
                title
                description
                availableForSale
                featuredImage {
                  url
                }
                priceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                }
                compareAtPriceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                }
                variants(first: 1) {
                  edges {
                    node {
                      id
                    }
                  }
                }
              }
            }
          }
        }
      `;
      
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': this.storefrontAccessToken
        },
        body: JSON.stringify({
          query: graphqlQuery,
          variables: {
            query,
            first: limit
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Shopify API responded with status ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      
      if (data.errors) {
        throw new Error(`GraphQL Error: ${data.errors[0].message}`);
      }

      // Transform the response to our ShopifyProduct interface
      return data.data.products.edges.map((edge: any) => {
        const node = edge.node;
        const variantId = node.variants.edges[0]?.node.id || null;
        
        return {
          id: node.id,
          variantId: variantId,
          title: node.title,
          description: node.description,
          price: node.priceRange.minVariantPrice.amount,
          currencyCode: node.priceRange.minVariantPrice.currencyCode,
          compareAtPrice: node.compareAtPriceRange?.minVariantPrice?.amount,
          availableForSale: node.availableForSale,
          imageUrl: node.featuredImage?.url
        };
      });
    } catch (error) {
      console.error('Error searching Shopify products:', error);
      throw error;
    }
  }

  /**
   * Get the cart for a specific user
   */
  async getCart(userId: string): Promise<ShopifyCart | null> {
    console.log(`Getting cart for user: ${userId}`);
    
    // Try to get from local cache first
    let cart = this.carts.get(userId);
    
    if (cart) {
      return cart;
    }
    
    // If not in cache, create a new cart
    try {
      const graphqlQuery = `
        mutation CreateCart {
          cartCreate {
            cart {
              id
              checkoutUrl
              cost {
                totalAmount {
                  amount
                  currencyCode
                }
              }
              lines(first: 10) {
                edges {
                  node {
                    id
                    quantity
                    merchandise {
                      ... on ProductVariant {
                        id
                        title
                        priceV2 {
                          amount
                          currencyCode
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;
      
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': this.storefrontAccessToken
        },
        body: JSON.stringify({
          query: graphqlQuery
        })
      });
      
      if (!response.ok) {
        throw new Error(`Shopify API responded with status ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      
      if (data.errors) {
        throw new Error(`GraphQL Error: ${data.errors[0].message}`);
      }

      const shopifyCart = data.data.cartCreate.cart;
      
      // Transform to our cart format
      cart = {
        id: shopifyCart.id,
        items: [],
        totalAmount: shopifyCart.cost.totalAmount.amount,
        currencyCode: shopifyCart.cost.totalAmount.currencyCode,
        totalQuantity: 0,
        checkoutUrl: shopifyCart.checkoutUrl
      };
      
      // Store in cache
      this.carts.set(userId, cart);
      
      return cart;
    } catch (error) {
      console.error('Error creating Shopify cart:', error);
      throw error;
    }
  }

  /**
   * Add an item to the user's cart
   */
  async addToCart(userId: string, variantId: string, quantity: number): Promise<AddToCartResult> {
    console.log(`Adding item ${variantId} to cart for user ${userId}`);
    
    try {
      // Get or create the cart
      let cart = await this.getCart(userId);
      if (!cart) {
        throw new Error("Failed to create cart");
      }
      
      // Add item to cart with GraphQL
      const graphqlQuery = `
        mutation AddToCart($cartId: ID!, $lines: [CartLineInput!]!) {
          cartLinesAdd(cartId: $cartId, lines: $lines) {
            cart {
              id
              checkoutUrl
              cost {
                totalAmount {
                  amount
                  currencyCode
                }
              }
              lines(first: 50) {
                edges {
                  node {
                    id
                    quantity
                    merchandise {
                      ... on ProductVariant {
                        id
                        title
                        priceV2 {
                          amount
                          currencyCode
                        }
                        product {
                          title
                        }
                      }
                    }
                  }
                }
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;
      
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': this.storefrontAccessToken
        },
        body: JSON.stringify({
          query: graphqlQuery,
          variables: {
            cartId: cart.id,
            lines: [
              {
                merchandiseId: variantId,
                quantity
              }
            ]
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Shopify API responded with status ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      
      if (data.errors) {
        throw new Error(`GraphQL Error: ${data.errors[0].message}`);
      }
      
      if (data.data.cartLinesAdd.userErrors && data.data.cartLinesAdd.userErrors.length > 0) {
        return {
          success: false,
          error: data.data.cartLinesAdd.userErrors[0].message
        };
      }
      
      const updatedShopifyCart = data.data.cartLinesAdd.cart;
      const addedItem = updatedShopifyCart.lines.edges.slice(-1)[0].node;
      
      // Update our cart model
      const updatedCart: ShopifyCart = {
        id: updatedShopifyCart.id,
        items: updatedShopifyCart.lines.edges.map((edge: any) => ({
          id: edge.node.id,
          variantId: edge.node.merchandise.id,
          title: edge.node.merchandise.product.title,
          quantity: edge.node.quantity,
          price: edge.node.merchandise.priceV2.amount
        })),
        totalAmount: updatedShopifyCart.cost.totalAmount.amount,
        currencyCode: updatedShopifyCart.cost.totalAmount.currencyCode,
        totalQuantity: updatedShopifyCart.lines.edges.reduce((sum: number, edge: any) => sum + edge.node.quantity, 0),
        checkoutUrl: updatedShopifyCart.checkoutUrl
      };
      
      // Update cache
      this.carts.set(userId, updatedCart);
      
      return {
        success: true,
        cart: updatedCart,
        item: {
          title: addedItem.merchandise.product.title
        }
      };
    } catch (error) {
      console.error('Error adding to cart:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error adding to cart"
      };
    }
  }

  /**
   * Remove an item from the user's cart
   */
  async removeFromCart(userId: string, lineId: string): Promise<RemoveFromCartResult> {
    console.log(`Removing item ${lineId} from cart for user ${userId}`);
    
    try {
      // Get the cart
      const cart = await this.getCart(userId);
      if (!cart) {
        return {
          success: false,
          error: "Cart not found"
        };
      }
      
      // Find the item to get its title before removal
      const item = cart.items.find(item => item.id === lineId);
      if (!item) {
        return {
          success: false,
          error: "Item not found in cart"
        };
      }
      
      const itemTitle = item.title;
      
      // Remove item from cart with GraphQL
      const graphqlQuery = `
        mutation RemoveFromCart($cartId: ID!, $lineIds: [ID!]!) {
          cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
            cart {
              id
              checkoutUrl
              cost {
                totalAmount {
                  amount
                  currencyCode
                }
              }
              lines(first: 50) {
                edges {
                  node {
                    id
                    quantity
                    merchandise {
                      ... on ProductVariant {
                        id
                        title
                        priceV2 {
                          amount
                          currencyCode
                        }
                        product {
                          title
                        }
                      }
                    }
                  }
                }
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;
      
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': this.storefrontAccessToken
        },
        body: JSON.stringify({
          query: graphqlQuery,
          variables: {
            cartId: cart.id,
            lineIds: [lineId]
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Shopify API responded with status ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      
      if (data.errors) {
        throw new Error(`GraphQL Error: ${data.errors[0].message}`);
      }
      
      if (data.data.cartLinesRemove.userErrors && data.data.cartLinesRemove.userErrors.length > 0) {
        return {
          success: false,
          error: data.data.cartLinesRemove.userErrors[0].message
        };
      }
      
      const updatedShopifyCart = data.data.cartLinesRemove.cart;
      
      // Update our cart model
      const updatedCart: ShopifyCart = {
        id: updatedShopifyCart.id,
        items: updatedShopifyCart.lines.edges.map((edge: any) => ({
          id: edge.node.id,
          variantId: edge.node.merchandise.id,
          title: edge.node.merchandise.product.title,
          quantity: edge.node.quantity,
          price: edge.node.merchandise.priceV2.amount
        })),
        totalAmount: updatedShopifyCart.cost.totalAmount.amount,
        currencyCode: updatedShopifyCart.cost.totalAmount.currencyCode,
        totalQuantity: updatedShopifyCart.lines.edges.reduce((sum: number, edge: any) => sum + edge.node.quantity, 0),
        checkoutUrl: updatedShopifyCart.checkoutUrl
      };
      
      // Update cache
      this.carts.set(userId, updatedCart);
      
      return {
        success: true,
        cart: updatedCart,
        item: {
          title: itemTitle
        }
      };
    } catch (error) {
      console.error('Error removing from cart:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error removing from cart"
      };
    }
  }

  /**
   * Create a checkout URL for the user's cart
   */
  async createCheckout(userId: string): Promise<string> {
    console.log(`Creating checkout for user ${userId}`);
    
    try {
      // Get the cart
      const cart = await this.getCart(userId);
      if (!cart || cart.items.length === 0) {
        throw new Error("Cart is empty");
      }
      
      // Shopify Storefront API already provides a checkout URL with the cart
      return cart.checkoutUrl;
    } catch (error) {
      console.error('Error creating checkout:', error);
      throw error;
    }
  }
}
