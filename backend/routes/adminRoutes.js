// adminRoutes.js - FINAL CORRECTED VERSION

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const Admin = require("../models/User"); // Corrected path (you are using User.js)

// REMOVED: const salaryController = require("./salaryController");

// ✅ POST /api/admin/register
router.post("/admin/register", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        // Check if user already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(409).json({ message: "Admin already exists." });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save new admin
        const newAdmin = new Admin({
            name: "Admin User", // Optional field
            email,
            password: hashedPassword,
            userType: "admin", // Set userType for admin
        });

        await newAdmin.save();

        res.status(201).json({ message: "Admin registered successfully." });
    } catch (err) {
        console.error("Register admin error:", err);
        res.status(500).json({ message: "Server error. Try again later." });
    }
});
  

module.exports = router;