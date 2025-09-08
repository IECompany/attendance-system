const express = require("express");
const router = express.Router();
const multer = require("multer");
const xlsx = require("xlsx");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const fs = require("fs");

const upload = multer({ dest: "uploads/" });

// ✅ Convert Excel numeric date (like 38050) to DD/MM/YYYY
const convertExcelDateToDDMMYYYY = (excelDateNumber) => {
  if (typeof excelDateNumber === "number") {
    const date = new Date((excelDateNumber - 25569) * 86400 * 1000);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return excelDateNumber;
};

// ✅ Generate password as lowercase(name)@MMYYYY
const generatePasswordFromNameAndDOB = (name, dobString) => {
  try {
    if (!name || !dobString) return "default@123";
    const parts = dobString.split("/");
    if (parts.length !== 3) return "default@123";

    const month = parts[1];
    const year = parts[2];
    const cleanedName = name.trim().toLowerCase().replace(/\s+/g, "");
    return `${cleanedName}@${month}${year}`;
  } catch (error) {
    console.error("Password generation error:", error);
    return "default@123";
  }
};

// --- NEW ROUTE: Register Single User ---
router.post("/register-single-user", async (req, res) => {
  try {
    const companyId = req.companyId;
    if (!companyId) {
      return res.status(403).json({ message: "Company ID missing. Not authorized." });
    }

    const {
      employeeId,
      name,
      dateOfBirth,
      contactNo,
      professionalEmail,
      personalEmail,
      departmentDesignation,
      dateOfJoining,
      currentCtc,
      monthlyInHandSalary,
      basicPay,
      pfDeduction,
      esiDeduction,
      professionalTax,
      incentivesBonus,
    } = req.body;

    const primaryLoginEmail = professionalEmail;
    const generatedPassword = generatePasswordFromNameAndDOB(name, dateOfBirth);

    if (!employeeId || !primaryLoginEmail || !dateOfBirth || !dateOfJoining || !generatedPassword) {
      return res.status(400).json({ message: "Missing essential user information." });
    }

    const existingUser = await User.findOne({
      companyId: companyId,
      $or: [
        { email: primaryLoginEmail },
        { employeeId: employeeId }
      ]
    });

    if (existingUser) {
      return res.status(409).json({ message: "User with this email or employee ID already exists.", isConflict: true });
    }

    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    const newUser = new User({
      companyId,
      name,
      email: primaryLoginEmail,
      password: hashedPassword,
      employeeId: employeeId,
      dateOfBirth,
      contactNo: contactNo || undefined,
      personalEmail: personalEmail || undefined,
      professionalEmail: professionalEmail || undefined,
      departmentDesignation: departmentDesignation || undefined,
      dateOfJoining,
      currentCtc: currentCtc || 0,
      salaryInHandPerMonth: monthlyInHandSalary || 0,
      basicPay: basicPay || 0,
      pfDeduction: pfDeduction || 0,
      esiDeduction: esiDeduction || 0,
      professionalTax: professionalTax || 0,
      incentivesBonus: incentivesBonus || 0,
      userType: "user",
    });

    await newUser.save();

    res.status(201).json({
      message: "User registered successfully!",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        generatedPassword: generatedPassword,
      },
    });

  } catch (error) {
    console.error("Critical error:", error);
    res.status(500).json({
      message: "Server error during single user registration.",
      details: error.message
    });
  }
});

// --- EXISTING ROUTE: Bulk User Registration ---
router.post("/bulk-register-users", upload.single("excelFile"), async (req, res) => {
  try {
    const companyId = req.companyId;
    if (!companyId) {
      return res.status(403).json({ message: "Company ID missing. Not authorized." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No Excel file uploaded." });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: "" });
    const headers = jsonData[0].map(h => String(h).trim());
    const usersData = jsonData.slice(1);

    const EXCEL_HEADERS = {
      EMPLOYEE_ID: "Employee Id",
      EMPLOYEE_NAME: "Employee Name",
      DATE_OF_BIRTH: "Date of Birth",
      CONTACT_NO: "Contact No",
      PROFESSIONAL_EMAIL: "Professional Email",
      PERSONAL_EMAIL: "Personal Email",
      DEPARTMENT_DESIGNATION: "Department / Designation",
      DATE_OF_JOINING: "Date of Joining",
      CURRENT_CTC: "Current CTC (Annual)",
      MONTHLY_IN_HAND_SALARY: "Monthly In-Hand Salary (Net Payable)",
      BASIC_PAY: "Basic Pay (Monthly)",
      PF_DEDUCTION: "PF Deduction (Monthly)",
      ESI_DEDUCTION: "ESI Deduction (Monthly)",
      PROFESSIONAL_TAX: "Professional Tax (Monthly)",
      INCENTIVES_BONUS: "Incentives / Bonus (Monthly)",
    };

    const getHeaderIndex = (headerName) => headers.indexOf(headerName);
    const idx = (key) => getHeaderIndex(EXCEL_HEADERS[key]);

    const essentialHeaders = [
      EXCEL_HEADERS.EMPLOYEE_ID,
      EXCEL_HEADERS.EMPLOYEE_NAME,
      EXCEL_HEADERS.DATE_OF_BIRTH,
      EXCEL_HEADERS.PROFESSIONAL_EMAIL,
      EXCEL_HEADERS.DATE_OF_JOINING,
    ];

    const missingHeaders = essentialHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return res.status(400).json({
        message: "Missing essential column headers in Excel.",
        missingHeaders,
        expectedHeaders: Object.values(EXCEL_HEADERS)
      });
    }

    const registeredUsers = [];
    const failedUsers = [];

    for (const [rowIndex, row] of usersData.entries()) {
      const rowNum = rowIndex + 2;

      const employeeId = String(row[idx("EMPLOYEE_ID")] || '').trim();
      const name = String(row[idx("EMPLOYEE_NAME")] || '').trim();
      const rawDateOfBirth = row[idx("DATE_OF_BIRTH")];
      const dateOfBirth = convertExcelDateToDDMMYYYY(rawDateOfBirth) || String(rawDateOfBirth || '').trim();
      const contactNo = String(row[idx("CONTACT_NO")] || '').trim();
      const professionalEmail = String(row[idx("PROFESSIONAL_EMAIL")] || '').toLowerCase().trim();
      const personalEmail = String(row[idx("PERSONAL_EMAIL")] || '').toLowerCase().trim();
      const departmentDesignation = String(row[idx("DEPARTMENT_DESIGNATION")] || '').trim();
      const rawDateOfJoining = row[idx("DATE_OF_JOINING")];
      const dateOfJoining = convertExcelDateToDDMMYYYY(rawDateOfJoining) || String(rawDateOfJoining || '').trim();

      const parseNumber = (val) => {
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num;
      };

      const currentCtc = parseNumber(row[idx("CURRENT_CTC")]);
      const monthlyInHandSalary = parseNumber(row[idx("MONTHLY_IN_HAND_SALARY")]);
      const basicPay = parseNumber(row[idx("BASIC_PAY")]);
      const pfDeduction = parseNumber(row[idx("PF_DEDUCTION")]);
      const esiDeduction = parseNumber(row[idx("ESI_DEDUCTION")]);
      const professionalTax = parseNumber(row[idx("PROFESSIONAL_TAX")]);
      const incentivesBonus = parseNumber(row[idx("INCENTIVES_BONUS")]);

      const primaryLoginEmail = professionalEmail;
      const generatedPassword = generatePasswordFromNameAndDOB(name, dateOfBirth);

      console.log(`Processing row ${rowNum}: Employee ID '${employeeId}', Password: '${generatedPassword}'`);

      if (!employeeId) {
        failedUsers.push({ row: rowNum, data: row, reason: "Employee ID missing." });
        continue;
      }

      if (!primaryLoginEmail || !dateOfBirth || !dateOfJoining || !generatedPassword) {
        failedUsers.push({ row: rowNum, data: row, reason: "Missing essential fields (Email, DOB, or Date of Joining)." });
        continue;
      }

      try {
        const existingUser = await User.findOne({
          companyId: companyId,
          $or: [
            { email: primaryLoginEmail },
            { employeeId: employeeId }
          ]
        });

        if (existingUser) {
          failedUsers.push({
            row: rowNum,
            data: row,
            reason: `User with Email '${primaryLoginEmail}' or Employee ID '${employeeId}' already exists.`
          });
          continue;
        }

        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        const newUser = new User({
          companyId,
          name,
          email: primaryLoginEmail,
          password: hashedPassword,
          employeeId: employeeId,
          dateOfBirth,
          contactNo: contactNo || undefined,
          personalEmail: personalEmail || undefined,
          professionalEmail: professionalEmail || undefined,
          departmentDesignation: departmentDesignation || undefined,
          dateOfJoining,
          currentCtc,
          salaryInHandPerMonth: monthlyInHandSalary,
          basicPay,
          pfDeduction,
          esiDeduction,
          professionalTax,
          incentivesBonus,
          userType: "user",
        });

        await newUser.save();
        registeredUsers.push({ email: primaryLoginEmail, employeeId, name });

      } catch (userError) {
        console.error(`Error on row ${rowNum}: ${userError.message}`);
        let errorMessage = `Database error: ${userError.message}`;
        if (userError.code === 11000) {
          if (userError.keyPattern?.email) errorMessage = `Duplicate email '${primaryLoginEmail}' within your company.`;
          else if (userError.keyPattern?.employeeId) errorMessage = `Duplicate Employee ID '${employeeId}' within your company.`;
          else if (userError.keyPattern?.personalEmail) errorMessage = `Duplicate Personal Email '${personalEmail}' within your company.`;
          else if (userError.keyPattern?.professionalEmail) errorMessage = `Duplicate Professional Email '${professionalEmail}' within your company.`;
        }
        failedUsers.push({ row: rowNum, data: row, reason: errorMessage });
      }
    }

    res.status(200).json({
      message: "Bulk registration completed.",
      registeredCount: registeredUsers.length,
      failedCount: failedUsers.length,
      details: failedUsers.length > 0 ? "Some users failed." : "All users registered successfully.",
      failedUsers: failedUsers.map(f => ({ row: f.row, reason: f.reason }))
    });

  } catch (error) {
    console.error("Critical error:", error);
    res.status(500).json({
      message: "Server error during bulk registration.",
      details: error.message
    });
  } finally {
    if (req.file?.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Failed to delete file:", err);
      });
    }
  }
});

module.exports = router;