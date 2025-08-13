// src/components/BulkUserRegistration.jsx - UPDATED for Multi-Tenancy

import React, { useState, useCallback } from "react"; // Added useCallback
import { FaUpload, FaDownload } from "react-icons/fa";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import { Alert, Spinner, Button } from "react-bootstrap"; // Added Spinner, Button for consistency

import { useAuth } from '../authContext'; // <-- NEW: Import useAuth context

const BulkUserRegistration = () => {
  const { user, token, logout } = useAuth(); // <-- NEW: Get user, token, and logout from AuthContext

  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState("");
  const [loading, setLoading] = useState(false);
  const [showFormatInfo, setShowFormatInfo] = useState(false);

  // --- NEW: Helper to get authenticated headers ---
  const getAuthHeaders = useCallback(() => {
    if (!token || !user || !user.companyId) {
      // If token or companyId is missing, it means user is not properly authenticated
      // or session is invalid. Redirect to login.
      setMessage("Session expired or invalid. Please log in again."); // Set error message
      setVariant("danger");
      logout(); // Use logout function from context
      return null;
    }
    return {
      'Authorization': `Bearer ${token}`,
      'X-Company-ID': user.companyId
    };
  }, [token, user, logout]); // Dependencies for useCallback

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage(""); // Clear previous messages
    setVariant("");
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select an Excel file to upload.");
      setVariant("warning");
      return;
    }

    const headers = getAuthHeaders(); // <-- NEW: Get authenticated headers
    if (!headers) return; // Exit if headers are not available (getAuthHeaders will handle logout)

    setLoading(true);
    setMessage("Uploading and processing file...");
    setVariant("info");

    try {
      const formData = new FormData();
      formData.append("excelFile", file);

      const res = await fetch("http://localhost:5001/api/admin/bulk-register-users", {
        method: "POST",
        headers: { // <-- NEW: Add headers for authentication
            'Authorization': headers.Authorization,
            'X-Company-ID': headers['X-Company-ID']
            // Note: Content-Type for FormData is automatically set by the browser
        },
        body: formData,
      });

      const result = await res.json();

      if (res.ok) {
        setMessage(`✅ Bulk user registration successful! Registered ${result.registeredCount} users. Failed: ${result.failedCount}.`);
        setVariant("success");
        setFile(null);
      } else {
        setMessage(`❌ Bulk registration failed: ${result.message || "Unknown error"}. Details: ${result.details || ''} ${result.missingHeaders ? 'Missing headers: ' + result.missingHeaders.join(', ') : ''}`);
        setVariant("danger");
      }
    } catch (err) {
      console.error("Error during file upload:", err);
      setMessage(`❌ An error occurred during upload: ${err.message}. Please check your network and try again.`);
      setVariant("danger");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "Employee Id", "Employee Name", "Date of Birth",
      "Personal email", "Professional Email", "Contact no",
      "Current CTC", "Salary in hand per month", "Payable Amount",
      "PF", "ESI", "Totral Payable Amoun", "Incentive", "tOTAL ctc"
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users Template");

    XLSX.writeFile(wb, "bulk_upload_template.xlsx");

    setShowFormatInfo(false);
    setMessage("Standard Excel template downloaded!");
    setVariant("info");
  };

  return (
    <motion.div
      className="d-flex h-100"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div
        className="card shadow-lg panel-card w-100 d-flex flex-column border-0"
        style={{ backgroundColor: "#ffffff", borderRadius: '15px' }}
      >
        <div className="card-header bg-warning text-white fw-bold py-3"
          style={{ borderTopLeftRadius: '15px', borderTopRightRadius: '15px' }}
        >
          <h5 className="mb-0">
            <FaUpload className="me-2" /> Bulk User Registration (Excel Upload)
          </h5>
        </div>
        <div className="card-body d-flex flex-column flex-grow-1 p-4">

          <Button
            variant="info"
            size="sm"
            className="mb-3 d-flex align-items-center justify-content-center"
            onClick={handleDownloadTemplate}
            style={{ width: 'fit-content', minWidth: '220px' }}
          >
            <FaDownload className="me-2" /> Download Standard Excel Template
          </Button>

          <Button
            variant="outline-secondary"
            size="sm"
            className="mb-3 ms-2 d-flex align-items-center justify-content-center"
            onClick={() => setShowFormatInfo(!showFormatInfo)}
            style={{ width: 'fit-content', minWidth: '180px' }}
          >
            {showFormatInfo ? 'Hide Format Details' : 'Show Format Details'}
          </Button>

          {showFormatInfo && (
            <div className="alert alert-info py-2 px-3 mb-3 small" role="alert">
              **Excel Template Information:**
              <br />
              Upload an **Excel file (.xlsx or .xls)** to register multiple users.
              <br />
              **Required Columns:** `Employee Id`, `Employee Name`, `Date of Birth` (e.g., `24-Aug-2002`), and at least one of `Personal email` or `Professional Email`.
              <br />
              *Password will be auto-generated by the **backend** from 'Date of Birth' (e.g., `Aug@2002`).*
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="excelFile" className="form-label fw-bold text-muted">Select Excel File:</label>
            <input
              type="file"
              id="excelFile"
              className="form-control form-control-lg"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              disabled={loading}
            />
          </div>

          {message && (
            <Alert variant={variant} className="mt-3">
              {message}
            </Alert>
          )}

          <Button
            variant="warning"
            className="w-100 py-3 fs-5 fw-bold mt-auto"
            onClick={handleUpload}
            disabled={!file || loading}
          >
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Uploading...
              </>
            ) : (
              <>
                <FaUpload className="me-2" /> Upload and Register Users
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default BulkUserRegistration;
