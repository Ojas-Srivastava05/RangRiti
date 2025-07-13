import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  artistName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Painting', 'Pottery', 'Sculpture', 'Handloom', 'Woodcraft', 'Other'],
    required: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  images: {
    type: [String], // Array of image URLs
    validate: [arrayLimit, 'Product must have at least one image']
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewsCount: {
    type: Number,
    default: 0
  },
  inStock: {
    type: Boolean,
    default: true
  },
  quantityAvailable: {
    type: Number,
    default: 1,
    min: 0
  },
  material: {
    type: String,
    trim: true
  },
  size: {
    type: String, // e.g., "12x18 inches", or "Medium"
    trim: true
  },
  originRegion: {
    type: String, // e.g., "Rajasthan", "West Bengal"
    trim: true
  },
  dateCreated: {
    type: Date,
    default: Date.now
  },
  tags: {
    type: [String], // e.g., ["handmade", "tribal", "folk art"]
    default: []
  }
});

// Validator for image array
function arrayLimit(val) {
  return val.length > 0;
}

const Product = mongoose.model('Product', productSchema);

module.exports = Product;