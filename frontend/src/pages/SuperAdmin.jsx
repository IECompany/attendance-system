import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

const SuperAdmin = () => {
  const [district, setDistrict] = useState("");
  const [dccb, setDccb] = useState("");
  const [state, setState] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radius, setRadius] = useState(50);
  const [message, setMessage] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [adminList, setAdminList] = useState([]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setMessage("Filters applied successfully!");
    console.log({ district, dccb, state, latitude, longitude, radius });
  };

  const handleDownload = () => {
    console.log("Downloading filtered dataset...");
  };

  const handleAddAdmin = () => {
    if (newAdminEmail && !adminList.includes(newAdminEmail)) {
      setAdminList([...adminList, newAdminEmail]);
      setNewAdminEmail("");
      alert("✅ Admin added successfully");
    }
  };

  const handleRemoveAdmin = (email) => {
    setAdminList(adminList.filter((admin) => admin !== email));
  };

  return (
    <>
      <Navbar />
      <div className="container mt-5">
        <h2 className="text-danger text-center">Super Admin Panel</h2>

        <form onSubmit={handleFilterSubmit} className="mt-4">
          <div className="mb-3">
            <label className="form-label">District</label>
            <input
              type="text"
              className="form-control"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">DCCB</label>
            <input
              type="text"
              className="form-control"
              value={dccb}
              onChange={(e) => setDccb(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">State</label>
            <input
              type="text"
              className="form-control"
              value={state}
              onChange={(e) => setState(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Latitude</label>
            <input
              type="number"
              step="any"
              className="form-control"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Longitude</label>
            <input
              type="number"
              step="any"
              className="form-control"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Radius (meters)</label>
            <input
              type="number"
              className="form-control"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              min="1"
              max="1000"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-100">
            Apply Filters
          </button>
        </form>

        {message && <div className="mt-3 alert alert-success">{message}</div>}

        <div className="mt-4">
          <button className="btn btn-secondary w-100" onClick={handleDownload}>
            Download Filtered Dataset
          </button>
        </div>

        <hr className="my-5" />

        <h4>Add / Manage Admins</h4>
        <div className="input-group mb-3">
          <input
            type="email"
            className="form-control"
            placeholder="Enter new admin email"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
          />
          <button className="btn btn-success" onClick={handleAddAdmin}>
            Add Admin
          </button>
        </div>

        {adminList.length > 0 && (
          <ul className="list-group">
            {adminList.map((admin, index) => (
              <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                {admin}
                <button className="btn btn-sm btn-danger" onClick={() => handleRemoveAdmin(admin)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <Link to="/" className="btn btn-link mt-4">
          Back to Login (Dashboard)
        </Link>
      </div>
    </>
  );
};

export default SuperAdmin;