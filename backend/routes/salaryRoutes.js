// backend/routes/salaryRoutes.js - FINAL VERSION WITH MULTI-TENANCY & CALCULATIONS

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Import Models
const User = require('../models/User');
const Visit = require('../models/Visit');
const { protect } = require('../middleware/companyAuth');

// --- EmployeeSalary Schema (NEW) ---
const employeeSalarySchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    erpId: {
        type: String,
        required: true
    },
    month: {
        type: Number,
        required: true,
        min: 1,
        max: 12
    },
    year: {
        type: Number,
        required: true
    },
    salaryInHandPerMonth: { type: Number, default: 0 },
    fixedAllowances: { type: Number, default: 0 },
    employeePFContribution: { type: Number, default: 0 },
    employeeESIContribution: { type: Number, default: 0 },
    employerEPFContribution: { type: Number, default: 0 },
    employerESICContribution: { type: Number, default: 0 },
    incentive: { type: Number, default: 0 },
    otherDeductions: [{
        title: { type: String, required: true },
        amount: { type: Number, required: true }
    }],
    reimbursements: [{
        title: { type: String, required: true },
        amount: { type: Number, required: true }
    }],
    manualNetSalaryOverride: { type: Number, default: null }, // If manual override is used
    salaryDetailsConfigured: { type: Boolean, default: false },
}, { timestamps: true });

const EmployeeSalary = mongoose.model('EmployeeSalary', employeeSalarySchema);


// --- HELPER FUNCTION: Calculate salary details ---
const calculateSalary = (salaryDoc, paidDays, totalDaysInMonth) => {
    // Ensure all numeric inputs are treated as numbers, defaulting to 0 if invalid
    const salaryInHand = typeof salaryDoc.salaryInHandPerMonth === 'number' ? salaryDoc.salaryInHandPerMonth : 0;
    const fixedAllowances = typeof salaryDoc.fixedAllowances === 'number' ? salaryDoc.fixedAllowances : 0;
    const incentive = typeof salaryDoc.incentive === 'number' ? salaryDoc.incentive : 0;
    const empPF = typeof salaryDoc.employeePFContribution === 'number' ? salaryDoc.employeePFContribution : 0;
    const empESI = typeof salaryDoc.employeeESIContribution === 'number' ? salaryDoc.employeeESIContribution : 0;
    const emplrPF = typeof salaryDoc.employerEPFContribution === 'number' ? salaryDoc.employerEPFContribution : 0;
    const emplrESI = typeof salaryDoc.employerESICContribution === 'number' ? salaryDoc.employerESICContribution : 0;
    const manualNet = typeof salaryDoc.manualNetSalaryOverride === 'number' ? salaryDoc.manualNetSalaryOverride : null;

    const dailyRate = salaryInHand / totalDaysInMonth;
    const attendanceAdjustedSalary = paidDays * dailyRate;

    const totalOtherDeductions = salaryDoc.otherDeductions.reduce((sum, ded) => sum + ded.amount, 0);
    const totalReimbursements = salaryDoc.reimbursements.reduce((sum, reim) => sum + reim.amount, 0);

    const grossSalary = attendanceAdjustedSalary + fixedAllowances + incentive + totalReimbursements;

    const totalDeductions = empPF + empESI + totalOtherDeductions;
    const netSalary = manualNet !== null ? manualNet : grossSalary - totalDeductions;

    const calculatedCtc = grossSalary + emplrPF + emplrESI;

    return {
        paidDays,
        attendanceAdjustedSalary,
        totalCustomDeductions: totalOtherDeductions,
        totalReimbursements: totalReimbursements,
        grossSalary,
        netSalary,
        calculatedCtc,
        calculatedEmployeeEPF: empPF,
        calculatedEmployeeESIC: empESI
    };
};

// --- GET /api/admin/employees-salary-info ---
// @desc    Fetch salary information for all employees of a company for a given month/year
// @access  Private
router.get("/employees-salary-info", protect, async (req, res) => {
    try {
        const companyId = req.companyId;
        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({ message: "Month and Year query parameters are required." });
        }

        const numericMonth = parseInt(month);
        const numericYear = parseInt(year);
        const totalDaysInMonth = new Date(numericYear, numericMonth, 0).getDate();

        // Use Promise.all to run all database queries concurrently for better performance
        const [employees, visits, salaryDocs] = await Promise.all([
            User.find({
                companyId: companyId,
                userType: { $in: ['user', 'pacs'] }
            }),
            Visit.find({
                companyId: companyId,
                'checkin.date': { $gte: new Date(numericYear, numericMonth - 1, 1), $lte: new Date(numericYear, numericMonth, 0) }
            }),
            EmployeeSalary.find({
                companyId: companyId,
                month: numericMonth,
                year: numericYear
            })
        ]);

        const visitsByUserId = visits.reduce((acc, visit) => {
            if (!acc[visit.userId]) {
                acc[visit.userId] = [];
            }
            acc[visit.userId].push(visit);
            return acc;
        }, {});

        const salaryDocsByUserId = salaryDocs.reduce((acc, doc) => {
            acc[doc.userId] = doc;
            return acc;
        }, {});

        // Combine data and calculate salaries
        const finalEmployeesSalaryData = employees.map(employee => {
            const employeeVisits = visitsByUserId[employee._id] || [];
            const paidDays = employeeVisits.filter(visit => visit.status === 'completed').length;
            const salaryInfo = salaryDocsByUserId[employee._id] || new EmployeeSalary({ companyId, userId: employee._id, erpId: employee.pacsId, month: numericMonth, year: numericYear });

            // Calculate salary details using the helper function
            const calculated = calculateSalary(salaryInfo, paidDays, totalDaysInMonth);

            // Return a combined object with user info and calculated salary
            return {
                _id: employee._id,
                name: employee.name,
                pacsId: employee.pacsId,
                pacsName: employee.pacsName,
                district: employee.district,
                ...salaryInfo.toObject(), // Use toObject() to get a plain JS object
                calculated: calculated, // Add the calculated values
                leave: employee.leave ? employee.leave.toObject() : null
            };
        });

        res.status(200).json(finalEmployeesSalaryData);
    } catch (err) {
        console.error("Error fetching employee salary info:", err);
        res.status(500).json({ message: "Server error.", error: err.message });
    }
});

// --- PUT /api/admin/employees-salary-info/:id ---
// @desc    Update salary details for a specific employee
// @access  Private
router.put("/employees-salary-info/:id", protect, async (req, res) => {
    try {
        const companyId = req.companyId;
        const { id } = req.params;
        const updatedFields = req.body;

        if (!companyId) {
            return res.status(403).json({ message: "Company ID missing. Cannot update salary." });
        }

        // 1. Find the salary document by its _id and ensure it belongs to the logged-in company
        const salaryDoc = await EmployeeSalary.findOne({ _id: id, companyId: companyId });

        if (!salaryDoc) {
            return res.status(404).json({ message: "Salary record not found or does not belong to your company." });
        }

        // 2. Update the document with the new data
        Object.keys(updatedFields).forEach(key => {
            salaryDoc[key] = updatedFields[key];
        });

        await salaryDoc.save();

        res.status(200).json({ message: "Salary details updated successfully." });
    } catch (err) {
        console.error("Error updating salary details:", err);
        res.status(500).json({ message: "Server error.", error: err.message });
    }
});

// --- NEW ENDPOINT: PUT /api/admin/salaries/update-leave/:userId ---
// @desc    Update the number of leaves remaining for a specific employee
// @access  Private
router.put('/salaries/update-leave/:userId', protect, async (req, res) => {
    try {
        const companyId = req.companyId;
        const { userId } = req.params;
        const { leavesRemaining } = req.body;

        if (typeof leavesRemaining !== 'number' || leavesRemaining < 0) {
            return res.status(400).json({ message: 'Invalid value for remaining leaves.' });
        }

        const userToUpdate = await User.findOne({ _id: userId, companyId: companyId });

        if (!userToUpdate) {
            return res.status(404).json({ message: 'User not found or does not belong to your company.' });
        }

        // Update the leave data on the User model
        if (!userToUpdate.leave) {
            userToUpdate.leave = {};
        }
        userToUpdate.leave.leavesRemaining = leavesRemaining;

        await userToUpdate.save();

        res.status(200).json({ message: 'Leaves updated successfully.', leave: userToUpdate.leave });

    } catch (err) {
        console.error("Error updating leaves:", err);
        res.status(500).json({ message: "Server error.", error: err.message });
    }
});

module.exports = router;