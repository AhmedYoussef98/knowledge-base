import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../i18n/useTranslation';
import { autoAcceptPendingInvites } from '../services/tenantApi';
import { Mail, Lock, LogIn, Loader2, AlertCircle, Globe } from 'lucide-react';
import logo from '../src/assets/logo.png';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn, user } = useAuth();
    const { language, toggleLanguage, isRTL } = useLanguage();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Get return URL from query params
    const returnTo = searchParams.get('returnTo');

    // If already logged in, redirect
    useEffect(() => {
        if (user) {
            handlePostLogin();
        }
    }, [user]);

    const handlePostLogin = async () => {
        // Auto-accept any pending invites for this user
        await autoAcceptPendingInvites();

        // Redirect to returnTo or dashboard
        if (returnTo) {
            navigate(returnTo);
        } else {
            navigate('/dashboard');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error: signInError } = await signIn(email, password);

        if (signInError) {
            setError(signInError.message);
            setLoading(false);
            return;
        }

        // The useEffect will handle redirect when user state updates
    };

    const getSignUpLink = () => {
        if (returnTo) {
            return `/signup?returnTo=${encodeURIComponent(returnTo)}`;
        }
        return '/signup';
    };

    return (
        <div className="min-h-screen bg-daleel-deep-space circuit-pattern flex items-center justify-center p-4 relative">
            {/* Background gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-br from-daleel-cyan/5 via-daleel-deep-space to-daleel-neon/5 -z-10" />
            <div className="absolute top-20 left-10 w-96 h-96 bg-daleel-neon/5 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-daleel-cyan/5 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />

            <div className="w-full max-w-md relative z-10">
                {/* Language Toggle - Top Right */}
                <div className={`absolute -top-16 ${isRTL ? 'left-0' : 'right-0'}`}>
                    <button
                        onClick={toggleLanguage}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-daleel-neon/10 hover:bg-daleel-neon/20 transition-all text-sm border border-daleel-neon/30 hover:border-daleel-neon glow-hover text-daleel-pure-light"
                    >
                        <Globe size={14} />
                        <span className="font-bold">{language === 'ar' ? 'EN' : 'ع'}</span>
                    </button>
                </div>

                {/* Logo/Brand */}
                <div className={`${isRTL ? 'text-right' : 'text-center'} mb-8`}>
                    <Link to="/" className="inline-block">
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-daleel-neon/20 border-2 border-daleel-neon rounded-2xl shadow-lg mb-6 glow-neon p-3">
                            <img src={logo} alt="Daleel Logo" className="w-full h-full object-contain" />
                        </div>
                    </Link>
                    <h1 className="text-3xl font-bold text-daleel-pure-light" style={{ fontFamily: 'Space Grotesk, Tajawal, sans-serif' }}>
                        {t('auth.loginTitle')}
                    </h1>
                    <p className="text-daleel-pure-light/70 mt-2">{t('auth.loginSubtitle')}</p>
                </div>

                {/* Form Card */}
                <div className="bg-daleel-tech-slate rounded-2xl shadow-xl border border-daleel-cyan/20 p-8 glow-cyan">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className={`block text-sm font-medium text-daleel-pure-light mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                                {t('auth.email')}
                            </label>
                            <div className="relative">
                                <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-daleel-cyan`} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`w-full ${isRTL ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 border border-daleel-cyan/30 rounded-xl focus:ring-2 focus:ring-daleel-neon focus:border-transparent transition-all bg-daleel-deep-space text-daleel-pure-light placeholder:text-daleel-pure-light/40`}
                                    placeholder={language === 'ar' ? 'you@company.com' : 'you@company.com'}
                                    required
                                    dir={isRTL ? 'rtl' : 'ltr'}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <label className="block text-sm font-medium text-daleel-pure-light">
                                    {t('auth.password')}
                                </label>
                                <Link to="/forgot-password" className="text-sm text-daleel-cyan hover:text-daleel-neon font-medium transition-colors">
                                    {t('auth.forgotPassword')}
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-daleel-cyan`} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`w-full ${isRTL ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 border border-daleel-cyan/30 rounded-xl focus:ring-2 focus:ring-daleel-neon focus:border-transparent transition-all bg-daleel-deep-space text-daleel-pure-light placeholder:text-daleel-pure-light/40`}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className={`flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-daleel-neon text-daleel-deep-space font-semibold rounded-xl hover:bg-daleel-green transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 glow-neon"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    {t('common.login')}
                                </>
                            )}
                        </button>
                    </form>

                    {/* Sign Up Link */}
                    <div className={`mt-6 text-sm text-daleel-pure-light/70 ${isRTL ? 'text-right' : 'text-center'}`}>
                        {t('auth.noAccount')}{' '}
                        <Link to={getSignUpLink()} className="text-daleel-cyan hover:text-daleel-neon font-medium transition-colors">
                            {t('common.signup')}
                        </Link>
                    </div>
                </div>

                {/* Back to Home */}
                <div className={`mt-6 ${isRTL ? 'text-right' : 'text-center'}`}>
                    <Link to="/" className="text-sm text-daleel-pure-light/50 hover:text-daleel-cyan transition-colors inline-flex items-center gap-1">
                        {isRTL ? '→' : '←'} {t('common.back')}
                    </Link>
                </div>
            </div>
        </div>
    );
}
