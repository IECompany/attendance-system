import React, { useState, useEffect, useCallback } from "react";
import {
  FaDownload,
  FaUserPlus,
  FaClipboardList,
  FaBuilding,
  FaBriefcase,
  FaFileCsv,
  FaUsers,
  FaUpload,
  FaChartLine,
  FaMoneyBillAlt,
  FaBars, // NEW: Hamburger icon for mobile
} from "react-icons/fa";
import { motion } from "framer-motion";
import { 
  Alert, 
  Nav, 
  Spinner, 
  Button, 
  Offcanvas, // NEW: Offcanvas for mobile sidebar
  Row,       // NEW: Row for responsive layout
  Col        // NEW: Col for responsive layout
} from "react-bootstrap";
import AdminVisitsTable from "../components/AdminVisitsTable";
import BulkUserRegistration from "../components/BulkUserregistration";
import UserManagement from '../components/UserManagement';
import EmployeeSalaryInformation from '../components/EmployeeSalaryInformation';

import { useAuth } from '../authContext';

// Define API base URL using an environment variable with a fallback for local development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state

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

  // --- Core Data Fetching Logic (Retained from previous working code) ---

  const fetchStates = useCallback(async () => {
    const headers = getAuthHeaders();
    if (!headers) return;
    try {
      const res = await fetch(`${API_BASE_URL}/states`, { headers });
      const data = await res.json();
      if (res.ok) {
        setAvailableStates(data.sort());
      } else {
        console.error("❌ Failed to fetch states:", data.message || "Unknown error");
      }
    } catch (err) {
      console.error("❌ Error fetching states:", err);
    }
  }, [getAuthHeaders]);


  const handleAddState = async (e) => {
    e.preventDefault();
    if (!tempNewStateName.trim()) {
      alert("Please enter a state name.");
      return;
    }

    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const res = await fetch(`${API_BASE_URL}/states`, {
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
        setShowAddStateInput(false); 
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
    
    const fetchUniqueDates = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/unique-checkin-dates`, { headers });
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
        const res = await fetch(`${API_BASE_URL}/offices`, { headers });
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
  }, [user, token, logout, officeListUpdated, getAuthHeaders, fetchStates]);

  useEffect(() => {
    if (activeSection === 'visitsHistory' || activeSection === 'dashboard') {
      const fetchAllVisits = async () => {
        const headers = getAuthHeaders();
        if (!headers) return;

        setLoading(true);
        setError(null);
        try {
          const response = await fetch(`${API_BASE_URL}/admin/visits`, { headers });
          const contentType = response.headers.get("content-type");
          if (!response.ok || (contentType && !contentType.includes("application/json"))) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch all admin visits. Server responded with: ${errorText.substring(0, 150)}...`);
          }
          const data = await response.json();
          setVisits(data);
        } catch (err) {
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
      alert(`❌ Failed to download CSV: ${err.message}`);
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleDownloadEntireDataset = () => { downloadCsv(`${API_BASE_URL}/admin/download-submissions`, "all_submissions.csv"); };
  const handleDownloadStatewiseDataset = () => { if (!downloadState) { alert("Please select a State."); return; } const query = new URLSearchParams({ state: downloadState }).toString(); downloadCsv(`${API_BASE_URL}/admin/download-submissions?${query}`, `submissions_state_${downloadState}.csv`); };
  const handleDownloadOfficewiseDataset = () => { if (!downloadOffice) { alert("Please select an Office."); return; } const query = new URLSearchParams({ officeId: downloadOffice }).toString(); downloadCsv(`${API_BASE_URL}/admin/download-submissions?${query}`, `submissions_office_${downloadOffice}.csv`); };
  const handleDownloadDatewiseDataset = () => { if (!downloadDate) { alert("Please select a Date."); return; } const query = new URLSearchParams({ date: downloadDate }).toString(); downloadCsv(`${API_BASE_URL}/admin/download-submissions?${query}`, `submissions_date_${downloadDate}.csv`); };
  const handleDownloadStatuswiseDataset = () => { if (!downloadStatus) { alert("Please select a Status (Active/Completed)."); return; } const query = new URLSearchParams({ status: downloadStatus }).toString(); downloadCsv(`${API_BASE_URL}/admin/download-submissions?${query}`, `submissions_status_${downloadStatus}.csv`); };

  const handleAdminRegister = async (e) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) { alert("Please enter email and password."); return; }

    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const res = await fetch(`${API_BASE_URL}/admin/register`, {
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
    } catch (err) { alert("Server error."); }
  };

  const handleAddOffice = async (e) => {
    e.preventDefault();
    if (!newOfficeName.trim() || !newOfficeState) { alert("Please enter both Office Name and select a State."); return; }

    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const res = await fetch(`${API_BASE_URL}/offices`, {
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
    } catch (err) { alert("Server error while adding office."); }
  };

  const handleAddOccupation = async (e) => {
    e.preventDefault();
    if (!newOccupationName.trim()) { alert("Please enter an Occupation Name."); return; }

    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const res = await fetch(`${API_BASE_URL}/occupations`, {
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
    } catch (err) { alert("Server error while adding occupation."); }
  };
  
  // Helper function to handle section change and close sidebar on mobile
  const handleSectionChange = (section) => {
    setActiveSection(section);
    setIsSidebarOpen(false); 
  };

  const renderContent = () => {
    const defaultCardProps = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
        transition: { duration: 0.3 },
        className: "card shadow-sm panel-card h-100 w-100",
        style: { backgroundColor: "var(--ui-white)" }
    };

    switch (activeSection) {
      case 'dashboard':
        return (
          <motion.div {...defaultCardProps}>
            <div className="card-header fw-bold text-white welcome-header">
              <span className="me-2">🎉</span> Welcome, Super Admin!
            </div>
            <div className="card-body">
              <h3 className="mb-3" style={{ color: "var(--ui-blue-dark)" }}>Your Dashboard Awaits!</h3>
              <p>Navigate through the powerful administrative tools using the sidebar.</p>
              <hr />
              <Row className="g-3"> 
                <Col xs={12} md={6} lg={4}>
                  <div className="card text-center text-white p-3 border-0" style={{ backgroundColor: "var(--ui-blue-primary)" }}>
                    <h5>Overall Total Attendance</h5>
                    <h4 className="fw-bold">{visits.length > 0 ? visits.length : (loading ? <Spinner as="span" animation="border" size="sm" /> : '0')}</h4>
                    <p className="small mb-0">Fetched from Attendance History</p>
                  </div>
                </Col>
              </Row>
              <div className="ad-container mt-4 p-3 border rounded">
                <p className="text-muted text-center mb-0">Google Ad Space</p>
                <div className="ad-slot" style={{ height: '250px', backgroundColor: '#e9ecef' }}>
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 'downloadReports':
        return (
          <motion.div {...defaultCardProps} className="card shadow-sm panel-card h-100 d-flex flex-column">
            <div className="card-header d-flex justify-content-between align-items-center fw-bold text-white" style={{ backgroundColor: "var(--ui-blue-primary)" }}>
              <span><FaFileCsv className="me-2" /> Download Data Reports</span>
            </div>
            <div className="card-body d-flex flex-column flex-grow-1">
              <h5 className="mb-3" style={{ color: "var(--ui-blue-dark)" }}>General Reports:</h5>
              <Button className="w-100 mb-4 py-2 fs-5" onClick={handleDownloadEntireDataset} disabled={downloadLoading} style={{ backgroundColor: "var(--ui-blue-primary)", border: "none" }}>
                {downloadLoading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" /> : <FaDownload className="me-2" />}
                {downloadLoading ? 'Downloading...' : 'Download All Data'}
              </Button>
              <h5 className="mb-3 pt-3 mt-3" style={{ color: "var(--ui-blue-dark)", borderTop: "1px dashed #ccc" }}>Specific Reports:</h5>
              <Row className="g-3"> 
                <Col xs={12} md={6}>
                  <label htmlFor="downloadState" className="form-label fw-bold mb-1">By State:</label>
                  <select id="downloadState" className="form-select mb-2" value={downloadState} onChange={(e) => setDownloadState(e.target.value)}>
                    <option value="">Select State</option>
                    {availableStates.map((s) => (<option key={s} value={s}>{s}</option>))}
                  </select>
                  <Button className="btn btn-secondary btn-sm w-100" onClick={handleDownloadStatewiseDataset} disabled={downloadLoading}>
                    {downloadLoading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : <FaDownload className="me-1" />} Download
                  </Button>
                </Col>
                <Col xs={12} md={6}>
                  <label htmlFor="downloadOffice" className="form-label fw-bold mb-1">By Office:</label>
                  <select id="downloadOffice" className="form-select mb-2" value={downloadOffice} onChange={(e) => setDownloadOffice(e.target.value)}>
                    <option value="">Select Office</option>
                    {availableOffices.map((office) => (<option key={office._id} value={office._id}>{office.name} ({office.state})</option>))}
                  </select>
                  <Button className="btn btn-secondary btn-sm w-100" onClick={handleDownloadOfficewiseDataset} disabled={downloadLoading}>
                    {downloadLoading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : <FaDownload className="me-1" />} Download
                  </Button>
                </Col>
                <Col xs={12} md={6}>
                  <label htmlFor="downloadDate" className="form-label fw-bold mb-1">By Date:</label>
                  <select id="downloadDate" className="form-select mb-2" value={downloadDate} onChange={(e) => setDownloadDate(e.target.value)}>
                    <option value="">Select Date</option>
                    {availableDates.map((d) => (<option key={d} value={d}>{d}</option>))}
                  </select>
                  <Button className="btn btn-secondary btn-sm w-100" onClick={handleDownloadDatewiseDataset} disabled={downloadLoading}>
                    {downloadLoading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : <FaDownload className="me-1" />} Download
                  </Button>
                </Col>
                <Col xs={12} md={6}>
                  <label htmlFor="downloadStatus" className="form-label fw-bold mb-1">By Status:</label>
                  <select id="downloadStatus" className="form-select mb-2" value={downloadStatus} onChange={(e) => setDownloadStatus(e.target.value)}>
                    <option value="">Select Status</option>
                    {statusList.map((s) => (<option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>))}
                  </select>
                  <Button className="btn btn-secondary btn-sm w-100" onClick={handleDownloadStatuswiseDataset} disabled={downloadLoading}>
                    {downloadLoading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : <FaDownload className="me-1" />} Download
                  </Button>
                </Col>
              </Row>
            </div>
          </motion.div>
        );
      case 'addAdmin':
        return (
          <motion.div {...defaultCardProps} className="card shadow-sm panel-card h-100 d-flex flex-column">
            <div className="card-header text-white fw-bold" style={{ backgroundColor: "var(--ui-blue-primary)" }}>
              <FaUserPlus className="me-2" /> Add New Admin
            </div>
            <div className="card-body d-flex flex-column flex-grow-1">
              <form onSubmit={handleAdminRegister} className="d-flex flex-column flex-grow-1">
                <input type="email" className="form-control mb-3" placeholder="Email Address" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
                <input type="password" className="form-control mb-4" placeholder="Password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required />
                <Button type="submit" className="w-100 py-2 fs-5 mt-auto" style={{ backgroundColor: "var(--ui-blue-primary)", border: "none" }}>
                  Register Admin
                </Button>
              </form>
            </div>
          </motion.div>
        );
      case 'bulkUserRegistration':
        return (
          <motion.div {...defaultCardProps} className="h-100 p-3">
            <BulkUserRegistration />
          </motion.div>
        );
      case 'manageOffices':
        return (
          <motion.div {...defaultCardProps} className="card shadow-sm panel-card h-100 d-flex flex-column">
            <div className="card-header text-white fw-bold" style={{ backgroundColor: "var(--ui-blue-primary)" }}>
              <FaBuilding className="me-2" /> Manage Offices
            </div>
            <div className="card-body d-flex flex-column flex-grow-1">
              <form onSubmit={handleAddOffice} className="d-flex flex-column flex-grow-1">
                <input type="text" className="form-control mb-3" placeholder="Enter New Office/DCCB Name" value={newOfficeName} onChange={(e) => setNewOfficeName(e.target.value)} required />
                {showAddStateInput ? (
                  <div className="d-flex align-items-center mb-3 flex-wrap"> 
                    <input
                      type="text"
                      className="form-control me-2 flex-grow-1 mb-2 mb-sm-0"
                      placeholder="Enter New State Name"
                      value={tempNewStateName}
                      onChange={(e) => setTempNewStateName(e.target.value)}
                      required
                    />
                    <Button onClick={handleAddState} variant="primary" className="ms-auto me-2" style={{ backgroundColor: "var(--ui-blue-primary)", border: "none" }}>
                      Add
                    </Button>
                    <Button onClick={() => setShowAddStateInput(false)} variant="secondary">
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="d-flex align-items-center mb-3 flex-wrap"> 
                    <select
                      className="form-select flex-grow-1 me-2 mb-2 mb-sm-0"
                      value={newOfficeState}
                      onChange={(e) => setNewOfficeState(e.target.value)}
                      required
                    >
                      <option value="">Select State for Office</option>
                      {availableStates.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <Button onClick={() => setShowAddStateInput(true)} variant="link" className="text-decoration-none" style={{ color: "var(--ui-blue-primary)" }}>
                      Add New State?
                    </Button>
                  </div>
                )}
                
                <Button type="submit" className="w-100 py-2 fs-5 mt-auto" style={{ backgroundColor: "var(--ui-blue-primary)", border: "none" }}>
                  Add Office
                </Button>
              </form>
            </div>
          </motion.div>
        );
      case 'manageOccupations':
        return (
          <motion.div {...defaultCardProps} className="card shadow-sm panel-card h-100 d-flex flex-column">
            <div className="card-header text-white fw-bold" style={{ backgroundColor: "var(--ui-blue-primary)" }}>
              <FaBriefcase className="me-2" /> Manage Occupations
            </div>
            <div className="card-body d-flex flex-column flex-grow-1">
              <form onSubmit={handleAddOccupation} className="d-flex flex-column flex-grow-1">
                <input type="text" className="form-control mb-4" placeholder="Enter New Occupation Name" value={newOccupationName} onChange={(e) => setNewOccupationName(e.target.value)} required />
                <Button type="submit" className="w-100 py-2 fs-5 mt-auto" style={{ backgroundColor: "var(--ui-blue-primary)", border: "none" }}>
                  Add Occupation
                </Button>
              </form>
            </div>
          </motion.div>
        );
      case 'userManagement':
        return (
          <motion.div {...defaultCardProps} className="h-100 p-3">
            <UserManagement />
          </motion.div>
        );
      case 'visitsHistory':
        return (
          <motion.div {...defaultCardProps} className="card shadow-sm panel-card h-100 w-100">
            <div className="card-header text-white fw-bold" style={{ backgroundColor: "var(--ui-blue-primary)" }}>
              <FaClipboardList className="me-2" /> All Employee Attendance History
            </div>
            <div className="card-body p-0 table-responsive-scroll"> 
              <AdminVisitsTable visits={visits} loading={loading} error={error} />
            </div>
          </motion.div>
        );
      case 'employeeSalaryInformation':
        return (
          <motion.div {...defaultCardProps} className="h-100 w-100 p-3">
            <EmployeeSalaryInformation />
          </motion.div>
        );
      default:
        return null;
    }
  };
  
  // Component for the sidebar navigation (used in both desktop and Offcanvas)
  const SidebarContent = ({ onClose }) => (
    <>
      <h5 className="mb-4 text-center text-white">Navigation</h5>
      <Nav className="flex-column">
        {[
          { key: 'dashboard', icon: FaChartLine, label: 'Dashboard' },
          { key: 'downloadReports', icon: FaFileCsv, label: 'Download Reports' },
          { key: 'userManagement', icon: FaUsers, label: 'Manage Users' },
          { key: 'bulkUserRegistration', icon: FaUpload, label: 'Bulk User Reg.' },
          { key: 'employeeSalaryInformation', icon: FaMoneyBillAlt, label: 'Employee Salary Info' },
          { key: 'addAdmin', icon: FaUserPlus, label: 'Add Admin' },
          { key: 'manageOffices', icon: FaBuilding, label: 'Manage Offices' },
          { key: 'manageOccupations', icon: FaBriefcase, label: 'Manage Occupations' },
          { key: 'visitsHistory', icon: FaClipboardList, label: 'All Employee Attendance History' },
        ].map(({ key, icon: Icon, label }) => (
          <Nav.Link
            key={key}
            href="#"
            className={`text-white py-2 mb-1 ${activeSection === key ? 'active-sidebar-link' : ''}`}
            onClick={() => {
              handleSectionChange(key);
              if (onClose) onClose(); // Close Offcanvas after selection
            }}
          >
            <Icon className="me-2" /> {label}
          </Nav.Link>
        ))}
      </Nav>
      <div className="ad-container mt-4 p-2 border rounded">
        <p className="text-muted text-center mb-0 small text-white-50">Ad Space</p>
        <div className="ad-slot" style={{ height: '100px', backgroundColor: '#e9ecef' }}>
        </div>
      </div>
    </>
  );

  return (
    <div className="main-container" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Responsive Header with Hamburger Menu */}
      <header className="py-3 text-white shadow-sm admin-header d-flex align-items-center justify-content-between px-3 px-md-4">
        <Button
          variant="link"
          className="d-md-none p-0 text-white"
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open navigation menu"
        >
          <FaBars size={24} />
        </Button>
        
        <h2 className="m-0 text-center flex-grow-1" style={{ color: "var(--ui-white)", fontWeight: 700, fontSize: '1.75rem' }}>
          <SuperAdminLogo /> AI-HRMS Super Admin Panel
        </h2>
        
        {/* Spacer for alignment on mobile */}
        <div className="d-md-none" style={{ width: '24px' }} /> 
      </header>
      
      {/* Offcanvas for mobile sidebar */}
      <Offcanvas show={isSidebarOpen} onHide={() => setIsSidebarOpen(false)} placement="start" className="mobile-sidebar-nav">
        <Offcanvas.Header closeButton closeVariant="white">
          <Offcanvas.Title className="text-white fw-bold">
            <SuperAdminLogo /> Menu
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-3">
          <SidebarContent onClose={() => setIsSidebarOpen(false)} />
        </Offcanvas.Body>
      </Offcanvas>

      <div className="d-flex flex-grow-1">
        
        {/* Desktop Sidebar - hidden on mobile (d-none d-md-block) */}
        <nav
          className="p-3 shadow-lg sidebar-nav d-none d-md-block"
          style={{
            width: "250px",
            flexShrink: 0,
            overflowY: "auto",
            minHeight: "calc(100vh - 70px)",
          }}
        >
          <SidebarContent />
        </nav>

        <main className="flex-grow-1 p-3 p-md-4" style={{ overflowY: "auto" }}>
          {renderContent()}
        </main>
      </div>

      <footer className="text-white text-center py-3 shadow-lg" style={{ backgroundColor: "var(--ui-blue-dark)" }}>
        <small>© {new Date().getFullYear()} AI-HRMS. All rights reserved.</small>
      </footer>

      {/* -------------------------------------------------------------
        RESPONSIVE & STYLING CSS (MERGED FROM ALL USER INPUTS)
        -------------------------------------------------------------
      */}
      <style jsx="true">{`
        :root {
          /* --- Blue Monochromatic Palette --- */
          --ui-blue-primary: #2962FF; 
          --ui-blue-dark: #0D47A1;    
          --ui-blue-darker-tone: #083475; 
          --ui-blue-light-bg: #f0f5ff; 
          
          /* --- Neutral Colors --- */
          --ui-white: #FFFFFF;
          --ui-dark: #333;
          --ui-gray: #6c757d;

          /* --- UI Effects --- */
          --box-shadow-light: 0 4px 12px rgba(0,0,0,0.08);
          --transition-speed: 0.3s;
        }
        
        body {
            background-color: var(--ui-blue-light-bg);
            font-family: 'Poppins', sans-serif;
        }

        /* --- Main Container & Background --- */
        .main-container {
          background-color: var(--ui-blue-light-bg);
          /* Brick pattern from user input */
          background-image: url("data:image/svg+xml,%3Csvg width='42' height='44' viewBox='0 0 42 44' xmlns='http://www.w3.org/2000/svg'%3E%3Cg id='Page-1' stroke='none' stroke-width='1' fill='none' fill-rule='evenodd'%3E%3Cg id='brick-wall' fill='%239e9e9e' fill-opacity='0.1'%3E%3Cpath d='M0,0 L0,44 L21,44 L21,0 L0,0 Z M21,0 L21,22 L42,22 L42,0 L21,0 Z M21,22 L21,44 L42,44 L42,22 L21,22 Z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }

        /* --- Header Styles (Includes Responsive Fixes) --- */
        .admin-header {
          background-color: var(--ui-blue-dark) !important;
          /* Pattern from user input */
          background-image: url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23004d40' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M5 0h1L0 6V5zm1 5v1H5z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") !important;
          background-repeat: repeat !important;
          position: sticky;
          top: 0;
          z-index: 1020;
          height: 70px;
        }
        
        /* --- Sidebar Styles (Desktop & Offcanvas) --- */
        .sidebar-nav, .mobile-sidebar-nav {
          background-color: var(--ui-blue-darker-tone);
          border-right: 1px solid rgba(255, 255, 255, 0.1); 
          color: var(--ui-white);
        }
        
        /* Targets the Offcanvas itself for dark theme */
        .mobile-sidebar-nav.offcanvas { 
            background-color: var(--ui-blue-darker-tone);
        }

        .sidebar-nav .nav-link, .mobile-sidebar-nav .nav-link {
          transition: background-color var(--transition-speed), color var(--transition-speed);
          border-radius: 8px; 
        }

        .sidebar-nav .nav-link:hover, .mobile-sidebar-nav .nav-link:hover {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
        }
        
        .active-sidebar-link {
          background-color: var(--ui-blue-primary) !important;
          border-radius: 8px;
          font-weight: 600;
        }
        
        /* --- Panel Card Styles --- */
        .panel-card {
          border-radius: 12px; 
          border: none; 
          box-shadow: var(--box-shadow-light);
          overflow: hidden;
        }

        .panel-card .card-header {
          border-top-left-radius: 12px; 
          border-top-right-radius: 12px; 
          border-bottom: none; 
        }

        .welcome-header {
          background-color: var(--ui-blue-dark);
          /* Pattern from user input */
          background-image: url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23004d40' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M5 0h1L0 6V5zm1 5v1H5z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") !important;
          background-repeat: repeat !important;
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
          padding: 1.5rem; 
          font-size: 1.5rem; 
        }

        /* --- Ad Container Styles --- */
        .ad-container {
          background-color: rgba(255, 255, 255, 0.5); 
          border: 1px dashed #ccc !important; 
          text-align: center;
          padding: 1rem;
        }

        .ad-slot {
          width: 100%;
          min-height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--ui-gray);
          font-style: italic;
        }
        
        /* --- Form & Touch Target Optimization --- */
        .form-select, .form-control, .btn {
            min-height: 48px; 
            padding: 0.75rem 1rem;
        }
        
        /* --- Table Responsiveness Fix --- */
        .table-responsive-scroll {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            padding: 0.5rem;
        }
        
        /* **Mobile Adaptation Media Query** */
        @media (max-width: 767.98px) {
            .admin-header h2 {
                font-size: 1.2rem !important;
            }
            .admin-header {
                justify-content: start;
            }
            main {
                padding: 1rem !important;
            }
            .panel-card {
                margin-bottom: 1rem;
            }
            .ad-container {
                display: none; 
            }
            /* Make inline forms stack cleanly on mobile */
            .card-body .flex-wrap > * {
                flex-basis: 100% !important; 
                margin: 0 0 0.5rem 0 !important;
            }
        }
      `}</style>
    </div>
  );
};

export default SuperAdminPanel;