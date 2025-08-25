import React from "react";
import { FaSignInAlt } from 'react-icons/fa';

const Login = () => {
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

        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--ui-white);
          font-family: 'Poppins', sans-serif;
        }

        .login-card {
          background-color: var(--ui-white);
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          padding: 2.5rem;
          max-width: 450px;
          width: 100%;
          transition: all var(--transition-speed);
        }
        
        .login-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(0,0,0,0.15);
        }

        .login-heading {
          text-align: center;
          font-weight: 700;
          color: var(--ui-turquoise);
          font-size: 2rem;
          margin-bottom: 2rem;
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
          outline: none;
        }
        
        .btn-login {
            font-weight: 600;
            padding: 12px;
            border-radius: 8px;
            transition: all var(--transition-speed);
            background-color: var(--ui-turquoise);
            color: var(--ui-white);
            border: none;
        }

        .btn-login:hover {
            background-color: #005f54;
            transform: translateY(-2px);
        }
      `}</style>
      <div className="login-container">
        <div className="login-card">
          <h2 className="login-heading">
            <FaSignInAlt className="me-2" /> Login
          </h2>
          <form>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input 
                type="email" 
                className="form-control" 
                id="email" 
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input 
                type="password" 
                className="form-control" 
                id="password" 
                placeholder="Enter password" 
                required
              />
            </div>
            <button type="submit" className="btn btn-login w-100">
              Login
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;