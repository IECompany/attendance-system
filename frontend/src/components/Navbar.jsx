import React from "react";
import { Link } from "react-router-dom";
import { FaFingerprint } from "react-icons/fa";

const Navbar = () => {
  return (
    <>
      <style jsx="true">{`
        :root {
          /* --- Blue Monochromatic Palette --- */
          --ui-blue-primary: #2962FF; /* Main vibrant blue for accents */
          --ui-blue-dark: #0D47A1;    /* Darker shade for the navbar background */
          --ui-white: #FAFAFA;
        }

        .navbar {
          background-color: var(--ui-blue-dark);
          background-image: url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23FFFFFF' fill-opacity='0.05' fill-rule='evenodd'%3E%3Cpath d='M5 0h1L0 6V5zm1 5v1H5z'/%3E%3C/g%3E%3C/svg%3E");
          padding: 1rem 0;
          border-bottom: 3px solid var(--ui-blue-primary);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        }

        .navbar-brand {
          font-family: 'Poppins', sans-serif;
          font-weight: 700;
          font-size: 1.75rem;
          color: var(--ui-white) !important; /* Changed to white for better contrast */
          transition: color 0.3s ease;
        }
        
        .navbar-brand:hover {
          color: #bbdefb !important; /* A light blue for hover */
        }

        .navbar-toggler {
          border: none;
        }

        .navbar-toggler-icon {
          filter: invert(1);
        }

        .navbar-nav .nav-link {
          color: var(--ui-white) !important;
          font-weight: 500;
          position: relative;
          padding: 0.5rem 1rem;
        }

        .navbar-nav .nav-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 2px;
          background-color: var(--ui-blue-primary); /* Accent color for the underline */
          transition: width 0.3s ease;
        }
        
        .navbar-nav .nav-link:hover::after,
        .navbar-nav .nav-link.active::after {
          width: 80%;
        }

        @media (max-width: 991.98px) {
          .navbar-nav .nav-link::after {
            content: none;
          }
        }
      `}</style>

      <nav className="navbar navbar-expand-lg navbar-dark">
        <div className="container">
          <Link className="navbar-brand d-flex align-items-center" to="/">
            <FaFingerprint style={{ fontSize: "2rem", marginRight: "0.5rem" }} />
            AI-HRMS
          </Link>
          <button 
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNavAltMarkup"
            aria-controls="navbarNavAltMarkup"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNavAltMarkup">
            <div className="navbar-nav ms-auto">
              <Link className="nav-link active" aria-current="page" to="/">
                Home
              </Link>
              <Link className="nav-link" to="/login">
                Login
              </Link>
              <Link className="nav-link" to="/contact">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
