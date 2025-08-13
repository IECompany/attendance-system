// frontend/src/App.jsx (Partial update)

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './authContext'; // Make sure authContext is correctly set up

// Import your pages
import Dashboard from './pages/Dashboard'; // Likely your combined Login/Registration for users
import MainDashboard from './pages/MainDashboard'; // User's main dashboard
import AdminPanel from './pages/AdminPanel'; // Admin's dashboard
import SuperAdminPanel from './pages/SuperAdminPanel'; // Super Admin's dashboard
import CompanyRegister from './pages/CompanyRegister'; // <-- NEW: Import CompanyRegister

// You might have other imports like Navbar, etc.

// PrivateRoute component (if you don't have one, consider adding for protected routes)
const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth(); // Assuming useAuth gives user object and loading state

  if (loading) {
    return <div>Loading authentication...</div>; // Or a spinner
  }

  if (!user) {
    // Not authenticated, redirect to login (or company registration if that's the entry point)
    return <Navigate to="/login" />; // Redirect to login
  }

  if (allowedRoles && !allowedRoles.includes(user.userType)) {
    // Authenticated but not authorized, redirect to unauthorized page or dashboard
    return <Navigate to="/unauthorized" />; // You might create an Unauthorized page
  }

  return children;
};


function App() {
  return (
    <Router>
      <AuthProvider> {/* Wrap your application with AuthProvider */}
        {/* <Navbar /> // You might want a conditional navbar based on auth status/role */}
        <Routes>
          {/* Public Routes */}
          {/* This route will be the entry point for new company registration */}
          <Route path="/register-company" element={<CompanyRegister />} /> {/* <-- NEW ROUTE */}
          <Route path="/login" element={<Dashboard />} /> {/* Your existing login/user registration */}
          <Route path="/" element={<Navigate to="/login" />} /> {/* Default redirect */}
          <Route path="/unauthorized" element={<div>You are not authorized to view this page.</div>} /> {/* Optional */}

          {/* Protected Routes - Example usage */}
          <Route
            path="/user-dashboard"
            element={
              <PrivateRoute allowedRoles={['user']}>
                <MainDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin-panel"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminPanel />
              </PrivateRoute>
            }
          />
          <Route
            path="/super-admin-panel"
            element={
              <PrivateRoute allowedRoles={['superadmin']}>
                <SuperAdminPanel />
              </PrivateRoute>
            }
          />

          {/* Fallback for unmatched routes */}
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;