// models/User.js - UPDATED for multi-tenancy and password hashing
const mongoose = require("mongoose");
const bcrypt = require("bcrypt"); // <-- ADD THIS for password hashing

const UserSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    name: { type: String },
    email: { type: String, required: true },
    password: { type: String, required: true },
    pacsId: { type: String, sparse: true },

    pacsName: { type: String },
    district: { type: String },
    location: { type: String },

    personalEmail: { type: String, sparse: true },
    professionalEmail: { type: String, sparse: true },
    contactNo: { type: String },
    salaryInHandPerMonth: {
        type: Number,
        default: 0,
        min: 0
    },
    currentCtc: {
        type: Number,
        default: 0,
        min: 0
    },
    employeePFContribution: {
        type: Number,
        default: 0,
        min: 0
    },
    employeeESIContribution: {
        type: Number,
        default: 0,
        min: 0
    },
    employerEPFContribution: {
        type: Number,
        default: 0,
        min: 0
    },
    employerESICContribution: {
        type: Number,
        default: 0,
        min: 0
    },
    fixedAllowances: {
        type: Number,
        default: 0,
        min: 0
    },
    payableAmount: { type: Number, default: 0 },
    totalPayableAmount: { type: Number, default: 0 },
    incentive: { type: Number, default: 0 },

    otherDeductions: [{
        title: { type: String, required: true },
        amount: { type: Number, required: true, min: 0 },
        date: { type: Date, default: Date.now }
    }],
    reimbursements: [{
        title: { type: String, required: true },
        amount: { type: Number, required: true, min: 0 },
        date: { type: Date, default: Date.now }
    }],
    manualNetSalaryOverride: {
        type: Number,
        default: null
    },
    salaryDetailsConfigured: {
        type: Boolean,
        default: false
    },
    dateOfBirth: {
        type: String,
        required: false,
    },
    userType: { type: String, enum: ["admin", "user", "pacs", "superadmin"], default: "user" },

}, { timestamps: true });

// <-- NEW: Pre-save hook to hash the password before saving a User document
UserSchema.pre('save', async function(next) {
    if (this.isModified('password')) { // Only hash if the password field is modified
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

// NEW INDEXES: Ensure uniqueness *within* a company
UserSchema.index({ companyId: 1, email: 1 }, { unique: true });
UserSchema.index({ companyId: 1, pacsId: 1 }, { unique: true, sparse: true });
UserSchema.index({ companyId: 1, personalEmail: 1 }, { unique: true, sparse: true });
UserSchema.index({ companyId: 1, professionalEmail: 1 }, { unique: true, sparse: true });


module.exports = mongoose.model("User", UserSchema);
