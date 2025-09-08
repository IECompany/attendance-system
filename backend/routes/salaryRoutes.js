const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Visit = require('../models/Visit');
const { protect } = require('../middleware/companyAuth');

// --- HELPER FUNCTION: Calculate duration in hours ---
const calculateDurationInHours = (checkInDate, checkOutDate) => {
    if (!checkInDate || !checkOutDate) return 0;
    const durationMs = checkOutDate.getTime() - checkInDate.getTime();
    return Math.max(0, durationMs / (1000 * 60 * 60));
};

// --- GET /api/admin/employees-salary-info ---
router.get("/employees-salary-info", protect, async (req, res) => {
    try {
        const companyId = req.companyId;
        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({ message: "Month and Year query parameters are required." });
        }

        const numericMonth = parseInt(month);
        const numericYear = parseInt(year);
        const monthYearKey = `${numericMonth}-${numericYear}`;
        const totalDaysInMonth = new Date(numericYear, numericMonth, 0).getDate();
        const startDate = new Date(numericYear, numericMonth - 1, 1);
        const endDate = new Date(numericYear, numericMonth, 0, 23, 59, 59, 999);

        const [employees, visits] = await Promise.all([
            User.find({ companyId: companyId, userType: { $in: ['user', 'pacs'] } })
                .select('employeeId name pacsName district currentCtc basicPay salaryInHandPerMonth pfDeduction esiDeduction professionalTax incentivesBonus fixedAllowances incentive otherDeductions reimbursements manualNetSalaryOverride monthlyLeaves individualPaidLeaves employeePFContribution employeeESIContribution employerEPFContribution employerESIContribution salaryDetailsConfigured email allowances'),
            Visit.find({
                companyId: companyId,
                'checkin.date': { $gte: startDate, $lte: endDate },
                status: 'completed'
            })
        ]);

        const visitsByEmail = visits.reduce((acc, visit) => {
            if (!acc[visit.erpId]) {
                acc[visit.erpId] = [];
            }
            acc[visit.erpId].push(visit);
            return acc;
        }, {});

        // Combine data and calculate salaries
        const finalEmployeesSalaryData = employees.map(employee => {
            const employeeVisits = visitsByEmail[employee.email] || [];
            let paidDays = 0;

            // Calculate paid days from visits
            employeeVisits.forEach(visit => {
                const duration = calculateDurationInHours(visit.checkin.date, visit.checkout.date);
                const durationInMinutes = duration * 60;
                if (durationInMinutes >= 5) {
                    paidDays += 1;
                } else if (durationInMinutes >= 2) {
                    paidDays += 0.5;
                }
            });

            // Add bulk monthly leaves (for holidays/offs)
            const bulkMonthlyLeaves = employee.monthlyLeaves && employee.monthlyLeaves.get(monthYearKey)
                ? employee.monthlyLeaves.get(monthYearKey)
                : 0;
            // Add individual paid leaves
            const individualPaidLeaves = employee.individualPaidLeaves && employee.individualPaidLeaves.get(monthYearKey)
                ? employee.individualPaidLeaves.get(monthYearKey)
                : 0;

            paidDays += bulkMonthlyLeaves + individualPaidLeaves;

            const salaryInHand = employee.salaryInHandPerMonth || 0;
            const dailyRate = totalDaysInMonth > 0 ? salaryInHand / totalDaysInMonth : 0;
            const attendanceAdjustedSalary = paidDays * dailyRate;
            const totalOtherDeductions = (employee.otherDeductions || []).reduce((sum, ded) => sum + (ded.amount || 0), 0);
            const totalReimbursements = (employee.reimbursements || []).reduce((sum, reim) => sum + (reim.amount || 0), 0);
            
            // --- UPDATED LOGIC: Calculate total allowances from the new array structure ---
            const totalAllowances = Array.isArray(employee.allowances) 
                ? employee.allowances.reduce((sum, allowance) => sum + (allowance.amount || 0), 0)
                : 0;

            // --- UPDATED LOGIC: REMOVED totalAllowances from grossSalary and calculatedCtc ---
            const grossSalary = attendanceAdjustedSalary + (employee.incentivesBonus || 0) + totalReimbursements;
            let netSalary = grossSalary - totalOtherDeductions;

            if (employee.manualNetSalaryOverride !== null && employee.manualNetSalaryOverride !== undefined) {
                netSalary = employee.manualNetSalaryOverride;
            }
            
            const calculatedCtc = (employee.basicPay || 0) + (employee.fixedAllowances || 0) + (employee.incentive || 0) + (employee.incentivesBonus || 0) + (employee.employerEPFContribution || 0) + (employee.employerESIContribution || 0) + (employee.pfDeduction || 0) + (employee.esiDeduction || 0);

            return {
                ...employee.toObject(),
                calculated: {
                    paidDays: parseFloat(paidDays.toFixed(2)),
                    bulkMonthlyLeaves: parseFloat(bulkMonthlyLeaves.toFixed(2)),
                    individualPaidLeaves: parseFloat(individualPaidLeaves.toFixed(2)),
                    attendanceAdjustedSalary: parseFloat(attendanceAdjustedSalary.toFixed(2)),
                    totalOtherDeductions: parseFloat(totalOtherDeductions.toFixed(2)),
                    totalReimbursements: parseFloat(totalReimbursements.toFixed(2)),
                    totalAllowances: parseFloat(totalAllowances.toFixed(2)),
                    grossSalary: parseFloat(grossSalary.toFixed(2)),
                    netSalary: parseFloat(netSalary.toFixed(2)),
                    calculatedCtc: parseFloat(calculatedCtc.toFixed(2)),
                }
            };
        });

        res.status(200).json(finalEmployeesSalaryData);
    } catch (err) {
        console.error("Error fetching employee salary info:", err);
        res.status(500).json({ message: "Server error.", error: err.message });
    }
});

// --- PUT /api/admin/employees-salary-info/:id ---
router.put("/employees-salary-info/:id", protect, async (req, res) => {
    try {
        const companyId = req.companyId;
        const { id } = req.params;
        const { individualPaidLeaves, allowances, ...updatedFields } = req.body;

        const user = await User.findOne({ _id: id, companyId: companyId });

        if (!user) {
            return res.status(404).json({ message: "User not found or does not belong to your company." });
        }
        
        if (updatedFields.currentCtc !== undefined) user.currentCtc = updatedFields.currentCtc;
        if (updatedFields.basicPay !== undefined) user.basicPay = updatedFields.basicPay;
        if (updatedFields.salaryInHandPerMonth !== undefined) user.salaryInHandPerMonth = updatedFields.salaryInHandPerMonth;
        if (updatedFields.pfDeduction !== undefined) user.pfDeduction = updatedFields.pfDeduction;
        if (updatedFields.esiDeduction !== undefined) user.esiDeduction = updatedFields.esiDeduction;
        if (updatedFields.professionalTax !== undefined) user.professionalTax = updatedFields.professionalTax;
        if (updatedFields.incentivesBonus !== undefined) user.incentivesBonus = updatedFields.incentivesBonus;
        if (updatedFields.fixedAllowances !== undefined) user.fixedAllowances = updatedFields.fixedAllowances;
        if (updatedFields.employeePFContribution !== undefined) user.employeePFContribution = updatedFields.employeePFContribution;
        if (updatedFields.employeeESIContribution !== undefined) user.employeeESIContribution = updatedFields.employeeESIContribution;
        if (updatedFields.employerEPFContribution !== undefined) user.employerEPFContribution = updatedFields.employerEPFContribution;
        if (updatedFields.employerESIContribution !== undefined) user.employerESIContribution = updatedFields.employerESIContribution;
        if (updatedFields.incentive !== undefined) user.incentive = updatedFields.incentive;
        if (updatedFields.manualNetSalaryOverride !== undefined) {
            user.manualNetSalaryOverride = updatedFields.manualNetSalaryOverride === null ? null : parseFloat(updatedFields.manualNetSalaryOverride);
        }
        if (updatedFields.salaryDetailsConfigured !== undefined) user.salaryDetailsConfigured = updatedFields.salaryDetailsConfigured;
        
        if (Array.isArray(updatedFields.otherDeductions)) {
            user.otherDeductions = updatedFields.otherDeductions.map(ded => ({
                title: ded.title,
                amount: parseFloat(ded.amount) || 0,
            }));
        }
        if (Array.isArray(updatedFields.reimbursements)) {
            user.reimbursements = updatedFields.reimbursements.map(reim => ({
                title: reim.title,
                amount: parseFloat(reim.amount) || 0,
            }));
        }

        if (individualPaidLeaves !== undefined && typeof individualPaidLeaves === 'object' && individualPaidLeaves !== null) {
            const [month, year] = Object.keys(individualPaidLeaves)[0].split('-');
            const leavesValue = parseFloat(Object.values(individualPaidLeaves)[0]);
            const parsedMonth = parseInt(month, 10);
            const parsedYear = parseInt(year, 10);

            if (!isNaN(parsedMonth) && !isNaN(parsedYear) && !isNaN(leavesValue)) {
                const monthYearKey = `${parsedMonth}-${parsedYear}`;
                user.individualPaidLeaves.set(monthYearKey, leavesValue);
            }
        }
        
        // --- UPDATED LOGIC: Correctly handle allowances as an array of objects ---
        if (Array.isArray(allowances)) {
            user.allowances = allowances.map(allowance => ({
                title: allowance.title,
                amount: parseFloat(allowance.amount) || 0
            }));
        }

        await user.save();

        res.status(200).json({ message: "Salary details updated successfully.", user: user.toObject() });
    } catch (err) {
        console.error("Error updating salary details:", err);
        res.status(500).json({ message: "Server error.", error: err.message });
    }
});

// --- PUT /api/admin/salaries/update-monthly-leaves ---
router.put('/salaries/update-monthly-leaves', protect, async (req, res) => {
    try {
        const companyId = req.companyId;
        const { month, year, leaves } = req.body;

        if (!month || !year || leaves === undefined) {
            return res.status(400).json({ message: "Month, year, and leaves are required." });
        }

        const leavesValue = parseFloat(leaves);
        if (isNaN(leavesValue) || leavesValue < 0) {
            return res.status(400).json({ message: "Leaves must be a valid non-negative number." });
        }

        const monthYearKey = `${month}-${year}`;

        const result = await User.updateMany(
            {
                companyId: companyId,
                userType: { $in: ['user', 'pacs'] }
            },
            {
                $set: { [`monthlyLeaves.${monthYearKey}`]: leavesValue }
            }
        );

        res.status(200).json({
            message: `Monthly leaves updated successfully for ${result.modifiedCount} employees.`,
            modifiedCount: result.modifiedCount
        });

    } catch (err) {
        console.error("Error updating monthly leaves:", err);
        res.status(500).json({ message: "Server error.", error: err.message });
    }
});

module.exports = router;