import React from 'react';
import { Globe } from 'lucide-react';

interface Props {
  lang: 'ar' | 'en';
  toggleLang: () => void;
  t: (key: string) => string;
  tenantName?: string;
  primaryColor?: string;
}

export const Navbar: React.FC<Props> = ({ lang, toggleLang, t, tenantName, primaryColor = '#1E293B' }) => {
  return (
    <nav
      className="text-white shadow-lg sticky top-0 z-50"
      style={{ backgroundColor: primaryColor }}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Dynamic tenant logo or initial */}
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center text-lg font-bold"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
          >
            {tenantName ? tenantName.charAt(0).toUpperCase() : 'K'}
          </div>
          <div className="hidden sm:block">
            <h1 className="font-bold text-lg">{tenantName || 'Knowledge Base'}</h1>
            <p className="text-xs opacity-75 mt-0.5">{t('navSubtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Language Toggle */}
          <button
            onClick={toggleLang}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all text-sm border border-white/20"
          >
            <Globe size={14} />
            <span className="font-bold">{lang === 'ar' ? 'English' : 'عربي'}</span>
          </button>

          <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-xs text-gray-200">{t('online')}</span>
          </div>
        </div>
      </div>
    </nav>
  );
};