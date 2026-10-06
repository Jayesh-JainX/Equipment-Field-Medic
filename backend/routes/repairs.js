const express = require('express');
const router = express.Router();
const RepairLog = require('../models/RepairLog');
const { optionalAuth } = require('../middleware/auth');

// In-memory fallback array for repair logs when MongoDB is offline
const memoryRepairLogs = [];

// @route   POST /api/repairs
// @desc    Save a completed/generated field repair log
router.post('/', optionalAuth, async (req, res) => {
  try {
    const {
      equipmentName,
      category,
      identifiedMaterial,
      confidenceScore,
      issueDescription,
      durabilityRating,
      requiredTools,
      steps,
      batteryTips
    } = req.body;

    if (!equipmentName || !identifiedMaterial) {
      return res.status(400).json({ message: 'Equipment name and identified material are required' });
    }

    try {
      const newLog = new RepairLog({
        userId: req.user ? req.user.userId : null,
        equipmentName,
        category: category || 'General Gear',
        identifiedMaterial,
        confidenceScore: confidenceScore || 0.95,
        issueDescription: issueDescription || 'Field damage',
        durabilityRating: durabilityRating || 'High Durability (Multi-day)',
        requiredTools: requiredTools || [],
        steps: steps || [],
        batteryTips: batteryTips || []
      });

      await newLog.save();
      return res.status(201).json(newLog);
    } catch (dbErr) {
      const memLog = {
        _id: 'mem_repair_' + Date.now(),
        userId: req.user ? req.user.userId : null,
        equipmentName,
        category: category || 'General Gear',
        identifiedMaterial,
        confidenceScore: confidenceScore || 0.95,
        issueDescription: issueDescription || 'Field damage',
        durabilityRating: durabilityRating || 'High Durability (Multi-day)',
        requiredTools: requiredTools || [],
        steps: steps || [],
        batteryTips: batteryTips || [],
        createdAt: new Date().toISOString()
      };
      memoryRepairLogs.unshift(memLog);
      return res.status(201).json(memLog);
    }
  } catch (err) {
    res.status(500).json({ message: 'Failed to save repair log', error: err.message });
  }
});

// @route   GET /api/repairs
// @desc    Get repair log history
router.get('/', optionalAuth, async (req, res) => {
  try {
    try {
      const query = req.user ? { userId: req.user.userId } : {};
      const logs = await RepairLog.find(query).sort({ createdAt: -1 }).limit(20);
      if (logs && logs.length > 0) {
        return res.json(logs);
      }
    } catch (dbErr) {}

    // Fallback to memory logs
    const filtered = req.user 
      ? memoryRepairLogs.filter(log => log.userId === req.user.userId)
      : memoryRepairLogs;

    return res.json(filtered);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching repair history' });
  }
});

// @route   DELETE /api/repairs/:id
// @desc    Delete a repair log entry
router.delete('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    try {
      await RepairLog.findByIdAndDelete(id);
      return res.json({ message: 'Repair log deleted' });
    } catch (dbErr) {}

    const index = memoryRepairLogs.findIndex(item => item._id === id);
    if (index !== -1) {
      memoryRepairLogs.splice(index, 1);
    }
    return res.json({ message: 'Repair log deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting repair log' });
  }
});

module.exports = router;
