// server/models/Office.js - UPDATED for multi-tenancy
const mongoose = require('mongoose');

const OfficeSchema = new mongoose.Schema({
  companyId: { // <-- NEW FIELD
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  state: {
    type: String,
    required: true,
    trim: true,
  },
  isApproved: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// NEW INDEX: Ensure office names are unique *within* a company
OfficeSchema.index({ companyId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Office', OfficeSchema);