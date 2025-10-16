import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../authContext";
import { FaUserPlus, FaSignInAlt } from 'react-icons/fa';
import ReCAPTCHA from "react-google-recaptcha";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

const Dashboard = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [captchaValue, setCaptchaValue] = useState(null);

  const navigate = useNavigate();
  const { login, user: authUser } = useAuth();
  const recaptchaRef = useRef(null);

  useEffect(() => {
    setErrorMessage("");
  }, [isLogin]);

  const onCaptchaChange = (value) => {
    setCaptchaValue(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    if (!captchaValue) {
      setErrorMessage("Please complete the reCAPTCHA.");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const res = await fetch(`${API_BASE_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ loginId, password, recaptchaToken: captchaValue }),
        });

        let data;
        try {
          data = await res.json();
        } catch {
          setErrorMessage("Failed to process server response.");
          setLoading(false);
          return;
        }

        if (!res.ok || !data?.user) {
          setErrorMessage(data.message || "Login failed.");
          setLoading(false);
          return;
        }

        login(data.user, data.token);

        if (data.user.userType === "superadmin") navigate("/super-admin-panel");
        else if (data.user.userType === "admin") navigate("/admin-panel");
        else navigate("/user-dashboard");

      } else {
        if (password !== confirmPassword) {
          setErrorMessage("Passwords do not match!");
          setLoading(false);
          return;
        }

        const tempCompanyId = "60c72b2f9b1e8e001c8e8e8e";
        const res = await fetch(`${API_BASE_URL}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email: loginId, password, companyId: tempCompanyId, recaptchaToken: captchaValue }),
        });

        const data = await res.json();

        if (!res.ok) {
          setErrorMessage(data.message || "Registration failed");
          setLoading(false);
          return;
        }

        login(data.user, data.token);

        setErrorMessage("Registered and logged in successfully!");
        setTimeout(() => {
          if (data.user.userType === "superadmin") navigate("/super-admin-panel");
          else if (data.user.userType === "admin") navigate("/admin-panel");
          else navigate("/user-dashboard");
        }, 1000);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      if (recaptchaRef.current) recaptchaRef.current.reset();
      setLoading(false);
    }
  };

  return (
    <>
            <style jsx="true">{`
        :root {
          /* --- Blue Monochromatic Palette --- */
          --ui-blue-primary: #2962FF; /* Main vibrant blue */
          --ui-blue-dark: #0D47A1;    /* Darker shade for gradients and hovers */
          
          /* --- Neutral Colors --- */
          --ui-white: #FAFAFA;
          --ui-dark: #333;
          --ui-gray: #6c757d;

          /* --- UI Effects --- */
          --box-shadow-light: 0 4px 12px rgba(0,0,0,0.08);
          --transition-speed: 0.3s;
        }
        
        body {
          background-color: var(--ui-white);
          font-family: 'Poppins', sans-serif;
          color: var(--ui-dark);
        }

        .login-hero {
          background: linear-gradient(135deg, var(--ui-blue-primary) 0%, var(--ui-blue-dark) 100%);
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
          border-color: var(--ui-blue-primary);
          box-shadow: 0 0 0 3px rgba(41, 98, 255, 0.15);
        }

        .btn-submit {
          font-weight: 600;
          padding: 12px;
          border-radius: 8px;
          transition: all var(--transition-speed);
          background-color: var(--ui-blue-primary);
          color: var(--ui-white);
          border: none;
        }
        
        .btn-submit:hover {
          background-color: var(--ui-blue-dark);
        }
        
        .btn-toggle {
            color: var(--ui-gray);
            font-size: 0.9rem;
            transition: color var(--transition-speed);
        }
        
        .btn-toggle:hover {
            color: var(--ui-blue-primary);
        }
        
        .link-company-reg {
            color: var(--ui-blue-primary);
            font-weight: 500;
            transition: color var(--transition-speed);
        }
        
        .link-company-reg:hover {
            color: var(--ui-blue-dark);
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
          <p>Your journey to simplified workforce management begins here.</p>
        </div>
      </div>

      <div className="container auth-container">
        <div className="row justify-content-center">
          <div className="col-lg-5 col-md-7">
            <div className="auth-card">
              <h4 className="text-center form-title">
                {isLogin ? <FaSignInAlt /> : <FaUserPlus />}
                {isLogin ? "Login to Your Account" : "Create a New Account"}
              </h4>

              <div className="ad-space">
                <p className="text-muted small mb-0">Advertisement</p>
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
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                )}

                {/* reCAPTCHA */}
                <div className="mb-3">
                  <ReCAPTCHA
                    sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                    onChange={onCaptchaChange}
                    ref={recaptchaRef}
                  />
                </div>

                {errorMessage && (
                  <div className={`alert ${errorMessage.includes("successfully") ? "alert-success" : "alert-danger"} mt-3`}>
                    {errorMessage}
                  </div>
                )}

                <button type="submit" className="btn btn-submit w-100 mt-3" disabled={loading}>
                  {loading ? (isLogin ? "Logging In..." : "Registering...") : (isLogin ? "Login" : "Register")}
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
