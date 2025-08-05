import mongoose from 'mongoose';
import multer from 'multer';
import { GridFsStorage } from 'multer-gridfs-storage';
import Grid from 'gridfs-stream';
import dotenv from 'dotenv';
dotenv.config();


let gfs, gridfsBucket;

const conn = mongoose.connection;

conn.once('open', () => {
  gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: 'food_images'
  });
  
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('food_images');
  console.log('GridFS initialized');
});

const storage = new GridFsStorage({
  url: process.env.MONGODB_URI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
      const fileInfo = {
        filename: filename,
        bucketName: 'food_images',
        metadata: {
          originalName: file.originalname,
          uploadDate: new Date(),
          contentType: file.mimetype
        }
      };
      resolve(fileInfo);
    });
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

export { upload, gfs, gridfsBucket };