// src/models/Occupation.js - UPDATED for multi-tenancy
const mongoose = require('mongoose');

const occupationSchema = new mongoose.Schema({
  companyId: { // <-- NEW FIELD
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// NEW INDEX: Ensure occupation names are unique *within* a company
occupationSchema.index({ companyId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Occupation', occupationSchema);