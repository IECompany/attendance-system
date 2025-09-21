import React, { useState, useEffect, useCallback } from "react";
import {
    FaDownload,
    FaMapMarkedAlt,
    FaClipboardList,
    FaFilter,
    FaRedo
} from "react-icons/fa";
import { motion } from "framer-motion";
import { Spinner, Alert, Form, Row, Col, Button } from 'react-bootstrap';
import AdminVisitsTable from "../components/AdminVisitsTable";

import { useAuth } from '../authContext';

// Define the API base URL using an environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

const AdminPanel = () => {
    const { user, token, logout } = useAuth();

    // --- States for CSV Download Section ---
    const [district, setDistrict] = useState("");
    const [state, setState] = useState("");
    const [date, setDate] = useState("");
    const [erpIdDownload, setErpIdDownload] = useState("");
    const [downloadLoading, setDownloadLoading] = useState(false);

    // --- States for Table Filtering ---
    const [tableErpIdFilter, setTableErpIdFilter] = useState("");
    const [tableDistrictFilter, setTableDistrictFilter] = useState("");
    const [tableStateFilter, setTableStateFilter] = useState("");
    const [tableDateFilter, setTableDateFilter] = useState("");
    const [tableStatusFilter, setTableStatusFilter] = useState("");

    // --- Lists for Dropdowns ---
    const [districtList, setDistrictList] = useState([]);
    const [stateList, setStateList] = useState([]);
    const [dateList, setDateList] = useState([]);
    const statusList = ["active", "completed"];

    // --- States for AdminVisitsTable Data ---
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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

    useEffect(() => {
        if (!user || !token || !user.companyId) {
            logout();
            return;
        }

        const headers = getAuthHeaders();
        if (!headers) return;

        fetch(`${API_BASE_URL}/admin/unique-districts`, { headers })
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(setDistrictList)
            .catch((err) => console.error("❌ Failed to fetch districts:", err));

        fetch(`${API_BASE_URL}/admin/unique-states`, { headers })
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(setStateList)
            .catch((err) => console.error("❌ Failed to fetch states:", err));

        fetch(`${API_BASE_URL}/admin/unique-checkin-dates`, { headers })
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(setDateList)
            .catch((err) => console.error("❌ Failed to fetch dates:", err));
    }, [user, token, logout, getAuthHeaders]);

    useEffect(() => {
        const fetchVisitsForTable = async () => {
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

                const url = `${API_BASE_URL}/admin/visits?${queryParams.toString()}`;
                const res = await fetch(url, { headers });

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
    }, [tableErpIdFilter, tableDistrictFilter, tableStateFilter, tableDateFilter, tableStatusFilter, user, token, logout, getAuthHeaders]);

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

    const handleDownload = () => {
        if (!district || !state || !date) {
            alert("Please select District, State, and Date to download filtered dataset.");
            return;
        }
        const query = new URLSearchParams({ district, state, date }).toString();
        downloadCsv(`${API_BASE_URL}/admin/download-submissions?${query}`, "filtered_submissions.csv");
    };

    const handleDownloadAll = () => {
        downloadCsv(`${API_BASE_URL}/admin/download-submissions`, "all_submissions.csv");
    };

    const handleDownloadByErpId = () => {
        if (!erpIdDownload.trim()) {
            alert("Please enter ERP ID to download.");
            return;
        }
        downloadCsv(`${API_BASE_URL}/admin/download-submissions/${erpIdDownload}`, `${erpIdDownload}_submissions.csv`);
    };

    return (
        <>
            <style jsx="true">{`
                :root {
                    --ui-orange: #FF8F00;
                    --ui-turquoise: #00796B;
                    --ui-white: #FAFAFA;
                    --ui-dark: #333;
                    --ui-gray: #6c757d;
                    --ui-light-gray: #f8f9fa;
                    --box-shadow-light: 0 4px 12px rgba(0,0,0,0.08);
                    --transition-speed: 0.3s;
                }

                body {
                    background-color: var(--ui-white);
                    font-family: 'Poppins', sans-serif;
                    color: var(--ui-dark);
                }

                .admin-header {
                    background-color: var(--ui-turquoise);
                    color: var(--ui-white);
                    padding: 3rem 0;
                    text-align: center;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                }

                .admin-header h2 {
                    font-weight: 700;
                    font-size: 2.5rem;
                }

                .content-container {
                    padding-top: 2rem;
                    padding-bottom: 2rem;
                }

                .panel-card {
                    border-radius: 15px;
                    box-shadow: var(--box-shadow-light);
                    transition: transform var(--transition-speed), box-shadow var(--transition-speed);
                    border: none;
                    overflow: hidden;
                    background-color: var(--ui-light-gray);
                }

                .panel-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 20px rgba(0,0,0,0.15);
                }

                .card-header-custom {
                    background-color: var(--ui-turquoise);
                    color: var(--ui-white);
                    padding: 1rem 1.5rem;
                    font-weight: 600;
                    font-size: 1.1rem;
                    border-bottom: none;
                }

                .btn-custom-primary {
                    background-color: var(--ui-turquoise);
                    color: var(--ui-white);
                    border: none;
                    transition: all var(--transition-speed);
                }

                .btn-custom-primary:hover {
                    background-color: #005f54;
                    transform: translateY(-2px);
                }

                .btn-custom-secondary {
                    background-color: var(--ui-orange);
                    color: var(--ui-white);
                    border: none;
                    transition: all var(--transition-speed);
                }

                .btn-custom-secondary:hover {
                    background-color: #e57d00;
                    transform: translateY(-2px);
                }

                .btn-custom-outline {
                    color: var(--ui-turquoise);
                    border: 2px solid var(--ui-turquoise);
                    background-color: transparent;
                    font-weight: 600;
                    transition: all var(--transition-speed);
                }

                .btn-custom-outline:hover {
                    background-color: var(--ui-turquoise);
                    color: var(--ui-white);
                    border-color: var(--ui-turquoise);
                }

                .form-select, .form-control {
                    border-radius: 8px;
                    border: 1px solid #dee2e6;
                    padding: 0.75rem 1rem;
                }

                .footer {
                    background-color: var(--ui-turquoise);
                    color: var(--ui-white);
                    padding: 1.5rem 0;
                    text-align: center;
                }
            `}</style>

            <header className="admin-header">
                <h2><FaMapMarkedAlt className="me-3" />Admin Panel</h2>
            </header>

            <main className="container content-container">
                <div className="row g-4">

                    {/* Download Dataset Section */}
                    <motion.div className="col-md-6 d-flex" whileHover={{ scale: 1.02 }} >
                        <div className="card panel-card w-100 d-flex flex-column">
                            <div className="card-header card-header-custom d-flex justify-content-between align-items-center">
                                <span><FaDownload className="me-2" /> Download Dataset (CSV)</span>
                            </div>
                            <div className="card-body d-flex flex-column flex-grow-1">
                                <Form.Select
                                    className="mb-3"
                                    value={district}
                                    onChange={(e) => setDistrict(e.target.value)}
                                >
                                    <option value="">Select District</option>
                                    {districtList.map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </Form.Select>

                                <Form.Select
                                    className="mb-3"
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                >
                                    <option value="">Select State</option>
                                    {stateList.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </Form.Select>

                                <Form.Select
                                    className="mb-4"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                >
                                    <option value="">Select Date</option>
                                    {dateList.map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </Form.Select>

                                <Button className="btn-custom-primary w-100 mb-3" onClick={handleDownload} disabled={downloadLoading}>
                                    {downloadLoading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : <FaDownload className="me-2" />}
                                    {downloadLoading ? 'Downloading...' : 'Download Filtered Dataset'}
                                </Button>

                                <input
                                    type="text"
                                    className="form-control mb-3"
                                    placeholder="Enter ERP ID to download"
                                    value={erpIdDownload}
                                    onChange={(e) => setErpIdDownload(e.target.value)}
                                />
                                <Button className="btn-custom-secondary w-100 mb-4" onClick={handleDownloadByErpId} disabled={downloadLoading}>
                                    {downloadLoading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : <FaDownload className="me-2" />}
                                    {downloadLoading ? 'Downloading...' : 'Download by ERP ID'}
                                </Button>

                                <Button className="btn-custom-outline w-100 py-3 fs-5" onClick={handleDownloadAll} disabled={downloadLoading}>
                                    {downloadLoading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : <FaDownload className="me-2" />}
                                    {downloadLoading ? 'Downloading...' : 'Download Entire Dataset'}
                                </Button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Filter Visit Data for Table Section */}
                    <motion.div className="col-md-6 d-flex" whileHover={{ scale: 1.02 }}>
                        <div className="card panel-card w-100 d-flex flex-column">
                            <div className="card-header card-header-custom d-flex justify-content-between align-items-center">
                                <span><FaClipboardList className="me-2" /> Filter Table Data</span>
                            </div>
                            <div className="card-body d-flex flex-column flex-grow-1">
                                <input
                                    type="text"
                                    className="form-control mb-3"
                                    placeholder="Filter by ERP ID"
                                    value={tableErpIdFilter}
                                    onChange={(e) => setTableErpIdFilter(e.target.value)}
                                />
                                <Form.Select
                                    className="mb-3"
                                    value={tableDistrictFilter}
                                    onChange={(e) => setTableDistrictFilter(e.target.value)}
                                >
                                    <option value="">Filter by District</option>
                                    {districtList.map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </Form.Select>
                                <Form.Select
                                    className="mb-3"
                                    value={tableStateFilter}
                                    onChange={(e) => setTableStateFilter(e.target.value)}
                                >
                                    <option value="">Filter by State</option>
                                    {stateList.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </Form.Select>
                                <Form.Select
                                    className="mb-3"
                                    value={tableDateFilter}
                                    onChange={(e) => setTableDateFilter(e.target.value)}
                                >
                                    <option value="">Filter by Date</option>
                                    {dateList.map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </Form.Select>
                                <Form.Select
                                    className="mb-4"
                                    value={tableStatusFilter}
                                    onChange={(e) => setTableStatusFilter(e.target.value)}
                                >
                                    <option value="">Filter by Status</option>
                                    {statusList.map((s) => (
                                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                    ))}
                                </Form.Select>
                                <Button
                                    variant="outline-secondary"
                                    className="btn-custom-outline w-100"
                                    onClick={() => {
                                        setTableErpIdFilter("");
                                        setTableDistrictFilter("");
                                        setTableStateFilter("");
                                        setTableDateFilter("");
                                        setTableStatusFilter("");
                                    }}
                                >
                                    <FaRedo className="me-2" />
                                    Clear Table Filters
                                </Button>
                            </div>
                        </div>
                    </motion.div>

                    {/* All Visit Data Section */}
                    <motion.div className="col-12" whileHover={{ scale: 1.01 }}>
                        <div className="card panel-card" >
                            <div className="card-header card-header-custom">
                                <FaClipboardList className="me-2" /> All Visit Data
                            </div>
                            <div className="card-body">
                                <AdminVisitsTable visits={visits} loading={loading} error={error} />
                            </div>
                        </div>
                    </motion.div>

                </div>
            </main>

            <footer className="footer">
                <div className="container">
                    <small>&copy; {new Date().getFullYear()} Nectar Infotel. All rights reserved.</small>
                </div>
            </footer>
        </>
    );
};

export default AdminPanel;
