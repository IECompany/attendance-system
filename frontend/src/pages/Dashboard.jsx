import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../authContext";
import { FaUserPlus, FaSignInAlt } from 'react-icons/fa'; // Import icons

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

const Dashboard = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [loginId, setLoginId] = useState("");
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

    try {
      if (isLogin) {
        // CORRECTED: Await the fetch call and store the response in a variable.
        const res = await fetch(`${API_BASE_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ loginId, password }),
        });
        
        // This is the correct way to parse and handle the response
        let data;
        try {
          data = await res.json();
        } catch (parseError) {
          // If the server returns a non-JSON response (e.g., an empty body), this will catch it.
          console.error("Failed to parse response JSON:", parseError);
          setErrorMessage("Failed to process server response. Please check server logs.");
          setLoading(false);
          return;
        }

        console.log('Login API Response Status:', res.status);
        console.log('Login API Response Data:', data);
        
        // Handle server-side errors
        if (!res.ok) {
          setErrorMessage(data.message || "Login failed due to a server error.");
          setLoading(false);
          return;
        }

        // Check for user data within the parsed response
        if (!data || !data.user) {
          console.log('User data not found in response.');
          setErrorMessage(data.message || "Login failed. User data is missing from the response.");
          setLoading(false);
          return;
        }

        console.log('User Type from Response:', data.user.userType);
        console.log('Company ID from Response:', data.user.companyId);
        console.log('User Name from Response:', data.user.name);
        console.log('User ID from Response:', data.user.userId);
        
        const { token, user } = data;
        
        console.log('Calling useAuth login with user:', user);
        console.log('Calling useAuth login with token:', token ? 'present' : 'missing');
        login(user, token);
        
        console.log('Attempting redirection based on userType:', user.userType);
        if (user.userType === "superadmin") {
          navigate("/super-admin-panel");
        } else if (user.userType === "admin") {
          navigate("/admin-panel");
        } else {
          navigate("/user-dashboard");
        }

      } else { // Registration
        if (password !== confirmPassword) {
          setErrorMessage("Passwords do not match!");
          setLoading(false);
          return;
        }
        
        const tempCompanyId = "60c72b2f9b1e8e001c8e8e8e"; // Placeholder - REPLACE with actual logic
        
        // CORRECTED: Await the fetch and store the response.
        const res = await fetch(`${API_BASE_URL}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email: loginId, password, companyId: tempCompanyId }),
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          setErrorMessage(data.message || "Registration failed");
          setLoading(false);
          return;
        }
        
        const { token, user } = data;
        
        login(user, token);
        
        setErrorMessage("Registered and logged in successfully!");
        setTimeout(() => {
          if (user.userType === "superadmin") {
            navigate("/super-admin-panel");
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
    <>
      <style jsx="true">{`
        :root {
          --ui-orange: #FF8F00;
          --ui-turquoise: #00796B;
          --ui-white: #FAFAFA;
          --ui-dark: #333;
          --ui-gray: #6c757d;
          --box-shadow-light: 0 4px 12px rgba(0,0,0,0.08);
          --transition-speed: 0.3s;
        }
        
        body {
          background-color: var(--ui-white);
          font-family: 'Poppins', sans-serif;
          color: var(--ui-dark);
        }

        .login-hero {
          background: linear-gradient(135deg, var(--ui-turquoise) 0%, #004d40 100%);
          color: var(--ui-white);
          padding: 80px 0;
          text-align: center;
          position: relative;
          z-index: 1;
        }
        
        .login-hero h2 {
          font-weight: 700;
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }

        .login-hero p {
          font-size: 1.1rem;
          opacity: 0.9;
        }

        .auth-container {
          position: relative;
          z-index: 2;
          margin-top: -60px; /* Overlap with hero section */
        }
        
        .auth-card {
          background-color: var(--ui-white);
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          padding: 2.5rem;
          transition: all var(--transition-speed);
        }
        
        .auth-card:hover {
            box-shadow: 0 15px 40px rgba(0,0,0,0.15);
        }
        
        .form-title {
          font-weight: 600;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        
        .form-label {
          font-weight: 500;
          color: var(--ui-dark);
        }

        .form-control {
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          padding: 10px 15px;
          transition: all var(--transition-speed);
        }
        
        .form-control:focus {
          border-color: var(--ui-turquoise);
          box-shadow: 0 0 0 3px rgba(0, 121, 107, 0.1);
        }

        .btn-submit {
          font-weight: 600;
          padding: 12px;
          border-radius: 8px;
          transition: all var(--transition-speed);
          background-color: var(--ui-turquoise);
          color: var(--ui-white);
          border: none;
        }
        
        .btn-submit:hover {
          background-color: #005f54;
        }
        
        .btn-toggle {
            color: var(--ui-gray);
            font-size: 0.9rem;
            transition: color var(--transition-speed);
        }
        
        .btn-toggle:hover {
            color: var(--ui-turquoise);
        }
        
        .link-company-reg {
            color: var(--ui-orange);
            font-weight: 500;
            transition: color var(--transition-speed);
        }
        
        .link-company-reg:hover {
            color: #cc7200;
        }

        .footer {
          background-color: #f8f9fa;
          color: var(--ui-gray);
          padding: 20px 0;
          text-align: center;
          margin-top: 50px;
        }
        
        /* Ad Space Styling */
        .ad-space {
          background-color: #f0f0f0;
          border: 1px dashed #ccc;
          padding: 2rem;
          text-align: center;
          border-radius: 15px;
          margin-top: 2rem;
        }
      `}</style>

      <Navbar />

      <div className="login-hero">
        <div className="container">
          <h2>Welcome Back!</h2>
          <p>
            Your journey to simplified workforce management begins here.
          </p>
        </div>
      </div>

      <div className="container auth-container">
        <div className="row justify-content-center">
          <div className="col-lg-5 col-md-7">
            {/* Main authentication card */}
            <div className="auth-card">
              <h4 className="text-center form-title">
                {isLogin ? <FaSignInAlt /> : <FaUserPlus />}
                {isLogin ? "Login to Your Account" : "Create a New Account"}
              </h4>
              
              {/* This is the new ad space div, moved to a more visible location */}
              <div className="ad-space">
                <p className="text-muted small mb-0">Advertisement</p>
                {/* Your actual ad code (e.g., Google AdSense) goes here */}
                <div style={{ height: '100px', backgroundColor: '#e9ecef', marginTop: '10px', borderRadius: '8px' }}>
                  <p style={{ paddingTop: '40px' }}>[Your Ad Content]</p>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {!isLogin && (
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">Employee Name</label>
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
                  <label htmlFor="loginId" className="form-label">Email ID or Company ID</label>
                  <input
                    type="text"
                    id="loginId"
                    className="form-control"
                    placeholder="Enter your Email or Company ID"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password</label>
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
                    <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
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
                  <div className={`alert ${errorMessage.includes("successfully") ? "alert-success" : "alert-danger"} mt-3`}>
                    {errorMessage}
                  </div>
                )}

                <button type="submit" className="btn btn-submit w-100 mt-3" disabled={loading}>
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
              <div className="text-center mt-4">
                <button className="btn btn-link btn-toggle" onClick={() => setIsLogin(!isLogin)}>
                  {isLogin ? "Don't have an account? Register here" : "Already have an account? Login here"}
                </button>
                <p className="mt-3">
                  <a href="/register-company" className="link-company-reg">
                    Register Your Company or Shop Here (अपनी कंपनी या दुकान यहाँ रजिस्टर करें)
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="footer">
        <div className="container">
          <small>© {new Date().getFullYear()} Nectar Infotel. All rights reserved.</small>
        </div>
      </footer>
    </>
  );
};

export default Dashboard;
