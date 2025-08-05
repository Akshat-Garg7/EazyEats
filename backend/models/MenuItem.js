import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'food_images.files'
  },
  imageFilename: String,
  category: {
    type: String,
    default: 'main'
  },
  available: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

menuItemSchema.index({ name: 'text', description: 'text', category: 'text' });

menuItemSchema.virtual('imageUrl').get(function() {
  return this.imageId ? `/api/images/${this.imageId}` : null;
});

menuItemSchema.set('toJSON', { virtuals: true });

export default mongoose.model('MenuItem', menuItemSchema);
