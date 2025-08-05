import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: String,
  imageId: mongoose.Schema.Types.ObjectId,
  imageUrl: String,
  quantity: {
    type: Number,
    required: true,
    min: 1
  }
});

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  street: {
    type: String,
    required: true
  },
  'postal-code': {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  items: [orderItemSchema],
  customer: customerSchema,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  },
  totalAmount: {
    type: Number,
    required: true
  },
  orderDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('Order', orderSchema);