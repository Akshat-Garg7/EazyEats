import express from 'express';
import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';

const router = express.Router();

// Get all orders
// router.get('/', async (req, res) => {
//   try {
//     const orders = await Order.find().sort({ createdAt: -1 });
//     res.json(orders);
//   } catch (error) {
//     console.error('Error fetching orders:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

// Create new order
router.post('/', async (req, res) => {
  try {
    const { items, customer } = req.body;
    console.log('Creating new order:',{items,customer});
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }
    
    if (!customer || !customer.name || !customer.email) {
      return res.status(400).json({ error: 'Customer name and email are required' });
    }
    
    const totalAmount = items.reduce((total, item) => {
      return total + (parseFloat(item.price) * item.quantity);
    }, 0);

    const orderId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

    const order = new Order({
      id: orderId,
      items: items,
      customer: customer,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      status: 'pending'
    });

    const savedOrder = await order.save();
    
    console.log(`New order created: ${orderId} for ${customer.name}`);
    
    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: savedOrder
    });
    
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(400).json({ 
      error: 'Failed to create order',
      details: error.message 
    });
  }
});

export default router;