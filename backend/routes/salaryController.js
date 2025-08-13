// backend/routes/salaryController.js - CRITICAL FIX APPLIED + DEBUG LOGS

const User = require('../models/User');
const Visit = require('../models/Visit');

const calculateDurationInHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const durationMs = checkOut.getTime() - checkIn.getTime();
    return Math.max(0, durationMs / (1000 * 60 * 60)); // Ensure non-negative duration
};

const AVERAGE_WORKING_DAYS_IN_MONTH = 26; // Example: 5-day week, ~4.33 weeks/month

// Define standard EPF/ESI percentages if not explicitly set per user
const DEFAULT_EMPLOYER_EPF_PERCENTAGE = 12; // Standard EPF rate for employer on basic
const DEFAULT_EMPLOYER_ESIC_PERCENTAGE = 3.25; // Example employer ESIC rate on basic
const DEFAULT_EMPLOYEE_EPF_PERCENTAGE = 12; // Standard EPF rate for employee on basic
const DEFAULT_EMPLOYEE_ESIC_PERCENTAGE = 0.75; // Typical employee ESIC contribution on basic

exports.getEmployeesSalaryInfo = async (req, res) => {
    try {
        const { month, year } = req.query;

        console.log(`[Backend Debug] Received request for Month: ${month}, Year: ${year}`); // DEBUG LOG

        if (!month || !year) {
            console.log('[Backend Debug] Month or year missing.'); // DEBUG LOG
            return res.status(400).json({ message: 'Month and year query parameters are required.' });
        }

        const targetMonth = parseInt(month, 10) - 1; // Months are 0-indexed in JavaScript Date (0-11)
        const targetYear = parseInt(year, 10);

        console.log(`[Backend Debug] Parsed targetMonth (0-indexed): ${targetMonth}, targetYear: ${targetYear}`); // DEBUG LOG

        if (isNaN(targetMonth) || isNaN(targetYear) || targetMonth < 0 || targetMonth > 11) {
            console.log('[Backend Debug] Invalid month or year.'); // DEBUG LOG
            return res.status(400).json({ message: 'Invalid month or year provided.' });
        }

        // Get start and end date of the target month
        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999); // Last day of the month
        console.log(`[Backend Debug] Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`); // DEBUG LOG

        // Fetch only regular users ('user' or 'pacs')
        const employees = await User.find({ userType: { $in: ['user', 'pacs'] } })
                                        .select('-password'); // Don't return passwords
        console.log(`[Backend Debug] Found ${employees.length} employees with userType 'user' or 'pacs'.`); // DEBUG LOG
        if (employees.length === 0) {
            console.log('[Backend Debug] No eligible employees found. Returning empty array.'); // DEBUG LOG
            return res.json([]); // Explicitly return empty if no employees
        }

        const employeesWithSalary = await Promise.all(employees.map(async (employee) => {
            console.log(`[Backend Debug] Processing employee: ${employee.name} (${employee.email}) - ID: ${employee._id}`); // DEBUG LOG

            let fullDays = 0;
            let halfDays = 0;
            let totalActualWorkingHours = 0;
            let totalCustomDeductionsAmount = 0;
            let totalReimbursementsAmount = 0;

            // --- Fetch visits for the target month for this employee ---
            // CRITICAL FIX: Changing from 'user: employee._id' to 'erpId: employee.email'
            // This is based on your provided Visit data which showed 'erpId' and not 'user' ObjectId.
            const visits = await Visit.find({
                erpId: employee.email, // <--- THIS IS THE KEY CHANGE!
                'checkin.date': { $gte: startDate, $lte: endDate }, // Correct path for nested date
                status: 'completed'
            });
            console.log(`[Backend Debug] Found ${visits.length} completed visits for ${employee.name} via erpId.`); // DEBUG LOG

            // Handle cases where otherDeductions or reimbursements might be undefined
            const safeOtherDeductions = employee.otherDeductions || [];
            const safeReimbursements = employee.reimbursements || [];

            // Calculate full and half days based on visits
            visits.forEach(visit => {
                const checkInDate = visit.checkin && visit.checkin.date ? new Date(visit.checkin.date) : null;
                const checkOutDate = visit.checkout && visit.checkout.date ? new Date(visit.checkout.date) : null;

                const duration = visit.durationInHours !== undefined && visit.durationInHours !== null
                                     ? visit.durationInHours
                                     : calculateDurationInHours(checkInDate, checkOutDate);
                
                console.log(`[Backend Debug] Visit for ${employee.name} on ${checkInDate ? checkInDate.toISOString() : 'N/A'}: Duration = ${duration.toFixed(2)} hours`); // DEBUG LOG

                totalActualWorkingHours += duration;

                if (duration >= 8) { // Assuming 8 hours is a full day
                    fullDays++;
                } else if (duration > 0 && duration < 8) { // Assuming any check-in less than 8 hours but greater than 0 is half-day
                    halfDays++;
                }
            });

            const paidDays = fullDays + (halfDays * 0.5);
            console.log(`[Backend Debug] ${employee.name}: Full Days: ${fullDays}, Half Days: ${halfDays}, Paid Days: ${paidDays.toFixed(2)}`); // DEBUG LOG
            
            const monthlyBaseSalaryForCalc = employee.salaryInHandPerMonth || 0;
            const dailyBaseSalary = monthlyBaseSalaryForCalc > 0 ? (monthlyBaseSalaryForCalc / AVERAGE_WORKING_DAYS_IN_MONTH) : 0;
            const attendanceAdjustedSalary = paidDays * dailyBaseSalary;

            console.log(`[Backend Debug] ${employee.name}: Monthly Base Salary: ${monthlyBaseSalaryForCalc}, Daily Base: ${dailyBaseSalary.toFixed(2)}, Attendance Adjusted Salary: ${attendanceAdjustedSalary.toFixed(2)}`); // DEBUG LOG

            // --- Employer Contributions (for CTC) ---
            const employerEPF = employee.employerEPFContribution !== undefined && employee.employerEPFContribution !== null
                                        ? employee.employerEPFContribution
                                        : (monthlyBaseSalaryForCalc * DEFAULT_EMPLOYER_EPF_PERCENTAGE / 100);
            const employerESIC = employee.employerESICContribution !== undefined && employee.employerESICContribution !== null
                                         ? employee.employerESICContribution
                                         : (monthlyBaseSalaryForCalc * DEFAULT_EMPLOYER_ESIC_PERCENTAGE / 100);

            // --- Employee Deductions (from Gross Salary) ---
            const employeeEPFDeduction = employee.employeePFContribution !== undefined && employee.employeePFContribution !== null
                                                 ? employee.employeePFContribution
                                                 : (monthlyBaseSalaryForCalc * DEFAULT_EMPLOYEE_EPF_PERCENTAGE / 100);
            const employeeESICDeduction = employee.employeeESIContribution !== undefined && employee.employeeESIContribution !== null
                                                  ? employee.employeeESIContribution
                                                  : (monthlyBaseSalaryForCalc * DEFAULT_EMPLOYEE_ESIC_PERCENTAGE / 100);
            
            // --- Custom Deductions & Reimbursements ---
            safeOtherDeductions.forEach(ded => { // Use safe array
                totalCustomDeductionsAmount += ded.amount;
            });
            safeReimbursements.forEach(reim => { // Use safe array
                totalReimbursementsAmount += reim.amount;
            });

            // --- Salary Calculations ---
            let calculatedCtc = monthlyBaseSalaryForCalc + employerEPF + employerESIC + (employee.fixedAllowances || 0);

            let grossSalary = attendanceAdjustedSalary + (employee.fixedAllowances || 0) + (employee.incentive || 0);

            let netSalary = grossSalary - employeeEPFDeduction - employeeESICDeduction - totalCustomDeductionsAmount + totalReimbursementsAmount;

            // Apply manual override if set
            if (employee.manualNetSalaryOverride !== null && employee.manualNetSalaryOverride >= 0) {
                netSalary = employee.manualNetSalaryOverride;
            }

            // Filter condition check for each employee
            const isEmployeeDataMeaningful = paidDays > 0 ||
                (employee.fixedAllowances && employee.fixedAllowances > 0) ||
                (employee.incentive && employee.incentive > 0) ||
                (employee.manualNetSalaryOverride !== null && employee.manualNetSalaryOverride > 0) ||
                (safeReimbursements.length > 0 && totalReimbursementsAmount > 0); // Use safeReimbursements here
            
            console.log(`[Backend Debug] ${employee.name}: Is data meaningful for display? ${isEmployeeDataMeaningful}`); // DEBUG LOG


            return {
                _id: employee._id,
                name: employee.name,
                email: employee.email,
                pacsId: employee.pacsId,
                pacsName: employee.pacsName,
                district: employee.district,
                location: employee.location,
                contactNo: employee.contactNo,
                userType: employee.userType,

                // Stored salary configuration on the user model
                salaryInHandPerMonth: employee.salaryInHandPerMonth,
                currentCtc: employee.currentCtc,
                fixedAllowances: employee.fixedAllowances,
                employeePFContribution: employee.employeePFContribution,
                employeeESIContribution: employee.employeeESIContribution,
                employerEPFContribution: employee.employerEPFContribution,
                employerESICContribution: employee.employerESICContribution,
                otherDeductions: employee.otherDeductions,
                reimbursements: employee.reimbursements,
                manualNetSalaryOverride: employee.manualNetSalaryOverride,
                salaryDetailsConfigured: employee.salaryDetailsConfigured,
                incentive: employee.incentive,

                // Calculated fields for the month
                calculated: {
                    month: parseInt(month, 10),
                    year: targetYear,
                    fullDays: fullDays,
                    halfDays: halfDays,
                    paidDays: parseFloat(paidDays.toFixed(2)), // Ensure paidDays is also fixed
                    totalActualWorkingHours: parseFloat(totalActualWorkingHours.toFixed(2)),
                    attendanceAdjustedSalary: parseFloat(attendanceAdjustedSalary.toFixed(2)),
                    calculatedEmployerEPF: parseFloat(employerEPF.toFixed(2)),
                    calculatedEmployerESIC: parseFloat(employerESIC.toFixed(2)),
                    calculatedEmployeeEPF: parseFloat(employeeEPFDeduction.toFixed(2)),
                    calculatedEmployeeESIC: parseFloat(employeeESICDeduction.toFixed(2)),

                    grossSalary: parseFloat(grossSalary.toFixed(2)),
                    calculatedCtc: parseFloat(calculatedCtc.toFixed(2)),
                    totalCustomDeductions: parseFloat(totalCustomDeductionsAmount.toFixed(2)),
                    totalReimbursements: parseFloat(totalReimbursementsAmount.toFixed(2)),
                    netSalary: parseFloat(netSalary.toFixed(2))
                },
                _isMeaningfulForDisplay: isEmployeeDataMeaningful // Add this for debugging the filter
            };
        }));

        const filteredEmployeesWithSalary = employeesWithSalary.filter(emp => emp._isMeaningfulForDisplay);
        console.log(`[Backend Debug] Final filtered employees count: ${filteredEmployeesWithSalary.length}`); // DEBUG LOG
        if (filteredEmployeesWithSalary.length === 0) {
            console.log('[Backend Debug] After filtering, no employees with meaningful salary data found. Sending empty array to frontend.'); // DEBUG LOG
        }

        res.json(filteredEmployeesWithSalary);

    } catch (error) {
        console.error('[Backend Error] Error fetching employee salary info:', error); // DEBUG LOG
        res.status(500).json({ message: 'Server error while fetching salary information.', error: error.message });
    }
};

// ... (rest of your updateEmployeeSalaryDetails function remains the same)
exports.updateEmployeeSalaryDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            salaryInHandPerMonth,
            currentCtc,
            fixedAllowances,
            employeePFContribution,
            employeeESIContribution,
            employerEPFContribution,
            employerESICContribution,
            otherDeductions,
            reimbursements,
            manualNetSalaryOverride,
            salaryDetailsConfigured,
            incentive
        } = req.body;

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'Employee not found.' });
        }

        if (salaryInHandPerMonth !== undefined) user.salaryInHandPerMonth = salaryInHandPerMonth;
        if (currentCtc !== undefined) user.currentCtc = currentCtc;
        if (fixedAllowances !== undefined) user.fixedAllowances = fixedAllowances;
        if (employeePFContribution !== undefined) user.employeePFContribution = employeePFContribution;
        if (employeeESIContribution !== undefined) user.employeeESIContribution = employeeESIContribution;
        if (employerEPFContribution !== undefined) user.employerEPFContribution = employerEPFContribution;
        if (employerESICContribution !== undefined) user.employerESICContribution = employerESICContribution;
        if (manualNetSalaryOverride !== undefined) {
             user.manualNetSalaryOverride = manualNetSalaryOverride === null ? null : parseFloat(manualNetSalaryOverride);
        }
        if (salaryDetailsConfigured !== undefined) user.salaryDetailsConfigured = salaryDetailsConfigured;
        if (incentive !== undefined) user.incentive = incentive;

        if (Array.isArray(otherDeductions)) {
            user.otherDeductions = otherDeductions.map(ded => ({
                title: ded.title,
                amount: parseFloat(ded.amount),
                date: ded.date ? new Date(ded.date) : new Date()
            }));
        }
        if (Array.isArray(reimbursements)) {
            user.reimbursements = reimbursements.map(reim => ({
                title: reim.title,
                amount: parseFloat(reim.amount),
                date: reim.date ? new Date(reim.date) : new Date()
            }));
        }

        await user.save();

        res.json({ message: 'Employee salary details updated successfully.', user: user.toObject({ getters: true }) });

    } catch (error) {
        console.error('Error updating employee salary details:', error);
        res.status(500).json({ message: 'Server error while updating salary information.', error: error.message });
    }
};