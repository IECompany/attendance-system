// backend/models/Leave.js

const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // Ensure each user has only one leave record
    },
    totalLeaves: {
        type: Number,
        required: true,
        default: 15 // Default number of leaves per year
    },
    leavesTaken: {
        type: Number,
        required: true,
        default: 0
    },
    leavesRemaining: {
        type: Number,
        required: true,
        default: 15
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const Leave = mongoose.model('Leave', leaveSchema);

module.exports = Leave;