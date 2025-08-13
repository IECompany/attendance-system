// models/State.js - UPDATED for multi-tenancy
const mongoose = require('mongoose');

const stateSchema = new mongoose.Schema({
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
}, { timestamps: true });

// NEW INDEX: Ensure state names are unique *within* a company
stateSchema.index({ companyId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('State', stateSchema);