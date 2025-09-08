// components/SubmissionTable.js - UPDATED for Multi-Tenancy

import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../authContext'; // <-- NEW: Import useAuth context

// Use an environment variable for the API URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

const SubmissionTable = ({ erpId }) => {
  const { user, token, logout } = useAuth(); // <-- NEW: Get user, token, and logout from AuthContext

  const [visits, setVisits] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- NEW: Helper to get authenticated headers ---
  const getAuthHeaders = useCallback(() => {
    if (!token || !user || !user.companyId) {
      // If token or companyId is missing, it means user is not properly authenticated
      // or session is invalid. Redirect to login.
      setError("Session expired or invalid. Please log in again."); // Set error message
      logout(); // Use logout function from context to clear session and redirect
      return null;
    }
    return {
      'Authorization': `Bearer ${token}`,
      'X-Company-ID': user.companyId
    };
  }, [token, user, logout]); // Dependencies for useCallback

  useEffect(() => {
    // Function to fetch visits for the current user within their company
    const fetchVisits = async () => {
      // Ensure we have an ERP ID (user's login ID) to fetch visits for
      if (!erpId) {
        setError('Please log in with your ERP ID to view your visit history.');
        setVisits([]);
        return;
      }

      const headers = getAuthHeaders(); // <-- NEW: Get authenticated headers
      if (!headers) {
        // getAuthHeaders already handles error/logout, so just return here
        return;
      }

      setLoading(true);
      setError(null); // Clear any previous errors

      try {
        // Fetch visits for the specific erpId and within the authenticated companyId
        const response = await fetch(`${API_BASE_URL}/submissions/${erpId}`, {
          method: 'GET',
          headers: headers // <-- NEW: Pass authentication headers
        });
        
        const contentType = response.headers.get("content-type");
        if (!response.ok || (contentType && !contentType.includes("application/json"))) {
            const errorText = await response.text(); 
            console.error("Server Response Error:", errorText); 
            throw new Error(`Failed to fetch visit history. Server responded with: ${errorText.substring(0, 150)}...`);
        }

        const data = await response.json(); 
        setVisits(data);
      } catch (err) {
        console.error('Error fetching visits:', err);
        setError(err.message || 'Could not fetch visit history. Please check your network and ERP ID.');
      } finally {
        setLoading(false);
      }
    };

    // Only fetch visits if user and token are available (meaning authenticated)
    if (user && token && user.companyId) {
      fetchVisits();
    } else {
      // If not authenticated, ensure visits are cleared and error is set
      setVisits([]);
      setLoading(false);
      setError("Not authenticated. Please log in to view your submission history.");
    }
  }, [erpId, user, token, getAuthHeaders]); // Add user, token, and getAuthHeaders to dependencies

  const formatDateTime = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) { 
        console.warn('Invalid date string received:', dateString);
        return 'Invalid Date';
      }
      return date.toLocaleString();
    } catch (e) {
      console.error('Error formatting date:', e, 'for string:', dateString);
      return 'Error Formatting Date';
    }
  };

  return (
    <div className="submission-table-container">
      {loading && (
        <div className="text-center my-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading visit history...</span>
          </div>
          <p className="mt-2">Loading your visit history...</p>
        </div>
      )}

      {error && <div className="alert alert-danger my-4">{error}</div>}

      {!loading && !error && visits.length === 0 && (
        <div className="alert alert-info my-4">No visit history found for "{erpId}".</div>
      )}

      {!loading && !error && visits.length > 0 && (
        <div className="table-responsive">
          <table className="table table-striped table-hover mt-4 shadow-sm rounded">
            <thead className="table-dark">
              <tr>
                <th>Email ID</th> 
                <th>Check-in Date & Time</th>
                <th>Check-out Date & Time</th> 
                <th>Location (Check-in)</th>
                <th>Location (Check-out)</th> 
                <th>Office</th>
                <th>District</th>
                <th>State</th>
                <th>Occupation</th>
                <th>Check-in Photos</th>
                <th>Check-out Photo</th> 
                <th>Status</th> 
              </tr>
            </thead>
            <tbody>
              {visits.map((visit) => (
                <tr key={visit._id}>
                  <td>{visit.erpId}</td>
                  <td>{formatDateTime(visit.checkin.date)}</td>
                  <td>
                    {visit.checkout && visit.checkout.date 
                      ? formatDateTime(visit.checkout.date) 
                      : <span className="text-muted">Ongoing</span>}
                  </td>
                  <td>{visit.checkin.locationName}</td>
                  <td>
                    {visit.checkout && visit.checkout.locationName 
                      ? visit.checkout.locationName 
                      : <span className="text-muted">N/A</span>}
                  </td>
                  <td>{visit.checkin.dccb || 'N/A'}</td>
                  <td>{visit.checkin.district || 'N/A'}</td>
                  <td>{visit.checkin.state || 'N/A'}</td>
                  <td>{visit.checkin.occupation || 'N/A'}</td>
                  <td>
                    {visit.checkin.photos && visit.checkin.photos.length > 0 ? (
                      visit.checkin.photos.map((photo, index) => (
                        <a key={index} href={photo.url} target="_blank" rel="noopener noreferrer" className="me-1">
                          {photo.label || `Photo ${index + 1}`}
                        </a>
                      ))
                    ) : 'No Photos'}
                  </td>
                  <td>
                    {/* Assuming checkout.photos is an array now, similar to checkin.photos */}
                    {visit.checkout && visit.checkout.photos && visit.checkout.photos.length > 0 ? (
                      visit.checkout.photos.map((photo, index) => (
                        <a key={index} href={photo.url} target="_blank" rel="noopener noreferrer" className="me-1">
                          {photo.label || `Photo ${index + 1}`}
                        </a>
                      ))
                    ) : 'N/A'}
                  </td>
                  <td>
                    <span className={`badge ${visit.status === 'active' ? 'bg-info' : 'bg-success'}`}>
                      {visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .submission-table-container {
          background-color: #ffffff;
          padding: 20px;
          border-radius: 1rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .table thead th {
          background-color: #0d47a1;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default SubmissionTable;