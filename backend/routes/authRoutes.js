// Attandance System/backend/routes/authRoutes.js - UPDATED for Login without explicit Company ID in request

const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const rateLimit = require('express-rate-limit'); // Import rate-limit

// JWT Secret from environment variable (CRITICAL: Ensure this is set)
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '1d'; // Token expires in 1 day

if (!JWT_SECRET) {
    console.error("JWT_SECRET is not defined in environment variables!");
    process.exit(1); // Exit if JWT secret is not defined
}

// Rate limiting middleware
const loginLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 5, // limit each IP to 5 login requests per windowMs
    message: "Too many login attempts from this IP, please try again after an hour",
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

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

        // 2. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Create new user
        const newUser = new User({
            companyId, // Assign companyId
            name,
            email,
            password: hashedPassword,
            userType: 'user' // Default user type
        });
        await newUser.save();

        // 4. Generate token and send response
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

// POST /login - Authenticates user (without requiring companyId in request body)
router.post("/login", loginLimiter, async (req, res) => { // Apply rate limiter to login
    const { loginId, password } = req.body;

    try {
        if (!loginId || !password) {
            return res.status(400).json({ message: "Please provide login ID and password" });
        }

        // 1. Find user by email or pacsId (globally unique assumption)
        const user = await User.findOne({
            $or: [{ email: loginId }, { pacsId: loginId }],
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" }); // Generic message
        }

        // 2. Compare provided password with hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" }); // Generic message
        }

        // 3. If authentication successful, generate token
        const token = generateToken(user._id, user.companyId);

        // 4. Return user details including companyId and token
        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                userId: user._id,
                name: user.name,
                email: user.email,
                pacsId: user.pacsId,
                userType: user.userType,
                companyId: user.companyId,
            },
        });
    } catch (err) {
        console.error("Login failed:", err);
        res.status(500).json({ error: "Login failed", details: err.message });
    }
});

module.exports = router;