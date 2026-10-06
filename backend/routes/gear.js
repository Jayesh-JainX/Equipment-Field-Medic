const express = require('express');
const router = express.Router();
const GearItem = require('../models/GearItem');
const { optionalAuth } = require('../middleware/auth');

const defaultGearItems = [
  { id: '1', name: 'Duct Tape (Heavy Duty)', category: 'Repair', inPack: true },
  { id: '2', name: 'Paracord (550lb, 20ft)', category: 'Cordage', inPack: true },
  { id: '3', name: 'Zip Ties (Assorted 8-inch)', category: 'Hardware', inPack: true },
  { id: '4', name: 'Seam Sealer / Super Glue', category: 'Adhesive', inPack: true },
  { id: '5', name: 'Multi-Tool & Pliers', category: 'Hardware', inPack: true },
  { id: '6', name: 'Emergency Tent Pole Splint Sleeve', category: 'Shelter', inPack: true },
  { id: '7', name: 'Tenacious Repair Tape Patches', category: 'Apparel', inPack: true }
];

let inMemoryGearList = [...defaultGearItems];

// @route   GET /api/gear
// @desc    Get user's pack gear list
router.get('/', optionalAuth, async (req, res) => {
  try {
    try {
      const query = req.user ? { userId: req.user.userId } : {};
      const items = await GearItem.find(query);
      if (items && items.length > 0) {
        return res.json(items);
      }
    } catch (dbErr) {}

    return res.json(inMemoryGearList);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching gear inventory' });
  }
});

// @route   POST /api/gear
// @desc    Add a new item to user's pack
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { name, category, material } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Item name is required' });
    }

    try {
      const newItem = new GearItem({
        userId: req.user ? req.user.userId : null,
        name,
        category: category || 'General',
        material: material || 'Unknown',
        inPack: true
      });
      await newItem.save();
      return res.status(201).json(newItem);
    } catch (dbErr) {
      const memItem = {
        id: 'mem_gear_' + Date.now(),
        name,
        category: category || 'General',
        material: material || 'Unknown',
        inPack: true
      };
      inMemoryGearList.push(memItem);
      return res.status(201).json(memItem);
    }
  } catch (err) {
    res.status(500).json({ message: 'Error adding gear item' });
  }
});

// @route   DELETE /api/gear/:id
// @desc    Remove an item from user pack
router.delete('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    try {
      await GearItem.findByIdAndDelete(id);
    } catch (dbErr) {}

    inMemoryGearList = inMemoryGearList.filter(item => item.id !== id && item._id !== id);
    return res.json({ message: 'Gear item removed' });
  } catch (err) {
    res.status(500).json({ message: 'Error removing gear item' });
  }
});

module.exports = router;
