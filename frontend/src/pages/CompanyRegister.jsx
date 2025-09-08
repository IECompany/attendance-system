import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Message from '../components/Message';
import { FaBuilding, FaUserTie, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

const CompanyRegister = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    companyAddress: '',
    companyContactNo: '',
    totalEmployees: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
  });

  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
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
        adminPassword: formData.adminPassword,
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

        .register-container {
          background-color: var(--ui-light-gray);
          padding: 2.5rem;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          max-width: 650px;
          margin: 3rem auto;
          animation: fadeIn 0.8s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .register-heading {
          text-align: center;
          font-weight: 700;
          color: var(--ui-turquoise);
          font-size: 2rem;
          margin-bottom: 2rem;
        }

        .section-heading {
          font-weight: 600;
          font-size: 1.5rem;
          color: var(--ui-dark);
          margin-top: 2rem;
          margin-bottom: 1.5rem;
          border-left: 4px solid var(--ui-orange);
          padding-left: 1rem;
        }
        
        .form-group {
            margin-bottom: 1.5rem;
        }

        .form-label {
          font-weight: 500;
          color: var(--ui-gray);
          margin-bottom: 0.5rem;
          display: block;
        }
        
        .form-control {
            width: 100%;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            border: 1px solid #dee2e6;
            transition: border-color var(--transition-speed), box-shadow var(--transition-speed);
        }
        
        .form-control:focus {
            border-color: var(--ui-turquoise);
            outline: none;
            box-shadow: 0 0 0 3px rgba(0, 121, 107, 0.1);
        }
        
        .btn-register {
            width: 100%;
            padding: 1rem;
            background-color: var(--ui-turquoise);
            color: var(--ui-white);
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color var(--transition-speed), transform var(--transition-speed);
            margin-top: 1.5rem;
        }

        .btn-register:hover {
            background-color: #005f54;
            transform: translateY(-2px);
        }

        .btn-register:disabled {
            background-color: #a0a0a0;
            cursor: not-allowed;
            transform: none;
        }

        .message-container {
            margin-bottom: 1.5rem;
            padding: 1rem;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .message-container.success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .message-container.error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
      `}</style>
      <div className="register-container">
        <h2 className="register-heading">Register Your Company</h2>
        {message && (
          <div className={`message-container ${message.type}`}>
            {message.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
            <span>{message.text}</span>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          {/* Company Details */}
          <h3 className="section-heading">Company Information <FaBuilding className="ms-2" /></h3>
          <div className="row">
            <div className="col-md-6 form-group">
              <label htmlFor="companyName" className="form-label">Company Name:</label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>
            <div className="col-md-6 form-group">
              <label htmlFor="companyAddress" className="form-label">Company Address:</label>
              <input
                type="text"
                id="companyAddress"
                name="companyAddress"
                value={formData.companyAddress}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>
          </div>
          <div className="row">
            <div className="col-md-6 form-group">
              <label htmlFor="companyContactNo" className="form-label">Company Contact No.:</label>
              <input
                type="text"
                id="companyContactNo"
                name="companyContactNo"
                value={formData.companyContactNo}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>
            <div className="col-md-6 form-group">
              <label htmlFor="totalEmployees" className="form-label">Total Number of Employees:</label>
              <input
                type="number"
                id="totalEmployees"
                name="totalEmployees"
                value={formData.totalEmployees}
                onChange={handleChange}
                required
                min="1"
                className="form-control"
              />
            </div>
          </div>

          {/* Super Admin Details */}
          <h3 className="section-heading">Super Admin Information <FaUserTie className="ms-2" /></h3>
          <div className="row">
            <div className="col-md-12 form-group">
              <label htmlFor="adminName" className="form-label">Admin Name:</label>
              <input
                type="text"
                id="adminName"
                name="adminName"
                value={formData.adminName}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>
          </div>
          <div className="row">
            <div className="col-md-12 form-group">
              <label htmlFor="adminEmail" className="form-label">Admin Email:</label>
              <input
                type="email"
                id="adminEmail"
                name="adminEmail"
                value={formData.adminEmail}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>
          </div>
          <div className="row">
            <div className="col-md-6 form-group">
              <label htmlFor="adminPassword" className="form-label">Password:</label>
              <input
                type="password"
                id="adminPassword"
                name="adminPassword"
                value={formData.adminPassword}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>
            <div className="col-md-6 form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password:</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-register">
            {loading ? 'Registering...' : 'Register Company'}
          </button>
        </form>
      </div>
    </>
  );
};

export default CompanyRegister;