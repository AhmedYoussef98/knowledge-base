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
import Dashboard from './pages/Dashboard';
import AcceptInvite from './pages/AcceptInvite';
import GeminiGuide from './pages/GeminiGuide';
import ForgotPassword from './pages/ForgotPassword';
import UpdatePassword from './pages/UpdatePassword';

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
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />

            {/* User dashboard (central hub) */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* KB creation */}
            <Route path="/onboarding" element={<Onboarding />} />

            {/* Owner settings */}
            <Route path="/settings" element={<Settings />} />

            {/* Invite acceptance */}
            <Route path="/invite/:token" element={<AcceptInvite />} />

            {/* Guides */}
            <Route path="/gemini-guide" element={<GeminiGuide />} />

            {/* Tenant-specific routes */}
            <Route path="/kb/:slug" element={<Home />} />
            <Route path="/kb/:slug/admin" element={<Admin />} />

            {/* Legacy routes - redirect to dashboard */}
            <Route path="/admin" element={<Navigate to="/dashboard" replace />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </TenantProvider>
      </AuthProvider>
    </Router>
  );
}