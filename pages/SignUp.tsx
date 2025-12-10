import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../i18n/useTranslation';
import { autoAcceptPendingInvites } from '../services/tenantApi';
import { Mail, Lock, UserPlus, Loader2, AlertCircle, CheckCircle2, Globe } from 'lucide-react';
import logo from '../src/assets/logo.png';

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [existingUser, setExistingUser] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const { signUp, user, resendVerification } = useAuth();
    const { language, toggleLanguage, isRTL } = useLanguage();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const containerRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLDivElement>(null);

    // Animation
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(formRef.current, {
                y: 20,
                opacity: 0,
                duration: 0.6,
                ease: "power2.out"
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    // Get return URL from query params
    const returnTo = searchParams.get('returnTo');

    // If already logged in, redirect
    useEffect(() => {
        if (user) {
            handlePostSignup();
        }
    }, [user]);

    const handlePostSignup = async () => {
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

        if (password !== confirmPassword) {
            setError(language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError(language === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        const { data, error: signUpError } = await signUp(email, password);

        if (signUpError) {
            console.log("Signup error:", signUpError.message);
            // Handle existing user specifically
            if (signUpError.message.toLowerCase().includes('already registered')) {
                setExistingUser(true);
            }
            // Check for rate limits or other specific errors
            else if (signUpError.message.includes('rate limit')) {
                setError(language === 'ar' ? 'طلبات كثيرة جداً. حاول مرة أخرى لاحقاً.' : 'Too many requests. Please try again later.');
            }
            else {
                setError(signUpError.message);
            }
            setLoading(false);
            return;
        }

        // If data.session is null, it means email confirmation is required (and enabled)
        // If data.session is present, they are logged in (auto-confirm or disabled)
        if (data && !data.session && data.user) {
            setEmailSent(true);
        }

        // If session exists, the useEffect watching 'user' will handle the redirect
        setLoading(false);
    };

    const getLoginLink = () => {
        if (returnTo) {
            return `/login?returnTo=${encodeURIComponent(returnTo)}`;
        }
        return '/login';
    };

    // Email confirmation sent
    if (emailSent) {
        return (
            <div className="min-h-screen bg-daleel-deep-space circuit-pattern flex items-center justify-center p-4 relative">
                {/* Background gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-br from-daleel-cyan/5 via-daleel-deep-space to-daleel-green/5 -z-10" />
                <div className="absolute top-20 left-10 w-96 h-96 bg-daleel-green/5 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-daleel-cyan/5 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />

                <div className="w-full max-w-md relative z-10">
                    <div className="bg-daleel-tech-slate rounded-2xl shadow-xl border border-daleel-green/30 p-8 text-center glow-cyan">
                        <div className="w-16 h-16 bg-daleel-green/20 border-2 border-daleel-green rounded-full flex items-center justify-center mx-auto mb-6 glow-neon">
                            <CheckCircle2 className="w-8 h-8 text-daleel-green" />
                        </div>
                        <h1 className="text-2xl font-bold text-daleel-pure-light mb-2" style={{ fontFamily: 'Space Grotesk, Tajawal, sans-serif' }}>
                            {t('auth.verifyEmail')}
                        </h1>
                        <p className="text-daleel-pure-light/70 mb-6">
                            {t('auth.verifyEmailMessage')} <strong className="text-daleel-neon">{email}</strong>
                        </p>
                        <p className="text-sm text-daleel-pure-light/60 mb-8">
                            {language === 'ar'
                                ? 'انقر على الرابط في البريد الإلكتروني لتفعيل حسابك، ثم عد وسجّل الدخول.'
                                : 'Click the link in the email to activate your account, then come back and sign in.'}
                        </p>
                        <div className="flex flex-col gap-3 w-full">
                            <Link
                                to={getLoginLink()}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-daleel-gradient text-daleel-deep-space font-semibold rounded-xl hover:shadow-lg transition-all glow-neon"
                            >
                                {language === 'ar' ? 'اذهب إلى تسجيل الدخول' : 'Go to Sign In'}
                            </Link>

                            {!resendSuccess ? (
                                <button
                                    onClick={async () => {
                                        setResendLoading(true);
                                        const { error } = await resendVerification(email);
                                        if (!error) setResendSuccess(true);
                                        setResendLoading(false);
                                    }}
                                    disabled={resendLoading}
                                    className="text-sm text-daleel-cyan hover:text-daleel-neon underline disabled:opacity-50 transition-colors"
                                >
                                    {resendLoading
                                        ? (language === 'ar' ? 'جاري الإرسال...' : 'Sending...')
                                        : t('auth.resendVerification')}
                                </button>
                            ) : (
                                <p className="text-sm text-daleel-green font-medium animate-fade-in">
                                    {language === 'ar' ? 'تم إرسال البريد بنجاح!' : 'Email resent successfully!'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Existing User Found
    if (existingUser) {
        return (
            <div className="min-h-screen bg-daleel-deep-space circuit-pattern flex items-center justify-center p-4 relative">
                {/* Background gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-br from-daleel-cyan/5 via-daleel-deep-space to-daleel-neon/5 -z-10" />
                <div className="absolute top-20 left-10 w-96 h-96 bg-daleel-cyan/5 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-daleel-neon/5 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />

                <div className="w-full max-w-md relative z-10">
                    <div className="bg-daleel-tech-slate rounded-2xl shadow-xl border border-daleel-cyan/30 p-8 text-center animate-fade-in-up glow-cyan">
                        <div className="w-20 h-20 bg-daleel-cyan/20 border-2 border-daleel-cyan rounded-full flex items-center justify-center mx-auto mb-6 glow-cyan p-3">
                            <img src={logo} alt="Daleel Logo" className="w-full h-full object-contain" />
                        </div>
                        <h1 className="text-2xl font-bold text-daleel-pure-light mb-2" style={{ fontFamily: 'Space Grotesk, Tajawal, sans-serif' }}>
                            {language === 'ar' ? 'لديك حساب بالفعل' : 'You already have an account'}
                        </h1>
                        <p className="text-daleel-pure-light/70 mb-8">
                            {language === 'ar' ? 'البريد الإلكتروني' : 'The email'} <strong className="text-daleel-neon">{email}</strong> {language === 'ar' ? 'مسجّل بالفعل.' : 'is already registered.'}
                        </p>
                        <Link
                            to={getLoginLink()}
                            className="inline-flex items-center gap-2 px-8 py-3 bg-daleel-cyan text-daleel-deep-space font-semibold rounded-xl hover:bg-daleel-neon transition-all w-full justify-center glow-cyan"
                        >
                            {language === 'ar' ? 'سجّل الدخول بدلاً من ذلك' : 'Sign In Instead'}
                        </Link>
                        <button
                            onClick={() => setExistingUser(false)}
                            className="mt-4 text-sm text-daleel-pure-light/50 hover:text-daleel-cyan underline transition-colors"
                        >
                            {language === 'ar' ? 'استخدم بريداً إلكترونياً مختلفاً' : 'Use a different email'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="min-h-screen bg-daleel-deep-space circuit-pattern flex items-center justify-center p-4 relative">
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
                        {t('auth.signupTitle')}
                    </h1>
                    <p className="text-daleel-pure-light/70 mt-2">
                        {returnTo?.includes('invite')
                            ? (language === 'ar' ? 'سجّل لقبول دعوتك' : 'Sign up to accept your invitation')
                            : t('auth.signupSubtitle')
                        }
                    </p>
                </div>

                {/* Form Card */}
                <div ref={formRef} className="bg-daleel-tech-slate rounded-2xl shadow-xl border border-daleel-cyan/20 p-8 glow-cyan">
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
                                    placeholder="you@company.com"
                                    required
                                    dir={isRTL ? 'rtl' : 'ltr'}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className={`block text-sm font-medium text-daleel-pure-light mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                                {t('auth.password')}
                            </label>
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

                        {/* Confirm Password */}
                        <div>
                            <label className={`block text-sm font-medium text-daleel-pure-light mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                                {t('auth.confirmPassword')}
                            </label>
                            <div className="relative">
                                <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-daleel-cyan`} />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                                    <UserPlus className="w-5 h-5" />
                                    {t('common.signup')}
                                </>
                            )}
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className={`mt-6 text-sm text-daleel-pure-light/70 ${isRTL ? 'text-right' : 'text-center'}`}>
                        {t('auth.hasAccount')}{' '}
                        <Link to={getLoginLink()} className="text-daleel-cyan hover:text-daleel-neon font-medium transition-colors">
                            {t('common.login')}
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <p className={`text-xs text-daleel-pure-light/50 mt-6 ${isRTL ? 'text-right' : 'text-center'}`}>
                    {language === 'ar'
                        ? 'بالتسجيل، أنت توافق على شروط الخدمة وسياسة الخصوصية.'
                        : 'By signing up, you agree to our Terms of Service and Privacy Policy.'}
                </p>

                {/* Back to Home */}
                <div className={`mt-4 ${isRTL ? 'text-right' : 'text-center'}`}>
                    <Link to="/" className="text-sm text-daleel-pure-light/50 hover:text-daleel-cyan transition-colors inline-flex items-center gap-1">
                        {isRTL ? '→' : '←'} {t('common.back')}
                    </Link>
                </div>
            </div>
        </div>
    );
}
