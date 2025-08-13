// AdminPanel.jsx - UPDATED for Multi-Tenancy

import React, { useState, useEffect, useCallback } from "react"; // Added useCallback
import {
  FaDownload,
  FaMapMarkedAlt,
  FaClipboardList,
  FaFilter,
  FaRedo
} from "react-icons/fa";
import { motion } from "framer-motion";
import { Spinner, Alert, Form, Row, Col, Button } from 'react-bootstrap'; // Ensure Button is imported
import AdminVisitsTable from "../components/AdminVisitsTable";

import { useAuth } from '../authContext'; // <-- NEW: Import useAuth context

const AdminPanel = () => {
  const { user, token, logout } = useAuth(); // <-- NEW: Get user, token, and logout from AuthContext

  // --- States for CSV Download Section ---
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [date, setDate] = useState("");
  const [erpIdDownload, setErpIdDownload] = useState("");
  const [downloadLoading, setDownloadLoading] = useState(false); // New: For download loading state

  // --- States for Table Filtering ---
  const [tableErpIdFilter, setTableErpIdFilter] = useState("");
  const [tableDistrictFilter, setTableDistrictFilter] = useState("");
  const [tableStateFilter, setTableStateFilter] = useState("");
  const [tableDateFilter, setTableDateFilter] = useState("");
  const [tableStatusFilter, setTableStatusFilter] = useState("");

  const [bgColor, setBgColor] = useState("#e3f2fd");

  // --- Lists for Dropdowns ---
  const [districtList, setDistrictList] = useState([]);
  const [stateList, setStateList] = useState([]);
  const [dateList, setDateList] = useState([]);
  const statusList = ["active", "completed"];

  // --- States for AdminVisitsTable Data ---
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- NEW: Helper to get authenticated headers ---
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

  // --- Effect to Fetch Dropdown Options on Mount ---
  useEffect(() => {
    // Initial authentication check
    if (!user || !token || !user.companyId) {
      logout();
      return;
    }

    setBgColor("#e3f2fd");
    const headers = getAuthHeaders();
    if (!headers) return;

    // Fetch unique districts for dropdowns
    fetch("http://localhost:5001/api/admin/unique-districts", { headers })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(setDistrictList)
      .catch((err) => console.error("❌ Failed to fetch districts:", err));

    // Fetch unique states for dropdowns
    fetch("http://localhost:5001/api/admin/unique-states", { headers })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(setStateList)
      .catch((err) => console.error("❌ Failed to fetch states:", err));

    // Fetch unique dates for dropdowns
    fetch("http://localhost:5001/api/admin/unique-checkin-dates", { headers }) // Corrected endpoint name
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(setDateList)
      .catch((err) => console.error("❌ Failed to fetch dates:", err));
  }, [user, token, logout, getAuthHeaders]); // Added dependencies

  // Effect to Fetch Visits for the Table
  useEffect(() => {
    const fetchVisitsForTable = async () => {
      // Initial authentication check
      if (!user || !token || !user.companyId) {
        logout();
        return;
      }

      const headers = getAuthHeaders();
      if (!headers) return;

      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();
        if (tableErpIdFilter) queryParams.append("erpId", tableErpIdFilter);
        if (tableDistrictFilter) queryParams.append("district", tableDistrictFilter);
        if (tableStateFilter) queryParams.append("state", tableStateFilter);
        if (tableDateFilter) queryParams.append("date", tableDateFilter);
        if (tableStatusFilter) queryParams.append("status", tableStatusFilter);

        const url = `http://localhost:5001/api/admin/visits?${queryParams.toString()}`;
        const res = await fetch(url, { headers }); // <-- NEW: Pass headers
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to fetch visits for table");
        }
        const data = await res.json();
        setVisits(data);
      } catch (err) {
        console.error("❌ Error fetching visits for table:", err);
        setError(err.message || "Failed to load visit data for table.");
      } finally {
        setLoading(false);
      }
    };

    fetchVisitsForTable();
  }, [tableErpIdFilter, tableDistrictFilter, tableStateFilter, tableDateFilter, tableStatusFilter, user, token, logout, getAuthHeaders]); // Added dependencies

  // --- CSV Download Handlers (UPDATED to use fetch with headers) ---
  const downloadCsv = async (url, filename) => {
    setDownloadLoading(true);
    setError(null); // Clear previous errors
    const headers = getAuthHeaders();
    if (!headers) {
        setDownloadLoading(false);
        return;
    }

    try {
        const response = await fetch(url, {
            method: 'GET', // Or POST if your backend expects it for larger filters
            headers: headers,
        });

        if (!response.ok) {
            const errorData = await response.text(); // Get text as it might not be JSON for errors
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

  const handleDownload = () => {
    if (!district || !state || !date) {
      alert("Please select District, State, and Date to download filtered dataset.");
      return;
    }
    const query = new URLSearchParams({ district, state, date }).toString();
    downloadCsv(`http://localhost:5001/api/admin/download-submissions?${query}`, "filtered_submissions.csv");
  };

  const handleDownloadAll = () => {
    downloadCsv("http://localhost:5001/api/admin/download-submissions", "all_submissions.csv");
  };

  const handleDownloadByErpId = () => {
    if (!erpIdDownload.trim()) {
      alert("Please enter ERP ID to download.");
      return;
    }
    downloadCsv(`http://localhost:5001/api/admin/download-submissions/${erpIdDownload}`, `${erpIdDownload}_submissions.csv`);
  };

  return (
    <div style={{ backgroundColor: bgColor, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="py-4 text-center text-white" style={{ backgroundColor: "#0d6efd" }}>
        <h2><FaMapMarkedAlt className="me-2" /> Admin Panel</h2>
      </header>

      <motion.div
        className="w-100 text-center text-dark py-4 greeting-card-full shadow-sm"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      />

      <main className="container my-4 flex-grow-1">
        <div className="row g-4">

          {/* Download Dataset Section */}
          <motion.div className="col-md-6 d-flex" whileHover={{ scale: 1.02 }}>
            <div className="card shadow-sm panel-card w-100 d-flex flex-column" style={{ backgroundColor: "#e7f0ff" }}>
              <div className="card-header d-flex justify-content-between align-items-center bg-primary text-white fw-bold">
                <span><FaDownload className="me-2" /> Download Dataset (CSV)</span>
              </div>
              <div className="card-body d-flex flex-column flex-grow-1">
                <select
                  className="form-select mb-2"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                >
                  <option value="">Select District</option>
                  {districtList.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select
                  className="form-select mb-2"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                >
                  <option value="">Select State</option>
                  {stateList.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <select
                  className="form-select mb-3"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                >
                  <option value="">Select Date</option>
                  {dateList.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <Button className="btn btn-primary w-100 mb-3" onClick={handleDownload} disabled={downloadLoading}>
                  {downloadLoading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : <FaDownload className="me-2" />}
                  {downloadLoading ? 'Downloading...' : 'Download Filtered Dataset'}
                </Button>

                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Enter ERP ID to download"
                  value={erpIdDownload}
                  onChange={(e) => setErpIdDownload(e.target.value)}
                />
                <Button className="btn btn-success w-100 mb-3" onClick={handleDownloadByErpId} disabled={downloadLoading}>
                  {downloadLoading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : <FaDownload className="me-2" />}
                  {downloadLoading ? 'Downloading...' : 'Download My ERP Dataset'}
                </Button>

                <Button className="btn btn-outline-primary w-100 py-3 fs-5" onClick={handleDownloadAll} disabled={downloadLoading}>
                  {downloadLoading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : <FaDownload className="me-2" />}
                  {downloadLoading ? 'Downloading...' : 'Download Entire Dataset'}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Filter Visit Data for Table Section */}
          <motion.div className="col-md-6 d-flex" whileHover={{ scale: 1.02 }}>
            <div className="card shadow-sm panel-card w-100 d-flex flex-column" style={{ backgroundColor: "#e7f0ff" }}>
              <div className="card-header d-flex justify-content-between align-items-center bg-primary text-white fw-bold">
                <span><FaClipboardList className="me-2" /> Filter Table Data</span>
              </div>
              <div className="card-body d-flex flex-column flex-grow-1">
                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Filter by ERP ID"
                  value={tableErpIdFilter}
                  onChange={(e) => setTableErpIdFilter(e.target.value)}
                />
                <select
                  className="form-select mb-2"
                  value={tableDistrictFilter}
                  onChange={(e) => setTableDistrictFilter(e.target.value)}
                >
                  <option value="">Filter by District</option>
                  {districtList.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select
                  className="form-select mb-2"
                  value={tableStateFilter}
                  onChange={(e) => setTableStateFilter(e.target.value)}
                >
                  <option value="">Filter by State</option>
                  {stateList.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <select
                  className="form-select mb-2"
                  value={tableDateFilter}
                  onChange={(e) => setTableDateFilter(e.target.value)}
                >
                  <option value="">Filter by Date</option>
                  {dateList.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                 <select
                  className="form-select mb-3"
                  value={tableStatusFilter}
                  onChange={(e) => setTableStatusFilter(e.target.value)}
                >
                  <option value="">Filter by Status</option>
                  {statusList.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
                <Button
                  variant="outline-secondary"
                  className="w-100"
                  onClick={() => {
                    setTableErpIdFilter("");
                    setTableDistrictFilter("");
                    setTableStateFilter("");
                    setTableDateFilter("");
                    setTableStatusFilter("");
                  }}
                >
                  Clear Table Filters
                </Button>
              </div>
            </div>
          </motion.div>

          {/* All Visit Data Section */}
          <motion.div className="col-12" whileHover={{ scale: 1.01 }}>
            <div className="card mt-4 mb-5 shadow-sm panel-card" style={{ backgroundColor: "#e7f0ff" }}>
              <div className="card-header bg-primary text-white fw-bold">
                <FaClipboardList className="me-2" /> All Visit Data
              </div>
              <div className="card-body">
                <AdminVisitsTable visits={visits} loading={loading} error={error} />
              </div>
            </div>
          </motion.div>

        </div>
      </main>

      <footer className="text-white text-center py-3" style={{ backgroundColor: "#0d6efd" }}>
        <small>&copy; {new Date().getFullYear()} Nectar Infotel. All rights reserved.</small>
      </footer>

      <style>{`
        .panel-card {
          border-radius: 1rem;
          transition: transform 0.3s ease;
        }
        .greeting-card-full {
          background: #d0e7ff;
          border-bottom-left-radius: 20%;
          border-bottom-right-radius: 20%;
          border: 2px solid #2196f3;
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;
