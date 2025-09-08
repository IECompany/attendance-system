// frontend/src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './authContext';

// Import your pages
import Dashboard from './pages/Dashboard';
import MainDashboard from './pages/MainDashboard';
import AdminPanel from './pages/AdminPanel';
import SuperAdminPanel from './pages/SuperAdminPanel';
import CompanyRegister from './pages/CompanyRegister';
import LandingPage from './pages/LandingPage'; // <-- NEW: Import the new component

// PrivateRoute component (no changes)
const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading authentication...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.userType)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};


function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          {/* This route is now the default entry point */}
          <Route path="/" element={<LandingPage />} /> {/* <-- UPDATED: Default route */}
          <Route path="/register-company" element={<CompanyRegister />} />
          <Route path="/login" element={<Dashboard />} />
          <Route path="/unauthorized" element={<div>You are not authorized to view this page.</div>} />

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