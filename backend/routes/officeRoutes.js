// Attandance System/backend/routes/officeRoutes.js - UPDATED for multi-tenancy
const express = require('express');
const router = express.Router();
const Office = require('../models/Office');

// POST /api/offices - Add a new office
router.post('/', async (req, res) => {
  try {
    const companyId = req.companyId; // <-- NEW: Get companyId from middleware
    if (!companyId) {
      return res.status(403).json({ message: "Company ID missing. Not authorized for this operation." });
    }

    const { name, state } = req.body; // District received but not saved in schema for now

    if (!name || !state) {
        return res.status(400).json({ message: "Office name and state are required." });
    }

    // Check if office with this name already exists within THIS company
    const existingOffice = await Office.findOne({ companyId: companyId, name: name });
    if (existingOffice) {
      return res.status(409).json({ message: 'Office with this name already exists in your company.' });
    }

    const newOffice = new Office({
      companyId: companyId, // <-- NEW: Assign companyId to the new office
      name,
      state
    });
    await newOffice.save();
    res.status(201).json({ message: 'Office added successfully', office: newOffice });
  } catch (error) {
    console.error('Error adding office:', error);
    res.status(500).json({ message: 'Server error while adding office.', error: error.message });
  }
});

// GET /api/offices - Get all offices (filtered by company and optionally by state)
router.get('/', async (req, res) => {
  try {
    const companyId = req.companyId; // <-- NEW: Get companyId from middleware
    if (!companyId) {
      return res.status(403).json({ message: "Company ID missing. Not authorized to fetch offices." });
    }

    const { state } = req.query; // Query parameter for state: /api/offices?state=Uttar Pradesh

    let query = { companyId: companyId }; // <-- NEW: Base filter by companyId
    if (state) {
      query.state = state; // Filter by state if provided
    }
    const offices = await Office.find(query).sort({ name: 1 }); // Sort by name alphabetically
    res.status(200).json(offices);
  } catch (error) {
    console.error('Error fetching offices:', error);
    res.status(500).json({ message: 'Server error while fetching offices.', error: error.message });
  }
});

// @route   DELETE /api/offices/:id
// @desc    Delete an office by ID (within the current company)
router.delete('/:id', async (req, res) => {
  try {
    const companyId = req.companyId; // <-- NEW: Get companyId from middleware
    if (!companyId) {
      return res.status(403).json({ message: "Company ID missing. Not authorized to delete offices." });
    }

    const { id } = req.params;
    // Find and delete office within THIS company
    const office = await Office.findOneAndDelete({ _id: id, companyId: companyId }); // <-- NEW: Filter by companyId

    if (!office) {
      return res.status(404).json({ message: 'Office not found or not belonging to your company.' });
    }
    res.status(200).json({ message: 'Office deleted successfully.' });
  } catch (error) {
    console.error('Error deleting office:', error);
    res.status(500).json({ message: 'Server error while deleting office.', error: error.message });
  }
});

// @route   PUT /api/offices/:id
// @desc    Update an office by ID (within the current company)
router.put('/:id', async (req, res) => {
  try {
    const companyId = req.companyId; // <-- NEW: Get companyId from middleware
    if (!companyId) {
      return res.status(403).json({ message: "Company ID missing. Not authorized to update offices." });
    }

    const { id } = req.params;
    const { name, state } = req.body;

    // Find office within THIS company
    let office = await Office.findOne({ _id: id, companyId: companyId }); // <-- NEW: Filter by companyId
    if (!office) {
      return res.status(404).json({ message: 'Office not found or not belonging to your company.' });
    }

    // Check for duplicate name if name is being changed
    if (name && name !== office.name) {
        const existingOfficeWithName = await Office.findOne({ companyId: companyId, name: name });
        if (existingOfficeWithName) {
            return res.status(409).json({ message: 'Another office with this name already exists in your company.' });
        }
    }

    office.name = name || office.name;
    office.state = state || office.state;

    await office.save();
    res.status(200).json({ message: 'Office updated successfully', office });
  } catch (error) {
    console.error('Error updating office:', error);
    res.status(500).json({ message: 'Server error while updating office.', error: error.message });
  }
});

module.exports = router;
