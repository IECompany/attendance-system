import React, { useState, useEffect, useCallback } from "react";
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
  FaMoneyBillAlt,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { Alert, Nav, Spinner, Button } from "react-bootstrap";
import AdminVisitsTable from "../components/AdminVisitsTable";
import BulkUserRegistration from '../components/BulkUserRegistration';
import UserManagement from '../components/UserManagement';
import EmployeeSalaryInformation from '../components/EmployeeSalaryInformation';

import { useAuth } from '../authContext';

// A simple SVG logo for the header
const SuperAdminLogo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    width="1em"
    height="1em"
    style={{ verticalAlign: 'text-bottom', marginRight: '0.5rem' }}
  >
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);


const SuperAdminPanel = () => {
  const { user, token, logout } = useAuth();

  const [activeSection, setActiveSection] = useState('dashboard');

  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);
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
  const [downloadLoading, setDownloadLoading] = useState(false);

  const [availableStates, setAvailableStates] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableOffices, setAvailableOffices] = useState([]);
  const statusList = ["active", "completed"];

  // --- NEW STATES FOR ADDING A NEW STATE ---
  const [showAddStateInput, setShowAddStateInput] = useState(false);
  const [tempNewStateName, setTempNewStateName] = useState("");

  const getAuthHeaders = useCallback(() => {
    if (!token || !user || !user.companyId) {
      alert("Session expired or invalid. Please log in again.");
      logout();
      return null;
    }
    return {
      'Authorization': `Bearer ${token}`,
      'X-Company-ID': user.companyId
    };
  }, [token, user, logout]);

  // --- NEW: Function to handle adding a new state ---
  const handleAddState = async (e) => {
    e.preventDefault();
    if (!tempNewStateName.trim()) {
      alert("Please enter a state name.");
      return;
    }

    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const res = await fetch("http://localhost:5001/api/states", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': headers.Authorization
        },
        body: JSON.stringify({ name: tempNewStateName }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ State "${tempNewStateName}" added successfully.`);
        setTempNewStateName("");
        setShowAddStateInput(false); // Switch back to dropdown
        // Trigger a re-fetch of states to update the dropdown
        fetchStates();
      } else {
        alert(`❌ Failed to add state: ${data.message}`);
      }
    } catch (err) {
      console.error("❌ Error adding state:", err);
      alert("Server error while adding state.");
    }
  };


  useEffect(() => {
    if (!user || !token || !user.companyId) {
      logout();
      return;
    }

    const headers = getAuthHeaders();
    if (!headers) return;

    // --- UPDATED: Moved state fetching into a separate function for reusability ---
    const fetchStates = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/states", { headers });
        const data = await res.json();
        if (res.ok) {
          setAvailableStates(data.sort());
        } else {
          console.error("❌ Failed to fetch states:", data.message || "Unknown error");
        }
      } catch (err) {
        console.error("❌ Error fetching states:", err);
      }
    };
    
    const fetchUniqueDates = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/admin/unique-checkin-dates", { headers });
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
    
    const fetchOffices = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/offices", { headers });
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
  }, [user, token, logout, officeListUpdated, getAuthHeaders]);

  useEffect(() => {
    if (activeSection === 'visitsHistory' || activeSection === 'dashboard') {
      const fetchAllVisits = async () => {
        const headers = getAuthHeaders();
        if (!headers) return;

        setLoading(true);
        setError(null);
        try {
          const response = await fetch(`http://localhost:5001/api/admin/visits`, { headers });
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
  }, [activeSection, officeListUpdated, occupationListUpdated, user, token, getAuthHeaders]);

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
      alert("✅ CSV downloaded successfully!");
    } catch (err) {
      console.error("Error during CSV download:", err);
      alert(`❌ Failed to download CSV: ${err.message}`);
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleDownloadEntireDataset = () => { downloadCsv("http://localhost:5001/api/admin/download-submissions", "all_submissions.csv"); };
  const handleDownloadStatewiseDataset = () => { if (!downloadState) { alert("Please select a State."); return; } const query = new URLSearchParams({ state: downloadState }).toString(); downloadCsv(`http://localhost:5001/api/admin/download-submissions?${query}`, `submissions_state_${downloadState}.csv`); };
  const handleDownloadOfficewiseDataset = () => { if (!downloadOffice) { alert("Please select an Office."); return; } const query = new URLSearchParams({ officeId: downloadOffice }).toString(); downloadCsv(`http://localhost:5001/api/admin/download-submissions?${query}`, `submissions_office_${downloadOffice}.csv`); };
  const handleDownloadDatewiseDataset = () => { if (!downloadDate) { alert("Please select a Date."); return; } const query = new URLSearchParams({ date: downloadDate }).toString(); downloadCsv(`http://localhost:5001/api/admin/download-submissions?${query}`, `submissions_date_${downloadDate}.csv`); };
  const handleDownloadStatuswiseDataset = () => { if (!downloadStatus) { alert("Please select a Status (Active/Completed)."); return; } const query = new URLSearchParams({ status: downloadStatus }).toString(); downloadCsv(`http://localhost:5001/api/admin/download-submissions?${query}`, `submissions_status_${downloadStatus}.csv`); };

  const handleAdminRegister = async (e) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) { alert("Please enter email and password."); return; }

    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const res = await fetch("http://localhost:5001/api/admin/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': headers.Authorization,
          'X-Company-ID': headers['X-Company-ID']
        },
        body: JSON.stringify({ email: adminEmail, password: adminPassword, companyId: user.companyId }),
      });
      const data = await res.json();
      if (res.ok) { alert("✅ Admin created successfully."); setAdminEmail(""); setAdminPassword(""); } else { alert(`❌ ${data.message}`); }
    } catch (err) { console.error("❌ Error creating admin:", err); alert("Server error."); }
  };

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

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="card shadow-sm panel-card h-100 p-0"
            style={{ backgroundColor: "var(--ui-light-tint)" }}
          >
            <div className="card-header fw-bold text-white welcome-header">
              <span className="me-2">🎉</span> Welcome, Super Admin!
            </div>
            <div className="card-body">
              <h3 className="mb-3" style={{ color: "var(--ui-orange)" }}>Your Dashboard Awaits!</h3>
              <p>Navigate through the powerful administrative tools using the sidebar.</p>
              <hr />
              <div className="row g-3">
                <div className="col-md-6 col-lg-4">
                  <div className="card text-center text-white p-3 border-0" style={{ backgroundColor: "var(--ui-turquoise)" }}>
                    <h5>Overall Total Attandance</h5>
                    <h4 className="fw-bold">{visits.length > 0 ? visits.length : '...'}</h4>
                    <p className="small">Fetched from Email Attandance History</p>
                  </div>
                </div>
              </div>
              <div className="ad-container mt-4 p-3 border rounded">
                <p className="text-muted text-center mb-0">Google Ad Space</p>
                {/* Google AdSense code will go here */}
                {/* Add placeholder for AdSense responsive ad unit here. */}
                <div className="ad-slot" style={{ height: '250px', backgroundColor: '#e9ecef' }}>
                  {/* Google Ad Placeholder 1 */}
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
            style={{ backgroundColor: "var(--ui-light-tint)" }}
          >
            <div className="card-header d-flex justify-content-between align-items-center fw-bold" style={{ backgroundColor: "var(--ui-turquoise)", color: "white" }}>
              <span><FaFileCsv className="me-2" /> Download Data Reports</span>
            </div>
            <div className="card-body d-flex flex-column flex-grow-1">
              <h5 className="mb-3" style={{ color: "var(--ui-orange)" }}>General Reports:</h5>
              <Button className="w-100 mb-4 py-2 fs-5" onClick={handleDownloadEntireDataset} disabled={downloadLoading} style={{ backgroundColor: "var(--ui-turquoise)", border: "none" }}>
                {downloadLoading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" /> : <FaDownload className="me-2" />}
                {downloadLoading ? 'Downloading...' : 'Download All Data'}
              </Button>
              <h5 className="mb-3 pt-3 mt-3" style={{ color: "var(--ui-orange)", borderTop: "1px dashed #ccc" }}>Specific Reports:</h5>
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
            style={{ backgroundColor: "var(--ui-light-tint)" }}
          >
            <div className="card-header text-white fw-bold" style={{ backgroundColor: "var(--ui-turquoise)" }}>
              <FaUserPlus className="me-2" /> Add New Admin
            </div>
            <div className="card-body d-flex flex-column flex-grow-1">
              <form onSubmit={handleAdminRegister} className="d-flex flex-column flex-grow-1">
                <input type="email" className="form-control mb-3" placeholder="Email Address" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
                <input type="password" className="form-control mb-4" placeholder="Password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required />
                <Button type="submit" className="w-100 py-2 fs-5 mt-auto" style={{ backgroundColor: "var(--ui-orange)", border: "none" }}>
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
            style={{ backgroundColor: "var(--ui-light-tint)" }}
          >
            <div className="card-header text-white fw-bold" style={{ backgroundColor: "var(--ui-turquoise)" }}>
              <FaBuilding className="me-2" /> Manage Offices
            </div>
            <div className="card-body d-flex flex-column flex-grow-1">
              <form onSubmit={handleAddOffice} className="d-flex flex-column flex-grow-1">
                <input type="text" className="form-control mb-3" placeholder="Enter New Office/DCCB Name" value={newOfficeName} onChange={(e) => setNewOfficeName(e.target.value)} required />

                {/* --- NEW: Conditional rendering for state input/dropdown --- */}
                {showAddStateInput ? (
                  <div className="d-flex align-items-center mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter New State Name"
                      value={tempNewStateName}
                      onChange={(e) => setTempNewStateName(e.target.value)}
                      required
                    />
                    <Button onClick={handleAddState} variant="primary" className="ms-2 px-4" style={{ backgroundColor: "var(--ui-orange)", border: "none" }}>
                      Add
                    </Button>
                    <Button onClick={() => setShowAddStateInput(false)} variant="secondary" className="ms-2">
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="d-flex align-items-center mb-3">
                    <select
                      className="form-select flex-grow-1"
                      value={newOfficeState}
                      onChange={(e) => setNewOfficeState(e.target.value)}
                      required
                    >
                      <option value="">Select State for Office</option>
                      {availableStates.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <Button onClick={() => setShowAddStateInput(true)} variant="link" className="ms-2 text-decoration-none" style={{ color: "var(--ui-turquoise)" }}>
                      Add New State?
                    </Button>
                  </div>
                )}
                
                <Button type="submit" className="w-100 py-2 fs-5 mt-auto" style={{ backgroundColor: "var(--ui-orange)", border: "none" }}>
                  Add Office
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
            style={{ backgroundColor: "var(--ui-light-tint)" }}
          >
            <div className="card-header text-white fw-bold" style={{ backgroundColor: "var(--ui-turquoise)" }}>
              <FaBriefcase className="me-2" /> Manage Occupations
            </div>
            <div className="card-body d-flex flex-column flex-grow-1">
              <form onSubmit={handleAddOccupation} className="d-flex flex-column flex-grow-1">
                <input type="text" className="form-control mb-4" placeholder="Enter New Occupation Name" value={newOccupationName} onChange={(e) => setNewOccupationName(e.target.value)} required />
                <Button type="submit" className="w-100 py-2 fs-5 mt-auto" style={{ backgroundColor: "var(--ui-orange)", border: "none" }}>
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
            style={{ backgroundColor: "var(--ui-light-tint)" }}
          >
            <div className="card-header text-white fw-bold" style={{ backgroundColor: "var(--ui-turquoise)" }}>
              <FaClipboardList className="me-2" /> All Employee Attendance History
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
      className="main-container"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header className="py-3 text-center text-white shadow-sm admin-header">
        <h2 style={{ color: "var(--ui-orange)", fontWeight: 700, fontSize: '1.75rem' }}>
          <SuperAdminLogo /> AI-HRMS Super Admin Panel
        </h2>
      </header>

      <div className="d-flex flex-grow-1">
        <nav
          className="p-3 shadow-lg sidebar-nav"
          style={{
            width: "250px",
            flexShrink: 0,
            overflowY: "auto",
            minHeight: "calc(100vh - 70px)",
          }}
        >
          <h5 className="mb-4 text-center text-white">Navigation</h5>
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
              <FaClipboardList className="me-2" /> All Employee Attandance History
            </Nav.Link>
          </Nav>
          <div className="ad-container mt-4 p-2 border rounded">
            <p className="text-muted text-center mb-0">Google Ad Space</p>
            {/* Google AdSense code will go here */}
            {/* Add placeholder for a smaller, square ad unit here */}
            <div className="ad-slot" style={{ height: '100px', backgroundColor: '#e9ecef' }}>
              {/* Google Ad Placeholder 2 */}
            </div>
          </div>
        </nav>

        <main className="flex-grow-1 p-4" style={{ overflowY: "auto" }}>
          {renderContent()}
        </main>
      </div>

      <footer className="text-white text-center py-3 shadow-lg" style={{ backgroundColor: "var(--ui-turquoise)" }}>
        <small>© {new Date().getFullYear()} AI-HRMS. All rights reserved.</small>
      </footer>

      <style>{`
        :root {
          --ui-orange: #FF8F00;
          --ui-turquoise: #00796B;
          --ui-dark-turquoise: #004d40;
          --ui-dark-turquoise-tone: #003630; /* A new darker tone for the sidebar */
          --ui-white: #FAFAFA;
          --ui-light-bg: #e0f2f1; /* A light tint of turquoise for the background */
          --ui-light-tint: #b2dfdb; /* A slightly darker tint for cards */
          --ui-dark: #333;
          --ui-gray: #6c757d;
          --box-shadow-light: 0 4px 12px rgba(0,0,0,0.08);
          --transition-speed: 0.3s;
        }

        .main-container {
          background-color: var(--ui-light-bg);
          background-image: url("data:image/svg+xml,%3Csvg width='42' height='44' viewBox='0 0 42 44' xmlns='http://www.w3.org/2000/svg'%3E%3Cg id='Page-1' stroke='none' stroke-width='1' fill='none' fill-rule='evenodd'%3E%3Cg id='brick-wall' fill='%239e9e9e' fill-opacity='0.1'%3E%3Cpath d='M0,0 L0,44 L21,44 L21,0 L0,0 Z M21,0 L21,22 L42,22 L42,0 L21,0 Z M21,22 L21,44 L42,44 L42,22 L21,22 Z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }

        .admin-header {
          background-color: var(--ui-dark-turquoise) !important;
          background-image: url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23004d40' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M5 0h1L0 6V5zm1 5v1H5z'/%3E%3C/g%3E%3C/svg%3E") !important;
          background-repeat: repeat !important;
        }

        .sidebar-nav {
          background-color: var(--ui-dark-turquoise-tone);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--ui-white);
        }

        .sidebar-nav .nav-link {
          transition: background-color var(--transition-speed), color var(--transition-speed);
          border-radius: 8px;
        }

        .sidebar-nav .nav-link:hover, .sidebar-nav .active-sidebar-link {
          background-color: var(--ui-turquoise);
          color: var(--ui-white);
        }

        .panel-card {
          border-radius: 12px;
          border: none;
        }

        .panel-card .card-header {
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
          border-bottom: none;
        }

        .welcome-header {
          background-color: var(--ui-dark-turquoise);
          background-image: url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23004d40' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M5 0h1L0 6V5zm1 5v1H5z'/%3E%3C/g%3E%3C/svg%3E") !important;
          background-repeat: repeat !important;
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
          padding: 1.5rem;
          font-size: 1.5rem;
        }
        
        .ad-container {
          background-color: rgba(255, 255, 255, 0.5);
          border: 1px dashed #ccc !important;
          text-align: center;
          padding: 1rem;
        }

        .ad-slot {
          width: 100%;
          min-height: 100px; /* Or other specific height for your ad format */
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--ui-gray);
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default SuperAdminPanel;