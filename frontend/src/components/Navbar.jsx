import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div className="container">
        <img 
          src="/nectar-logo.png" 
          alt="Nectar Logo" 
          height={30} 
          width={35} 
          className="me-2"
        />
        <Link className="navbar-brand fw-bold fs-3" to="/">
          Nectar Infotel
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
          <div className="navbar-nav ms-auto fs-5">
            {/* Nav links here */}
          </div>
        </div>
      </div>

      <style>{`
        .nav-link:hover {
          color: #ffc107 !important;
          text-decoration: underline;
        }
        .nav-link.active {
          color: #fff !important;
          background-color: #0d6efd;
          border-radius: 5px;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
