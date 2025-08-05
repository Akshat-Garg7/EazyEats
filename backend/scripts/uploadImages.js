import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { GridFSBucket } from 'mongodb';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { config } from 'dotenv';
import MenuItem from '../models/MenuItem.js';
import Order from '../models/Order.js';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config();

// All your menu items with image mapping
const menuItemsData = [
  {
    "id": "m1",
    "name": "Mac & Cheese",
    "price": "8.99",
    "description": "Creamy cheddar cheese mixed with perfectly cooked macaroni, topped with crispy breadcrumbs. A classic comfort food.",
    "image": "images/mac-and-cheese.jpg",
    "category": "main"
  },
  {
    "id": "m2",
    "name": "Margherita Pizza",
    "price": "12.99",
    "description": "A classic pizza with fresh mozzarella, tomatoes, and basil on a thin and crispy crust.",
    "image": "images/margherita-pizza.jpg",
    "category": "main"
  },
  {
    "id": "m3",
    "name": "Caesar Salad",
    "price": "7.99",
    "description": "Romaine lettuce tossed in Caesar dressing, topped with croutons and parmesan shavings.",
    "image": "images/caesar-salad.jpg",
    "category": "salad"
  },
  {
    "id": "m4",
    "name": "Spaghetti Carbonara",
    "price": "10.99",
    "description": "Al dente spaghetti with a creamy sauce made from egg yolk, pecorino cheese, pancetta, and pepper.",
    "image": "images/spaghetti-carbonara.jpg",
    "category": "main"
  },
  {
    "id": "m5",
    "name": "Veggie Burger",
    "price": "9.99",
    "description": "A juicy veggie patty served on a whole grain bun with lettuce, tomato, and a tangy sauce.",
    "image": "images/veggie-burger.jpg",
    "category": "main"
  },
  {
    "id": "m6",
    "name": "Grilled Chicken Sandwich",
    "price": "10.99",
    "description": "Tender grilled chicken breast with avocado, bacon, lettuce, and honey mustard on a toasted bun.",
    "image": "images/grilled-chicken-sandwich.jpg",
    "category": "main"
  },
  {
    "id": "m7",
    "name": "Steak Frites",
    "price": "17.99",
    "description": "Succulent steak cooked to your preference, served with crispy golden fries and herb butter.",
    "image": "images/steak-frites.jpg",
    "category": "main"
  },
  {
    "id": "m8",
    "name": "Sushi Roll Platter",
    "price": "15.99",
    "description": "An assortment of fresh sushi rolls including California, Spicy Tuna, and Eel Avocado.",
    "image": "images/sushi-roll-platter.jpg",
    "category": "main"
  },
  {
    "id": "m9",
    "name": "Chicken Curry",
    "price": "13.99",
    "description": "Tender pieces of chicken simmered in a rich and aromatic curry sauce, served with basmati rice.",
    "image": "images/chicken-curry.jpg",
    "category": "main"
  },
  {
    "id": "m10",
    "name": "Vegan Buddha Bowl",
    "price": "11.99",
    "description": "A hearty bowl filled with quinoa, roasted veggies, avocado, and a tahini dressing.",
    "image": "images/vegan-buddha-bowl.jpg",
    "category": "healthy"
  },
  {
    "id": "m11",
    "name": "Seafood Paella",
    "price": "19.99",
    "description": "A Spanish delicacy filled with saffron-infused rice, shrimp, mussels, and chorizo.",
    "image": "images/seafood-paella.jpg",
    "category": "main"
  },
  {
    "id": "m12",
    "name": "Pancake Stack",
    "price": "8.99",
    "description": "Fluffy pancakes stacked high, drizzled with maple syrup and topped with fresh berries.",
    "image": "images/pancake-stack.jpg",
    "category": "breakfast"
  },
  {
    "id": "m13",
    "name": "Miso Ramen",
    "price": "12.99",
    "description": "A warming bowl of ramen with miso broth, tender pork, soft-boiled egg, and green onions.",
    "image": "images/miso-ramen.jpg",
    "category": "main"
  },
  {
    "id": "m14",
    "name": "Beef Tacos",
    "price": "9.99",
    "description": "Three soft tortillas filled with seasoned beef, fresh salsa, cheese, and sour cream.",
    "image": "images/beef-tacos.jpg",
    "category": "main"
  },
  {
    "id": "m15",
    "name": "Chocolate Brownie",
    "price": "5.99",
    "description": "A rich and fudgy brownie, topped with a scoop of vanilla ice cream and chocolate sauce.",
    "image": "images/chocolate-brownie.jpg",
    "category": "dessert"
  },
  {
    "id": "m16",
    "name": "Lobster Bisque",
    "price": "14.99",
    "description": "A creamy soup made from lobster stock, aromatic vegetables, and a touch of brandy.",
    "image": "images/lobster-bisque.jpg",
    "category": "soup"
  },
  {
    "id": "m17",
    "name": "Mushroom Risotto",
    "price": "13.99",
    "description": "Creamy Arborio rice cooked with a medley of wild mushrooms and finished with parmesan.",
    "image": "images/mushroom-risotto.jpg",
    "category": "main"
  },
  {
    "id": "m18",
    "name": "Eggplant Parmesan",
    "price": "11.99",
    "description": "Layers of breaded eggplant, marinara sauce, and melted mozzarella and parmesan cheeses.",
    "image": "images/eggplant-parmesan.jpg",
    "category": "main"
  },
  {
    "id": "m19",
    "name": "Lemon Cheesecake",
    "price": "6.99",
    "description": "A creamy cheesecake with a tangy lemon flavor, served on a crumbly biscuit base.",
    "image": "images/lemon-cheesecake.jpg",
    "category": "dessert"
  },
  {
    "id": "m20",
    "name": "Falafel Wrap",
    "price": "8.99",
    "description": "Crispy falafels wrapped in a warm pita with lettuce, tomatoes, and a tahini sauce.",
    "image": "images/falafel-wrap.jpg",
    "category": "wrap"
  }
];

// Orders data
const ordersData = [
  {
    "items": [
      {
        "id": "m1",
        "name": "Mac & Cheese",
        "price": "8.99",
        "description": "Creamy cheddar cheese mixed with perfectly cooked macaroni, topped with crispy breadcrumbs. A classic comfort food.",
        "quantity": 4
      },
      {
        "id": "m2",
        "name": "Margherita Pizza",
        "price": "12.99",
        "description": "A classic pizza with fresh mozzarella, tomatoes, and basil on a thin and crispy crust.",
        "quantity": 1
      },
      {
        "id": "m5",
        "name": "Veggie Burger",
        "price": "9.99",
        "description": "A juicy veggie patty served on a whole grain bun with lettuce, tomato, and a tangy sauce.",
        "quantity": 5
      },
      {
        "id": "m19",
        "name": "Lemon Cheesecake",
        "price": "6.99",
        "description": "A creamy cheesecake with a tangy lemon flavor, served on a crumbly biscuit base.",
        "quantity": 2
      }
    ],
    "customer": {
      "name": "AG",
      "email": "AG@xyz.com",
      "street": "xyz road",
      "postal-code": "13245",
      "city": "LA"
    },
    "id": "273.3599901897983"
  },
  {
    "items": [
      {
        "id": "m1",
        "name": "Mac & Cheese",
        "price": "8.99",
        "description": "Creamy cheddar cheese mixed with perfectly cooked macaroni, topped with crispy breadcrumbs. A classic comfort food.",
        "quantity": 1
      },
      {
        "id": "m2",
        "name": "Margherita Pizza",
        "price": "12.99",
        "description": "A classic pizza with fresh mozzarella, tomatoes, and basil on a thin and crispy crust.",
        "quantity": 3
      }
    ],
    "customer": {
      "name": "AG",
      "email": "AG@xyaa.com",
      "street": "dfs",
      "postal-code": "12331",
      "city": "dfas"
    },
    "id": "596.7746556133449"
  }
];

let gridfsBucket;

const uploadAllData = async () => {
  try {
    console.log('🚀 Starting complete data upload process...\n');
    
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/food-order-db');
    console.log('✅ Connected to MongoDB\n');
    
    // Initialize GridFS
    gridfsBucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: 'food_images'
    });
    console.log('📁 GridFS initialized\n');
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await MenuItem.deleteMany({});
    await Order.deleteMany({});
    
    // Clear existing images
    try {
      const existingFiles = await gridfsBucket.find().toArray();
      for (const file of existingFiles) {
        await gridfsBucket.delete(file._id);
      }
      console.log(`✅ Cleared ${existingFiles.length} existing images`);
    } catch (error) {
      console.log('ℹ️ No existing images to clear');
    }
    
    console.log('✅ Cleared existing data\n');
    
    // Step 1: Upload menu items with images
    console.log('📋 Step 1: Uploading menu items with images...');
    await uploadMenuItemsWithImages();
    
    // Step 2: Upload orders
    console.log('\n📋 Step 2: Uploading orders...');
    await uploadOrders();
    
    console.log('\n🎉 Complete data upload successful!');
    console.log(`✅ Uploaded ${menuItemsData.length} menu items with images`);
    console.log(`✅ Uploaded ${ordersData.length} orders`);
    
    // Display summary
    console.log('\n📊 Summary:');
    const menuCount = await MenuItem.countDocuments();
    const orderCount = await Order.countDocuments();
    const imageFiles = await gridfsBucket.find().toArray();
    
    console.log(`   • Menu Items: ${menuCount}`);
    console.log(`   • Orders: ${orderCount}`);
    console.log(`   • Images: ${imageFiles.length}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Upload failed:', error);
    process.exit(1);
  }
};

const uploadMenuItemsWithImages = async () => {
  let successCount = 0;
  let errorCount = 0;
  
  for (const menuItem of menuItemsData) {
    try {
      console.log(`\n📄 Processing: ${menuItem.name} (${menuItem.id})`);
      
      // Extract filename from image path
      const filename = path.basename(menuItem.image);
      const imagePath = path.join(__dirname, '../images', filename);
      
      let imageId = null;
      
      // Check if image file exists and upload
      if (fs.existsSync(imagePath)) {
        console.log(`   📸 Uploading image: ${filename}`);
        imageId = await uploadImageToGridFS(imagePath, filename, menuItem.id);
        console.log(`   ✅ Image uploaded with ID: ${imageId}`);
      } else {
        console.log(`   ⚠️  Image not found: ${imagePath}`);
      }
      
      // Create menu item with image reference
      const menuItemDoc = new MenuItem({
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        description: menuItem.description,
        imageId: imageId,
        imageFilename: imageId ? filename : null,
        category: menuItem.category || 'main',
        available: true
      });
      
      await menuItemDoc.save();
      console.log(`   ✅ Menu item saved to database`);
      successCount++;
      
    } catch (error) {
      console.error(`   ❌ Error processing ${menuItem.name}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Menu Items Upload Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
};

const uploadImageToGridFS = async (imagePath, filename, menuItemId) => {
  return new Promise((resolve, reject) => {
    const uploadStream = gridfsBucket.openUploadStream(filename, {
      metadata: {
        originalName: filename,
        menuItemId: menuItemId,
        uploadDate: new Date(),
        contentType: getContentType(filename)
      }
    });
    
    const fileStream = fs.createReadStream(imagePath);
    
    uploadStream.on('finish', () => {
      resolve(uploadStream.id);
    });
    
    uploadStream.on('error', (error) => {
      reject(error);
    });
    
    fileStream.pipe(uploadStream);
  });
};

const uploadOrders = async () => {
  let successCount = 0;
  let errorCount = 0;
  
  for (const orderData of ordersData) {
    try {
      console.log(`\n📋 Processing Order: ${orderData.id}`);
      
      // Calculate total amount
      const totalAmount = orderData.items.reduce((total, item) => {
        return total + (parseFloat(item.price) * item.quantity);
      }, 0);
      
      // Create order document
      const orderDoc = new Order({
        id: orderData.id,
        items: orderData.items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          description: item.description,
          quantity: item.quantity,
          imageId: null, // Will be populated when orders are fetched
          imageUrl: null
        })),
        customer: orderData.customer,
        status: 'pending',
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        orderDate: new Date()
      });
      
      await orderDoc.save();
      console.log(`   ✅ Order saved (Total: $${totalAmount.toFixed(2)})`);
      successCount++;
      
    } catch (error) {
      console.error(`   ❌ Error processing order ${orderData.id}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Orders Upload Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
};

// Helper function to get content type
const getContentType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    default:
      return 'image/jpeg';
  }
};

// Run the upload process
uploadAllData();