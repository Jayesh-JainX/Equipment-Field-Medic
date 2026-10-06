const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
  stepNumber: Number,
  title: String,
  instruction: String,
  voicePrompt: String,
  materialsNeeded: [String],
  safetyWarning: String,
  estimatedTimeMinutes: Number
}, { _id: false });

const repairLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  equipmentName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: 'General Gear'
  },
  identifiedMaterial: {
    type: String,
    required: true
  },
  confidenceScore: {
    type: Number,
    default: 0.95
  },
  issueDescription: {
    type: String,
    required: true
  },
  durabilityRating: {
    type: String,
    enum: ['Emergency Field Patch (Temporary)', 'High Durability (Multi-day)', 'Permanent Field Fix'],
    default: 'High Durability (Multi-day)'
  },
  requiredTools: [String],
  steps: [stepSchema],
  batteryTips: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('RepairLog', repairLogSchema);
