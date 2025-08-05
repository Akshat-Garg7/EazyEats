import mongoose from 'mongoose';
import MenuItem from '../models/MenuItem.js';

export async function getRelevantDataFromDB(query) {
  if (!query || typeof query !== 'string') return '';
  
  try {
    const keywords = query.toLowerCase().split(/\s+/);
    console.log('Original keywords:', keywords);
    
    // Create keyword mappings for better semantic search
    const categoryMappings = {
      'dessert': ['dessert', 'sweet', 'cake', 'ice cream', 'pudding', 'pastry', 'cookie', 'chocolate', 'candy'],
      'sweets': ['dessert', 'sweet', 'cake', 'ice cream', 'pudding', 'pastry', 'cookie', 'chocolate', 'candy'],
      'sweet': ['dessert', 'sweet', 'cake', 'ice cream', 'pudding', 'pastry', 'cookie', 'chocolate', 'candy'],
      'spicy': ['spicy', 'hot', 'chili', 'pepper', 'masala', 'curry', 'tandoori', 'vindaloo'],
      'beverage': ['drink', 'beverage', 'juice', 'coffee', 'tea', 'soda', 'water', 'smoothie'],
      'appetizer': ['appetizer', 'starter', 'snack', 'finger food', 'dip'],
      'main course': ['main', 'entree', 'dinner', 'lunch', 'rice', 'noodles', 'pasta'],
      'vegetarian': ['vegetarian', 'veg', 'plant-based', 'veggie'],
      'non-vegetarian': ['non-vegetarian', 'non-veg', 'meat', 'chicken', 'fish', 'beef', 'pork']
    };

    // Expand search terms based on mappings
    const expandedKeywords = new Set(keywords);
    
    keywords.forEach(keyword => {
      Object.entries(categoryMappings).forEach(([category, terms]) => {
        if (terms.includes(keyword)) {
          terms.forEach(term => expandedKeywords.add(term));
        }
      });
    });

    // Convert back to array for regex
    const searchTerms = Array.from(expandedKeywords);
    console.log('Expanded search terms:', searchTerms);
    
    // Build more comprehensive MongoDB filter
    const filter = {
      $or: [
        { name: new RegExp(searchTerms.join('|'), 'i') },
        { category: new RegExp(searchTerms.join('|'), 'i') },
        { description: new RegExp(searchTerms.join('|'), 'i') },
        // Remove tags search if you don't have tags field
        // { tags: { $in: searchTerms.map(term => new RegExp(term, 'i')) } },
        // Category-specific searches
        ...(keywords.some(k => ['dessert', 'sweet', 'sweets'].includes(k)) ? [{ category: /dessert|sweet|sweets/i }] : []),
        ...(keywords.includes('spicy') ? [{ 
          $or: [
            { description: /spicy|hot|chili|pepper/i },
            // Remove spiceLevel if you don't have this field
            // { spiceLevel: { $gt: 0 } }
          ]
        }] : [])
      ]
    };

    console.log('MongoDB filter:', JSON.stringify(filter, null, 2));

    // Sort by relevance (you can implement scoring later)
    const matchedItems = await MenuItem.find(filter)
      .limit(10)
      .lean();

    console.log('Found items:', matchedItems.length);

    if (matchedItems.length === 0) {
      // Debug: Let's see what categories actually exist in your database
      const allCategories = await MenuItem.distinct('category');
      console.log('All available categories in database:', allCategories);
      
      // Debug: Let's see a few sample items
      const sampleItems = await MenuItem.find({}).limit(5).lean();
      console.log('Sample items:', sampleItems.map(item => ({ name: item.name, category: item.category })));
      
      // Try a very broad search as fallback
      const broadFilter = {
        $or: [
          { name: new RegExp(keywords.join('|'), 'i') },
          { category: new RegExp(keywords.join('|'), 'i') },
          { description: new RegExp(keywords.join('|'), 'i') }
        ]
      };
      
      const broadResults = await MenuItem.find(broadFilter).limit(10).lean();
      console.log('Broad search results:', broadResults.length);
      
      if (broadResults.length === 0) {
        // If still no results, suggest alternatives based on available categories
        const suggestions = getSuggestions(keywords, allCategories);
        return `No matching items found. ${suggestions}`;
      }
      
      return formatItems(broadResults);
    }

    return formatItems(matchedItems);
  } catch (err) {
    console.error('Error querying database:', err);
    return 'Error retrieving data from the database.';
  }
}

function getSuggestions(keywords, availableCategories) {
  if (keywords.some(k => ['dessert', 'sweet', 'sweets'].includes(k))) {
    const possibleCategories = availableCategories.filter(cat => 
      /sweet|dessert|ice|cake|chocolate|candy/i.test(cat)
    );
    
    if (possibleCategories.length > 0) {
      return `However, we do have items in these categories: ${possibleCategories.join(', ')}`;
    }
    
    return `Available categories are: ${availableCategories.join(', ')}. Try searching for specific items or ask for recommendations from these categories.`;
  }
  
  return `Available categories are: ${availableCategories.join(', ')}.`;
}

function formatItems(items) {
  return items.map(item => {
    return `Name: ${item.name}
Category: ${item.category}
Price: ₹${item.price}
Description: ${item.description}
Available: ${item.available ? 'Yes' : 'No'}${item.spiceLevel ? `\nSpice Level: ${item.spiceLevel}/5` : ''}`;
  }).join('\n\n');
}

// Helper function to check what's actually in your database
export async function debugDatabase() {
  try {
    const totalItems = await MenuItem.countDocuments();
    const categories = await MenuItem.distinct('category');
    const sampleItems = await MenuItem.find({}).limit(10).lean();
    
    console.log('=== DATABASE DEBUG INFO ===');
    console.log('Total items:', totalItems);
    console.log('Categories:', categories);
    console.log('Sample items:', sampleItems.map(item => ({
      name: item.name,
      category: item.category,
      description: item.description?.substring(0, 50) + '...'
    })));
    console.log('=== END DEBUG INFO ===');
    
    return {
      totalItems,
      categories,
      sampleItems: sampleItems.slice(0, 5)
    };
  } catch (err) {
    console.error('Debug error:', err);
    return null;
  }
}