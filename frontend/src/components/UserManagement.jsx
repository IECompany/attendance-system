// src/components/UserManagement.jsx - UPDATED for Multi-Tenancy

import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import axios from 'axios';
import { Table, Form, Button, Spinner, Alert, Pagination } from 'react-bootstrap';
import { FaSearch, FaTrash, FaUsers } from 'react-icons/fa';

import { useAuth } from '../authContext'; // <-- NEW: Import useAuth context

const UserManagement = () => {
    const { user, token, logout } = useAuth(); // <-- NEW: Get user, token, and logout from AuthContext

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(false);

    const API_BASE_URL = 'http://localhost:5001/api/admin'; 

    // --- NEW: Helper to get authenticated headers ---
    const getAuthHeaders = useCallback(() => {
        if (!token || !user || !user.companyId) {
            // If token or companyId is missing, it means user is not properly authenticated
            // or session is invalid. Redirect to login.
            setError("Session expired or invalid. Please log in again."); // Set error message
            logout(); // Use logout function from context
            return null;
        }
        return {
            'Authorization': `Bearer ${token}`,
            'X-Company-ID': user.companyId
        };
    }, [token, user, logout]); // Dependencies for useCallback

    useEffect(() => {
        // Initial authentication check
        if (!user || !token || !user.companyId) {
            setLoading(false); // Stop loading if not authenticated
            return;
        }

        const fetchUsers = async () => {
            const headers = getAuthHeaders(); // <-- NEW: Get authenticated headers
            if (!headers) {
                setLoading(false);
                return; // Exit if headers are not available
            }

            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(`${API_BASE_URL}/users`, {
                    params: {
                        page,
                        limit,
                        search: searchTerm
                    },
                    headers: headers // <-- NEW: Pass authentication headers
                });
                setUsers(response.data.users);
                setTotalPages(response.data.totalPages);
                setTotalUsers(response.data.totalUsers);
            } catch (err) {
                console.error("Failed to fetch users:", err);
                setError(err.response?.data?.message || "Failed to fetch users. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [page, limit, searchTerm, refreshTrigger, user, token, logout, getAuthHeaders]); // Added user, token, logout, getAuthHeaders to dependencies

    const handleDeleteUser = async (userId, userName) => {
        if (window.confirm(`Are you sure you want to delete user "${userName}" (ID: ${userId})? This action cannot be undone.`)) {
            const headers = getAuthHeaders(); // <-- NEW: Get authenticated headers
            if (!headers) return; // Exit if headers are not available

            try {
                setLoading(true);
                await axios.delete(`${API_BASE_URL}/users/${userId}`, {
                    headers: headers // <-- NEW: Pass authentication headers
                });
                setRefreshTrigger(prev => !prev); 
                alert(`User "${userName}" deleted successfully!`);
            } catch (err) {
                console.error("Failed to delete user:", err);
                setError(err.response?.data?.message || "Failed to delete user. Please try again.");
            } finally {
                setLoading(false);
            }
        }
    };

    // Helper function to generate password from DOB string (e.g., "10-May-1985")
    const generatePasswordFromDOBString = (dobString) => {
        if (!dobString || typeof dobString !== 'string') {
            return 'N/A'; // Or a default message
        }
        try {
            const parts = dobString.split('-'); // Expected format: DD-Mon-YYYY
            if (parts.length === 3) {
                const month = parts[1]; // "May"
                const year = parts[2]; // "1985"
                return `${month}@${year}`;
            }
        } catch (error) {
            console.error("Error generating password from DOB string:", dobString, error);
        }
        return 'Invalid DOB Format'; // Fallback
    };
    
    // Pagination render logic
    let items = [];
    for (let number = 1; number <= totalPages; number++) {
        items.push(
            <Pagination.Item key={number} active={number === page} onClick={() => setPage(number)}>
                {number}
            </Pagination.Item>,
        );
    }

    return (
        <div className="p-4" style={{ maxWidth: '1200px', margin: 'auto' }}>
            <hr className="my-4" />
            <h2 className="mb-3 text-primary">
                <FaUsers className="me-2" /> Manage System Users ({totalUsers} Total Users)
            </h2>
            <hr className="mb-4" />

            <Form className="mb-4 d-flex align-items-center">
                <Form.Group controlId="searchUsers" className="me-3 flex-grow-1">
                    <div className="input-group">
                        <span className="input-group-text"><FaSearch /></span>
                        <Form.Control
                            type="text"
                            placeholder="Search by Employee Name or ID..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                            className="rounded-end"
                        />
                    </div>
                </Form.Group>

                <Form.Group controlId="limitUsers">
                    <Form.Select
                        value={limit}
                        onChange={(e) => {
                            setLimit(parseInt(e.target.value));
                            setPage(1);
                        }}
                    >
                        <option value="5">Show 5</option>
                        <option value="10">Show 10</option>
                        <option value="20">Show 20</option>
                        <option value="50">Show 50</option>
                    </Form.Select>
                </Form.Group>
            </Form>

            {loading ? (
                <div className="text-center my-5">
                    <Spinner animation="border" role="status" className="me-2" />
                    <p>Loading users...</p>
                </div>
            ) : error ? (
                <Alert variant="danger" className="text-center">{error}</Alert>
            ) : users.length === 0 ? (
                <Alert variant="info" className="text-center">No users found matching your criteria.</Alert>
            ) : (
                <>
                    <div style={{ maxHeight: '500px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '0.25rem' }}>
                        <Table striped bordered hover responsive className="mb-0">
                            <thead className="bg-light sticky-top">
                                <tr>
                                    <th>Employee ID</th>
                                    <th>Name</th>
                                    <th>Email (Login)</th>
                                    <th>Date of Birth</th>
                                    <th>Password</th>
                                    <th>Contact No</th>
                                    <th>User Type</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user._id}>
                                        <td>{user.pacsId}</td>
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            {user.dateOfBirth || 'N/A'}
                                        </td>
                                        <td>
                                            {generatePasswordFromDOBString(user.dateOfBirth)}
                                        </td>
                                        <td>{user.contactNo || 'N/A'}</td>
                                        <td>{user.userType}</td>
                                        <td>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => handleDeleteUser(user._id, user.name)}
                                                disabled={loading}
                                            >
                                                <FaTrash /> Delete
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>

                    {totalPages > 1 && (
                        <div className="d-flex justify-content-center mt-3">
                            <Pagination>
                                <Pagination.Prev onClick={() => setPage(prev => Math.max(prev - 1, 1))} disabled={page === 1} />
                                {items}
                                <Pagination.Next onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} disabled={page === totalPages} />
                            </Pagination>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default UserManagement;
