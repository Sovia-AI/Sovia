/**
 * ResponseFormatter - A service that formats technical analysis results
 * into more human-like, conversational responses
 */
export class ResponseFormatter {
  // Intros for market analysis responses to add variety
  private marketIntros = [
    "Let's dive into {token}'s chart and see what's up!",
    "Alright, let's take a look at what {token} has been doing lately!",
    "Here's the full scoop on {token}'s current market situation!",
    "Let's break down {token}'s chart and see where things stand!",
    "I've got the latest on {token} - here's what the data tells us!",
    "{token}'s been making moves, so here's the technical breakdown!",
    "Time for a deep dive into {token}'s market performance!",
    "Let's decode {token}'s chart patterns and see what's cooking!",
    "Here's the technical picture for {token} right now!",
    "Let's zoom in on {token} and see what the indicators are saying!",
    "Looking at {token}'s action lately, here's what I'm seeing!",
    "I just checked {token}'s charts and here's the quick rundown!",
    "Let me break down what {token}'s been up to in the market!",
    "Looking at {token} with a technical lens, here's what stands out!",
    "Let's dive into the latest data on {token} and see what we find!"
  ];

  // Conclusion phrases for analysis to add variety
  private conclusionPhrases = [
    "What's your take on this? Ready to make a move?",
    "Are you thinking of jumping in, or waiting for better conditions?",
    "How does this align with your trading strategy?",
    "What's your play based on these signals?",
    "Does this match what you were expecting for {token}?",
    "Are you bullish or bearish based on these indicators?",
    "Does this analysis help with your decision?",
    "What timeline are you looking at for your {token} strategy?",
    "Are you trading short-term swings or looking at a longer hold?",
    "Would you like a deeper dive into any specific indicator?",
    "Any specific part of this analysis you want me to elaborate on?",
    "Does this give you the insights you were looking for?",
    "Does this help with your decision making for {token}?",
    "Would you like me to focus on any particular aspect of {token}'s chart?",
    "What timeframe are you considering for your {token} strategy?"
  ];

  // Transition phrases to connect sections
  private transitionPhrases = [
    "Looking at the indicators more closely,",
    "Digging into the technical side,",
    "When we check the momentum indicators,",
    "On the volume front,",
    "If we analyze the trend patterns,",
    "The support and resistance levels show that",
    "Price action suggests that",
    "Market statistics reveal",
    "Taking a step back to look at the bigger picture,",
    "Zooming in on the recent movements,",
    "Analyzing the volatility patterns,",
    "The momentum indicators suggest that",
    "Checking the market structure,",
    "The volume profile indicates",
    "When we look at trader participation,"
  ];

  // Phrases to describe bullish conditions
  private bullishPhrases = [
    "looking pretty bullish",
    "showing strong upward momentum",
    "giving off positive vibes",
    "signaling potential upside",
    "suggesting a possible uptrend",
    "pointing to buying pressure",
    "indicating accumulation",
    "showing signs of strength",
    "revealing buyer interest",
    "flashing some bullish signals",
    "indicating upward potential",
    "showing some serious strength",
    "suggesting buyers are in control"
  ];

  // Phrases to describe bearish conditions
  private bearishPhrases = [
    "leaning bearish",
    "showing downward pressure",
    "giving off cautious signals",
    "suggesting some weakness",
    "pointing to selling pressure",
    "indicating distribution",
    "showing signs of a pullback",
    "signaling a possible correction",
    "hinting at downside risk",
    "under some selling pressure",
    "indicating cautionary signals",
    "suggesting a pullback might be coming",
    "looking like sellers might be in control"
  ];

  // Phrases to describe neutral conditions
  private neutralPhrases = [
    "in a wait-and-see mode",
    "showing mixed signals",
    "in consolidation",
    "taking a breather",
    "moving sideways",
    "in a neutral pattern",
    "lacking clear direction",
    "coiling up for the next move",
    "at a crossroads",
    "showing indecision",
    "in a phase of equilibrium",
    "balancing between buyers and sellers",
    "gathering strength before the next move"
  ];

  // Market overview intros
  private marketOverviewIntros = [
    "Here's what's happening in the crypto market right now:",
    "Let me break down the current state of the market for you:",
    "The crypto markets are showing some interesting moves today:",
    "Here's a snapshot of what's going on in crypto land:",
    "Let's take a look at today's market situation:",
    "The latest from the crypto markets shows:",
    "Here's the scoop on what's happening in crypto today:",
    "Market overview coming right up! Here's what I'm seeing:",
    "Fresh from the crypto markets, here's what's going on:",
    "Taking the pulse of the crypto market today:",
    "Here's your crypto market weather report:",
    "Let's check the crypto market temperature:",
    "The crypto landscape is looking like this today:",
    "Here's the current crypto market rundown:",
    "Let me paint the picture of today's crypto market:"
  ];
  
  // New specialized intros for specific indicator analyses
  private rsiIntros = [
    "Let's check {token}'s momentum with the RSI:",
    "Looking at {token}'s relative strength index:",
    "Here's what the RSI is saying about {token}:",
    "The momentum gauge (RSI) for {token} shows:",
    "{token}'s buying and selling pressure measured by RSI:"
  ];
  
  private macdIntros = [
    "Taking a look at {token}'s MACD trend indicator:",
    "Here's what {token}'s MACD is telling us about momentum:",
    "The MACD for {token} is revealing some interesting signals:",
    "Checking {token}'s trend strength with MACD:",
    "{token}'s momentum story according to MACD:"
  ];
  
  private bollingerIntros = [
    "Let's look at {token}'s volatility through Bollinger Bands:",
    "Here's what the Bollinger Bands are saying about {token}:",
    "Checking {token}'s price volatility with Bollinger Bands:",
    "{token}'s price channels according to Bollinger Bands:",
    "The volatility picture for {token} using Bollinger Bands:"
  ];
  
  private maIntros = [
    "Here's what {token}'s moving averages are telling us:",
    "Taking a look at {token}'s trend through moving averages:",
    "The moving average picture for {token} shows:",
    "Here's the trend story for {token} via moving averages:",
    "{token}'s direction according to moving averages:"
  ];
  
  private supportResistanceIntros = [
    "Let's map out {token}'s key price levels:",
    "Here are the important price zones for {token}:",
    "These are the battlegrounds for {token}'s price action:",
    "{token}'s support and resistance roadmap:",
    "The key price barriers for {token} are:"
  ];

  /**
   * Formats a technical analysis response to be more conversational and human-like
   * while preserving all technical data
   */
  formatResponse(analysisText: string, query: string): string {
    // Keep original format for parsing purposes
    if (this.shouldReturnRawFormat(query)) {
      console.log('Using raw format for specific query type');
      return analysisText;
    }

    try {
      // Extract the token symbol from the analysis text
      const tokenSymbolMatch = analysisText.match(/Analysis for (.*?) \((.*?)\)/i) || 
                               analysisText.match(/## Technical Analysis for (.*?) \((.*?)\)/i) ||
                               analysisText.match(/## Market Overview for (.*?) \((.*?)\)/i);
                              
      const tokenName = tokenSymbolMatch ? tokenSymbolMatch[1] : "this token";
      const tokenSymbol = tokenSymbolMatch ? tokenSymbolMatch[2] : "";

      // Check if the user is asking for a specific indicator
      const specificIndicator = this.extractSpecificIndicator(query, analysisText);
      if (specificIndicator) {
        return specificIndicator;
      }

      // Format full technical analysis with more natural language
      if (analysisText.includes("Technical Analysis")) {
        return this.formatTechnicalAnalysis(analysisText, tokenName, tokenSymbol);
      } 
      // Format market overview
      else if (analysisText.includes("Market Overview") || analysisText.includes("Crypto Market Overview")) {
        return this.formatMarketOverview(analysisText, tokenName, tokenSymbol);
      }
      // Format fundamental analysis
      else if (analysisText.includes("Fundamental Analysis")) {
        return this.formatFundamentalAnalysis(analysisText, tokenName, tokenSymbol);
      }
      
      // Default case - return the original with minimal formatting
      return this.addConversationalElements(analysisText, tokenName, tokenSymbol);
    } catch (error) {
      console.error('Error in ResponseFormatter:', error);
      // If any error occurs, return the original analysis to ensure data is preserved
      return analysisText;
    }
  }

  /**
   * Format a full technical analysis response
   */
  private formatTechnicalAnalysis(analysisText: string, tokenName: string, tokenSymbol: string): string {
    // Extract price
    const priceMatch = analysisText.match(/Current Price:\s*\$([0-9,.]+)/);
    const price = priceMatch ? priceMatch[1] : "N/A";
    
    // Extract price change
    const priceChangeMatch = analysisText.match(/24h Change:\s*(-?[0-9,.]+)%/);
    const priceChange = priceChangeMatch ? priceChangeMatch[1] : "0";

    // Extract market cap
    const marketCapMatch = analysisText.match(/Market Cap:\s*\$([0-9,\.]+)/);
    const marketCap = marketCapMatch ? marketCapMatch[1] : "N/A";

    // Extract volume
    const volumeMatch = analysisText.match(/24h Volume:\s*\$([0-9,\.]+)/);
    const volume = volumeMatch ? volumeMatch[1] : "N/A";
    
    // Extract RSI
    const rsiMatch = analysisText.match(/RSI:\s*([0-9\.]+)/);
    const rsi = rsiMatch ? rsiMatch[1] : "N/A";

    // Replace formal headers with conversational intro
    const randomIntro = this.getRandomElement(this.marketIntros).replace('{token}', tokenSymbol || tokenName);
    let conversationalAnalysis = `${randomIntro} ${tokenSymbol}'s currently at $${price}, ${parseFloat(priceChange) >= 0 ? 'up' : 'down'} ${Math.abs(parseFloat(priceChange)).toFixed(2)}% over the last 24 hours, and it's been a bit of a rollercoaster. Here's the full breakdown to help you make sense of it:\n\n`;
    
    // Add price and volume section with a conversational tone
    conversationalAnalysis += `**Price and Volume:** That ${parseFloat(priceChange) >= 0 ? '+' : ''}${priceChange}% ${parseFloat(priceChange) >= 0 ? 'gain' : 'dip'} comes with a 24-hour volume of $${volume}, which is ${this.getVolumeDescription(volume)}. The market cap's a ${this.getMarketCapDescription(marketCap)} $${marketCap}, ${tokenSymbol}'s ${this.getMarketCapPosition(marketCap)}.\n\n`;

    // Add RSI in a conversational way
    conversationalAnalysis += `**RSI:** Sitting at ${rsi}, which is ${this.getRSIDescription(parseFloat(rsi))}.\n\n`;
    
    // Keep MACD, Bollinger Bands, Moving Averages, Support/Resistance sections with minor modifications
    // We'll extract these sections from the original and add conversational elements
    const macdSection = this.extractSection(analysisText, "MACD:", "Bollinger Bands:");
    const bollingerSection = this.extractSection(analysisText, "Bollinger Bands:", "Moving Averages:");
    const maSection = this.extractSection(analysisText, "Moving Averages:", "Support");
    const supportResistanceSection = this.extractSection(analysisText, "Support Levels:", "Current Trend:");
    const trendSection = this.extractSection(analysisText, "Current Trend:", "Market Statistics:");
    
    conversationalAnalysis += this.addConversationalElement("MACD:", macdSection);
    conversationalAnalysis += this.addConversationalElement("Bollinger Bands:", bollingerSection);
    conversationalAnalysis += this.addConversationalElement("Moving Averages:", maSection);
    
    // Random transition to support and resistance
    conversationalAnalysis += `**Support and Resistance:** ${this.getRandomElement(this.transitionPhrases)}\n${supportResistanceSection}\n\n`;
    
    // Add trend and pattern section
    if (trendSection) {
      conversationalAnalysis += `**Trend and Patterns:** ${trendSection}\n\n`;
    }
    
    // Extract market statistics
    const marketStatSection = this.extractSection(analysisText, "Market Statistics", "Summary");
    if (marketStatSection) {
      conversationalAnalysis += `**Market Stats:** ${marketStatSection}\n\n`;
    }
    
    // Extract summary section
    const summaryMatch = analysisText.match(/Summary\n([\s\S]*?)(?:\n\*Disclaimer|$)/);
    let summaryText = summaryMatch ? summaryMatch[1].trim() : "";
    
    if (summaryText) {
      // Make the summary more conversational
      conversationalAnalysis += `**What's the deal?** ${this.reformatSummary(summaryText, tokenSymbol)}\n\n`;
    }
    
    // Add a casual question at the end
    const conclusion = this.getRandomElement(this.conclusionPhrases).replace('{token}', tokenSymbol);
    conversationalAnalysis += conclusion + "\n\n";
    
    // Add disclaimer
    conversationalAnalysis += "*Disclaimer: This is for info only, not financial advice.*";
    
    return conversationalAnalysis;
  }

  /**
   * Format a market overview response
   */
  private formatMarketOverview(analysisText: string, tokenName: string, tokenSymbol: string): string {
    // Use a random market overview intro
    const randomIntro = this.getRandomElement(this.marketOverviewIntros);
    let formattedOverview = `${randomIntro}\n\n`;
    
    // Get Solana data if available
    const solanaSection = this.extractSection(analysisText, "### Solana (SOL)", "### Bitcoin");
    if (solanaSection) {
      const solPriceMatch = solanaSection.match(/Current Price.*?\$([0-9,.]+)/);
      const solPrice = solPriceMatch ? solPriceMatch[1] : "N/A";
      
      const solChangeMatch = solanaSection.match(/24h Change.*?(-?[0-9,.]+)%/);
      const solChange = solChangeMatch ? solChangeMatch[1] : "0";
      
      formattedOverview += `**SOL** is trading at $${solPrice}, ${parseFloat(solChange) >= 0 ? 'up' : 'down'} ${Math.abs(parseFloat(solChange)).toFixed(2)}% in the last 24 hours. `;
    }
    
    // Get Bitcoin data if available
    const btcSection = this.extractSection(analysisText, "### Bitcoin (BTC)", "### Market");
    if (btcSection) {
      const btcPriceMatch = btcSection.match(/Current Price.*?\$([0-9,.]+)/);
      const btcPrice = btcPriceMatch ? btcPriceMatch[1] : "N/A";
      
      const btcChangeMatch = btcSection.match(/24h Change.*?(-?[0-9,.]+)%/);
      const btcChange = btcChangeMatch ? btcChangeMatch[1] : "0";
      
      formattedOverview += `**BTC** is priced at $${btcPrice}, ${parseFloat(btcChange) >= 0 ? 'up' : 'down'} ${Math.abs(parseFloat(btcChange)).toFixed(2)}% over the same period.\n\n`;
    }
    
    // Get market sentiment if available
    const sentimentSection = this.extractSection(analysisText, "### Market Sentiment", "### Market Highlights");
    if (sentimentSection) {
      formattedOverview += `**Market Mood:** ${sentimentSection}\n\n`;
    }
    
    // Get market highlights if available
    const highlightsSection = this.extractSection(analysisText, "### Market Highlights", "*Disclaimer");
    if (highlightsSection) {
      formattedOverview += `**What's Happening:** ${highlightsSection.replace(/is at/g, 'is')}\n\n`;
    }
    
    // Add a conversational ending
    const endingQuestions = [
      `What specific token are you interested in today? I can analyze any crypto for you!`,
      `Any specific coin you'd like me to take a deeper look at?`,
      `Need insights on a particular token? Just let me know which one!`,
      `Want me to dive deeper into any specific crypto?`
    ];
    
    formattedOverview += this.getRandomElement(endingQuestions) + "\n\n";
    
    // Add disclaimer
    formattedOverview += "*Disclaimer: This is for info only, not financial advice.*";
    
    return formattedOverview;
  }

  /**
   * Format a fundamental analysis response
   */
  private formatFundamentalAnalysis(analysisText: string, tokenName: string, tokenSymbol: string): string {
    const introLines = [
      `Let's look under the hood of ${tokenSymbol || tokenName} and see what's driving it!`,
      `Here's the fundamental breakdown of ${tokenSymbol || tokenName} - the stuff beyond just price charts!`,
      `Want to know what ${tokenSymbol || tokenName} is really about? Let's dive into the fundamentals!`,
      `${tokenSymbol || tokenName}'s fundamentals tell an interesting story. Here's what I found:`,
      `Beyond the charts, here's what's happening with ${tokenSymbol || tokenName} at its core:`
    ];
    
    const randomIntro = this.getRandomElement(introLines);
    let formattedAnalysis = `${randomIntro}\n\n`;
    
    // Keep most sections but add conversational elements
    const sections = analysisText.split("###");
    
    sections.forEach((section, index) => {
      if (index === 0) return; // Skip the header section
      
      const sectionParts = section.split("\n");
      const sectionTitle = sectionParts[0].trim();
      const sectionContent = sectionParts.slice(1).join("\n").trim();
      
      if (sectionTitle === "Token Information") {
        formattedAnalysis += `**The Basics:** ${tokenSymbol || tokenName} is ${sectionContent.includes("Current Price") ? `currently valued at ${sectionContent.match(/Current Price:\s*\$([0-9,.]+)/)?.[1] || 'N/A'}` : ''}. ${this.getRandomElement(this.transitionPhrases)}\n\n${sectionContent}\n\n`;
      } else if (sectionTitle === "Project Information" && sectionContent.length > 0) {
        formattedAnalysis += `**Behind the Scenes:** ${tokenSymbol || tokenName}'s got some interesting foundations. ${this.getRandomElement(this.transitionPhrases)}\n\n${sectionContent}\n\n`;
      } else if (sectionTitle === "Market Adoption" && sectionContent.length > 0) {
        formattedAnalysis += `**Real-World Traction:** Here's how ${tokenSymbol || tokenName} is doing in terms of actual use:\n\n${sectionContent}\n\n`;
      } else if (sectionTitle.includes("Summary") && sectionContent.length > 0) {
        formattedAnalysis += `**Bottom Line:** ${this.reformatSummary(sectionContent, tokenSymbol)}\n\n`;
      } else if (sectionContent.length > 0) {
        formattedAnalysis += `**${sectionTitle}:** ${sectionContent}\n\n`;
      }
    });
    
    // Add a conversational ending
    const endingQuestions = [
      `What aspect of ${tokenSymbol || tokenName}'s fundamentals matters most to you?`,
      `Does this align with what you were looking to find out about ${tokenSymbol || tokenName}?`,
      `Are you looking at ${tokenSymbol || tokenName} as a short-term trade or a longer-term investment?`,
      `What's your take on ${tokenSymbol || tokenName}'s fundamentals? Solid or concerning?`
    ];
    
    formattedAnalysis += this.getRandomElement(endingQuestions) + "\n\n";
    
    // Add disclaimer
    formattedAnalysis += "*Disclaimer: This is for info only, not financial advice.*";
    
    return formattedAnalysis;
  }

  /**
   * Add conversational elements to any text
   */
  private addConversationalElements(analysisText: string, tokenName: string, tokenSymbol: string): string {
    // Replace formal headers with conversational intros
    let conversational = analysisText
      .replace(/## Technical Analysis for (.*?) \((.*?)\)/i, 
               `Let's dive into ${tokenSymbol || tokenName}'s chart and see what's up!`)
      .replace(/## Market Overview for (.*?) \((.*?)\)/i,
               `Here's what's happening with ${tokenSymbol || tokenName} in the market right now!`)
      .replace(/## Fundamental Analysis for (.*?) \((.*?)\)/i,
               `Let's look at what ${tokenSymbol || tokenName} is all about under the hood!`)
      .replace(/## Crypto Market Overview/i,
               `Here's the latest on the crypto market scene!`);
    
    // Replace "Summary" with a more conversational heading
    conversational = conversational.replace(/### Summary/i, "So what's the bottom line?");
    
    // Add a casual question at the end before the disclaimer
    if (conversational.includes("*Disclaimer")) {
      const conclusion = this.getRandomElement(this.conclusionPhrases).replace('{token}', tokenSymbol || tokenName);
      conversational = conversational.replace(/\*Disclaimer/, `${conclusion}\n\n*Disclaimer`);
    }
    
    return conversational;
  }
  
  /**
   * Extracts specific indicator information if user asks for just one data point
   * and adds a conversational response around it
   */
  extractSpecificIndicator(query: string, analysisResult: string): string | null {
    // Lowercase query for easier matching
    const lowerQuery = query.toLowerCase();
    
    // Extract token symbol
    const tokenMatch = analysisResult.match(/Analysis for (.*?) \((.*?)\)/i) || 
                      analysisResult.match(/## Technical Analysis for (.*?) \((.*?)\)/i);
    const token = tokenMatch ? tokenMatch[2] : "this token";
    
    // Check for RSI query
    if (lowerQuery.includes("rsi") || lowerQuery.includes("relative strength")) {
      const rsiMatch = analysisResult.match(/RSI:.*?([0-9.]+).*?(bearish|bullish|neutral|oversold|overbought|momentum)/i);
      if (rsiMatch) {
        const rsiValue = rsiMatch[1];
        const rsiInterpretation = rsiMatch[2];
        const rsiAnalysis = this.getRSIDescription(parseFloat(rsiValue));
        
        const rsiIntro = this.getRandomElement(this.rsiIntros).replace('{token}', token);
        
        return `${rsiIntro}\n\n${token}'s RSI is at ${rsiValue} right now, which is ${rsiAnalysis}. ${this.getRandomElement(this.conclusionPhrases).replace('{token}', token)}\n\n*Disclaimer: This is for info only, not financial advice.*`;
      }
    }
    
    // Check for MACD query
    else if (lowerQuery.includes("macd") || lowerQuery.includes("moving average convergence divergence")) {
      const macdSection = this.extractSection(analysisResult, "MACD:", "Bollinger");
      if (macdSection) {
        const macdIntro = this.getRandomElement(this.macdIntros).replace('{token}', token);
        
        const macdValues = macdSection.match(/Value: ([-.0-9]+), Signal: ([-.0-9]+)/i);
        if (macdValues) {
          const macdValue = macdValues[1];
          const signalValue = macdValues[2];
          const isBullish = parseFloat(macdValue) > parseFloat(signalValue);
          
          return `${macdIntro}\n\n${token}'s MACD is at ${macdValue}, ${isBullish ? 'above' : 'below'} the signal line at ${signalValue}. That's a ${isBullish ? 'bullish signal' : 'bearish signal'}, like the market's ${isBullish ? 'gaining momentum' : 'hitting the pause button'} on ${token}. ${this.getRandomElement(this.conclusionPhrases).replace('{token}', token)}\n\n*Disclaimer: This is for info only, not financial advice.*`;
        }
        
        // Fallback if we can't extract specific values
        return `${macdIntro}\n\n${macdSection}\n\n${this.getRandomElement(this.conclusionPhrases).replace('{token}', token)}\n\n*Disclaimer: This is for info only, not financial advice.*`;
      }
    }
    
    // Check for Moving Averages query
    else if (lowerQuery.includes("moving average") || lowerQuery.includes("ema") || lowerQuery.includes("ma")) {
      const maSection = this.extractSection(analysisResult, "Moving Averages:", "Support");
      if (maSection) {
        const maIntro = this.getRandomElement(this.maIntros).replace('{token}', token);
        
        // Extract MA values
        const emaValues = {
          ema9: maSection.match(/EMA9: \$([0-9.]+)/i)?.[1],
          ema20: maSection.match(/EMA20: \$([0-9.]+)/i)?.[1],
          ema50: maSection.match(/EMA50: \$([0-9.]+)/i)?.[1],
          ema200: maSection.match(/EMA200: \$([0-9.]+)/i)?.[1]
        };
        
        // Extract trend interpretation
        const trendMatch = maSection.match(/-(.*)/i)?.[1]?.trim();
        
        let maResponse = `${maIntro}\n\n`;
        
        if (emaValues.ema9 && emaValues.ema20 && emaValues.ema50 && emaValues.ema200) {
          maResponse += `Short-term EMA (9) is at $${emaValues.ema9}, mid-term EMAs are at $${emaValues.ema20} (20) and $${emaValues.ema50} (50), while the long-term EMA (200) sits at $${emaValues.ema200}. `;
          
          // Add interpretation
          if (parseFloat(emaValues.ema9) > parseFloat(emaValues.ema20) && 
              parseFloat(emaValues.ema20) > parseFloat(emaValues.ema50)) {
            maResponse += "The shorter-term averages above longer-term ones suggest bullish momentum. ";
          } else if (parseFloat(emaValues.ema9) < parseFloat(emaValues.ema20) && 
                    parseFloat(emaValues.ema20) < parseFloat(emaValues.ema50)) {
            maResponse += "The shorter-term averages below longer-term ones point to bearish pressure. ";
          } else {
            maResponse += "There's some mixed signals with the EMAs crossing each other. ";
          }
        }
        
        if (trendMatch) {
          maResponse += `The overall trend interpretation is: ${trendMatch}. `;
        }
        
        // Add conclusion
        maResponse += `\n\n${this.getRandomElement(this.conclusionPhrases).replace('{token}', token)}\n\n*Disclaimer: This is for info only, not financial advice.*`;
        
        return maResponse;
      }
    }
    
    // Check for Bollinger Bands query
    else if (lowerQuery.includes("bollinger") || lowerQuery.includes("bands")) {
      const bollingerSection = this.extractSection(analysisResult, "Bollinger Bands:", "Moving Averages:");
      if (bollingerSection) {
        const priceMatch = analysisResult.match(/Current Price:\s*\$([0-9,.]+)/);
        const price = priceMatch ? priceMatch[1] : "N/A";
        
        const bollingerIntro = this.getRandomElement(this.bollingerIntros).replace('{token}', token);
        
        return `${bollingerIntro}\n\n${token}'s Bollinger Bands have the price at $${price}, with ${bollingerSection.replace(/- /g, '').trim()}. It's like the market's holding its breath - this tight range could mean a big move is coming soon. ${this.getRandomElement(this.conclusionPhrases).replace('{token}', token)}\n\n*Disclaimer: This is for info only, not financial advice.*`;
      }
    }
    
    // Check for support/resistance query
    else if (lowerQuery.includes("support") || lowerQuery.includes("resistance")) {
      const supportResistanceSection = this.extractSection(analysisResult, "Support Levels:", "Current Trend:") || 
                                       this.extractSection(analysisResult, "Support Levels:", "Trend:");
      if (supportResistanceSection) {
        const srIntro = this.getRandomElement(this.supportResistanceIntros).replace('{token}', token);
        
        if (lowerQuery.includes("support") && !lowerQuery.includes("resistance")) {
          // Just support levels
          const supportLines = supportResistanceSection.split('\n')
            .filter(line => line.includes("Support"))
            .map(line => line.trim());
          
          if (supportLines.length > 0) {
            const supportLevels = supportLines.join(', ').replace(/- Support \d+: /g, '');
            return `${srIntro}\n\n${token}'s got support at ${supportLevels}. These are the levels where buyers might step in if the price drops. ${this.getRandomElement(this.conclusionPhrases).replace('{token}', token)}\n\n*Disclaimer: This is for info only, not financial advice.*`;
          }
        } 
        else if (lowerQuery.includes("resistance") && !lowerQuery.includes("support")) {
          // Just resistance levels
          const resistanceLines = supportResistanceSection.split('\n')
            .filter(line => line.includes("Resistance"))
            .map(line => line.trim());
          
          if (resistanceLines.length > 0) {
            const resistanceLevels = resistanceLines.join(', ').replace(/- Resistance \d+: /g, '');
            return `${srIntro}\n\n${token}'s facing resistance at ${resistanceLevels}. These are the hurdles the price needs to clear for the next leg up. ${this.getRandomElement(this.conclusionPhrases).replace('{token}', token)}\n\n*Disclaimer: This is for info only, not financial advice.*`;
          }
        }
        else {
          // Both support and resistance
          return `${srIntro}\n\n${supportResistanceSection.replace(/- /g, '')}\n\nThese are the key levels to watch - supports are where buyers might step in, and resistances are the hurdles ${token} needs to clear. ${this.getRandomElement(this.conclusionPhrases).replace('{token}', token)}\n\n*Disclaimer: This is for info only, not financial advice.*`;
        }
      }
    }
    
    // Check for trend or pattern query
    else if (lowerQuery.includes("trend") || lowerQuery.includes("pattern")) {
      const trendSection = this.extractSection(analysisResult, "Current Trend:", "Market Statistics:") ||
                          this.extractSection(analysisResult, "Trend:", "Market Statistics:");
      if (trendSection) {
        return `${token}'s in a ${trendSection.replace(/- /g, '').trim()}. ${this.getRandomElement(this.conclusionPhrases).replace('{token}', token)}\n\n*Disclaimer: This is for info only, not financial advice.*`;
      }
    }
    
    // Check for volume query
    else if (lowerQuery.includes("volume")) {
      const volumeMatch = analysisResult.match(/24h Volume:\s*\$([0-9,\.]+)/) ||
                         analysisResult.match(/Volume:\s*\$([0-9,\.]+)/);
      
      if (volumeMatch) {
        const volume = volumeMatch[1];
        
        // Try to extract volume trend
        const volumeTrendMatch = analysisResult.match(/Volume Trend:\s*(\w+)\s*\(([-+]?[0-9.]+)%\s*change/i);
        let trendInfo = "";
        
        if (volumeTrendMatch) {
          const trend = volumeTrendMatch[1];
          const changePercent = volumeTrendMatch[2];
          trendInfo = `, which is ${trend} by ${changePercent}%`;
        }
        
        return `${token}'s 24-hour volume is $${volume}${trendInfo}. ${this.getVolumeDescription(volume)} ${this.getRandomElement(this.conclusionPhrases).replace('{token}', token)}\n\n*Disclaimer: This is for info only, not financial advice.*`;
      }
    }
    
    // Check for market cap query
    else if (lowerQuery.includes("market cap") || lowerQuery.includes("marketcap")) {
      const marketCapMatch = analysisResult.match(/Market Cap:\s*\$([0-9,\.]+)/);
      
      if (marketCapMatch) {
        const marketCap = marketCapMatch[1];
        
        return `${token}'s market cap is $${marketCap}, which makes it ${this.getMarketCapDescription(marketCap)}. ${this.getMarketCapPosition(marketCap)}. ${this.getRandomElement(this.conclusionPhrases).replace('{token}', token)}\n\n*Disclaimer: This is for info only, not financial advice.*`;
      }
    }
    
    return null;
  }

  /**
   * Helper method to get a random element from an array
   */
  private getRandomElement(arr: string[]): string {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * Helper method to extract a section from the analysis text
   */
  private extractSection(text: string, startMarker: string, endMarker: string): string {
    const startIndex = text.indexOf(startMarker);
    if (startIndex === -1) return '';
    
    const endIndex = text.indexOf(endMarker, startIndex);
    if (endIndex === -1) return text.substring(startIndex + startMarker.length).trim();
    
    return text.substring(startIndex + startMarker.length, endIndex).trim();
  }
  
  /**
   * Helper method to add a conversational element to a section
   */
  private addConversationalElement(header: string, content: string): string {
    if (!content) return '';
    
    return `**${header.replace(':', '')}:** ${this.getRandomElement(this.transitionPhrases)} ${content}\n\n`;
  }
  
  /**
   * Helper method to reformat the summary to be more conversational
   */
  private reformatSummary(summary: string, tokenSymbol: string): string {
    // Replace technical phrases with more conversational ones
    let conversationalSummary = summary
      .replace(/technical indicators/i, "signals")
      .replace(/bullish indicators/i, "bullish signs")
      .replace(/bearish indicators/i, "bearish warnings")
      .replace(/consolidation phase/i, "taking a breather")
      .replace(/monitor price action/i, `keep an eye on ${tokenSymbol}`)
      .replace(/current levels/i, "where it's at now");
      
    // Add a conversational opener if needed
    if (!conversationalSummary.includes("looks like") && 
        !conversationalSummary.includes("seems to") && 
        !conversationalSummary.includes("appears to")) {
      conversationalSummary = `Putting it all together, ${tokenSymbol} ${conversationalSummary}`;
    }
    
    return conversationalSummary;
  }
  
  /**
   * Helper method to check if we should return the raw format
   */
  private shouldReturnRawFormat(query: string): boolean {
    const rawFormatPatterns = [
      /raw/i,
      /original/i,
      /standard/i,
      /technical only/i,
      /just data/i,
      /no conversation/i
    ];
    
    return rawFormatPatterns.some(pattern => pattern.test(query));
  }
  
  /**
   * Helper method to describe RSI values
   */
  private getRSIDescription(rsi: number): string {
    if (rsi > 70) return "overbought territory, suggesting it might be due for a cooldown";
    if (rsi > 60) return "showing strong bullish momentum";
    if (rsi > 50) return "showing positive momentum";
    if (rsi > 40) return "slightly bearish, but still neutral";
    if (rsi > 30) return "showing bearish pressure";
    return "in oversold territory, which could indicate a potential bounce";
  }
  
  /**
   * Helper method to describe market cap
   */
  private getMarketCapDescription(marketCap: string): string {
    const capValue = parseFloat(marketCap.replace(/,/g, ''));
    
    if (capValue > 100000000000) return "a major player in the crypto space";
    if (capValue > 10000000000) return "a large-cap token";
    if (capValue > 1000000000) return "a mid-to-large cap token";
    if (capValue > 100000000) return "a mid-cap token";
    if (capValue > 10000000) return "a small-to-mid cap token";
    return "a smaller project by market cap";
  }
  
  /**
   * Helper method to describe market cap position
   */
  private getMarketCapPosition(marketCap: string): string {
    const capValue = parseFloat(marketCap.replace(/,/g, ''));
    
    if (capValue > 100000000000) return "putting it among the top crypto assets";
    if (capValue > 10000000000) return "placing it firmly in the top tier";
    if (capValue > 1000000000) return "which is significant but with room to grow";
    if (capValue > 100000000) return "giving it some established presence but plenty of growth potential";
    return "which means it has substantial room to grow if the project succeeds";
  }
  
  /**
   * Helper method to describe volume
   */
  private getVolumeDescription(volume: string): string {
    const volValue = parseFloat(volume.replace(/,/g, ''));
    
    if (volValue > 1000000000) return "showing massive trading interest";
    if (volValue > 100000000) return "showing very strong trading activity";
    if (volValue > 10000000) return "showing healthy liquidity";
    if (volValue > 1000000) return "decent but not exceptional";
    return "on the lower side, suggesting caution with liquidity";
  }
}
