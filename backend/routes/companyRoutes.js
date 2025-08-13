// Attandance System/backend/routes/companyRoutes.js - FIXED: SuperAdmin Password Hashing
const express = require("express");
const router = express.Router();
// const bcrypt = require("bcrypt"); // No longer needed here for hashing, User model handles it
const Company = require("../models/Company");
const User = require("../models/User");

// POST /api/company/register - Register a new company and its superadmin
router.post("/register", async (req, res) => {
  const { companyName, totalEmployees, superAdminEmail, adminName, adminPassword, contactNo } = req.body; // <-- Get adminName and adminPassword from frontend

  try {
    // 1. Check if companyName or superAdminEmail already exists
    const existingCompanyByName = await Company.findOne({ name: companyName });
    if (existingCompanyByName) {
      return res.status(400).json({ message: "Company with this name already exists." });
    }

    const existingCompanyByEmail = await Company.findOne({ superAdminEmail: superAdminEmail });
    if (existingCompanyByEmail) {
      return res.status(400).json({ message: "A company is already registered with this email. Please use a different email or log in." });
    }

    // 2. Create the new Company document (without superAdminPassword field)
    const newCompany = new Company({
      name: companyName,
      totalEmployees,
      superAdminEmail,
      contactNo,
      // <-- REMOVED: superAdminPassword is no longer stored/hashed here
    });
    await newCompany.save(); // Save the company first to get its _id

    // 3. Create the User document for the company's superadmin
    // The password will be hashed by the User model's pre('save') hook
    const companySuperAdminUser = new User({
      companyId: newCompany._id, // Link to the newly created company
      name: adminName, // Use adminName from frontend
      email: superAdminEmail,
      password: adminPassword, // <-- Use adminPassword from req.body (User model will hash it)
      userType: "superadmin", // Assign 'superadmin' role within this company
    });
    await companySuperAdminUser.save(); // This will trigger UserSchema.pre('save') to hash the password

    // 4. Update the Company document with the actual superAdminUserId
    newCompany.superAdminUserId = companySuperAdminUser._id;
    await newCompany.save(); // Save again to link the user ID

    res.status(201).json({
      message: "Company registered successfully! Your company's Super Admin account has been created.",
      company: {
        id: newCompany._id,
        name: newCompany.name,
        superAdminEmail: newCompany.superAdminEmail,
      },
      // IMPORTANT: Do NOT send the password in a real application, even for dev.
      // For development, you now know the password is what you entered (e.g., "1234").
      // loginInstructions: "Please use the super admin email and the password you entered to log in.",
    });

  } catch (err) {
    console.error("Company registration failed:", err);
    if (err.code === 11000) { // Duplicate key error
      return res.status(409).json({ message: "A company or email already exists with these details." });
    }
    res.status(500).json({ error: "Company registration failed", details: err.message });
  }
});

module.exports = router;
