import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import { FaFilter, FaDownload, FaUserPlus, FaTrashAlt, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import Select from 'react-select';
import Message from '../components/Message';

const SuperAdmin = () => {
  // Mock data for Select components
  const mockStates = [
    { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
    { value: 'Madhya Pradesh', label: 'Madhya Pradesh' },
    { value: 'Chhattisgarh', label: 'Chhattisgarh' },
  ];
  const mockDistricts = [
    { value: 'Lucknow', label: 'Lucknow' },
    { value: 'Bhopal', label: 'Bhopal' },
    { value: 'Raipur', label: 'Raipur' },
  ];

  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [dccb, setDccb] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radius, setRadius] = useState(50);
  const [message, setMessage] = useState(null);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [adminList, setAdminList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Function to simulate API calls
  const getAuthHeaders = () => {
    // In a real app, this would get the auth token from context or state
    return {
      'Authorization': 'Bearer YOUR_AUTH_TOKEN',
      'Content-Type': 'application/json',
    };
  };

  const handleFilterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Prepare data for API call
    const filterData = {
      state: selectedState ? selectedState.value : '',
      district: selectedDistrict ? selectedDistrict.value : '',
      dccb,
      latitude,
      longitude,
      radius,
    };

    console.log("Applying filters:", filterData);

    try {
      // Simulate API call
      // const response = await fetch('/api/filter-data', {
      //   method: 'POST',
      //   headers: getAuthHeaders(),
      //   body: JSON.stringify(filterData),
      // });
      // if (!response.ok) {
      //   throw new Error('Failed to apply filters');
      // }
      // const result = await response.json();
      setMessage({ type: 'success', text: "Filters applied successfully! (Simulated)" });
      setLoading(false);
    } catch (error) {
      console.error("Filter error:", error);
      setMessage({ type: 'error', text: "Failed to apply filters. Please try again." });
      setLoading(false);
    }
  };

  const handleDownload = () => {
    setMessage({ type: 'success', text: "Download started... (Simulated)" });
    console.log("Downloading filtered dataset...");
    // Simulate API call
    // window.open('/api/download-data', '_blank');
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail) {
      setMessage({ type: 'error', text: "Please enter a valid email address." });
      return;
    }
    setLoading(true);
    setMessage(null);

    try {
      // Simulate API call to add admin
      // const response = await fetch('/api/add-admin', {
      //   method: 'POST',
      //   headers: getAuthHeaders(),
      //   body: JSON.stringify({ email: newAdminEmail }),
      // });
      // if (!response.ok) {
      //   throw new Error('Failed to add admin');
      // }
      // const result = await response.json();

      setAdminList([...adminList, newAdminEmail]);
      setNewAdminEmail("");
      setMessage({ type: 'success', text: `Admin ${newAdminEmail} added successfully! (Simulated)` });
      setLoading(false);
    } catch (error) {
      console.error("Add admin error:", error);
      setMessage({ type: 'error', text: "Failed to add admin. Please try again." });
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async (email) => {
    setLoading(true);
    setMessage(null);
    try {
      // Simulate API call to remove admin
      // const response = await fetch(`/api/remove-admin/${email}`, {
      //   method: 'DELETE',
      //   headers: getAuthHeaders(),
      // });
      // if (!response.ok) {
      //   throw new Error('Failed to remove admin');
      // }

      setAdminList(adminList.filter((admin) => admin !== email));
      setMessage({ type: 'success', text: `Admin ${email} removed successfully! (Simulated)` });
      setLoading(false);
    } catch (error) {
      console.error("Remove admin error:", error);
      setMessage({ type: 'error', text: "Failed to remove admin. Please try again." });
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
          background-color: var(--ui-light-gray);
          font-family: 'Poppins', sans-serif;
          color: var(--ui-dark);
        }
        
        .super-admin-container {
            max-width: 900px;
            margin: 3rem auto;
            padding: 2rem;
            background-color: var(--ui-white);
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .super-admin-heading {
            text-align: center;
            font-weight: 700;
            color: var(--ui-turquoise);
            margin-bottom: 2rem;
        }

        .section-card {
            background-color: #f0f8ff;
            border: 1px solid #e0e7ff;
            border-radius: 10px;
            padding: 2rem;
            margin-bottom: 2rem;
        }

        .section-heading {
            font-weight: 600;
            color: var(--ui-dark);
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .form-label-custom {
          font-weight: 500;
          color: var(--ui-gray);
        }

        .form-control-custom {
            border-radius: 8px;
            border: 1px solid #ced4da;
            padding: 10px 15px;
            transition: all var(--transition-speed);
        }

        .form-control-custom:focus {
            border-color: var(--ui-turquoise);
            box-shadow: 0 0 0 3px rgba(0, 121, 107, 0.1);
            outline: none;
        }

        .btn-custom {
            font-weight: 600;
            padding: 12px;
            border-radius: 8px;
            transition: all var(--transition-speed);
            border: none;
        }
        
        .btn-primary-custom {
            background-color: var(--ui-turquoise);
            color: var(--ui-white);
        }
        
        .btn-primary-custom:hover {
            background-color: #005f54;
        }
        
        .btn-orange-custom {
            background-color: var(--ui-orange);
            color: var(--ui-white);
        }
        
        .btn-orange-custom:hover {
            background-color: #cc7200;
        }

        .btn-success-custom {
            background-color: #28a745;
            color: var(--ui-white);
        }
        .btn-success-custom:hover { background-color: #218838; }

        .btn-danger-custom {
            background-color: #dc3545;
            color: var(--ui-white);
        }
        .btn-danger-custom:hover { background-color: #c82333; }

        .admin-list-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: #fff;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            transition: all var(--transition-speed);
        }
        
        .admin-list-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

      `}</style>
      <Navbar />
      <div className="super-admin-container">
        <h2 className="super-admin-heading">Super Admin Panel</h2>

        {message && <Message type={message.type} text={message.text} />}

        {/* Filters and Download Section */}
        <div className="section-card">
          <h4 className="section-heading"><FaFilter /> Filter Attendance Data</h4>
          <form onSubmit={handleFilterSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label-custom">State</label>
                <Select
                  options={mockStates}
                  value={selectedState}
                  onChange={setSelectedState}
                  placeholder="Select State"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label-custom">District</label>
                <Select
                  options={mockDistricts}
                  value={selectedDistrict}
                  onChange={setSelectedDistrict}
                  placeholder="Select District"
                  isDisabled={!selectedState}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label-custom">DCCB</label>
              <input
                type="text"
                className="form-control-custom w-100"
                value={dccb}
                onChange={(e) => setDccb(e.target.value)}
                placeholder="Enter DCCB name"
              />
            </div>

            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label-custom">Latitude</label>
                <input
                  type="number"
                  step="any"
                  className="form-control-custom w-100"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="e.g., 26.8467"
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label-custom">Longitude</label>
                <input
                  type="number"
                  step="any"
                  className="form-control-custom w-100"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="e.g., 80.9462"
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label-custom">Radius (meters)</label>
                <input
                  type="number"
                  className="form-control-custom w-100"
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  min="1"
                  max="1000"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-custom btn-primary-custom w-100 mt-3" disabled={loading}>
              {loading ? "Applying..." : "Apply Filters"}
            </button>
          </form>

          <button className="btn-custom btn-orange-custom w-100 mt-4 d-flex justify-content-center align-items-center" onClick={handleDownload}>
            <FaDownload className="me-2" /> Download Filtered Dataset
          </button>
        </div>

        {/* Admin Management Section */}
        <div className="section-card">
          <h4 className="section-heading"><FaUserPlus /> Manage Admins</h4>
          <div className="input-group mb-3">
            <input
              type="email"
              className="form-control-custom"
              placeholder="Enter new admin email"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              required
            />
            <button className="btn-custom btn-success-custom ms-2" onClick={handleAddAdmin}>
              Add Admin
            </button>
          </div>

          {adminList.length > 0 && (
            <ul className="list-group mt-4">
              {adminList.map((admin, index) => (
                <li key={index} className="admin-list-item mt-2">
                  <span>{admin}</span>
                  <button className="btn-custom btn-danger-custom" onClick={() => handleRemoveAdmin(admin)}>
                    <FaTrashAlt />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

export default SuperAdmin;