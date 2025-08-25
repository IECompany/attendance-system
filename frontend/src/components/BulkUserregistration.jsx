import React, { useState, useCallback } from "react";
import { FaUpload, FaDownload, FaUserPlus } from "react-icons/fa";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import { Alert, Spinner, Button, Nav, Tabs, Tab, Form, Row, Col } from "react-bootstrap";
import { useAuth } from '../authContext';

const BulkUserRegistration = () => {
  const { user, token, logout } = useAuth();
  const [key, setKey] = useState('bulk'); // State for managing tabs

  // State for Bulk Upload
  const [file, setFile] = useState(null);
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkVariant, setBulkVariant] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showFormatInfo, setShowFormatInfo] = useState(false);

  // State for Single User Registration
  const [formData, setFormData] = useState({
    employeeId: "",
    name: "",
    dateOfBirth: "",
    personalEmail: "",
    professionalEmail: "",
    contactNo: "",
    currentCtc: "",
    salaryInHandPerMonth: "",
    payableAmount: "",
    pf: "",
    esi: "",
    totalPayableAmount: "",
    incentive: "",
    finalTotalCtc: "",
  });
  const [singleMessage, setSingleMessage] = useState("");
  const [singleVariant, setSingleVariant] = useState("");
  const [singleLoading, setSingleLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");

  // Helper to get authenticated headers
  const getAuthHeaders = useCallback((isMultipart = false) => {
    if (!token || !user || !user.companyId) {
      setBulkMessage("Session expired or invalid. Please log in again.");
      setBulkVariant("danger");
      logout();
      return null;
    }
    const headers = {
      'Authorization': `Bearer ${token}`,
      'X-Company-ID': user.companyId
    };
    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }, [token, user, logout]);

  // --- BULK UPLOAD HANDLERS ---
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setBulkMessage("");
    setBulkVariant("");
  };

  const handleBulkUpload = async () => {
    if (!file) {
      setBulkMessage("Please select an Excel file to upload.");
      setBulkVariant("warning");
      return;
    }

    const headers = getAuthHeaders(true); // isMultipart = true
    if (!headers) return;

    setBulkLoading(true);
    setBulkMessage("Uploading and processing file...");
    setBulkVariant("info");

    try {
      const formData = new FormData();
      formData.append("excelFile", file);

      const res = await fetch("http://localhost:5001/api/admin/bulk-register-users", {
        method: "POST",
        headers: {
          'Authorization': headers.Authorization,
          'X-Company-ID': headers['X-Company-ID']
        },
        body: formData,
      });

      const result = await res.json();

      if (res.ok) {
        setBulkMessage(`✅ Bulk registration complete! Registered: ${result.registeredCount}, Failed: ${result.failedCount}.`);
        setBulkVariant("success");
        setFile(null);
      } else {
        const errorDetails = result.missingHeaders ? `Missing headers: ${result.missingHeaders.join(', ')}` : result.details;
        const failedReason = result.failedUsers?.length > 0 ? `Failed details: ${result.failedUsers[0].reason}` : '';
        setBulkMessage(`❌ Bulk registration failed: ${result.message || "Unknown error"}. ${errorDetails || failedReason}`);
        setBulkVariant("danger");
      }
    } catch (err) {
      console.error("Error during file upload:", err);
      setBulkMessage(`❌ An error occurred: ${err.message}. Please check your network and try again.`);
      setBulkVariant("danger");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "Employee Id", "Employee Name", "Date of Birth",
      "Personal email", "Professional Email", "Contact no",
      "Current CTC", "Salary in hand per month", "Payable Amount",
      "PF", "ESI", "Total Payable Amount", "Incentive", "Total CTC"
    ];
    const sampleRow = [
      "EMP1001", "John Doe", "24/08/2002",
      "john.doe@gmail.com", "john.doe@company.com", "9876543210",
      500000, 45000, 20000,
      1800, 500, 37500, 3000, 540000
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users Template");
    XLSX.writeFile(wb, "bulk_upload_template.xlsx");
  
    setBulkMessage("Standard Excel template downloaded!");
    setBulkVariant("info");
  };

  // --- SINGLE USER HANDLERS ---
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    const headers = getAuthHeaders();
    if (!headers) return;

    setSingleMessage("");
    setSingleVariant("");
    setSingleLoading(true);
    setGeneratedPassword("");

    try {
      const res = await fetch("http://localhost:5001/api/admin/register-single-user", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (res.ok) {
        setSingleMessage(`✅ User '${result.user.name}' registered successfully!`);
        setSingleVariant("success");
        setGeneratedPassword(result.user.generatedPassword);
        // Clear form data
        setFormData({
          employeeId: "", name: "", dateOfBirth: "", personalEmail: "",
          professionalEmail: "", contactNo: "", currentCtc: "",
          salaryInHandPerMonth: "", payableAmount: "", pf: "",
          esi: "", totalPayableAmount: "", incentive: "", finalTotalCtc: "",
        });
      } else {
        setSingleMessage(`❌ Registration failed: ${result.message || "Unknown error"}.`);
        setSingleVariant("danger");
      }
    } catch (err) {
      console.error("Error during registration:", err);
      setSingleMessage(`❌ An error occurred: ${err.message}. Please check your network and try again.`);
      setSingleVariant("danger");
    } finally {
      setSingleLoading(false);
    }
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
            <FaUpload className="me-2" /> User Registration
          </h5>
        </div>
        <div className="card-body p-4">
          <Tabs
            id="controlled-tab-example"
            activeKey={key}
            onSelect={(k) => {
              setKey(k);
              // Reset messages and state when switching tabs
              setBulkMessage("");
              setSingleMessage("");
              setGeneratedPassword("");
            }}
            className="mb-3"
          >
            <Tab eventKey="bulk" title="Bulk Upload">
              <div className="d-flex flex-column h-100">
                <div className="d-flex align-items-center mb-3">
                  <Button
                    variant="info"
                    size="sm"
                    className="me-2 d-flex align-items-center"
                    onClick={handleDownloadTemplate}
                  >
                    <FaDownload className="me-2" /> Download Template
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setShowFormatInfo(!showFormatInfo)}
                  >
                    {showFormatInfo ? 'Hide Format Details' : 'Show Format Details'}
                  </Button>
                </div>

                {showFormatInfo && (
                  <div className="alert alert-info py-2 px-3 mb-3 small" role="alert">
                    **Excel Template Information:**
                    <br />
                    Upload an **Excel file (.xlsx or .xls)** to register multiple users.
                    <br />
                    **Required Columns:** `Employee Id`, `Employee Name`, `Date of Birth`, and at least one of `Personal email` or `Professional Email`.
                    <br />
                    **Date of Birth Format:** Please enter the date as **DD/MM/YYYY** (e.g., `24/08/2002`).
                    <br />
                    **Password:** The system will auto-generate the password as `lowercase(employeename)@MMYYYY`.
                  </div>
                )}

                <div className="mb-4">
                  <label htmlFor="excelFile" className="form-label fw-bold text-muted">Select Excel File:</label>
                  <input
                    type="file"
                    id="excelFile"
                    className="form-control"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    disabled={bulkLoading}
                  />
                </div>

                {bulkMessage && <Alert variant={bulkVariant} className="mt-3">{bulkMessage}</Alert>}

                <Button
                  variant="warning"
                  className="w-100 py-3 fs-5 fw-bold mt-auto"
                  onClick={handleBulkUpload}
                  disabled={!file || bulkLoading}
                >
                  {bulkLoading ? (
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
            </Tab>

            <Tab eventKey="single" title="Single User">
              <div className="d-flex flex-column h-100">
                <Form onSubmit={handleSingleSubmit} className="flex-grow-1">
                  <p className="text-muted small">
                    Fields with an asterisk (<span className="text-danger">*</span>) are required.
                  </p>
                  
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group controlId="employeeId">
                        <Form.Label>Employee ID <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="text" name="employeeId" value={formData.employeeId} onChange={handleFormChange} required />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="name">
                        <Form.Label>Employee Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="text" name="name" value={formData.name} onChange={handleFormChange} required />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group controlId="dateOfBirth">
                        <Form.Label>Date of Birth (DD/MM/YYYY) <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="text" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleFormChange} placeholder="e.g., 24/08/2002" required />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="personalEmail">
                        <Form.Label>Personal Email</Form.Label>
                        <Form.Control type="email" name="personalEmail" value={formData.personalEmail} onChange={handleFormChange} />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group controlId="professionalEmail">
                        <Form.Label>Professional Email <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="email" name="professionalEmail" value={formData.professionalEmail} onChange={handleFormChange} required />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="contactNo">
                        <Form.Label>Contact No</Form.Label>
                        <Form.Control type="text" name="contactNo" value={formData.contactNo} onChange={handleFormChange} />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <h6 className="mt-4 mb-3 text-primary">Salary Details</h6>
                  <Row className="mb-3">
                    <Col md={4}>
                      <Form.Group controlId="currentCtc">
                        <Form.Label>Current CTC</Form.Label>
                        <Form.Control type="number" name="currentCtc" value={formData.currentCtc} onChange={handleFormChange} />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group controlId="salaryInHandPerMonth">
                        <Form.Label>Salary in hand per month</Form.Label>
                        <Form.Control type="number" name="salaryInHandPerMonth" value={formData.salaryInHandPerMonth} onChange={handleFormChange} />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group controlId="payableAmount">
                        <Form.Label>Payable Amount</Form.Label>
                        <Form.Control type="number" name="payableAmount" value={formData.payableAmount} onChange={handleFormChange} />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={4}>
                      <Form.Group controlId="pf">
                        <Form.Label>PF</Form.Label>
                        <Form.Control type="number" name="pf" value={formData.pf} onChange={handleFormChange} />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group controlId="esi">
                        <Form.Label>ESI</Form.Label>
                        <Form.Control type="number" name="esi" value={formData.esi} onChange={handleFormChange} />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group controlId="totalPayableAmount">
                        <Form.Label>Total Payable Amount</Form.Label>
                        <Form.Control type="number" name="totalPayableAmount" value={formData.totalPayableAmount} onChange={handleFormChange} />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group controlId="incentive">
                        <Form.Label>Incentive</Form.Label>
                        <Form.Control type="number" name="incentive" value={formData.incentive} onChange={handleFormChange} />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="finalTotalCtc">
                        <Form.Label>Total CTC</Form.Label>
                        <Form.Control type="number" name="finalTotalCtc" value={formData.finalTotalCtc} onChange={handleFormChange} />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  {singleMessage && (
                    <Alert variant={singleVariant} className="mt-3">
                      {singleMessage}
                      {generatedPassword && (
                        <div className="mt-2 fw-bold">
                          Generated Password: <span className="text-decoration-underline">{generatedPassword}</span>
                        </div>
                      )}
                    </Alert>
                  )}

                  <Button
                    variant="warning"
                    className="w-100 py-3 fs-5 fw-bold mt-auto"
                    type="submit"
                    disabled={singleLoading}
                  >
                    {singleLoading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <FaUserPlus className="me-2" /> Register User
                      </>
                    )}
                  </Button>
                </Form>
              </div>
            </Tab>
          </Tabs>
        </div>
      </div>
    </motion.div>
  );
};

export default BulkUserRegistration;