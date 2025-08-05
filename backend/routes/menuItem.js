import express from 'express';
import MenuItem from '../models/MenuItem.js';
import { gridfsBucket } from '../config/gridfs.js';
import sharp from 'sharp';

const router = express.Router();

// GET all menu items with embedded images (MAIN HOME PAGE ROUTE)
router.get('/', async (req, res) => {
  try {
    console.log('Loading menu items for home page...');
    
    const menuItems = await MenuItem.find({ available: true }).sort({ category: 1, name: 1 });
    
    if (!menuItems || menuItems.length === 0) {
      return res.json([]);
    }

    const menuItemsWithImages = await Promise.all(
      menuItems.map(async (item) => {
        const itemData = item.toJSON();
        
        if (item.imageId) {
          try {
            const imageData = await getOptimizedImageAsBase64(item.imageId);
            itemData.imageData = imageData;
            itemData.hasImage = true;
          } catch (error) {
            console.warn(`Could not load image for item ${item.id}:`, error.message);
            itemData.imageData = null;
            itemData.hasImage = false;
          }
        } else {
          itemData.imageData = null;
          itemData.hasImage = false;
        }
        
        return itemData;
      })
    );
    
    console.log(`Loaded ${menuItemsWithImages.length} menu items for home page`);
    res.json(menuItemsWithImages);
    
  } catch (error) {
    console.error('Error fetching menu items for home page:', error);
    res.status(500).json({ 
      error: 'Failed to load menu items',
      message: 'Please try refreshing the page'
    });
  }
});

// Helper function to get optimized image as base64
async function getOptimizedImageAsBase64(imageId) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const downloadStream = gridfsBucket.openDownloadStream(imageId);
    
    downloadStream.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
    downloadStream.on('end', async () => {
      try {
        const originalBuffer = Buffer.concat(chunks);
        
        const optimizedBuffer = await sharp(originalBuffer)
          .resize(400, 400, { 
            fit: 'cover',
            withoutEnlargement: true,
            position: 'center'
          })
          .jpeg({ 
            quality: 85,
            progressive: true 
          })
          .toBuffer();
        
        const base64 = optimizedBuffer.toString('base64');
        resolve(`data:image/jpeg;base64,${base64}`);
        
      } catch (sharpError) {
        console.warn('Image optimization failed, using original:', sharpError.message);
        
        try {
          const files = await gridfsBucket.find({ _id: imageId }).toArray();
          const mimeType = files[0]?.contentType || 'image/jpeg';
          const buffer = Buffer.concat(chunks);
          const base64 = buffer.toString('base64');
          resolve(`data:${mimeType};base64,${base64}`);
        } catch (fallbackError) {
          reject(fallbackError);
        }
      }
    });
    
    downloadStream.on('error', (error) => {
      reject(error);
    });
  });
}

export default router;