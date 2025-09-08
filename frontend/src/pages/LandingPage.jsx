import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "../components/Navbar";
import {
  FaUserCheck,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaReceipt,
  FaClock,
  FaStar
} from 'react-icons/fa';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStartedClick = () => {
    navigate('/login');
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
          font-family: 'Poppins', sans-serif;
          background-color: var(--ui-white);
          color: var(--ui-dark);
        }

        .hero-section {
          background: linear-gradient(135deg, var(--ui-turquoise) 0%, #004d40 100%);
          color: var(--ui-white);
          padding: 120px 0;
          text-align: center;
          position: relative;
          z-index: 1;
        }
        
        .hero-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: url('data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M0 100h100V0C50 0 0 50 0 100z" fill="%23000000" fill-opacity="0.05"/%3E%3C/svg%3E');
            background-size: 50px;
            opacity: 0.5;
            z-index: -1;
        }

        .hero-section h1 {
          font-weight: 700;
          font-size: 3.5rem;
          margin-bottom: 1rem;
        }

        .hero-section p {
          font-size: 1.25rem;
          opacity: 0.9;
        }

        .btn-get-started {
          background-color: var(--ui-orange);
          color: var(--ui-white);
          font-weight: 600;
          padding: 14px 32px;
          border-radius: 50px;
          border: none;
          transition: transform var(--transition-speed), box-shadow var(--transition-speed);
        }

        .btn-get-started:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(255, 143, 0, 0.3);
        }

        .features-section {
          padding: 80px 0;
        }

        .section-heading {
          font-weight: 700;
          font-size: 2.5rem;
          color: var(--ui-turquoise);
          margin-bottom: 50px;
          position: relative;
          display: inline-block;
        }
        
        .section-heading::after {
            content: '';
            position: absolute;
            left: 50%;
            bottom: -10px;
            transform: translateX(-50%);
            width: 60px;
            height: 4px;
            background-color: var(--ui-orange);
            border-radius: 2px;
        }

        .feature-card {
          background-color: var(--ui-white);
          border-radius: 15px;
          padding: 2.5rem;
          text-align: center;
          box-shadow: var(--box-shadow-light);
          transition: all var(--transition-speed);
        }

        .feature-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.15);
        }

        .feature-icon-wrapper {
          background-color: #e0f2f1;
          color: var(--ui-turquoise);
          width: 70px;
          height: 70px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
        }
        
        .feature-icon {
            font-size: 2rem;
        }

        .feature-card h5 {
          font-weight: 600;
          color: var(--ui-dark);
          margin-bottom: 0.5rem;
        }

        .feature-card p {
          font-size: 0.95rem;
          color: var(--ui-gray);
        }
        
        .cta-banner {
            background: linear-gradient(45deg, var(--ui-orange), #ffc107);
            color: var(--ui-white);
            padding: 50px;
            border-radius: 15px;
            text-align: center;
            box-shadow: var(--box-shadow-light);
        }
        
        .cta-banner h3 {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 1rem;
        }
        
        .cta-banner p {
            font-size: 1.1rem;
            margin-bottom: 2rem;
        }
        
        .ad-space {
          border: 2px dashed var(--ui-turquoise);
          background-color: #f7fcfc;
          border-radius: 15px;
          text-align: center;
          padding: 30px;
          margin: 50px 0; /* Updated margin for spacing */
        }
        
        .ad-space p {
            color: var(--ui-gray);
        }

        .footer {
          background-color: var(--ui-turquoise);
          color: var(--ui-white);
          padding: 20px 0;
          text-align: center;
        }
      `}</style>
      
      <Navbar />

      {/* Hero Section */}
      <header className="hero-section">
        <div className="container">
          <h1 className="fw-bold">Manage Your Team, Effortlessly</h1>
          <p className="mt-3">
            A free, powerful platform to simplify daily attendance, payroll, and more for your business.
          </p>
          <button
            onClick={handleGetStartedClick}
            className="btn btn-get-started mt-4 shadow-sm"
          >
            Get Started
          </button>
        </div>
      </header>
      
      {/* First Ad Space (Placed just below the hero section) */}
      <div className="container">
        <div className="ad-space">
          <p className="text-muted">Advertisement (Google Ads)</p>
          <div style={{ height: '100px', backgroundColor: '#e9ecef', marginTop: '15px', borderRadius: '8px' }}>
            <p style={{ paddingTop: '40px' }}>[Your Ad Content]</p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="text-center section-heading">Key Features</h2>
          <div className="row g-4 justify-content-center">
            <div className="col-md-6 col-lg-4">
              <div className="feature-card h-100">
                <div className="feature-icon-wrapper">
                    <FaUserCheck className="feature-icon" />
                </div>
                <h5>Daily Attendance Management</h5>
                <p>
                  Effortlessly track and manage your employees' daily attendance with a powerful, intuitive system.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="feature-card h-100">
                <div className="feature-icon-wrapper">
                    <FaClock className="feature-icon" />
                </div>
                <h5>Simple Check-in & Check-out</h5>
                <p>
                  A streamlined check-in and check-out process for accurate and reliable timekeeping.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="feature-card h-100">
                <div className="feature-icon-wrapper">
                    <FaMapMarkerAlt className="feature-icon" />
                </div>
                <h5>Live Location with Geo-tagging</h5>
                <p>
                  Secure proof of presence by capturing your team's live location with a geo-tagged image.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="feature-card h-100">
                <div className="feature-icon-wrapper">
                    <FaMoneyBillWave className="feature-icon" />
                </div>
                <h5>Easy Salary Calculation</h5>
                <p>
                  Reduce manual effort with automatic salary calculations based on attendance and hours worked.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="feature-card h-100">
                <div className="feature-icon-wrapper">
                    <FaReceipt className="feature-icon" />
                </div>
                <h5>Professional Salary Slips</h5>
                <p>
                  Instantly generate and download professional, customizable salary slips for your entire team.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="feature-card h-100">
                <div className="feature-icon-wrapper">
                    <FaStar className="feature-icon" />
                </div>
                <h5>Completely Free to Use</h5>
                <p>
                  Start managing your employees today with no charges, hidden fees, or subscriptions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Second Ad Space (Placed between features and CTA) */}
      <div className="container">
        <div className="ad-space">
          <p className="text-muted">Advertisement (Google Ads)</p>
          <div style={{ height: '100px', backgroundColor: '#e9ecef', marginTop: '15px', borderRadius: '8px' }}>
            <p style={{ paddingTop: '40px' }}>[Your Ad Content]</p>
          </div>
        </div>
      </div>

      {/* Call to Action Banner */}
      <div className="container my-5">
          <div className="cta-banner">
              <h3>Ready to simplify your business?</h3>
              <p>Start your free journey with us today and manage your employees with confidence.</p>
              <button
                onClick={handleGetStartedClick}
                className="btn btn-get-started"
              >
                Sign Up Now
              </button>
          </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <small>© {new Date().getFullYear()} Nectar Infotel. All rights reserved.</small>
        </div>
      </footer>
    </>
  );
};

export default LandingPage;
