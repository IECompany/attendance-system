// Attandance System/backend/models/Company.js - UPDATED to remove superAdminPassword
const mongoose = require('mongoose');
// const bcrypt = require('bcrypt'); // No longer needed here if User model handles hashing

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    totalEmployees: {
        type: Number,
        required: true,
        min: 0
    },
    superAdminEmail: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    // <-- REMOVED: superAdminPassword is no longer stored directly in Company model
    // superAdminPassword: {
    //     type: String,
    //     required: true
    // },
    contactNo: {
        type: String,
        required: true,
        trim: true
    },
    superAdminUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

// <-- REMOVED: Pre-save hook for superAdminPassword no longer needed here
// companySchema.pre('save', async function(next) {
//     if (this.isModified('superAdminPassword') || this.isNew) {
//         const salt = await bcrypt.genSalt(10);
//         this.superAdminPassword = await bcrypt.hash(this.superAdminPassword, salt);
//     }
//     next();
// });

module.exports = mongoose.model('Company', companySchema);
