// backend/server.js - CORRECTED

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const app = express();

const cors = require("cors");

// Define a list of allowed origins for CORS
const allowedOrigins = [
  "http://localhost:5173", // For local development
  "https://hrms-live.onrender.com" // For production deployment
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
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

// Public Routes
app.use("/api", authRoutes);
app.use("/api/company", companyRoutes);

// Apply Authentication Middleware
app.use(protect); // ✅ All routes below this line are protected

// Protected Routes
app.use("/api", submissionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminDataDownloadFilter);
app.use("/api/offices", officeRoutes);
app.use("/api", stateRoutes);
app.use("/api", occupationRoutes);
app.use("/api/admin", bulkUploadRoutes);
app.use("/api/admin", salaryRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.send("✅ Nectar API is running...");
});

// 404 Handler (Always Last)
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
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