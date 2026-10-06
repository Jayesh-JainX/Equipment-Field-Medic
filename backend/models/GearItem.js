const mongoose = require('mongoose');

const gearItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Shelter', 'Footwear', 'Apparel', 'Cookware', 'Backpack', 'Hardware', 'FirstAid', 'General'],
    default: 'General'
  },
  material: String,
  inPack: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('GearItem', gearItemSchema);
