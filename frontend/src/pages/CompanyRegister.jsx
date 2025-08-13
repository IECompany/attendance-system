// frontend/src/pages/CompanyRegister.jsx - FIXED: Admin password field name for backend

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Message from '../components/Message';

const CompanyRegister = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    companyAddress: '',
    companyContactNo: '', // This will map to 'contactNo' in backend
    totalEmployees: '',   // <-- NEW: Added for totalEmployees
    adminName: '',
    adminEmail: '',       // This will map to 'superAdminEmail' in backend
    adminPassword: '',    // This holds the password entered in the form
    confirmPassword: '',
  });

  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_BASE_URL = "http://localhost:5001/api";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ // Use functional update for safety
      ...prev,
      [name]: name === 'totalEmployees' ? parseInt(value) || '' : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (formData.adminPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      setLoading(false);
      return;
    }

    // Basic validation for new fields
    if (!formData.totalEmployees || isNaN(formData.totalEmployees) || formData.totalEmployees <= 0) {
        setMessage({ type: 'error', text: 'Total Employees must be a positive number.' });
        setLoading(false);
        return;
    }
    if (!formData.companyContactNo) {
        setMessage({ type: 'error', text: 'Company Contact Number is required.' });
        setLoading(false);
        return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/company/register`, {
        companyName: formData.companyName,
        companyAddress: formData.companyAddress,
        contactNo: formData.companyContactNo,
        totalEmployees: formData.totalEmployees,
        superAdminName: formData.adminName,
        superAdminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword, // <-- FIXED: Changed from 'superAdminPassword' to 'adminPassword'
      });

      setMessage({ type: 'success', text: response.data.message || 'Company and Super Admin registered successfully!' });
      setLoading(false);

      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      console.error('Company registration error:', error.response?.data || error.message);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Registration failed. Please try again.'
      });
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Register Your Company</h2>
      {message && <Message type={message.type} text={message.text} />}
      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Company Details */}
        <h3 style={styles.subHeading}>Company Information</h3>
        <div style={styles.formGroup}>
          <label htmlFor="companyName" style={styles.label}>Company Name:</label>
          <input
            type="text"
            id="companyName"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="companyAddress" style={styles.label}>Company Address:</label>
          <input
            type="text"
            id="companyAddress"
            name="companyAddress"
            value={formData.companyAddress}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="companyContactNo" style={styles.label}>Company Contact No.:</label>
          <input
            type="text"
            id="companyContactNo"
            name="companyContactNo"
            value={formData.companyContactNo}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="totalEmployees" style={styles.label}>Total Number of Employees:</label>
          <input
            type="number" // Use type="number" for numerical input
            id="totalEmployees"
            name="totalEmployees"
            value={formData.totalEmployees}
            onChange={handleChange}
            required
            min="1" // Ensure at least 1 employee
            style={styles.input}
          />
        </div>

        {/* Super Admin Details */}
        <h3 style={styles.subHeading}>Super Admin Information</h3>
        <div style={styles.formGroup}>
          <label htmlFor="adminName" style={styles.label}>Admin Name:</label>
          <input
            type="text"
            id="adminName"
            name="adminName"
            value={formData.adminName}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="adminEmail" style={styles.label}>Admin Email:</label>
          <input
            type="email"
            id="adminEmail"
            name="adminEmail"
            value={formData.adminEmail}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="adminPassword" style={styles.label}>Password:</label>
          <input
            type="password"
            id="adminPassword"
            name="adminPassword"
            value={formData.adminPassword}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="confirmPassword" style={styles.label}>Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Registering...' : 'Register Company'}
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '500px',
    margin: '50px auto',
    padding: '30px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    backgroundColor: '#f9f9f9',
  },
  heading: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '25px',
    fontSize: '28px',
  },
  subHeading: {
    color: '#555',
    borderBottom: '1px solid #eee',
    paddingBottom: '10px',
    marginBottom: '20px',
    marginTop: '30px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  formGroup: {
    marginBottom: '18px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    color: '#666',
    fontSize: '15px',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    fontSize: '16px',
    boxSizing: 'border-box',
  },
  button: {
    padding: '12px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '18px',
    marginTop: '25px',
    transition: 'background-color 0.3s ease',
  },
  buttonHover: {
    backgroundColor: '#0056b3',
  },
};

export default CompanyRegister;
