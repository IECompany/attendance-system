const express = require('express');
const router = express.Router();
const Occupation = require('../models/Occupation');

// Correctly import both functions from the middleware file
const { protect, authorize } = require('../middleware/authMiddleware');

// Route to add a new occupation
// This route is protected and can only be accessed by a superadmin
router.post('/occupations', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { name } = req.body;
    const { companyId } = req.user;

    if (!name) {
      return res.status(400).json({ message: 'Occupation name is required.' });
    }
    if (!companyId) {
      return res.status(401).json({ message: 'Not authenticated as a company user.' });
    }

    const existingOccupation = await Occupation.findOne({ name: name.toUpperCase(), companyId });
    if (existingOccupation) {
      return res.status(409).json({ message: 'Occupation already exists for your company.' });
    }

    const newOccupation = new Occupation({
      name: name.toUpperCase(),
      companyId
    });

    await newOccupation.save();
    res.status(201).json({ message: 'Occupation added successfully', occupation: newOccupation });

  } catch (error) {
    console.error('Error adding occupation:', error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Occupation already exists.' });
    }
    res.status(500).json({ message: 'Server error while adding occupation.' });
  }
});

// Route to get all occupations for a company
router.get('/occupations', protect, async (req, res) => {
  try {
    const { companyId } = req.user;

    if (!companyId) {
      return res.status(401).json({ message: 'Not authenticated as a company user.' });
    }

    const occupations = await Occupation.find({ companyId }).select('name').sort('name');
    const occupationNames = occupations.map(occ => occ.name);
    res.status(200).json(occupationNames);

  } catch (error) {
    console.error('Error fetching occupations:', error);
    res.status(500).json({ message: 'Server error while fetching occupations.' });
  }
});

module.exports = router;