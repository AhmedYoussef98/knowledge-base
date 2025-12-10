import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../i18n/useTranslation';
import { createTenant, generateSlug, isSlugAvailable } from '../services/tenantApi';
import {
    BookOpen, Key, Palette, ArrowRight, ArrowLeft, Check,
    Loader2, AlertCircle, Sparkles, CheckCircle2, X, ExternalLink, Globe
} from 'lucide-react';
import logo from '../src/assets/logo.png';

type Step = 1 | 2 | 3;

export default function Onboarding() {
    const { user, loading: authLoading } = useAuth();
    const { language, isRTL, toggleLanguage } = useLanguage();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [step, setStep] = useState<Step>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form data
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
    const [apiKey, setApiKey] = useState('');
    const [primaryColor, setPrimaryColor] = useState('#A3FF47');

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

    // Auto-generate slug from name
    useEffect(() => {
        if (name) {
            const newSlug = generateSlug(name);
            setSlug(newSlug);
            checkSlugAvailability(newSlug);
        }
    }, [name]);

    const checkSlugAvailability = async (slugToCheck: string) => {
        if (!slugToCheck) {
            setSlugAvailable(null);
            return;
        }
        const available = await isSlugAvailable(slugToCheck);
        setSlugAvailable(available);
    };

    const handleSlugChange = (newSlug: string) => {
        const formattedSlug = generateSlug(newSlug);
        setSlug(formattedSlug);
        checkSlugAvailability(formattedSlug);
    };

    const handleNext = () => {
        if (step < 3) {
            setStep((step + 1) as Step);
            setError('');
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep((step - 1) as Step);
            setError('');
        }
    };

    const handleComplete = async () => {
        if (!name || !slug) {
            setError(language === 'ar' ? 'يرجى إدخال اسم لقاعدتك المعرفية' : 'Please provide a name for your knowledge base');
            return;
        }

        if (!slugAvailable) {
            setError(t('settings.slugTaken'));
            return;
        }

        setLoading(true);
        setError('');

        const { data: tenant, error: createError } = await createTenant({
            name,
            slug,
            gemini_api_key: apiKey || undefined,
            primary_color: primaryColor
        });

        if (createError) {
            setError(createError.message);
            setLoading(false);
            return;
        }

        if (tenant) {
            navigate(`/kb/${tenant.slug}/admin`);
        }
    };

    const canProceed = () => {
        switch (step) {
            case 1:
                return name.length > 0 && slug.length > 0 && slugAvailable === true;
            case 2:
                return true; // API key is optional
            case 3:
                return true;
            default:
                return false;
        }
    };

    const steps = [
        { num: 1, title: t('onboarding.step1Title'), icon: BookOpen },
        { num: 2, title: language === 'ar' ? 'مفتاح AI' : 'AI Key', icon: Key },
        { num: 3, title: language === 'ar' ? 'المظهر' : 'Style', icon: Palette },
    ];

    const colors = [
        '#A3FF47', // Daleel Neon
        '#00C2CB', // Circuit Cyan
        '#4ADE80', // Core Green
        '#14B8A6', // Teal
        '#3B82F6', // Blue
        '#8B5CF6', // Purple
        '#EC4899', // Pink
        '#EF4444', // Red
    ];

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-daleel-deep-space circuit-pattern">
                <Loader2 className="w-8 h-8 text-daleel-neon animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-daleel-deep-space circuit-pattern flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="w-full max-w-xl relative">

                {/* Top Bar */}
                <div className={`absolute -top-12 w-full flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <button
                        onClick={toggleLanguage}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-daleel-tech-slate hover:bg-daleel-tech-slate/80 transition-all text-sm border border-daleel-cyan/30 hover:border-daleel-neon text-daleel-pure-light"
                    >
                        <Globe size={14} />
                        <span className="font-bold">{language === 'ar' ? 'EN' : 'ع'}</span>
                    </button>
                    <Link
                        to="/dashboard"
                        className="p-2 bg-daleel-tech-slate/50 hover:bg-daleel-tech-slate rounded-full transition-colors border border-daleel-cyan/20 hover:border-daleel-cyan"
                        title={t('common.cancel')}
                    >
                        <X className="w-6 h-6 text-daleel-pure-light/70" />
                    </Link>
                </div>

                {/* Header */}
                <div className={`text-center mb-8 ${isRTL ? 'text-right' : ''}`}>
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-daleel-gradient rounded-2xl shadow-lg mb-6 glow-neon p-3">
                        <img src={logo} alt="Daleel Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-3xl font-bold text-daleel-pure-light" style={{ fontFamily: 'Space Grotesk, Tajawal, sans-serif' }}>
                        {language === 'ar' ? 'إنشاء قاعدة معرفية جديدة' : 'Create New Knowledge Base'}
                    </h1>
                    <p className="text-daleel-pure-light/70 mt-2">
                        {language === 'ar' ? 'خطوات سريعة للبدء' : 'Just a few quick steps to get started'}
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="flex justify-center mb-8">
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {steps.map((s, idx) => (
                            <React.Fragment key={s.num}>
                                <div
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                                        step === s.num
                                            ? 'bg-daleel-neon text-daleel-deep-space'
                                            : step > s.num
                                            ? 'bg-daleel-green/20 text-daleel-green border border-daleel-green/30'
                                            : 'bg-daleel-tech-slate text-daleel-pure-light/40 border border-daleel-cyan/20'
                                    }`}
                                >
                                    {step > s.num ? (
                                        <CheckCircle2 className="w-5 h-5" />
                                    ) : (
                                        <s.icon className="w-5 h-5" />
                                    )}
                                    <span className="font-medium text-sm hidden sm:inline">{s.title}</span>
                                </div>
                                {idx < steps.length - 1 && (
                                    <div className={`w-8 h-0.5 ${step > s.num ? 'bg-daleel-green' : 'bg-daleel-cyan/20'}`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-daleel-tech-slate rounded-2xl shadow-2xl border border-daleel-cyan/30 p-8 glow-cyan">

                    {/* Step 1: Name & URL */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div>
                                <label className={`block text-sm font-medium text-daleel-pure-light/80 mb-2 ${isRTL ? 'text-right' : ''}`}>
                                    {t('onboarding.kbName')}
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className={`w-full px-4 py-3 bg-daleel-deep-space border border-daleel-cyan/30 text-daleel-pure-light rounded-xl focus:ring-2 focus:ring-daleel-neon focus:border-daleel-neon transition-all text-lg ${isRTL ? 'text-right' : ''}`}
                                    placeholder={language === 'ar' ? 'القاعدة المعرفية لشركتي' : 'My Company Knowledge Base'}
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className={`block text-sm font-medium text-daleel-pure-light/80 mb-2 ${isRTL ? 'text-right' : ''}`}>
                                    {t('onboarding.kbSlug')}
                                </label>
                                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    <span className="text-daleel-cyan text-sm">yoursite.com/kb/</span>
                                    <input
                                        type="text"
                                        value={slug}
                                        onChange={(e) => handleSlugChange(e.target.value)}
                                        className={`flex-1 px-4 py-3 bg-daleel-deep-space border rounded-xl focus:ring-2 focus:ring-daleel-neon transition-all ${
                                            slugAvailable === true ? 'border-daleel-green/50 bg-daleel-green/5' :
                                            slugAvailable === false ? 'border-red-400/50 bg-red-400/5' :
                                            'border-daleel-cyan/30'
                                        } text-daleel-pure-light ${isRTL ? 'text-right' : ''}`}
                                        placeholder="my-company"
                                    />
                                </div>
                                {slugAvailable !== null && (
                                    <p className={`text-sm mt-2 flex items-center gap-2 ${slugAvailable ? 'text-daleel-green' : 'text-red-400'} ${isRTL ? 'flex-row-reverse' : ''}`}>
                                        {slugAvailable ? (
                                            <>
                                                <CheckCircle2 className="w-4 h-4" />
                                                {language === 'ar' ? 'هذا العنوان متاح' : 'This URL is available'}
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle className="w-4 h-4" />
                                                {language === 'ar' ? 'هذا العنوان مستخدم بالفعل' : 'This URL is already taken'}
                                            </>
                                        )}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 2: API Key */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="p-4 bg-daleel-cyan/10 border border-daleel-cyan/30 rounded-xl">
                                <h3 className={`font-medium text-daleel-cyan mb-1 ${isRTL ? 'text-right' : ''}`}>
                                    {t('onboarding.geminiApiKey')}
                                </h3>
                                <p className={`text-sm text-daleel-pure-light/70 ${isRTL ? 'text-right' : ''}`}>
                                    {language === 'ar'
                                        ? 'أضف مفتاح Gemini API لتفعيل المميزات الذكية مثل البحث الذكي والإجابات التلقائية.'
                                        : 'Add your Gemini API key to enable AI-powered features like smart search and auto-generated answers.'}
                                </p>
                            </div>

                            <div>
                                <label className={`block text-sm font-medium text-daleel-pure-light/80 mb-2 ${isRTL ? 'text-right' : ''}`}>
                                    {t('onboarding.geminiApiKey')} <span className="text-daleel-pure-light/40">({language === 'ar' ? 'اختياري' : 'optional'})</span>
                                </label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    className={`w-full px-4 py-3 bg-daleel-deep-space border border-daleel-cyan/30 text-daleel-pure-light rounded-xl focus:ring-2 focus:ring-daleel-neon focus:border-daleel-neon transition-all font-mono ${isRTL ? 'text-right' : ''}`}
                                    placeholder="AIzaSy..."
                                />
                                <div className={`flex items-center justify-between text-xs mt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    <p className="text-daleel-pure-light/50">
                                        {language === 'ar' ? 'مطلوب للإجابات الذكية' : 'Required for AI responses'}
                                    </p>
                                    <Link to="/gemini-guide" target="_blank" className={`text-daleel-cyan hover:text-daleel-neon font-medium hover:underline flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                        {language === 'ar' ? 'كيف تحصل على مفتاح مجاني؟' : 'How to get a free key?'}
                                        <ExternalLink className="w-3 h-3" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Branding */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div>
                                <label className={`block text-sm font-medium text-daleel-pure-light/80 mb-3 ${isRTL ? 'text-right' : ''}`}>
                                    {t('onboarding.primaryColor')}
                                </label>
                                <div className={`flex flex-wrap gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    {colors.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setPrimaryColor(color)}
                                            className={`w-10 h-10 rounded-full transition-all ${
                                                primaryColor === color
                                                    ? 'ring-4 ring-offset-2 ring-offset-daleel-tech-slate ring-daleel-neon scale-110'
                                                    : 'hover:scale-105'
                                            }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="mt-6 p-6 bg-daleel-deep-space/50 border border-daleel-cyan/20 rounded-xl">
                                <p className={`text-sm text-daleel-pure-light/50 mb-3 ${isRTL ? 'text-right' : ''}`}>
                                    {language === 'ar' ? 'معاينة' : 'Preview'}
                                </p>
                                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-daleel-deep-space font-bold text-lg border-2 glow-neon"
                                        style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                                    >
                                        {name ? name.charAt(0).toUpperCase() : 'K'}
                                    </div>
                                    <div className={isRTL ? 'text-right' : ''}>
                                        <h3 className="font-bold text-daleel-pure-light">{name || (language === 'ar' ? 'القاعدة المعرفية' : 'Knowledge Base')}</h3>
                                        <p className="text-sm text-daleel-cyan">yoursite.com/kb/{slug || 'your-kb'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className={`flex items-center gap-2 p-3 bg-red-400/20 border border-red-400/30 rounded-xl text-red-400 text-sm mt-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className={`flex justify-between mt-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {step > 1 ? (
                            <button
                                onClick={handleBack}
                                className={`flex items-center gap-2 px-4 py-2 text-daleel-pure-light/70 hover:text-daleel-neon transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
                            >
                                {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
                                {t('common.back')}
                            </button>
                        ) : (
                            <div />
                        )}

                        {step < 3 ? (
                            <button
                                onClick={handleNext}
                                disabled={!canProceed()}
                                className={`flex items-center gap-2 px-6 py-3 bg-daleel-neon text-daleel-deep-space font-bold rounded-xl hover:bg-daleel-green transition-all disabled:opacity-50 disabled:cursor-not-allowed glow-neon ${isRTL ? 'flex-row-reverse' : ''}`}
                            >
                                {t('common.next')}
                                {isRTL ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                            </button>
                        ) : (
                            <button
                                onClick={handleComplete}
                                disabled={loading || !canProceed()}
                                className={`flex items-center gap-2 px-6 py-3 bg-daleel-gradient text-daleel-deep-space font-bold rounded-xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed glow-neon ${isRTL ? 'flex-row-reverse' : ''}`}
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Check className="w-5 h-5" />
                                        {language === 'ar' ? 'إنشاء القاعدة المعرفية' : 'Create Knowledge Base'}
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
