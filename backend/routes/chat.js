import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getRelevantDataFromDB } from '../utils/dbQuery.js';

const router = express.Router();

// Initialize Gemini model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Helper function to determine query intent and customize response
function getQueryIntent(query) {
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('bulk') || queryLower.includes('large order') || queryLower.includes('party') || 
      queryLower.includes('catering') || /\d+.*people|people.*\d+/.test(queryLower)) {
    return 'bulk_order';
  }
  
  if (queryLower.includes('recommend') || queryLower.includes('suggest') || queryLower.includes('what should')) {
    return 'recommendation';
  }
  
  if (queryLower.includes('spicy') || queryLower.includes('hot')) {
    return 'spicy_preference';
  }
  
  if (queryLower.includes('vegetarian') || queryLower.includes('vegan') || queryLower.includes('veg')) {
    return 'dietary_preference';
  }
  
  if (queryLower.includes('price') || queryLower.includes('cost') || queryLower.includes('budget') || 
      queryLower.includes('cheap') || queryLower.includes('expensive')) {
    return 'price_inquiry';
  }
  
  if (queryLower.includes('dessert') || queryLower.includes('sweet') || queryLower.includes('cake') || 
      queryLower.includes('ice cream')) {
    return 'dessert_request';
  }
  
  return 'general';
}

// Helper function to create context-aware prompts
function createPrompt(query, contextData, intent) {
  const baseInstructions = `You are FoodieBot, a friendly and knowledgeable assistant for our food ordering app. 
Your personality: Enthusiastic about food, helpful, and always ready to make great recommendations.

IMPORTANT RULES:
1. Always be conversational and friendly
2. Use emojis sparingly but appropriately 
3. If no menu data is available, apologize and suggest alternatives
4. Always mention prices when recommending items
5. Be specific about what makes each dish special
6. Keep responses concise but informative (2-4 sentences max unless asked for details)`;

  let specificInstructions = '';
  let responseStyle = '';

  switch (intent) {
    case 'bulk_order':
      specificInstructions = `
BULK ORDER DETECTED: The user is interested in ordering for multiple people or a large quantity.
- Offer bulk discounts (10% off orders above ₹2000, 15% off above ₹5000)
- Suggest combo deals and family packs
- Mention catering services if available
- Ask about number of people to provide better recommendations`;
      responseStyle = 'Focus on value deals and bulk options';
      break;

    case 'recommendation':
      specificInstructions = `
RECOMMENDATION REQUEST: The user wants suggestions.
- Highlight 2-3 most popular or recommended items
- Mention what makes each special (taste, popularity, unique ingredients)
- Consider variety (appetizer, main course, dessert if available)
- Ask about preferences if context is unclear`;
      responseStyle = 'Be enthusiastic and descriptive about food';
      break;

    case 'spicy_preference':
      specificInstructions = `
SPICY FOOD REQUEST: User wants spicy food.
- Prioritize items with spicy ingredients or high spice levels
- Mention spice level if available
- Warn about extremely spicy items
- Suggest mild alternatives as backup`;
      responseStyle = 'Highlight spice levels and heat intensity';
      break;

    case 'dietary_preference':
      specificInstructions = `
DIETARY PREFERENCE: User has specific dietary needs.
- Filter and highlight vegetarian/vegan options clearly
- Mention ingredients that make items suitable for their diet
- Suggest complete meal combinations within their dietary restrictions`;
      responseStyle = 'Focus on dietary compliance and ingredient transparency';
      break;

    case 'price_inquiry':
      specificInstructions = `
PRICE-FOCUSED QUERY: User is budget-conscious.
- Highlight value-for-money options
- Mention any ongoing offers or discounts
- Suggest budget-friendly combos
- Show price range options (budget, mid-range, premium)`;
      responseStyle = 'Emphasize value and affordability';
      break;

    case 'dessert_request':
      specificInstructions = `
DESSERT REQUEST: User wants sweet treats.
- If no desserts found in menu data, apologize and explain
- Suggest sweet beverages or any sweet items available
- Ask if they'd like recommendations for sweet drinks instead
- Mention if desserts can be specially ordered`;
      responseStyle = 'Be understanding if limited dessert options';
      break;

    default:
      specificInstructions = `
GENERAL QUERY: Provide helpful information about the available menu items.
- Answer directly based on available menu data
- If searching for specific items, show exact matches first
- Suggest similar alternatives if exact match not found`;
      responseStyle = 'Be direct and helpful';
  }

  const contextSection = contextData && contextData !== 'No matching items found in the database.' 
    ? `=== AVAILABLE MENU ITEMS ===\n${contextData}\n`
    : `=== MENU STATUS ===\nNo specific items found for your query. This might mean:\n- The items aren't currently available\n- They might be categorized differently\n- Our menu might not include those specific items\n`;

  return `${baseInstructions}

${specificInstructions}

${contextSection}

=== USER QUERY ===
"${query}"

=== RESPONSE STYLE ===
${responseStyle}

Respond in a helpful, friendly manner. If no relevant menu items are available, acknowledge this politely and offer alternatives or ask clarifying questions.`;
}

router.post('/', async (req, res) => {
  const { query } = req.body;
  
  // Input validation
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ 
      error: 'Valid query is required',
      message: 'Please provide a non-empty query string'
    });
  }

  // Sanitize input
  const sanitizedQuery = query.trim().slice(0, 500); // Limit query length

  try {
    // Fetch menu data from DB
    const contextData = await getRelevantDataFromDB(sanitizedQuery);
    console.log('Context data retrieved:', contextData);

    // Determine query intent for better response customization
    const intent = getQueryIntent(sanitizedQuery);
    console.log('Detected intent:', intent);

    // Create context-aware prompt
    const prompt = createPrompt(sanitizedQuery, contextData, intent);
    console.log('Generated prompt preview:', prompt.substring(0, 200) + '...');

    // Generate response from Gemini with enhanced parameters
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7, // Balanced creativity
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 300, // Keep responses concise
      },
    });

    const reply = result.response.text();
    console.log('AI Response generated successfully');

    // Add some response post-processing
    const enhancedReply = enhanceResponse(reply, intent, contextData);

    res.json({ 
      answer: enhancedReply,
      intent: intent, // Useful for frontend to customize UI
      hasMenuData: contextData !== 'No matching items found in the database.'
    });

  } catch (error) {
    console.error('Error in /chat route:', error.message);
    
    // More specific error handling
    if (error.message.includes('API key')) {
      return res.status(500).json({ 
        error: 'AI service configuration error',
        message: 'Please try again later'
      });
    }
    
    if (error.message.includes('quota') || error.message.includes('limit')) {
      return res.status(429).json({ 
        error: 'Service temporarily unavailable',
        message: 'High demand right now, please try again in a moment'
      });
    }

    res.status(500).json({ 
      error: 'Failed to process chat request',
      message: 'Something went wrong. Please try again.'
    });
  }
});

// Helper function to enhance responses
function enhanceResponse(reply, intent, contextData) {
  let enhanced = reply;

  // Add helpful call-to-action based on intent
  if (intent === 'bulk_order' && contextData !== 'No matching items found in the database.') {
    enhanced += '\n\n💡 Ready to place your bulk order? Contact us for personalized assistance and additional discounts!';
  } else if (intent === 'recommendation' && contextData !== 'No matching items found in the database.') {
    enhanced += '\n\n🍽️ Would you like me to suggest any beverages or sides to go with your meal?';
  } else if (contextData === 'No matching items found in the database.') {
    enhanced += '\n\n📱 You can browse our full menu or ask me about specific categories like "main course", "beverages", or "snacks"!';
  }

  return enhanced;
}

// Additional endpoint for getting all available categories (useful for frontend)
router.get('/categories', async (req, res) => {
  try {
    // This would require adding a function to your dbQuery.js
    const categories = await MenuItem.distinct('category');
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'chat-ai',
    timestamp: new Date().toISOString()
  });
});

export default router;