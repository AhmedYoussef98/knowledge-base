import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Globe, Home, Settings, LogOut, Shield, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  lang: 'ar' | 'en';
  toggleLang: () => void;
  t: (key: string) => string;
  tenantName?: string;
  primaryColor?: string;
  tenantSlug?: string;
  isAdmin?: boolean;
}

export const Navbar: React.FC<Props> = ({
  lang,
  toggleLang,
  t,
  tenantName,
  primaryColor = '#1E293B',
  tenantSlug,
  isAdmin = false
}) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Smart home link: go to KB if in tenant context, otherwise dashboard
  const getHomeLink = () => {
    if (tenantSlug) {
      return `/kb/${tenantSlug}`;
    }
    return user ? '/dashboard' : '/';
  };

  return (
    <nav
      className="text-white shadow-lg sticky top-0 z-50"
      style={{ backgroundColor: primaryColor }}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Dynamic tenant logo or initial */}
          <Link
            to={getHomeLink()}
            className="h-10 w-10 rounded-xl flex items-center justify-center text-lg font-bold hover:scale-105 transition-transform"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
          >
            {tenantName ? tenantName.charAt(0).toUpperCase() : 'K'}
          </Link>
          <div className="hidden sm:block">
            <Link to={getHomeLink()}>
              <h1 className="font-bold text-lg hover:opacity-90 transition-opacity">{tenantName || 'Knowledge Base'}</h1>
            </Link>
            <p className="text-xs opacity-75 mt-0.5">{t('navSubtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Navigation Links */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* Dashboard Link - for logged in users */}
            {user && (
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all text-sm border border-white/20"
                title="Dashboard"
              >
                <LayoutDashboard size={14} />
                <span className="hidden md:inline font-medium">Dashboard</span>
              </Link>
            )}

            {/* KB Home Link - only when in tenant context */}
            {tenantSlug && (
              <Link
                to={`/kb/${tenantSlug}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all text-sm border border-white/20"
                title="Knowledge Base"
              >
                <Home size={14} />
                <span className="hidden md:inline font-medium">KB Home</span>
              </Link>
            )}

            {/* Admin Link - only show if user is admin */}
            {isAdmin && tenantSlug && (
              <Link
                to={`/kb/${tenantSlug}/admin`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all text-sm border border-white/20"
                title="Admin Panel"
              >
                <Shield size={14} />
                <span className="hidden md:inline font-medium">Admin</span>
              </Link>
            )}

            {/* Settings Link - only show if user is logged in */}
            {user && (
              <Link
                to="/settings"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all text-sm border border-white/20"
                title="Settings"
              >
                <Settings size={14} />
                <span className="hidden md:inline font-medium">Settings</span>
              </Link>
            )}
          </div>

          {/* Language Toggle */}
          <button
            onClick={toggleLang}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all text-sm border border-white/20"
          >
            <Globe size={14} />
            <span className="font-bold">{lang === 'ar' ? 'EN' : 'ع'}</span>
          </button>

          {/* Auth Button */}
          {user ? (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/80 hover:bg-red-500 transition-all text-sm font-medium"
              title="Sign Out"
            >
              <LogOut size={14} />
              <span className="hidden md:inline">Logout</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-all text-sm font-medium"
            >
              Sign In
            </Link>
          )}

          {/* Online Status */}
          <div className="hidden md:flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-xs text-gray-200">{t('online')}</span>
          </div>
        </div>
      </div>
    </nav>
  );
};