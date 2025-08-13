// backend/server.js - UPDATED to correctly apply protect middleware

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const app = express();

const cors = require("cors");

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));

// Import Routes
const authRoutes = require("./routes/authRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const adminRoutes = require("./routes/adminRoutes");
const adminDataDownloadFilter = require("./routes/adminDataDownloadFilter");
const officeRoutes = require("./routes/officeRoutes");
const stateRoutes = require("./routes/stateRoutes");
const occupationRoutes = require("./routes/occupationRoutes");
const bulkUploadRoutes = require("./routes/bulkupload");
const salaryRoutes = require("./routes/salaryRoutes");
const companyRoutes = require("./routes/companyRoutes");

// Import Middleware
const { protect, authorize } = require('./middleware/companyAuth');

// --- Define Public Routes First ---
// These routes do NOT require any authentication middleware.
// The login and company registration routes must be public.
app.use("/api", authRoutes); // This includes /api/login and /api/register
app.use("/api/company", companyRoutes); // This includes /api/company/register

// --- Apply Global Protection Middleware ---
// Any route defined AFTER this line will automatically go through `protect` middleware.
// This middleware will verify the JWT token and attach `req.user` and `req.companyId`.
app.use(protect); // <-- Apply protect middleware here, ONCE.

// --- Define Protected Routes ---
// These routes now automatically require authentication because of the `app.use(protect)` above.
// You no longer need to add `protect` to each individual route mount below.
// Apply `authorize` middleware for role-based access control where needed.

app.use("/api", submissionRoutes); // All submission routes now require authentication
app.use("/api", adminRoutes); // Admin routes (e.g., /api/admin/users)
app.use("/api/admin", adminDataDownloadFilter); // Specific admin data download routes
app.use("/api/offices", officeRoutes); // Office management routes
app.use("/api", stateRoutes); // State management routes
app.use("/api", occupationRoutes); // Occupation management routes
app.use("/api/admin", bulkUploadRoutes); // Bulk user upload routes
app.use("/api/admin", salaryRoutes); // Salary management routes

// Example of applying `authorize` for role-based access on a specific route group
// If your userRoutes are specifically for managing users by superadmin, apply authorize here.
// app.use('/api/users', authorize(['superadmin']), userRoutes); // Uncomment if you have a dedicated userRoutes for user management

// Root endpoint
app.get("/", (req, res) => {
  res.send("✅ Nectar API is running...");
});

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully!");
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });
