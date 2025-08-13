// src/routes/occupationRoutes.js
const express = require('express');
const router = express.Router();
const Occupation = require('../models/Occupation'); // Adjust path as needed

// Route to add a new occupation
router.post('/occupations', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Occupation name is required.' });
    }

    const newOccupation = new Occupation({ name });
    await newOccupation.save();
    res.status(201).json({ message: 'Occupation added successfully', occupation: newOccupation });
  } catch (error) {
    if (error.code === 11000) { // Duplicate key error (for unique: true)
      return res.status(409).json({ message: 'Occupation already exists.' });
    }
    console.error('Error adding occupation:', error);
    res.status(500).json({ message: 'Server error while adding occupation.' });
  }
});

// Route to get all occupations (for User Panel dropdown)
router.get('/occupations', async (req, res) => {
  try {
    const occupations = await Occupation.find({}).select('name').sort('name');
    const occupationNames = occupations.map(occ => occ.name);
    res.status(200).json(occupationNames);
  } catch (error) {
    console.error('Error fetching occupations:', error);
    res.status(500).json({ message: 'Server error while fetching occupations.' });
  }
});

module.exports = router;