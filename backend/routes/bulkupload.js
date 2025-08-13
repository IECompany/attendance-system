// Attandance System/backend/routes/bulkupload.js - UPDATED for multi-tenancy

const express = require("express");
const router = express.Router();
const multer = require("multer");
const xlsx = require("xlsx");
const bcrypt = require("bcrypt");
const User = require("../models/User"); // User model
const fs = require("fs"); // Temporary file delete karne ke liye

const upload = multer({ dest: "uploads/" }); // Multer for file uploads

// Function to generate password from DOB
const generatePasswordFromDOB = (dobString) => {
    try {
        const parts = dobString.split('-'); // e.g., "10-May-1985"
        if (parts.length === 3) {
            const month = parts[1];
            const year = parts[2];
            return `${month}@${year}`;
        }
    } catch (error) {
        console.error("Error parsing DOB for password generation:", dobString, error);
    }
    return "default@123"; // Fallback password if DOB format is unexpected
};

// Helper function to convert Excel date number to DD-Mon-YYYY string
const excelDateToDDMonYYYY = (excelDateNumber) => {
    // If it's already a string, assume it's correctly formatted or handle as-is
    if (typeof excelDateNumber === 'string') {
        return excelDateNumber; // Assume it's already "DD-Mon-YYYY" or similar
    }
    
    // If it's not a number, or NaN, return undefined or an error value
    if (typeof excelDateNumber !== 'number' || isNaN(excelDateNumber)) {
        return undefined; // Or return 'Invalid Date'
    }

    // Excel dates start from Jan 1, 1900, with Jan 1, 1900 being 1.
    // It also incorrectly treats 1900 as a leap year, so we subtract 1 day.
    const date = new Date(Date.UTC(0, 0, excelDateNumber - 1)); // Adjust for Excel's 1900 bug & UTC
    
    const day = date.getUTCDate();
    const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const month = monthNames[date.getUTCMonth()];
    const year = date.getUTCFullYear();

    const formattedDay = day < 10 ? '0' + day : day;

    return `${formattedDay}-${month}-${year}`;
};


// --- 1. POST /api/admin/bulk-register-users (Bulk User Registration) ---
router.post("/bulk-register-users", upload.single("excelFile"), async (req, res) => {
    try {
        // Extract companyId from the request (set by the 'protect' middleware)
        const companyId = req.companyId; 
        if (!companyId) {
            return res.status(403).json({ message: "Company ID missing. Not authorized for this operation." });
        }

        if (!req.file) {
            return res.status(400).json({ message: "No Excel file uploaded." });
        }

        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: "" }); 

        const headers = jsonData[0].map(h => String(h).trim());
        const usersData = jsonData.slice(1); // Skip header row

        const registeredUsers = [];
        const failedUsers = [];

        const EXCEL_HEADERS = {
            EMPLOYEE_ID: 'Employee Id',
            EMPLOYEE_NAME: 'Employee Name',
            DATE_OF_BIRTH: 'Date of Birth',
            PERSONAL_EMAIL: 'Personal email',
            PROFESSIONAL_EMAIL: 'Professional Email',
            CONTACT_NO: 'Contact no',
            CURRENT_CTC: 'Current CTC',
            SALARY_IN_HAND_PER_MONTH: 'Salary in hand per month',
            PAYABLE_AMOUNT: 'Payable Amount',
            PF: 'PF',
            ESI: 'ESI',
            TOTAL_PAYABLE_AMOUNT: 'Totral Payable Amoun',
            INCENTIVE: 'Incentive',
            TOTAL_CTC: 'tOTAL ctc',
        };

        const getHeaderIndex = (headerName) => headers.indexOf(headerName);

        const employeeIdColIndex = getHeaderIndex(EXCEL_HEADERS.EMPLOYEE_ID);
        const employeeNameColIndex = getHeaderIndex(EXCEL_HEADERS.EMPLOYEE_NAME);
        const dateOfBirthColIndex = getHeaderIndex(EXCEL_HEADERS.DATE_OF_BIRTH);
        const personalEmailColIndex = getHeaderIndex(EXCEL_HEADERS.PERSONAL_EMAIL);
        const professionalEmailColIndex = getHeaderIndex(EXCEL_HEADERS.PROFESSIONAL_EMAIL);
        const contactNoColIndex = getHeaderIndex(EXCEL_HEADERS.CONTACT_NO);
        const currentCtcColIndex = getHeaderIndex(EXCEL_HEADERS.CURRENT_CTC);
        const salaryInHandPerMonthColIndex = getHeaderIndex(EXCEL_HEADERS.SALARY_IN_HAND_PER_MONTH);
        const payableAmountColIndex = getHeaderIndex(EXCEL_HEADERS.PAYABLE_AMOUNT);
        const pfColIndex = getHeaderIndex(EXCEL_HEADERS.PF);
        const esiColIndex = getHeaderIndex(EXCEL_HEADERS.ESI);
        const totalPayableAmountColIndex = getHeaderIndex(EXCEL_HEADERS.TOTAL_PAYABLE_AMOUNT);
        const incentiveColIndex = getHeaderIndex(EXCEL_HEADERS.INCENTIVE);
        const totalCtcColIndex = getHeaderIndex(EXCEL_HEADERS.TOTAL_CTC);

        const essentialHeaders = [
            EXCEL_HEADERS.EMPLOYEE_ID,
            EXCEL_HEADERS.EMPLOYEE_NAME,
            EXCEL_HEADERS.DATE_OF_BIRTH,
        ];
        const missingEssentialHeaders = essentialHeaders.filter(header => !headers.includes(header));
        if (missingEssentialHeaders.length > 0) {
            return res.status(400).json({
                message: "Missing essential column headers in Excel file. Please ensure these are present.",
                missingHeaders: missingEssentialHeaders,
                expectedHeaders: Object.values(EXCEL_HEADERS)
            });
        }

        for (const [rowIndex, row] of usersData.entries()) {
            const rowNum = rowIndex + 2;

            const employeeId = String(row[employeeIdColIndex] || '').trim();
            const name = String(row[employeeNameColIndex] || '').trim();
            
            let rawDateOfBirth = row[dateOfBirthColIndex];
            const dateOfBirth = excelDateToDDMonYYYY(rawDateOfBirth) || String(rawDateOfBirth || '').trim();
            
            const personalEmail = String(row[personalEmailColIndex] || '').toLowerCase().trim();
            const professionalEmail = String(row[professionalEmailColIndex] || '').toLowerCase().trim();
            const contactNo = String(row[contactNoColIndex] || '').trim();

            const parseNumber = (value, index) => {
                if (index === -1 || value === undefined || value === null || value === "") return undefined;
                const num = parseFloat(value);
                return isNaN(num) ? undefined : num;
            };

            const currentCtc = parseNumber(row[currentCtcColIndex], currentCtcColIndex);
            const salaryInHandPerMonth = parseNumber(row[salaryInHandPerMonthColIndex], salaryInHandPerMonthColIndex);
            const payableAmount = parseNumber(row[payableAmountColIndex], payableAmountColIndex);
            const pf = parseNumber(row[pfColIndex], pfColIndex);
            const esi = parseNumber(row[esiColIndex], esiColIndex);
            const totalPayableAmount = parseNumber(row[totalPayableAmountColIndex], totalPayableAmountColIndex);
            const incentive = parseNumber(row[incentiveColIndex], incentiveColIndex);
            const finalTotalCtc = parseNumber(row[totalCtcColIndex], totalCtcColIndex);

            let primaryLoginEmail = professionalEmail || personalEmail;

            const generatedPassword = generatePasswordFromDOB(dateOfBirth);

            if (!employeeId || !primaryLoginEmail || !dateOfBirth || !generatedPassword) {
                failedUsers.push({ row: rowNum, data: row, reason: "Missing required 'Employee Id', a valid Email (Personal or Professional), or 'Date of Birth'." });
                continue;
            }

            try {
                // Check for existing user within THIS company using companyId
                const existingUser = await User.findOne({
                    companyId: companyId, // <-- Filter by companyId
                    $or: [
                        { email: primaryLoginEmail },
                        { pacsId: employeeId }
                    ]
                });

                if (existingUser) {
                    failedUsers.push({ row: rowNum, data: row, reason: `User with Email '${primaryLoginEmail}' or Employee ID '${employeeId}' already exists in this company.` });
                    continue;
                }

                const hashedPassword = await bcrypt.hash(generatedPassword, 10);

                const newUser = new User({
                    companyId: companyId, // <-- Assign companyId to new user
                    name: name,
                    email: primaryLoginEmail,
                    password: hashedPassword,
                    pacsId: employeeId,
                    dateOfBirth: dateOfBirth,
                    personalEmail: personalEmail || undefined,
                    professionalEmail: professionalEmail || undefined,
                    contactNo: contactNo || undefined,
                    currentCtc: currentCtc,
                    salaryInHandPerMonth: salaryInHandPerMonth,
                    payableAmount: payableAmount,
                    pf: pf,
                    esi: esi,
                    totalPayableAmount: totalPayableAmount,
                    incentive: incentive,
                    finalTotalCtc: finalTotalCtc,
                    userType: "user",
                });

                await newUser.save();
                registeredUsers.push({ email: primaryLoginEmail, pacsId: employeeId, name: name });

            } catch (userError) {
                console.error(`Error processing user from row ${rowNum}: ${JSON.stringify(row)} - ${userError.message}`);
                let errorMessage = `Database error during save: ${userError.message}`;
                if (userError.code === 11000) {
                    // More specific error messages for duplicate keys within the company scope
                    if (userError.keyPattern && userError.keyPattern.email) errorMessage = `Duplicate email '${primaryLoginEmail}' within your company.`;
                    else if (userError.keyPattern && userError.keyPattern.pacsId) errorMessage = `Duplicate Employee ID '${employeeId}' within your company.`;
                    else if (userError.keyPattern && userError.keyPattern.personalEmail) errorMessage = `Duplicate Personal Email '${personalEmail}' within your company.`;
                    else if (userError.keyPattern && userError.keyPattern.professionalEmail) errorMessage = `Duplicate Professional Email '${professionalEmail}' within your company.`;
                    else errorMessage = `Duplicate entry error within your company: ${userError.message}`;
                }
                failedUsers.push({ row: rowNum, data: row, reason: errorMessage });
            }
        }

        res.status(200).json({
            message: "Bulk registration process completed.",
            registeredCount: registeredUsers.length,
            failedCount: failedUsers.length,
            details: failedUsers.length > 0 ? "Some users could not be registered. Check 'failedUsers' for details." : "All users registered successfully.",
            failedUsers: failedUsers.map(f => ({ row: f.row, reason: f.reason, data: f.data }))
        });

    } catch (error) {
        console.error("Critical error during bulk registration API call:", error);
        res.status(500).json({
            message: "Server error during bulk registration process.",
            details: error.message
        });
    } finally {
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error("Error deleting temporary file:", err);
            });
        }
    }
});

// --- 2. GET /api/admin/users (Get All Users with Search and Pagination) ---
router.get("/users", async (req, res) => {
    try {
        const companyId = req.companyId; // <-- Get companyId from middleware
        if (!companyId) {
            return res.status(403).json({ message: "Company ID missing. Not authorized to fetch users." });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';

        // Filter users by companyId and exclude 'admin' userType (assuming 'superadmin' is the company-level admin)
        let query = {
            companyId: companyId, // <-- Filter by companyId
            userType: { $ne: 'admin' } // Exclude system-level admins if any, or adjust as per your 'superadmin' vs 'admin' distinction
        };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { pacsId: { $regex: search, $options: 'i' } },
                { dateOfBirth: { $regex: search, $options: 'i' } } 
            ];
        }

        const totalUsers = await User.countDocuments(query);
        const users = await User.find(query)
            .skip((page - 1) * limit)
            .limit(limit)
            .select('-password -__v'); // dateOfBirth will be included here

        res.status(200).json({
            users,
            currentPage: page,
            totalPages: Math.ceil(totalUsers / limit),
            totalUsers,
        });

    } catch (error) {
        console.error("Error fetching users for admin panel:", error);
        res.status(500).json({ message: "Server error while fetching users." });
    }
});

// --- 3. DELETE /api/admin/users/:id (Delete a User by ID) ---
router.delete("/users/:id", async (req, res) => {
    try {
        const companyId = req.companyId; // <-- Get companyId from middleware
        if (!companyId) {
            return res.status(403).json({ message: "Company ID missing. Not authorized to delete users." });
        }

        const { id } = req.params;

        // Ensure deletion happens only within the user's company
        const user = await User.findOneAndDelete({ _id: id, companyId: companyId });

        if (!user) {
            return res.status(404).json({ message: "User not found or not belonging to your company." });
        }

        res.status(200).json({ message: "User deleted successfully." });

    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Server error while deleting user." });
    }
});

module.exports = router;
