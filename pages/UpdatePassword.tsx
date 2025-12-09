import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../i18n/useTranslation';
import { Lock, Loader2, AlertCircle, CircuitBoard, CheckCircle2, Globe } from 'lucide-react';
import { gsap } from 'gsap';

export default function UpdatePassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { updatePassword, user } = useAuth();
    const { language, toggleLanguage, isRTL } = useLanguage();
    const { t } = useTranslation();
    const navigate = useNavigate();

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

        if (password !== confirmPassword) {
            setError(language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError(language === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        const { error: updateError } = await updatePassword(password);

        if (updateError) {
            setError(updateError.message);
            setLoading(false);
        } else {
            // Success! Redirect to dashboard
            navigate('/dashboard');
        }
    };

    if (!user) {
        // If accessed directly without a link, or link expired
        return (
            <div className="min-h-screen flex items-center justify-center bg-daleel-deep-space circuit-pattern p-4 relative">
                {/* Background gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-br from-daleel-cyan/5 via-daleel-deep-space to-daleel-neon/5 -z-10" />

                <div className="bg-daleel-tech-slate rounded-xl shadow-lg border border-daleel-cyan/30 p-8 max-w-md w-full text-center">
                    <AlertCircle className="w-12 h-12 text-daleel-neon mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-daleel-pure-light mb-2" style={{ fontFamily: 'Space Grotesk, Tajawal, sans-serif' }}>
                        {language === 'ar' ? 'رابط غير صالح أو منتهي الصلاحية' : 'Invalid or Expired Link'}
                    </h2>
                    <p className="text-daleel-pure-light/70 mb-6">
                        {language === 'ar'
                            ? 'رابط إعادة تعيين كلمة المرور هذا غير صالح أو انتهت صلاحيته. يرجى طلب رابط جديد.'
                            : 'This password reset link is invalid or has expired. Please request a new one.'}
                    </p>
                    <button
                        onClick={() => navigate('/forgot-password')}
                        className="text-daleel-cyan font-medium hover:text-daleel-neon transition-colors"
                    >
                        {language === 'ar' ? 'اذهب إلى نسيت كلمة المرور' : 'Go to Forgot Password'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="min-h-screen bg-daleel-deep-space circuit-pattern flex items-center justify-center p-4 relative">
            {/* Background gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-br from-daleel-cyan/5 via-daleel-deep-space to-daleel-green/5 -z-10" />
            <div className="absolute top-20 left-10 w-96 h-96 bg-daleel-green/5 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
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
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-daleel-green/20 border-2 border-daleel-green rounded-2xl shadow-lg mb-4 glow-neon">
                        <CircuitBoard className="w-8 h-8 text-daleel-green" />
                    </div>
                    <h1 className="text-3xl font-bold text-daleel-pure-light" style={{ fontFamily: 'Space Grotesk, Tajawal, sans-serif' }}>
                        {language === 'ar' ? 'تعيين كلمة مرور جديدة' : 'Set New Password'}
                    </h1>
                    <p className="text-daleel-pure-light/70 mt-2">
                        {language === 'ar'
                            ? 'أنشئ كلمة مرور آمنة جديدة لحسابك'
                            : 'Create a new secure password for your account'}
                    </p>
                </div>

                {/* Form Card */}
                <div ref={cardRef} className="bg-daleel-tech-slate rounded-2xl shadow-xl border border-daleel-green/20 p-8 glow-cyan">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* New Password */}
                        <div>
                            <label className={`block text-sm font-medium text-daleel-pure-light mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                                {t('auth.newPassword')}
                            </label>
                            <div className="relative">
                                <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-daleel-green`} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`w-full ${isRTL ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 border border-daleel-green/30 rounded-xl focus:ring-2 focus:ring-daleel-neon focus:border-transparent transition-all bg-daleel-deep-space text-daleel-pure-light placeholder:text-daleel-pure-light/40`}
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
                                <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-daleel-green`} />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={`w-full ${isRTL ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 border border-daleel-green/30 rounded-xl focus:ring-2 focus:ring-daleel-neon focus:border-transparent transition-all bg-daleel-deep-space text-daleel-pure-light placeholder:text-daleel-pure-light/40`}
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
                            className="w-full py-3 bg-daleel-green text-daleel-deep-space font-semibold rounded-xl hover:bg-daleel-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 glow-neon"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle2 className="w-5 h-5" />
                                    {t('auth.updatePassword')}
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
