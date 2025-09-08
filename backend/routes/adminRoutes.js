// backend/routes/adminRoutes.js - FINAL VERSION with role-based access + company isolation
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Visit = require("../models/Visit"); // <-- NEW: Import the Visit model
const { protect, authorize } = require("../middleware/companyAuth");

// ✅ POST /api/admin/register - Superadmin creates a new admin within the same company
router.post("/admin/register", protect, authorize("superadmin"), async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ message: "Name, email, and password are required." });
        }

        const companyId = req.companyId;

        const existingAdmin = await User.findOne({ email, companyId });
        if (existingAdmin) {
            return res.status(409).json({ message: "Admin with this email already exists in this company." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = new User({
            name,
            email,
            password: hashedPassword,
            userType: "admin",
            companyId,
        });

        await newAdmin.save();

        res.status(201).json({ message: "Admin registered successfully." });
    } catch (err) {
        console.error("Register admin error:", err);
        res.status(500).json({ message: "Server error. Try again later." });
    }
});

// ✅ GET /api/admin/visits - Fetch all visits for the authenticated company
// THIS IS THE MISSING ROUTE
router.get("/visits", protect, authorize("superadmin", "admin"), async (req, res) => {
    try {
        const companyId = req.companyId;

        // Use the companyId from the authenticated request to filter visits
        const visits = await Visit.find({ companyId: companyId }).sort({ "checkin.date": -1 });

        res.status(200).json(visits);
    } catch (err) {
        console.error("Error fetching admin visits:", err);
        res.status(500).json({ message: "Failed to fetch admin visit data." });
    }
});


// ✅ GET /api/admin/users - Fetch all users for the authenticated company
router.get("/users", protect, authorize("superadmin", "admin"), async (req, res) => {
    try {
        const companyId = req.companyId;
        const { page = 1, limit = 10, search = "" } = req.query;

        const query = { companyId };

        if (search.trim()) {
            const regex = new RegExp(search.trim(), "i");
            query.$or = [
                { name: regex },
                { employeeId: regex },
                { email: regex },
            ];
        }

        const skip = (page - 1) * limit;

        const [users, totalUsers] = await Promise.all([
            User.find(query)
                .select("-password")
                .skip(skip)
                .limit(Number(limit))
                .sort({ createdAt: -1 }),
            User.countDocuments(query)
        ]);
        
        res.json({
            users,
            totalUsers,
            totalPages: Math.ceil(totalUsers / limit),
        });
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({ message: "Failed to fetch users." });
    }
});

// ✅ DELETE /api/admin/users/:id - Delete user (must be within same company)
router.delete("/users/:id", protect, authorize("superadmin", "admin"), async (req, res) => {
    const { id } = req.params;
    try {
        const userToDelete = await User.findOne({ _id: id, companyId: req.companyId });
        if (!userToDelete) {
            return res.status(404).json({ message: "User not found or does not belong to your company." });
        }

        await User.findByIdAndDelete(id);
        res.json({ message: "User deleted successfully." });
    } catch (err) {
        console.error("Delete user error:", err);
        res.status(500).json({ message: "Failed to delete user." });
    }
});

module.exports = router;