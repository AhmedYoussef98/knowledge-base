import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';

// Pages
import Home from './pages/Home';
import Admin from './pages/Admin';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Settings from './pages/Settings';
import Landing from './pages/Landing';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <TenantProvider>
          <Routes>
            {/* Public landing */}
            <Route path="/" element={<Landing />} />

            {/* Auth routes */}
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/settings" element={<Settings />} />

            {/* Tenant-specific routes */}
            <Route path="/kb/:slug" element={<Home />} />
            <Route path="/kb/:slug/admin" element={<Admin />} />

            {/* Legacy routes - redirect to landing */}
            <Route path="/admin" element={<Navigate to="/login" replace />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </TenantProvider>
      </AuthProvider>
    </Router>
  );
}