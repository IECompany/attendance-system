// frontend/src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './authContext.jsx';

// Import your pages and components
import Dashboard from './pages/Dashboard.jsx';
import MainDashboard from './pages/MainDashboard.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import SuperAdminPanel from './pages/SuperAdminPanel.jsx';
import CompanyRegister from './pages/CompanyRegister.jsx';
import LandingPage from './pages/LandingPage.jsx';
import Chatbot from './components/Chatbot.jsx'; // <-- 1. IMPORT THE CHATBOT

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
        <div className="app-container">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/register-company" element={<CompanyRegister />} />
            <Route path="/login" element={<Dashboard />} />
            <Route path="/unauthorized" element={<div>You are not authorized to view this page.</div>} />

            {/* Protected Routes */}
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

            
            <Route path="*" element={<div>404 Not Found</div>} />
            
          </Routes>
          
         
          <Chatbot />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;