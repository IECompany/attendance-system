// models/Visit.js - UPDATED for multi-tenancy
const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  label: { type: String, default: 'Photo' },
}, { _id: false });

const visitSchema = new mongoose.Schema({
  companyId: { // <-- NEW FIELD: Link to the company this visit belongs to
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
  },
  erpId: { // This erpId now unique per company
    type: String,
    required: true,
    trim: true,
    index: true
  },
  checkin: {
    date: { type: Date, required: true },
    locationName: { type: String, required: true, trim: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    occupation: { type: String, trim: true },
    state: { type: String, trim: true },
    district: { type: String, trim: true },
    dccb: { type: String, trim: true },
    photos: [photoSchema],
    bikeMeterReading: { type: String, trim: true },
  },
  checkout: {
    date: { type: Date },
    locationName: { type: String, trim: true },
    latitude: { type: Number },
    longitude: { type: Number },
    photos: [photoSchema],
    bikeMeterReading: { type: String, trim: true },
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active',
  },
}, {
  timestamps: true
});

// NEW INDEX: Ensure erpId is unique for active visits within a company
visitSchema.index({ companyId: 1, erpId: 1, status: 1 });
visitSchema.index({ companyId: 1, 'checkin.date': -1 });

module.exports = mongoose.model('Visit', visitSchema);