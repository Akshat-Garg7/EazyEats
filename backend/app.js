import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import connectDB from './config/database.js';
import menuRoutes from './routes/menuItem.js';
import orderRoutes from './routes/order.js';
import chatRoutes from './routes/chat.js';


// Load environment variables
config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'https://eazy-eats-ui.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));


app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Main routes for home page functionality
app.use('/api/menu-items', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chat', chatRoutes);


// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Food Order API is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Food Order API',
    endpoints: {
      menuItems: '/api/menu-items (GET - loads all menu items with images)',
      orders: '/api/orders (POST - create new order)',
      health: '/health'
    }
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Error:', error.message);
  
  res.status(error.status || 500).json({
    error: error.message || 'Something went wrong!',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
🍕 Food Order API Started!
📍 http://localhost:${PORT}
🏠 Home page endpoint: GET /api/menu-items
📦 Order endpoint: POST /api/orders
  `);
});