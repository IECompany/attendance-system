// Attandance System/backend/routes/stateRoutes.js - UPDATED for multi-tenancy
const express = require('express');
const router = express.Router();
const State = require('../models/State'); // Make sure the path is correct

// POST /api/states - Add a new state
router.post('/states', async (req, res) => {
    try {
        const companyId = req.companyId; // <-- NEW: Get companyId from middleware
        if (!companyId) {
            return res.status(403).json({ message: "Company ID missing. Not authorized for this operation." });
        }

        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'State name is required.' });
        }

        // Check if state with this name already exists within THIS company
        const existingState = await State.findOne({ companyId: companyId, name: name });
        if (existingState) {
            return res.status(409).json({ message: 'State with this name already exists in your company.' });
        }

        const newState = new State({
            companyId: companyId, // <-- NEW: Assign companyId to the new state
            name
        });
        await newState.save();
        res.status(201).json({ message: 'State added successfully', state: newState });
    } catch (error) {
        console.error('Error adding state:', error);
        res.status(500).json({ message: 'Server error while adding state.', error: error.message });
    }
});

// GET /api/states - Get all states (filtered by company)
router.get('/states', async (req, res) => {
    try {
        const companyId = req.companyId; // <-- NEW: Get companyId from middleware
        if (!companyId) {
            return res.status(403).json({ message: "Company ID missing. Not authorized to fetch states." });
        }

        // Fetch states only for THIS company
        const states = await State.find({ companyId: companyId });
        res.status(200).json(states.map(s => s.name).sort()); // Only send names, sorted
    } catch (error) {
        console.error('Error fetching states:', error);
        res.status(500).json({ message: 'Server error while fetching states.', error: error.message });
    }
});

// If you add DELETE or PUT routes for states later, they would follow a similar pattern:
// router.delete('/states/:id', async (req, res) => {
//     try {
//         const companyId = req.companyId;
//         if (!companyId) return res.status(403).json({ message: "Company ID missing." });
//         const { id } = req.params;
//         const deletedState = await State.findOneAndDelete({ _id: id, companyId: companyId });
//         if (!deletedState) return res.status(404).json({ message: 'State not found or not belonging to your company.' });
//         res.status(200).json({ message: 'State deleted successfully.' });
//     } catch (error) {
//         console.error('Error deleting state:', error);
//         res.status(500).json({ message: 'Server error deleting state.' });
//     }
// });

module.exports = router;
