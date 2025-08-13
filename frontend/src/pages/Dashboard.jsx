// Dashboard.jsx (Login Component) - UPDATED to fix Super Admin redirect path

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../authContext";

const Dashboard = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState(""); // For registration only
  const [loginId, setLoginId] = useState(""); // Can be email or pacsId
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();
  const { login, user: authUser } = useAuth();

  useEffect(() => {
    setErrorMessage("");
  }, [isLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const API_BASE_URL = "http://localhost:5001/api";

    try {
      if (isLogin) {
        // --- Login Flow ---
        const res = await fetch(`${API_BASE_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ loginId, password }),
        });

        const data = await res.json();

        // Debugging Logs for Successful Login (already present)
        console.log('Login API Response Status:', res.status);
        console.log('Login API Response Data:', data);
        if (data && data.user) {
            console.log('User Type from Response:', data.user.userType);
            console.log('Company ID from Response:', data.user.companyId);
            console.log('User Name from Response:', data.user.name);
            console.log('User ID from Response:', data.user.userId);
        } else {
            console.log('User data not found in response.');
        }

        if (!res.ok) {
          setErrorMessage(data.message || data.details || "Login failed");
          return;
        }

        const { token, user } = data;
        
        // Calling useAuth login function (already present)
        console.log('Calling useAuth login with user:', user);
        console.log('Calling useAuth login with token:', token ? 'present' : 'missing');
        login(user, token);

        // --- FIXED: Redirection Path for Super Admin ---
        console.log('Attempting redirection based on userType:', user.userType);
        if (user.userType === "superadmin") {
          navigate("/super-admin-panel"); // <-- CHANGED: Added hyphen here
        } else if (user.userType === "admin") {
          navigate("/admin-panel");
        } else { // 'user' or 'pacs'
          navigate("/user-dashboard");
        }

      } else {
        // --- User Registration Flow (for existing companies) ---
        if (password !== confirmPassword) {
          setErrorMessage("Passwords do not match!");
          return;
        }

        const tempCompanyId = "60c72b2f9b1e8e001c8e8e8e"; // Placeholder - REPLACE with actual logic

        const res = await fetch(`${API_BASE_URL}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email: loginId, password, companyId: tempCompanyId }),
        });

        const data = await res.json();

        if (!res.ok) {
          setErrorMessage(data.message || "Registration failed");
          return;
        }

        const { token, user } = data;

        login(user, token);

        setErrorMessage("Registered and logged in successfully!");
        setTimeout(() => {
          if (user.userType === "superadmin") {
            navigate("/super-admin-panel"); // <-- Also change here if this path is used for registration redirect
          } else if (user.userType === "admin") {
            navigate("/admin-panel");
          } else {
            navigate("/user-dashboard");
          }
        }, 1000);
      }
    } catch (err) {
      console.error("API error:", err);
      setErrorMessage("Something went wrong. Please check your network or try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />

      <div className="welcome-box text-center mb-5">
        <h2 className="fw-bold text-white">Submit Your Attendance here </h2>
        <p className="text-light fs-5">
            enter your check-in and check-out times to mark your daily attendance
        </p>
      </div>

      <div className="container mt-4">
        <div className="row justify-content-center g-4">
          <div className="col-md-6">
            <div className="card form-card shadow-lg p-4 border-0">
              <h4 className={`text-center mb-4 ${isLogin ? "text-primary" : "text-info"}`}>
                {isLogin ? "Login" : "Register"}
              </h4>

              <form onSubmit={handleSubmit}>
                {!isLogin && (
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label text-primary">Employee Name</label>
                    <input
                      type="text"
                      id="name"
                      className="form-control"
                      placeholder="Enter Your Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="mb-3">
                  <label htmlFor="loginId" className="form-label text-primary"> EMAIL ID</label>
                  <input
                    type="text"
                    id="loginId"
                    className="form-control"
                    placeholder="Enter your EMAIL ID"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                      required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label text-primary">Password</label>
                  <input
                    type="password"
                    id="password"
                    className="form-control"
                    placeholder={isLogin ? "Enter your password" : "Create a password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {!isLogin && (
                  <div className="mb-4">
                    <label htmlFor="confirmPassword" className="form-label text-primary">Confirm Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      className="form-control"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                )}

                {errorMessage && (
                  <div className={`alert ${errorMessage.includes("success") ? "alert-success" : "alert-danger"} mt-3`}>
                    {errorMessage}
                  </div>
                )}

                <button type="submit" className={`btn w-100 mb-3 ${isLogin ? "btn-primary" : "btn-info text-white"}`} disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      {isLogin ? "Logging In..." : "Registering..."}
                    </>
                  ) : (
                    isLogin ? "Login" : "Register"
                  )}
                </button>
              </form>
              <div className="text-center">
                <button className="btn btn-link text-decoration-none text-secondary" onClick={() => setIsLogin(!isLogin)}>
                  {isLogin ? "Don't have an account? Register here" : "Already have an account? Login here"}
                </button>
                {/* New link for company registration */}
                <p className="mt-3">
                  <a href="/register-company" className="btn btn-link text-decoration-none text-success">
                    Register Your Company or Shop Here (अपनी कंपनी या दुकान यहाँ रजिस्टर करें)
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-primary text-light text-center py-3 mt-5">
        <div className="container">
          <small>© {new Date().getFullYear()} Nectar Infotel. All rights reserved.</small>
        </div>
      </footer>

      <style jsx="true">{`
        body {
          background-color: #e6f0ff;
        }
        .welcome-box {
          background: linear-gradient(to right, #66b2ff, #3399ff);
          padding: 40px;
          border-bottom-left-radius: 20%;
          border-bottom-right-radius: 20%;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          margin-top: -16px;
        }
        .form-card {
          background: #f0f8ff;
          border-radius: 15px;
          transition: all 0.3s ease-in-out;
        }
        .form-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }
        .form-label {
          font-weight: 600;
        }
        .btn-primary, .btn-info {
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        input:focus {
          border-color: #0d6efd;
          box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
        }
        ::placeholder {
          color: #b0c4de;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
