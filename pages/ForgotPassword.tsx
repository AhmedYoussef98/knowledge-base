import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../i18n/useTranslation';
import { Mail, Loader2, AlertCircle, CheckCircle2, ArrowLeft, Globe } from 'lucide-react';
import { gsap } from 'gsap';
import logo from '../src/assets/logo.png';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const { resetPassword } = useAuth();
    const { language, toggleLanguage, isRTL } = useLanguage();
    const { t } = useTranslation();

    const containerRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(cardRef.current, {
                y: 20,
                opacity: 0,
                duration: 0.6,
                ease: "power2.out"
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        const { error: resetError } = await resetPassword(email);

        if (resetError) {
            setError(resetError.message);
        } else {
            setMessage(language === 'ar' ? 'تحقق من بريدك للحصول على رابط إعادة التعيين' : 'Check your email for the password reset link');
        }

        setLoading(false);
    };

    return (
        <div ref={containerRef} className="min-h-screen bg-daleel-deep-space circuit-pattern flex items-center justify-center p-4 relative">
            {/* Background gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-br from-daleel-cyan/5 via-daleel-deep-space to-daleel-neon/5 -z-10" />
            <div className="absolute top-20 left-10 w-96 h-96 bg-daleel-cyan/5 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-daleel-neon/5 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />

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
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-daleel-cyan/20 border-2 border-daleel-cyan rounded-2xl shadow-lg mb-6 glow-cyan p-3">
                            <img src={logo} alt="Daleel Logo" className="w-full h-full object-contain" />
                        </div>
                    </Link>
                    <h1 className="text-3xl font-bold text-daleel-pure-light" style={{ fontFamily: 'Space Grotesk, Tajawal, sans-serif' }}>
                        {t('auth.resetPassword')}
                    </h1>
                    <p className="text-daleel-pure-light/70 mt-2">{t('auth.resetPasswordSubtitle')}</p>
                </div>

                {/* Form Card */}
                <div ref={cardRef} className="bg-daleel-tech-slate rounded-2xl shadow-xl border border-daleel-cyan/20 p-8 glow-cyan">
                    {!message ? (
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
                                className="w-full py-3 bg-daleel-gradient text-daleel-deep-space font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 glow-neon"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    t('auth.sendResetLink')
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className={isRTL ? 'text-right' : 'text-center'}>
                            <div className="w-16 h-16 bg-daleel-green/20 border-2 border-daleel-green rounded-full flex items-center justify-center mx-auto mb-4 glow-neon">
                                <CheckCircle2 className="w-8 h-8 text-daleel-green" />
                            </div>
                            <h3 className="text-xl font-bold text-daleel-pure-light mb-2">
                                {language === 'ar' ? 'تحقق من بريدك' : 'Check your email'}
                            </h3>
                            <p className="text-daleel-pure-light/70 mb-6">
                                {language === 'ar' ? 'أرسلنا رابط إعادة تعيين كلمة المرور إلى' : 'We sent a password reset link to'} <strong className="text-daleel-neon">{email}</strong>
                            </p>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="text-sm text-daleel-cyan hover:text-daleel-neon underline font-medium transition-colors"
                            >
                                {loading
                                    ? (language === 'ar' ? 'جاري الإرسال...' : 'Sending...')
                                    : (language === 'ar' ? 'انقر لإعادة إرسال الرابط' : 'Click to resend link')}
                            </button>
                        </div>
                    )}

                    {/* Back to Login */}
                    <div className={`mt-6 ${isRTL ? 'text-right' : 'text-center'}`}>
                        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-daleel-pure-light/70 hover:text-daleel-cyan transition-colors">
                            {isRTL ? <ArrowLeft className="w-4 h-4 rotate-180" /> : <ArrowLeft className="w-4 h-4" />}
                            {language === 'ar' ? 'العودة إلى تسجيل الدخول' : 'Back to Sign In'}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
