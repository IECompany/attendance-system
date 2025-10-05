import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "../components/Navbar";
import {
  FaUserCheck,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaReceipt,
  FaClock,
  FaStar,
  FaMobileAlt,
  FaShieldAlt,
  FaCogs,
  FaTwitter,
  FaLinkedin,
  FaFacebook
} from 'react-icons/fa';
import Chatbot from '../components/Chatbot.jsx'; // IMPORT THE CHATBOT HERE

// IMPORT YOUR VIDEOS HERE
import video1 from '../assets/video1.mp4';
import video2 from '../assets/video2.mp4';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStartedClick = () => {
    navigate('/login');
  };

  return (
    <>
      <style jsx="true">{`
        :root {
          /* --- Blue Monochromatic Palette --- */
          --ui-blue-primary: #2962FF; /* Main vibrant blue */
          --ui-blue-dark: #0D47A1;    /* Darker shade for gradients */
          --ui-blue-light: #E3F2FD;   /* Light background for icons */
          
          /* --- Neutral Colors --- */
          --ui-white: #FFFFFF;
          --ui-off-white: #f8f9fa;
          --ui-dark: #212529;
          --ui-gray: #6c757d;
          
          /* --- UI Effects --- */
          --box-shadow-light: 0 4px 12px rgba(0,0,0,0.08);
          --box-shadow-strong: 0 12px 30px rgba(0,0,0,0.15);
          --transition-speed: 0.3s ease;
        }
        
        body {
          font-family: 'Poppins', sans-serif;
          background-color: var(--ui-white);
          color: var(--ui-dark);
        }

        .hero-section {
          background: linear-gradient(135deg, var(--ui-blue-primary) 0%, var(--ui-blue-dark) 100%);
          color: var(--ui-white);
          padding: 100px 0;
          display: flex;
          align-items: center;
          min-height: 85vh;
        }

        .hero-content h1 {
          font-weight: 700;
          font-size: 3.5rem;
          margin-bottom: 1rem;
        }

        .hero-content p {
          font-size: 1.25rem;
          opacity: 0.9;
          max-width: 500px;
        }
        
        .hero-image {
          background-image: url('https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=2070&auto=format&fit=crop');
          background-size: cover;
          background-position: center;
          border-radius: 20px;
          min-height: 400px;
          box-shadow: var(--box-shadow-strong);
        }

        .btn-get-started {
          background-color: var(--ui-white);
          color: var(--ui-blue-primary);
          font-weight: 600;
          padding: 14px 32px;
          border-radius: 50px;
          border: none;
          transition: transform var(--transition-speed), box-shadow var(--transition-speed);
        }

        .btn-get-started:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(255, 255, 255, 0.25);
        }
        
        .section-padding {
            padding: 80px 0;
        }
        
        .bg-light {
            background-color: var(--ui-off-white);
        }

        .section-heading {
          font-weight: 700;
          font-size: 2.5rem;
          color: var(--ui-blue-dark);
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
            background-color: var(--ui-blue-primary);
            border-radius: 2px;
        }

        .feature-card {
          background-color: var(--ui-white);
          border-radius: 15px;
          padding: 2.5rem;
          text-align: center;
          box-shadow: var(--box-shadow-light);
          transition: all var(--transition-speed);
          border: 1px solid #eee;
        }

        .feature-card:hover {
          transform: translateY(-10px);
          box-shadow: var(--box-shadow-strong);
        }

        .feature-icon-wrapper {
          background-color: var(--ui-blue-light);
          color: var(--ui-blue-primary);
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
        
        .ad-space {
          border: 2px dashed var(--ui-blue-primary);
          background-color: #f8faff;
          border-radius: 15px;
          text-align: center;
          padding: 30px;
          margin: 60px 0;
        }
        
        .ad-space > p {
            color: var(--ui-gray);
        }

        .step-card {
            text-align: center;
        }
        .step-number {
            background-color: var(--ui-blue-primary);
            color: var(--ui-white);
            font-size: 1.5rem;
            font-weight: 700;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1rem;
            box-shadow: 0 5px 15px rgba(41, 98, 255, 0.3);
        }
        .step-card h5 {
            font-weight: 600;
            color: var(--ui-dark);
        }
        
        /* --- New Video Section --- */
        .video-card {
          background-color: var(--ui-white);
          border-radius: 15px;
          padding: 1.5rem;
          box-shadow: var(--box-shadow-light);
          border: 1px solid #eee;
          transition: all var(--transition-speed);
        }
        .video-card:hover {
          transform: translateY(-10px);
          box-shadow: var(--box-shadow-strong);
        }
        .video-player {
          width: 100%;
          border-radius: 8px;
          margin-bottom: 1rem;
        }
        .video-card h5 {
          font-weight: 600;
          color: var(--ui-dark);
          margin: 0;
        }

        .promo-banner {
          background: linear-gradient(135deg, var(--ui-blue-dark) 0%, var(--ui-blue-primary) 100%);
          color: var(--ui-white);
          border-radius: 20px;
          padding: 50px;
          display: flex;
          align-items: center;
        }
        .promo-banner-icon {
          font-size: 5rem;
          margin-right: 40px;
          opacity: 0.8;
        }
        .promo-banner h3 {
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .testimonial-card {
            background-color: var(--ui-white);
            border-radius: 15px;
            padding: 2rem;
            box-shadow: var(--box-shadow-light);
            border: 1px solid #eee;
        }
        .testimonial-card p {
            font-style: italic;
            color: var(--ui-gray);
        }
        .testimonial-author {
            display: flex;
            align-items: center;
            margin-top: 1.5rem;
        }
        .testimonial-author img {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            margin-right: 15px;
        }
        .author-info h6 {
            font-weight: 600;
            margin: 0;
        }
        .author-info span {
            font-size: 0.9rem;
            color: var(--ui-gray);
        }

        .footer {
          background-color: var(--ui-blue-dark);
          color: var(--ui-white);
          padding: 60px 0 20px 0;
        }
        .footer h5 {
            font-weight: 600;
            margin-bottom: 1.5rem;
            color: var(--ui-white);
        }
        .footer-links {
            list-style: none;
            padding: 0;
        }
        .footer-links li {
            margin-bottom: 0.8rem;
        }
        .footer-links a {
            color: rgba(255, 255, 255, 0.8);
            text-decoration: none;
            transition: color var(--transition-speed);
        }
        .footer-links a:hover {
            color: var(--ui-white);
        }
        .social-icons a {
            color: var(--ui-white);
            font-size: 1.5rem;
            margin-right: 15px;
            transition: color var(--transition-speed);
        }
        .social-icons a:hover {
            color: var(--ui-blue-light);
        }
        .footer-bottom {
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            padding-top: 20px;
            margin-top: 40px;
            text-align: center;
            font-size: 0.9rem;
            color: rgba(255, 255, 255, 0.7);
        }
      `}</style>
      
      <Navbar />

      {/* Hero Section */}
      <header className="hero-section">
        <div className="container">
          <div className="row align-items-center g-5">
              <div className="col-lg-6 hero-content">
                  <h1 className="fw-bold">Manage Your Team, Effortlessly</h1>
                  <p className="mt-3">
                    Our all-in-one HR platform simplifies attendance, payroll, appraisals, and employee activities with a secure, geotagged system.
                  </p>
                  <button
                    onClick={handleGetStartedClick}
                    className="btn btn-get-started mt-4 shadow-sm"
                  >
                    Get Started For Free
                  </button>
              </div>
              <div className="col-lg-6">
                <div className="hero-image"></div>
              </div>
          </div>
        </div>
      </header>

      {/* First Ad Space */}
      <div className="container">
        <div className="ad-space">
          <p className="text-muted">Advertisement (Google Ads)</p>
          <div style={{ height: '90px', backgroundColor: '#e9ecef', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p className='m-0'>[Your 728x90 Ad Content]</p>
          </div>
        </div>
      </div>
      
      {/* How It Works Section */}
      <section className="section-padding">
        <div className="container">
          <h2 className="text-center section-heading">Get Started in 3 Easy Steps</h2>
          <div className="row g-5 mt-4">
              <div className="col-md-4">
                  <div className="step-card">
                      <div className="step-number">1</div>
                      <h5>Create Your Company</h5>
                      <p>Sign up in seconds and set up your company profile. It's completely free.</p>
                  </div>
              </div>
              <div className="col-md-4">
                  <div className="step-card">
                      <div className="step-number">2</div>
                      <h5>Add Your Employees</h5>
                      <p>Easily onboard your team members to the platform with a simple import or manual entry.</p>
                  </div>
              </div>
              <div className="col-md-4">
                  <div className="step-card">
                      <div className="step-number">3</div>
                      <h5>Start Managing</h5>
                      <p>Begin tracking attendance, processing salaries, and managing activities in real-time.</p>
                  </div>
              </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-padding bg-light">
        <div className="container">
          <h2 className="text-center section-heading">A Powerful, All-in-One Solution</h2>
          <div className="row g-4 justify-content-center mt-4">
            <div className="col-md-6 col-lg-4">
              <div className="feature-card h-100">
                <div className="feature-icon-wrapper"><FaClock className="feature-icon" /></div>
                <h5>Automated Attendance</h5>
                <p>Streamline check-in and check-out with our accurate and reliable timekeeping system.</p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="feature-card h-100">
                <div className="feature-icon-wrapper"><FaMapMarkerAlt className="feature-icon" /></div>
                <h5>Geotagged Security</h5>
                <p>Ensure proof of presence by capturing your team's live location with a secure, geo-tagged image.</p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="feature-card h-100">
                <div className="feature-icon-wrapper"><FaMoneyBillWave className="feature-icon" /></div>
                <h5>Effortless Payroll</h5>
                <p>Automatically calculate salaries based on attendance, overtime, and company policies.</p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="feature-card h-100">
                <div className="feature-icon-wrapper"><FaReceipt className="feature-icon" /></div>
                <h5>Instant Salary Slips</h5>
                <p>Generate and download professional, customizable salary slips for your entire team in one click.</p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
                <div className="feature-card h-100">
                    <div className="feature-icon-wrapper"><FaStar className="feature-icon" /></div>
                    <h5>Performance Appraisals</h5>
                    <p>Track employee performance and conduct appraisals with structured feedback and goals.</p>
                </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="feature-card h-100">
                <div className="feature-icon-wrapper"><FaShieldAlt className="feature-icon" /></div>
                <h5>Secure & Reliable</h5>
                <p>Your data is always safe with our industry-leading security and robust infrastructure.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Second Ad Space */}
      <div className="container">
        <div className="ad-space">
          <p className="text-muted">Advertisement (Google Ads)</p>
          <div style={{ height: '90px', backgroundColor: '#e9ecef', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p className='m-0'>[Your 728x90 Ad Content]</p>
          </div>
        </div>
      </div>

      {/* Video Section (NEW) */}
      <section className="section-padding">
        <div className="container">
            <h2 className="text-center section-heading">See It In Action</h2>
            <div className="row g-4 justify-content-center mt-4">
                <div className="col-lg-6">
                    <div className="video-card">
                        <video className="video-player" src={video1} controls muted loop playsInline></video>
                        <h5>Streamlined Employee Onboarding</h5>
                    </div>
                </div>
                <div className="col-lg-6">
                    <div className="video-card">
                        <video className="video-player" src={video2} controls muted loop playsInline></video>
                        <h5>One-Click Payroll Generation</h5>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Promo Banner Section */}
      <section className="section-padding bg-light">
        <div className="container">
          <div className="promo-banner">
            <FaMobileAlt className="promo-banner-icon" />
            <div>
              <h3>Manage On The Go</h3>
              <p>Our mobile app lets your employees check in from anywhere and allows you to manage your team from the palm of your hand. Complete with geotagging for total peace of mind.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section-padding">
        <div className="container">
          <h2 className="text-center section-heading">Trusted by Businesses Like Yours</h2>
          <div className="row g-4 mt-4">
              <div className="col-lg-4">
                  <div className="testimonial-card">
                      <p>"This HRMS has been a game-changer... Managing attendance and payroll used to take hours, now it's just a few clicks."</p>
                      <div className="testimonial-author">
                          <img src="https://i.pravatar.cc/150?img=1" alt="Author" />
                          <div className="author-info">
                              <h6>Sarah Johnson</h6>
                              <span>CEO, Innovatech</span>
                          </div>
                      </div>
                  </div>
              </div>
              <div className="col-lg-4">
                  <div className="testimonial-card">
                      <p>"The geotagging feature is fantastic. It gives us the assurance we need for our remote sales team. Highly recommended!"</p>
                      <div className="testimonial-author">
                          <img src="https://i.pravatar.cc/150?img=2" alt="Author" />
                          <div className="author-info">
                              <h6>Mark Davis</h6>
                              <span>Operations Manager, BuildRight</span>
                          </div>
                      </div>
                  </div>
              </div>
              <div className="col-lg-4">
                  <div className="testimonial-card">
                      <p>"We switched to this platform because it's free and powerful. We stayed because the support is excellent and it's incredibly easy to use."</p>
                      <div className="testimonial-author">
                          <img src="https://i.pravatar.cc/150?img=3" alt="Author" />
                          <div className="author-info">
                              <h6>Jessica Chen</h6>
                              <span>Founder, Creative Minds</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
        </div>
      </section>
      
      {/* ADD THE CHATBOT HERE, JUST ABOVE THE FOOTER */}
      <Chatbot />

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="row">
              <div className="col-lg-4 mb-4 mb-lg-0">
                  <h5>AIHRMS</h5>
                  <p className="text-white-50">The complete solution for modern human resource management. Simplify your operations and empower your team.</p>
              </div>
              <div className="col-lg-2 col-md-4 col-6 mb-4 mb-lg-0">
                  <h5>Company</h5>
                  <ul className="footer-links">
                      <li><a href="#">About Us</a></li>
                      <li><a href="#">Careers</a></li>
                      <li><a href="#">Blog</a></li>
                      <li><a href="#">Contact</a></li>
                  </ul>
              </div>
              <div className="col-lg-2 col-md-4 col-6 mb-4 mb-lg-0">
                  <h5>Legal</h5>
                  <ul className="footer-links">
                      <li><a href="#">Privacy Policy</a></li>
                      <li><a href="#">Terms of Service</a></li>
                      <li><a href="#">Security</a></li>
                  </ul>
              </div>
              <div className="col-lg-4 col-md-4">
                  <h5>Follow Us</h5>
                  <div className="social-icons">
                      <a href="#"><FaTwitter /></a>
                      <a href="#"><FaFacebook /></a>
                      <a href="#"><FaLinkedin /></a>
                  </div>
              </div>
          </div>
          <div className="footer-bottom">
            <small>© {new Date().getFullYear()} Nectar Infotel. All rights reserved.</small>
          </div>
        </div>
      </footer>
    </>
  );
};

export default LandingPage;
