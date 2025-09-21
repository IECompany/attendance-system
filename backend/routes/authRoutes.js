// Attandance System/backend/routes/authRoutes.js - UPDATED for multi-tenant login

const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// JWT Secret from environment variable (CRITICAL: Ensure this is set)
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '1d';

if (!JWT_SECRET) {
    console.error("JWT_SECRET is not defined in environment variables!");
    process.exit(1);
}

// Function to generate JWT
const generateToken = (id, companyId) => {
    return jwt.sign({ id, companyId }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
};

// POST /register - Registers a new user (within a company)
router.post("/register", async (req, res) => {
    const { name, email, password, companyId } = req.body;

    try {
        if (!companyId) {
            return res.status(400).json({ message: "Company ID is required for user registration." });
        }

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email, and password are required." });
        }

        // 1. Check if user already exists within THIS company
        const existingUser = await User.findOne({ companyId, email });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists in this company." });
        }

        // 2. Create new user
        // Mongoose pre-save hook will hash the password
        const newUser = new User({
            companyId,
            name,
            email,
            password, 
            userType: 'user'
        });
        await newUser.save();

        // 3. Generate token and send response
        const token = generateToken(newUser._id, newUser.companyId);
        res.status(201).json({
            message: "User registered successfully.",
            token,
            user: {
                userId: newUser._id,
                name: newUser.name,
                email: newUser.email,
                userType: newUser.userType,
                companyId: newUser.companyId,
            },
        });
    } catch (err) {
        console.error("Registration failed:", err);
        res.status(500).json({ error: "Registration failed", details: err.message });
    }
});

// POST /login - Authenticates user without requiring companyId in request body
router.post("/login", async (req, res) => {
    const { loginId, password } = req.body;

    try {
        if (!loginId || !password) {
            return res.status(400).json({ message: "Please provide login ID and password" });
        }

        // 1. Find all users matching the loginId, regardless of their company.
        const users = await User.find({
            $or: [
                { email: loginId },
                { personalEmail: loginId },
                { professionalEmail: loginId },
                { employeeId: loginId }, 
            ],
        });

        // 2. If no user is found with that loginId
        if (users.length === 0) {
            return res.status(400).json({ message: "Invalid credentials." });
        }

        // 3. Iterate through the found users and check the password.
        let authenticatedUser = null;
        for (const user of users) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                authenticatedUser = user;
                break; // Exit the loop once a match is found
            }
        }
        
        // 4. If no user was authenticated
        if (!authenticatedUser) {
            return res.status(400).json({ message: "Invalid credentials." });
        }
        
        // 5. Generate JWT for the authenticated user
        const token = generateToken(authenticatedUser._id, authenticatedUser.companyId);

        // 6. Send success response with user data
        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                userId: authenticatedUser._id,
                name: authenticatedUser.name,
                email: authenticatedUser.email,
                personalEmail: authenticatedUser.personalEmail,
                professionalEmail: authenticatedUser.professionalEmail,
                employeeId: authenticatedUser.employeeId,
                userType: authenticatedUser.userType,
                companyId: authenticatedUser.companyId,
            },
        });
    } catch (err) {
        console.error("Login failed:", err);
        res.status(500).json({ error: "Login failed", details: err.message });
    }
});

module.exports = router;
