import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Globe, Home, Settings, LogOut, Shield, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../i18n/useTranslation';
import { getMyTenant } from '../services/tenantApi';

interface Props {
  tenantName?: string;
  primaryColor?: string;
  tenantSlug?: string;
  isAdmin?: boolean;
}

export const Navbar: React.FC<Props> = ({
  tenantName,
  primaryColor = '#0F172A',
  tenantSlug,
  isAdmin = false
}) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const { t } = useTranslation();
  const [isOwner, setIsOwner] = useState(false);

  // Check if user owns a tenant (for settings visibility)
  useEffect(() => {
    const checkOwnership = async () => {
      if (user) {
        const myTenant = await getMyTenant();
        setIsOwner(myTenant !== null);
      } else {
        setIsOwner(false);
      }
    };
    checkOwnership();
  }, [user]);

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
      className="text-daleel-pure-light shadow-lg sticky top-0 z-50 border-b border-daleel-cyan/20"
      style={{ backgroundColor: primaryColor }}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Dynamic tenant logo or initial */}
          <Link
            to={getHomeLink()}
            className="h-10 w-10 rounded-xl flex items-center justify-center text-lg font-bold hover:scale-105 transition-transform glow-cyan"
            style={{ backgroundColor: 'rgba(163, 255, 71, 0.2)' }}
          >
            {tenantName ? tenantName.charAt(0).toUpperCase() : 'د'}
          </Link>
          <div className="hidden sm:block">
            <Link to={getHomeLink()}>
              <h1 className="font-bold text-lg hover:opacity-90 transition-opacity">
                {tenantName || t('brand.name')}
              </h1>
            </Link>
            <p className="text-xs opacity-75 mt-0.5">{t('brand.tagline')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Navigation Links */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* Dashboard Link - for logged in users */}
            {user && (
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-daleel-cyan/20 transition-all text-sm border border-daleel-cyan/30 hover:border-daleel-cyan/60"
                title={t('dashboard.title')}
              >
                <LayoutDashboard size={14} />
                <span className="hidden md:inline font-medium">{t('dashboard.title')}</span>
              </Link>
            )}

            {/* KB Home Link - only when in tenant context */}
            {tenantSlug && (
              <Link
                to={`/kb/${tenantSlug}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-daleel-cyan/20 transition-all text-sm border border-daleel-cyan/30 hover:border-daleel-cyan/60"
                title={t('kb.searchPlaceholder')}
              >
                <Home size={14} />
                <span className="hidden md:inline font-medium">{t('common.back')}</span>
              </Link>
            )}

            {/* Admin Link - only show if user is admin */}
            {isAdmin && tenantSlug && (
              <Link
                to={`/kb/${tenantSlug}/admin`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-daleel-cyan/20 transition-all text-sm border border-daleel-cyan/30 hover:border-daleel-cyan/60"
                title={t('admin.title')}
              >
                <Shield size={14} />
                <span className="hidden md:inline font-medium">{t('admin.title')}</span>
              </Link>
            )}

            {/* Settings Link - only show if user owns a tenant */}
            {isOwner && (
              <Link
                to="/settings"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-daleel-cyan/20 transition-all text-sm border border-daleel-cyan/30 hover:border-daleel-cyan/60"
                title={t('settings.title')}
              >
                <Settings size={14} />
                <span className="hidden md:inline font-medium">{t('settings.title')}</span>
              </Link>
            )}
          </div>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-daleel-neon/10 hover:bg-daleel-neon/20 transition-all text-sm border border-daleel-neon/30 hover:border-daleel-neon glow-hover"
            title={t('common.language')}
          >
            <Globe size={14} />
            <span className="font-bold">{language === 'ar' ? 'EN' : 'ع'}</span>
          </button>

          {/* Auth Button */}
          {user ? (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/80 hover:bg-red-500 transition-all text-sm font-medium"
              title={t('common.logout')}
            >
              <LogOut size={14} />
              <span className="hidden md:inline">{t('common.logout')}</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-daleel-neon/20 hover:bg-daleel-neon/30 transition-all text-sm font-medium glow-neon"
            >
              {t('common.login')}
            </Link>
          )}

          {/* Online Status Removed as requested */}
        </div>
      </div>
    </nav>
  );
};