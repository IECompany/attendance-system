// src/SuperAdminPanel.jsx - UPDATED for Multi-Tenancy
import React, { useState, useEffect, useCallback } from "react"; // Added useCallback
import {
  FaDownload,
  FaMapMarkedAlt,
  FaUserPlus,
  FaClipboardList,
  FaBuilding,
  FaBriefcase,
  FaFileCsv,
  FaUsers,
  FaUpload,
  FaChartLine,
  FaMoneyBillAlt
} from "react-icons/fa";
import { motion } from "framer-motion";
import { Alert, Nav, Spinner, Button } from "react-bootstrap"; // Added Spinner, Button
import AdminVisitsTable from "../components/AdminVisitsTable";
import BulkUserRegistration from '../components/BulkUserRegistration';
import UserManagement from '../components/UserManagement';
import EmployeeSalaryInformation from '../components/EmployeeSalaryInformation';

import { useAuth } from '../authContext'; // <-- NEW: Import useAuth context

const SuperAdminPanel = () => {
  const { user, token, logout } = useAuth(); // <-- NEW: Get user, token, and logout from AuthContext

  // State to manage the active section displayed in the main content area
  const [activeSection, setActiveSection] = useState('dashboard'); // Default to a dashboard or first section

  // --- Existing States for Data and Forms ---
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false); // For initial data fetch
  const [error, setError] = useState(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [newOfficeName, setNewOfficeName] = useState("");
  const [newOfficeState, setNewOfficeState] = useState("");
  const [officeListUpdated, setOfficeListUpdated] = useState(false);
  const [newOccupationName, setNewOccupationName] = useState("");
  const [occupationListUpdated, setOccupationListUpdated] = useState(false);
  const [downloadState, setDownloadState] = useState("");
  const [downloadOffice, setDownloadOffice] = useState("");
  const [downloadDate, setDownloadDate] = useState("");
  const [downloadStatus, setDownloadStatus] = useState("");
  const [downloadLoading, setDownloadLoading] = useState(false); // New: For download loading state

  // --- Lists for Dropdowns ---
  // Assuming these lists will be fetched from the backend now, filtered by companyId
  const [availableStates, setAvailableStates] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableOffices, setAvailableOffices] = useState([]);
  const statusList = ["active", "completed"]; // Static status options

  // --- NEW: Helper to get authenticated headers ---
  const getAuthHeaders = useCallback(() => {
    if (!token || !user || !user.companyId) {
      // If token or companyId is missing, it means user is not properly authenticated
      // or session is invalid. Redirect to login.
      alert("Session expired or invalid. Please log in again.");
      logout(); // Use logout function from context
      return null;
    }
    return {
      'Authorization': `Bearer ${token}`,
      'X-Company-ID': user.companyId
    };
  }, [token, user, logout]); // Dependencies for useCallback

  // --- Initial Authentication Check and Data Fetching for Dropdowns ---
  useEffect(() => {
    // Ensure user is authenticated before attempting any API calls
    if (!user || !token || !user.companyId) {
      logout(); // Redirect to login if not authenticated
      return;
    }

    const headers = getAuthHeaders();
    if (!headers) return; // Exit if headers are not available

    // Fetch unique states for dropdowns
    const fetchStates = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/states", { headers }); // <-- NEW: Pass headers
        const data = await res.json();
        if (res.ok) {
          setAvailableStates(data.sort()); // Assuming backend returns array of names
        } else {
          console.error("❌ Failed to fetch states:", data.message || "Unknown error");
        }
      } catch (err) {
        console.error("❌ Error fetching states:", err);
      }
    };

    // Fetch unique check-in dates for dropdowns
    const fetchUniqueDates = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/admin/unique-checkin-dates", { headers }); // <-- NEW: Pass headers
        const data = await res.json();
        if (res.ok) {
          setAvailableDates(data.sort().reverse());
        } else {
          console.error("❌ Failed to fetch unique dates:", data.message || "Unknown error");
        }
      } catch (err) {
        console.error("❌ Error fetching unique dates:", err);
      }
    };
    
    // Fetch offices for dropdowns
    const fetchOffices = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/offices", { headers }); // <-- NEW: Pass headers
        const data = await res.json();
        if (res.ok) {
          setAvailableOffices(data.sort((a, b) => a.name.localeCompare(b.name)));
        } else {
          console.error("❌ Failed to fetch offices:", data.message || "Unknown error");
        }
      } catch (err) {
        console.error("❌ Error fetching offices:", err);
      }
    };

    fetchStates();
    fetchUniqueDates();
    fetchOffices();
  }, [user, token, logout, officeListUpdated, getAuthHeaders]); // Added dependencies

  // --- Fetch Visits for AdminVisitsTable (only if 'visitsHistory' section is active) ---
  useEffect(() => {
    if (activeSection === 'visitsHistory' || activeSection === 'dashboard') { // Also fetch for dashboard summary
      const fetchAllVisits = async () => {
        const headers = getAuthHeaders();
        if (!headers) return;

        setLoading(true);
        setError(null);
        try {
          const response = await fetch(`http://localhost:5001/api/admin/visits`, { headers }); // <-- NEW: Pass headers
          const contentType = response.headers.get("content-type");
          if (!response.ok || (contentType && !contentType.includes("application/json"))) {
            const errorText = await response.text();
            console.error("Server Response Error:", errorText);
            throw new Error(`Failed to fetch all admin visits. Server responded with: ${errorText.substring(0, 150)}...`);
          }
          const data = await response.json();
          setVisits(data);
        } catch (err) {
          console.error("Error fetching all admin visits for table:", err);
          setError(err.message || "Could not fetch admin visit data.");
        } finally {
          setLoading(false);
        }
      };
      fetchAllVisits();
    }
  }, [activeSection, officeListUpdated, occupationListUpdated, user, token, getAuthHeaders]); // Added dependencies

  // --- Download Handlers (UPDATED to use fetch with headers) ---
  const downloadCsv = async (url, filename) => {
    setDownloadLoading(true);
    setError(null);
    const headers = getAuthHeaders();
    if (!headers) {
        setDownloadLoading(false);
        return;
    }

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: headers,
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(errorData || `Failed to download CSV: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
        alert("CSV downloaded successfully!");
    } catch (err) {
        console.error("Error during CSV download:", err);
        alert(`Failed to download CSV: ${err.message}`);
    } finally {
        setDownloadLoading(false);
    }
  };

  const handleDownloadEntireDataset = () => { downloadCsv("http://localhost:5001/api/admin/download-submissions", "all_submissions.csv"); }; // Corrected endpoint
  const handleDownloadStatewiseDataset = () => { if (!downloadState) { alert("Please select a State."); return; } const query = new URLSearchParams({ state: downloadState }).toString(); downloadCsv(`http://localhost:5001/api/admin/download-submissions?${query}`, `submissions_state_${downloadState}.csv`); }; // Corrected endpoint
  const handleDownloadOfficewiseDataset = () => { if (!downloadOffice) { alert("Please select an Office."); return; } const query = new URLSearchParams({ officeId: downloadOffice }).toString(); downloadCsv(`http://localhost:5001/api/admin/download-submissions?${query}`, `submissions_office_${downloadOffice}.csv`); }; // Corrected endpoint
  const handleDownloadDatewiseDataset = () => { if (!downloadDate) { alert("Please select a Date."); return; } const query = new URLSearchParams({ date: downloadDate }).toString(); downloadCsv(`http://localhost:5001/api/admin/download-submissions?${query}`, `submissions_date_${downloadDate}.csv`); }; // Corrected endpoint
  const handleDownloadStatuswiseDataset = () => { if (!downloadStatus) { alert("Please select a Status (Active/Completed)."); return; } const query = new URLSearchParams({ status: downloadStatus }).toString(); downloadCsv(`http://localhost:5001/api/admin/download-submissions?${query}`, `submissions_status_${downloadStatus}.csv`); }; // Corrected endpoint

  // --- Admin Registration Handler (for company-specific admins) ---
  const handleAdminRegister = async (e) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) { alert("Please enter email and password."); return; }

    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const res = await fetch("http://localhost:5001/api/admin/register", { // Assuming this route creates an admin within the current company
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': headers.Authorization,
          'X-Company-ID': headers['X-Company-ID']
        },
        body: JSON.stringify({ email: adminEmail, password: adminPassword, companyId: user.companyId }), // Pass companyId explicitly
      });
      const data = await res.json();
      if (res.ok) { alert("✅ Admin created successfully."); setAdminEmail(""); setAdminPassword(""); } else { alert(`❌ ${data.message}`); }
    } catch (err) { console.error("❌ Error creating admin:", err); alert("Server error."); }
  };

  // --- Handle Add New Office/DCCB ---
  const handleAddOffice = async (e) => {
    e.preventDefault();
    if (!newOfficeName.trim() || !newOfficeState) { alert("Please enter both Office Name and select a State."); return; }

    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const res = await fetch("http://localhost:5001/api/offices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': headers.Authorization,
          'X-Company-ID': headers['X-Company-ID']
        },
        body: JSON.stringify({ name: newOfficeName, state: newOfficeState }),
      });
      const data = await res.json();
      if (res.ok) { alert(`✅ Office "${newOfficeName}" added successfully for ${newOfficeState}.`); setNewOfficeName(""); setNewOfficeState(""); setOfficeListUpdated((prev) => !prev); } else { alert(`❌ Failed to add office: ${data.message}`); }
    } catch (err) { console.error("❌ Error adding office:", err); alert("Server error while adding office."); }
  };

  // Handle Add New Occupation
  const handleAddOccupation = async (e) => {
    e.preventDefault();
    if (!newOccupationName.trim()) { alert("Please enter an Occupation Name."); return; }

    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const res = await fetch("http://localhost:5001/api/occupations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': headers.Authorization,
          'X-Company-ID': headers['X-Company-ID']
        },
        body: JSON.stringify({ name: newOccupationName }),
      });
      const data = await res.json();
      if (res.ok) { alert(`✅ Occupation "${newOccupationName}" added successfully.`); setNewOccupationName(""); setOccupationListUpdated((prev) => !prev); } else { alert(`❌ Failed to add occupation: ${data.message}`); }
    } catch (err) { console.error("❌ Error adding occupation:", err); alert("Server error while adding occupation."); }
  };

  // Helper function to render the active content based on activeSection state
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="card shadow-sm panel-card h-100 p-4"
            style={{ backgroundColor: "#e7f0ff" }}
          >
            <h3>Welcome to your Super Admin Dashboard!</h3>
            <p>Use the sidebar to navigate through various administrative functions.</p>
            <hr />
            <div className="row g-3">
                <div className="col-md-6 col-lg-4">
                    <div className="card text-center bg-primary text-white p-3">
                        <h5>Total Visits</h5>
                        <h4>{visits.length > 0 ? visits.length : '...'}</h4>
                        <p className="small">Fetched from ERP Visits History</p>
                    </div>
                </div>
            </div>
          </motion.div>
        );
      case 'downloadReports':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="card shadow-sm panel-card h-100 d-flex flex-column"
            style={{ backgroundColor: "#e7f0ff" }}
          >
            <div className="card-header d-flex justify-content-between align-items-center bg-info text-white fw-bold">
              <span><FaFileCsv className="me-2" /> Download Data Reports</span>
            </div>
            <div className="card-body d-flex flex-column flex-grow-1">
              <h5 className="mb-3 text-info">General Reports:</h5>
              <Button className="btn btn-primary w-100 mb-4 py-2 fs-5" onClick={handleDownloadEntireDataset} disabled={downloadLoading}>
                {downloadLoading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" /> : <FaDownload className="me-2" />}
                {downloadLoading ? 'Downloading...' : 'Download All Data'}
              </Button>
              <h5 className="mb-3 text-info border-top pt-3 mt-3">Specific Reports:</h5>
              <div className="row g-3">
                <div className="col-md-6 col-sm-12">
                  <label htmlFor="downloadState" className="form-label fw-bold mb-1">By State:</label>
                  <select id="downloadState" className="form-select mb-2" value={downloadState} onChange={(e) => setDownloadState(e.target.value)}>
                    <option value="">Select State</option>
                    {availableStates.map((s) => (<option key={s} value={s}>{s}</option>))}
                  </select>
                  <Button className="btn btn-secondary btn-sm w-100" onClick={handleDownloadStatewiseDataset} disabled={downloadLoading}>
                    {downloadLoading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : <FaDownload className="me-1" />} Download
                  </Button>
                </div>
                <div className="col-md-6 col-sm-12">
                  <label htmlFor="downloadOffice" className="form-label fw-bold mb-1">By Office:</label>
                  <select id="downloadOffice" className="form-select mb-2" value={downloadOffice} onChange={(e) => setDownloadOffice(e.target.value)}>
                    <option value="">Select Office</option>
                    {availableOffices.map((office) => (<option key={office._id} value={office._id}>{office.name} ({office.state})</option>))}
                  </select>
                  <Button className="btn btn-secondary btn-sm w-100" onClick={handleDownloadOfficewiseDataset} disabled={downloadLoading}>
                    {downloadLoading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : <FaDownload className="me-1" />} Download
                  </Button>
                </div>
                <div className="col-md-6 col-sm-12">
                  <label htmlFor="downloadDate" className="form-label fw-bold mb-1">By Date:</label>
                  <select id="downloadDate" className="form-select mb-2" value={downloadDate} onChange={(e) => setDownloadDate(e.target.value)}>
                    <option value="">Select Date</option>
                    {availableDates.map((d) => (<option key={d} value={d}>{d}</option>))}
                  </select>
                  <Button className="btn btn-secondary btn-sm w-100" onClick={handleDownloadDatewiseDataset} disabled={downloadLoading}>
                    {downloadLoading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : <FaDownload className="me-1" />} Download
                  </Button>
                </div>
                <div className="col-md-6 col-sm-12">
                  <label htmlFor="downloadStatus" className="form-label fw-bold mb-1">By Status:</label>
                  <select id="downloadStatus" className="form-select mb-2" value={downloadStatus} onChange={(e) => setDownloadStatus(e.target.value)}>
                    <option value="">Select Status</option>
                    {statusList.map((s) => (<option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>))}
                  </select>
                  <Button className="btn btn-secondary btn-sm w-100" onClick={handleDownloadStatuswiseDataset} disabled={downloadLoading}>
                    {downloadLoading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : <FaDownload className="me-1" />} Download
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 'addAdmin':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="card shadow-sm panel-card h-100 d-flex flex-column"
            style={{ backgroundColor: "#e7f0ff" }}
          >
            <div className="card-header bg-primary text-white fw-bold">
              <FaUserPlus className="me-2" /> Add New Admin
            </div>
            <div className="card-body d-flex flex-column flex-grow-1">
              <form onSubmit={handleAdminRegister} className="d-flex flex-column flex-grow-1">
                <input type="email" className="form-control mb-3" placeholder="Email Address" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
                <input type="password" className="form-control mb-4" placeholder="Password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required />
                <Button type="submit" className="btn btn-primary w-100 py-2 fs-5 mt-auto">
                  Register Admin
                </Button>
              </form>
            </div>
          </motion.div>
        );
      case 'bulkUserRegistration':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-100"
          >
            <BulkUserRegistration />
          </motion.div>
        );
      case 'manageOffices':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="card shadow-sm panel-card h-100 d-flex flex-column"
            style={{ backgroundColor: "#e7f0ff" }}
          >
            <div className="card-header bg-success text-white fw-bold">
              <FaBuilding className="me-2" /> Manage Offices / DCCBs
            </div>
            <div className="card-body d-flex flex-column flex-grow-1">
              <form onSubmit={handleAddOffice} className="d-flex flex-column flex-grow-1">
                <input type="text" className="form-control mb-3" placeholder="Enter New Office/DCCB Name" value={newOfficeName} onChange={(e) => setNewOfficeName(e.target.value)} required />
                <select className="form-select mb-4" value={newOfficeState} onChange={(e) => setNewOfficeState(e.target.value)} required>
                  <option value="">Select State for Office</option>
                  {availableStates.map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
                <Button type="submit" className="btn btn-success w-100 py-2 fs-5 mt-auto">
                  Add Office / DCCB
                </Button>
              </form>
            </div>
          </motion.div>
        );
      case 'manageOccupations':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="card shadow-sm panel-card h-100 d-flex flex-column"
            style={{ backgroundColor: "#e7f0ff" }}
          >
            <div className="card-header bg-info text-white fw-bold">
              <FaBriefcase className="me-2" /> Manage Occupations
            </div>
            <div className="card-body d-flex flex-column flex-grow-1">
              <form onSubmit={handleAddOccupation} className="d-flex flex-column flex-grow-1">
                <input type="text" className="form-control mb-4" placeholder="Enter New Occupation Name" value={newOccupationName} onChange={(e) => setNewOccupationName(e.target.value)} required />
                <Button type="submit" className="btn btn-info w-100 py-2 fs-5 mt-auto">
                  Add Occupation
                </Button>
              </form>
            </div>
          </motion.div>
        );
      case 'userManagement':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-100"
          >
            <UserManagement />
          </motion.div>
        );
      case 'visitsHistory':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="card shadow-sm panel-card h-100 w-100"
            style={{ backgroundColor: "#e7f0ff" }}
          >
            <div className="card-header bg-primary text-white fw-bold">
              <FaClipboardList className="me-2" /> All ERP Visits History
            </div>
            <div className="card-body">
              <AdminVisitsTable visits={visits} loading={loading} error={error} />
            </div>
          </motion.div>
        );
      case 'employeeSalaryInformation':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-100 w-100"
          >
            <EmployeeSalaryInformation />
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#e3f2fd",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header className="py-3 text-center text-white shadow-sm" style={{ backgroundColor: "#0d6efd" }}>
        <h2><FaMapMarkedAlt className="me-2" /> Super Admin Panel</h2>
      </header>

      <div className="d-flex flex-grow-1">
        {/* Sidebar */}
        <nav
          className="bg-dark text-white p-3 shadow-lg"
          style={{
            width: "250px",
            flexShrink: 0,
            overflowY: "auto",
            minHeight: "calc(100vh - 70px)",
          }}
        >
          <h5 className="mb-4 text-center">Navigation</h5>
          <Nav className="flex-column">
            <Nav.Link
              href="#"
              className={`text-white py-2 ${activeSection === 'dashboard' ? 'active-sidebar-link' : ''}`}
              onClick={() => setActiveSection('dashboard')}
            >
              <FaChartLine className="me-2" /> Dashboard
            </Nav.Link>
            <Nav.Link
              href="#"
              className={`text-white py-2 ${activeSection === 'downloadReports' ? 'active-sidebar-link' : ''}`}
              onClick={() => setActiveSection('downloadReports')}
            >
              <FaFileCsv className="me-2" /> Download Reports
            </Nav.Link>
            <Nav.Link
              href="#"
              className={`text-white py-2 ${activeSection === 'userManagement' ? 'active-sidebar-link' : ''}`}
              onClick={() => setActiveSection('userManagement')}
            >
              <FaUsers className="me-2" /> Manage Users
            </Nav.Link>
            <Nav.Link
              href="#"
              className={`text-white py-2 ${activeSection === 'bulkUserRegistration' ? 'active-sidebar-link' : ''}`}
              onClick={() => setActiveSection('bulkUserRegistration')}
            >
              <FaUpload className="me-2" /> Bulk User Reg.
            </Nav.Link>
            <Nav.Link
              href="#"
              className={`text-white py-2 ${activeSection === 'employeeSalaryInformation' ? 'active-sidebar-link' : ''}`}
              onClick={() => setActiveSection('employeeSalaryInformation')}
            >
              <FaMoneyBillAlt className="me-2" /> Employee Salary Info
            </Nav.Link>
            <Nav.Link
              href="#"
              className={`text-white py-2 ${activeSection === 'addAdmin' ? 'active-sidebar-link' : ''}`}
              onClick={() => setActiveSection('addAdmin')}
            >
              <FaUserPlus className="me-2" /> Add Admin
            </Nav.Link>
            <Nav.Link
              href="#"
              className={`text-white py-2 ${activeSection === 'manageOffices' ? 'active-sidebar-link' : ''}`}
              onClick={() => setActiveSection('manageOffices')}
            >
              <FaBuilding className="me-2" /> Manage Offices
            </Nav.Link>
            <Nav.Link
              href="#"
              className={`text-white py-2 ${activeSection === 'manageOccupations' ? 'active-sidebar-link' : ''}`}
              onClick={() => setActiveSection('manageOccupations')}
            >
              <FaBriefcase className="me-2" /> Manage Occupations
            </Nav.Link>
            <Nav.Link
              href="#"
              className={`text-white py-2 ${activeSection === 'visitsHistory' ? 'active-sidebar-link' : ''}`}
              onClick={() => setActiveSection('visitsHistory')}
            >
              <FaClipboardList className="me-2" /> Visits History
            </Nav.Link>
          </Nav>
        </nav>

        {/* Main Content Area */}
        <main className="flex-grow-1 p-4" style={{ overflowY: "auto" }}>
          {renderContent()}
        </main>
      </div>

      <footer className="text-white text-center py-3 shadow-lg" style={{ backgroundColor: "#0d6efd" }}>
        <small>&copy; {new Date().getFullYear()} Nectar Infotel. All rights reserved.</small>
      </footer>

      <style>{`
        .panel-card {
          border-radius: 1rem;
          transition: transform 0.3s ease;
        }
        .active-sidebar-link {
          background-color: #007bff !important;
          border-radius: 0.5rem;
          font-weight: bold;
        }
        .active-sidebar-link:hover {
            background-color: #007bff !important;
        }
        .nav-link:hover {
            background-color: #343a40 !important;
            border-radius: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default SuperAdminPanel;
