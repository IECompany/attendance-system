// Attendance System/backend/routes/authRoutes.js - UPDATED for multi-tenant login with reCAPTCHA

const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const User = require("../models/User");

// JWT Secret from environment variable
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '1d';

// reCAPTCHA Secret
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET;

if (!JWT_SECRET) {
    console.error("JWT_SECRET is not defined in environment variables!");
    process.exit(1);
}

if (!RECAPTCHA_SECRET) {
    console.error("RECAPTCHA_SECRET is not defined in environment variables!");
    process.exit(1);
}

// Function to generate JWT
const generateToken = (id, companyId) => {
    return jwt.sign({ id, companyId }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
};

// POST /register - Registers a new user
router.post("/register", async (req, res) => {
    const { name, email, password, companyId, recaptchaToken } = req.body;

    try {
        // --- Verify reCAPTCHA ---
        if (!recaptchaToken) {
            return res.status(400).json({ message: "reCAPTCHA token is missing" });
        }
        const recaptchaRes = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET}&response=${recaptchaToken}`
        );
        if (!recaptchaRes.data.success) {
            return res.status(400).json({ message: "reCAPTCHA verification failed" });
        }

        if (!companyId) return res.status(400).json({ message: "Company ID is required for user registration." });
        if (!name || !email || !password) return res.status(400).json({ message: "Name, email, and password are required." });

        // Check if user already exists in this company
        const existingUser = await User.findOne({ companyId, email });
        if (existingUser) return res.status(400).json({ message: "User with this email already exists in this company." });

        // Create new user
        const newUser = new User({ companyId, name, email, password, userType: 'user' });
        await newUser.save();

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

// POST /login - Authenticates user
router.post("/login", async (req, res) => {
    const { loginId, password, recaptchaToken } = req.body;

    try {
        // --- Verify reCAPTCHA ---
        if (!recaptchaToken) {
            return res.status(400).json({ message: "reCAPTCHA token is missing" });
        }
        const recaptchaRes = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET}&response=${recaptchaToken}`
        );
        if (!recaptchaRes.data.success) {
            return res.status(400).json({ message: "reCAPTCHA verification failed" });
        }

        if (!loginId || !password) return res.status(400).json({ message: "Please provide login ID and password" });

        // Find all users matching loginId (multi-tenant)
        const users = await User.find({
            $or: [
                { email: loginId },
                { personalEmail: loginId },
                { professionalEmail: loginId },
                { employeeId: loginId },
            ],
        });

        if (users.length === 0) return res.status(400).json({ message: "Invalid credentials." });

        // Check passwords
        let authenticatedUser = null;
        for (const user of users) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                authenticatedUser = user;
                break;
            }
        }

        if (!authenticatedUser) return res.status(400).json({ message: "Invalid credentials." });

        const token = generateToken(authenticatedUser._id, authenticatedUser.companyId);

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
