import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../i18n/useTranslation';
import {
    Sparkles,
    Search,
    BarChart3,
    Users,
    Zap,
    Shield,
    Globe,
    ArrowRight,
    CheckCircle2,
    MessageSquare,
    BookOpen,
    Lightbulb,
    LayoutDashboard,
    CircuitBoard
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function Landing() {
    const { user } = useAuth();
    const { language, toggleLanguage, isRTL } = useLanguage();
    const { t } = useTranslation();
    const heroRef = useRef<HTMLDivElement>(null);
    const featuresRef = useRef<HTMLDivElement>(null);
    const howItWorksRef = useRef<HTMLDivElement>(null);
    const ctaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Hero animations
            gsap.fromTo('.hero-badge',
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
            );

            gsap.fromTo('.hero-title',
                { opacity: 0, y: 40 },
                { opacity: 1, y: 0, duration: 1, delay: 0.2, ease: 'power3.out' }
            );

            gsap.fromTo('.hero-subtitle',
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.8, delay: 0.4, ease: 'power3.out' }
            );

            gsap.fromTo('.hero-buttons',
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.8, delay: 0.6, ease: 'power3.out' }
            );

            gsap.fromTo('.hero-stats',
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.8, delay: 0.8, ease: 'power3.out' }
            );

            gsap.fromTo('.hero-visual',
                { opacity: 0, scale: 0.9 },
                { opacity: 1, scale: 1, duration: 1.2, delay: 0.4, ease: 'power3.out' }
            );

            // Floating animation for hero visual
            gsap.to('.floating-card', {
                y: -10,
                duration: 2,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
                stagger: 0.2,
            });

            // Features section animations
            gsap.fromTo('.feature-card',
                { opacity: 0, y: 50 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    stagger: 0.15,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: featuresRef.current,
                        start: 'top 80%',
                    },
                }
            );

            // How it works animations
            gsap.fromTo('.step-card',
                { opacity: 0, x: isRTL ? 30 : -30 },
                {
                    opacity: 1,
                    x: 0,
                    duration: 0.8,
                    stagger: 0.2,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: howItWorksRef.current,
                        start: 'top 80%',
                    },
                }
            );

            // CTA animation
            gsap.fromTo('.cta-content',
                { opacity: 0, y: 40 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: ctaRef.current,
                        start: 'top 85%',
                    },
                }
            );

        }, heroRef);

        return () => ctx.revert();
    }, [isRTL]);

    const features = [
        {
            icon: Search,
            title: {
                en: 'Smart Search',
                ar: 'بحث ذكي'
            },
            description: {
                en: 'AI-powered search helps your customers find answers instantly with natural language queries.',
                ar: 'بحث مدعوم بالذكاء الاصطناعي يساعد عملاءك على إيجاد الإجابات فوراً باستخدام الاستعلامات الطبيعية.'
            },
        },
        {
            icon: Sparkles,
            title: {
                en: 'AI Assistant',
                ar: 'مساعد ذكي'
            },
            description: {
                en: 'Built-in chat assistant powered by Google Gemini provides intelligent, contextual responses.',
                ar: 'مساعد محادثة مدمج مدعوم بـ Google Gemini يقدم استجابات ذكية وسياقية.'
            },
        },
        {
            icon: BarChart3,
            title: {
                en: 'Analytics Dashboard',
                ar: 'لوحة التحليلات'
            },
            description: {
                en: 'Track top questions, popular keywords, and user behavior to improve your content.',
                ar: 'تتبع الأسئلة الأكثر شيوعاً والكلمات المفتاحية وسلوك المستخدمين لتحسين محتواك.'
            },
        },
        {
            icon: Users,
            title: {
                en: 'Multi-Tenant',
                ar: 'متعدد العملاء'
            },
            description: {
                en: 'Each client gets their own isolated knowledge base with custom branding and settings.',
                ar: 'كل عميل يحصل على قاعدته المعرفية المعزولة بعلامة تجارية وإعدادات مخصصة.'
            },
        },
        {
            icon: Globe,
            title: {
                en: 'Bilingual Support',
                ar: 'دعم ثنائي اللغة'
            },
            description: {
                en: 'Full support for English and Arabic with RTL layout switching.',
                ar: 'دعم كامل للإنجليزية والعربية مع تبديل اتجاه القراءة.'
            },
        },
        {
            icon: Shield,
            title: {
                en: 'Secure & Private',
                ar: 'آمن وخاص'
            },
            description: {
                en: 'Row-level security ensures complete data isolation between tenants.',
                ar: 'الأمان على مستوى الصف يضمن عزل البيانات الكامل بين العملاء.'
            },
        },
    ];

    const steps = [
        {
            number: '01',
            title: {
                en: 'Sign Up',
                ar: 'سجّل'
            },
            description: {
                en: 'Create your account in seconds with just an email and password.',
                ar: 'أنشئ حسابك في ثوانٍ بمجرد بريد إلكتروني وكلمة مرور.'
            },
            icon: Users,
        },
        {
            number: '02',
            title: {
                en: 'Configure',
                ar: 'اضبط'
            },
            description: {
                en: 'Name your knowledge base, add your Gemini API key, and choose your brand colors.',
                ar: 'اختر اسم قاعدتك المعرفية، أضف مفتاح Gemini API، واختر ألوان علامتك التجارية.'
            },
            icon: Lightbulb,
        },
        {
            number: '03',
            title: {
                en: 'Add Content',
                ar: 'أضف المحتوى'
            },
            description: {
                en: 'Create Q&A entries with our AI-powered auto-fill or manually add your content.',
                ar: 'أنشئ إدخالات الأسئلة والأجوبة بالملء التلقائي المدعوم بالذكاء الاصطناعي أو أضف محتواك يدوياً.'
            },
            icon: BookOpen,
        },
        {
            number: '04',
            title: {
                en: 'Go Live',
                ar: 'انطلق'
            },
            description: {
                en: 'Share your unique URL with customers and start reducing support tickets.',
                ar: 'شارك رابطك الفريد مع العملاء وابدأ بتقليل تذاكر الدعم.'
            },
            icon: Zap,
        },
    ];

    return (
        <div className="min-h-screen bg-daleel-deep-space overflow-hidden circuit-pattern" ref={heroRef}>
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-daleel-deep-space/80 backdrop-blur-lg border-b border-daleel-cyan/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-daleel-neon/20 border-2 border-daleel-neon rounded-xl flex items-center justify-center glow-neon">
                                <CircuitBoard className="w-5 h-5 text-daleel-neon" />
                            </div>
                            <div>
                                <span className="text-xl font-bold text-daleel-pure-light">
                                    {language === 'ar' ? 'دليل' : 'Daleel'}
                                </span>
                                <p className="text-xs text-daleel-cyan">{t('brand.tagline')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={toggleLanguage}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-daleel-neon/10 hover:bg-daleel-neon/20 transition-all text-sm border border-daleel-neon/30 hover:border-daleel-neon glow-hover text-daleel-pure-light"
                            >
                                <Globe size={14} />
                                <span className="font-bold">{language === 'ar' ? 'EN' : 'ع'}</span>
                            </button>
                            {user ? (
                                <Link
                                    to="/dashboard"
                                    className="flex items-center gap-2 px-5 py-2.5 bg-daleel-gradient text-daleel-deep-space font-semibold rounded-full glow-neon hover:shadow-lg transition-all"
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    {t('dashboard.title')}
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="text-daleel-pure-light hover:text-daleel-cyan font-medium transition-colors"
                                    >
                                        {t('common.login')}
                                    </Link>
                                    <Link
                                        to="/signup"
                                        className="px-5 py-2.5 bg-daleel-neon text-daleel-deep-space font-semibold rounded-full hover:bg-daleel-green transition-all glow-neon"
                                    >
                                        {t('landing.hero.cta')}
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative">
                {/* Background gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-br from-daleel-cyan/10 via-daleel-deep-space to-daleel-green/10 -z-10" />
                <div className="absolute top-20 left-10 w-72 h-72 bg-daleel-neon/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
                <div className="absolute top-40 right-10 w-72 h-72 bg-daleel-cyan/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
                <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-daleel-green/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />

                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left content */}
                        <div className={`${isRTL ? 'text-right' : 'text-left'} max-w-4xl mx-auto hero-content`}>
                            <div className="hero-badge inline-flex items-center px-4 py-2 rounded-full bg-daleel-tech-slate border border-daleel-cyan/30 mb-8">
                                <Zap className="w-4 h-4 text-daleel-neon mr-2" />
                                <span className="text-sm font-semibold text-daleel-pure-light">{t('landing.hero.title')}</span>
                            </div>

                            <h1 className="hero-title text-5xl sm:text-6xl lg:text-7xl font-bold text-daleel-pure-light leading-tight mb-6" style={{ fontFamily: 'Space Grotesk, Tajawal, sans-serif' }}>
                                {language === 'ar' ? (
                                    <>
                                        دليلك الذكي
                                        <span className="block text-daleel-gradient">
                                            نحو الوضوح
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        Your AI Path
                                        <span className="block text-daleel-gradient">
                                            to Clarity
                                        </span>
                                    </>
                                )}
                            </h1>

                            <p className="hero-subtitle text-xl text-daleel-pure-light/80 mb-8 max-w-lg">
                                {t('landing.hero.subtitle')}
                            </p>

                            <div className={`hero-buttons flex flex-col sm:flex-row gap-4 ${isRTL ? 'justify-end' : 'justify-start'} mb-12`}>
                                <Link
                                    to="/signup"
                                    className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-daleel-neon text-daleel-deep-space font-semibold rounded-full glow-neon-lg hover:bg-daleel-green transition-all text-lg"
                                >
                                    {t('landing.hero.cta')}
                                    <ArrowRight className={`w-5 h-5 group-hover:${isRTL ? '-translate-x-1' : 'translate-x-1'} transition-transform`} />
                                </Link>
                                <Link
                                    to="/login"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-daleel-tech-slate text-daleel-pure-light font-semibold rounded-full border border-daleel-cyan/30 hover:border-daleel-cyan hover:bg-daleel-tech-slate/80 transition-all text-lg"
                                >
                                    {t('common.login')}
                                </Link>
                            </div>

                            <div className={`hero-stats flex items-center ${isRTL ? 'justify-end' : 'justify-start'} gap-8`}>
                                <div>
                                    <div className="text-3xl font-bold text-daleel-neon">5 {language === 'ar' ? 'دقائق' : 'min'}</div>
                                    <div className="text-sm text-daleel-pure-light/60">{language === 'ar' ? 'وقت الإعداد' : 'Setup Time'}</div>
                                </div>
                                <div className="w-px h-12 bg-daleel-cyan/30" />
                                <div>
                                    <div className="text-3xl font-bold text-daleel-cyan">100%</div>
                                    <div className="text-sm text-daleel-pure-light/60">{language === 'ar' ? 'خدمة ذاتية' : 'Self-Service'}</div>
                                </div>
                                <div className="w-px h-12 bg-daleel-cyan/30" />
                                <div>
                                    <div className="text-3xl font-bold text-daleel-green">{language === 'ar' ? 'مجاني' : 'Free'}</div>
                                    <div className="text-sm text-daleel-pure-light/60">{language === 'ar' ? 'للبدء' : 'To Start'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Right visual */}
                        <div className={`hero-visual relative ${isRTL ? 'lg:pr-8' : 'lg:pl-8'}`}>
                            <div className="relative">
                                {/* Main card */}
                                <div className="floating-card bg-daleel-tech-slate rounded-2xl shadow-2xl p-6 border border-daleel-cyan/30 glow-cyan">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-daleel-gradient rounded-xl flex items-center justify-center glow-neon">
                                            <MessageSquare className="w-5 h-5 text-daleel-deep-space" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-daleel-pure-light">{t('ai.greeting')}</div>
                                            <div className="text-sm text-daleel-green flex items-center gap-1">
                                                <span className="w-2 h-2 bg-daleel-green rounded-full" /> {language === 'ar' ? 'متاح' : 'Online'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="bg-daleel-deep-space rounded-xl p-3 text-sm text-daleel-pure-light/80 border border-daleel-cyan/20">
                                            {language === 'ar' ? 'كيف أتتبع طلبي؟' : 'How do I track my order?'}
                                        </div>
                                        <div className="bg-daleel-gradient rounded-xl p-3 text-sm text-daleel-deep-space font-medium">
                                            {language === 'ar'
                                                ? 'يمكنك تتبع طلبك بتسجيل الدخول إلى حسابك والنقر على "طلباتي". ستجد معلومات التتبع في الوقت الفعلي.'
                                                : 'You can track your order by logging into your account and clicking on "My Orders". There you\'ll find real-time tracking information.'}
                                        </div>
                                    </div>
                                </div>

                                {/* Floating mini cards */}
                                <div className={`floating-card absolute -top-4 ${isRTL ? '-left-4' : '-right-4'} bg-daleel-tech-slate rounded-xl shadow-lg p-3 border border-daleel-neon/30 glow-neon`}>
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5 text-daleel-neon" />
                                        <span className="text-sm font-medium text-daleel-pure-light">
                                            {language === 'ar' ? '42٪ أقل تذاكر' : '+42% less tickets'}
                                        </span>
                                    </div>
                                </div>

                                <div className={`floating-card absolute -bottom-4 ${isRTL ? '-right-4' : '-left-4'} bg-daleel-tech-slate rounded-xl shadow-lg p-3 border border-daleel-cyan/30 glow-cyan`}>
                                    <div className="flex items-center gap-2">
                                        <Search className="w-5 h-5 text-daleel-cyan" />
                                        <span className="text-sm font-medium text-daleel-pure-light">
                                            {language === 'ar' ? 'بحث ذكي' : 'Smart Search'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section ref={featuresRef} className="py-24 px-4 sm:px-6 lg:px-8 bg-daleel-tech-slate/30">
                <div className="max-w-7xl mx-auto">
                    <div className={`${isRTL ? 'text-right' : 'text-center'} mb-16`}>
                        <h2 className="text-4xl sm:text-5xl font-bold text-daleel-pure-light mb-4" style={{ fontFamily: 'Space Grotesk, Tajawal, sans-serif' }}>
                            {language === 'ar' ? 'كل ما تحتاجه' : 'Everything You Need'}
                        </h2>
                        <p className="text-xl text-daleel-pure-light/70 max-w-2xl mx-auto">
                            {language === 'ar'
                                ? 'ميزات قوية لبناء وإدارة وتوسيع قاعدة معرفة دعم العملاء الخاصة بك.'
                                : 'Powerful features to build, manage, and scale your customer support knowledge base.'}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="feature-card bg-daleel-tech-slate rounded-2xl p-8 border border-daleel-cyan/20 hover:border-daleel-cyan/60 transition-colors duration-300 group border-glow-hover"
                            >
                                <div className="w-14 h-14 bg-daleel-gradient rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform glow-neon">
                                    <feature.icon className="w-7 h-7 text-daleel-deep-space" />
                                </div>
                                <h3 className="text-xl font-bold text-daleel-pure-light mb-3">{feature.title[language]}</h3>
                                <p className="text-daleel-pure-light/70 leading-relaxed">{feature.description[language]}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section ref={howItWorksRef} className="py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className={`${isRTL ? 'text-right' : 'text-center'} mb-16`}>
                        <h2 className="text-4xl sm:text-5xl font-bold text-daleel-pure-light mb-4" style={{ fontFamily: 'Space Grotesk, Tajawal, sans-serif' }}>
                            {language === 'ar' ? 'ابدأ في 4 خطوات بسيطة' : 'Get Started in 4 Simple Steps'}
                        </h2>
                        <p className="text-xl text-daleel-pure-light/70 max-w-2xl mx-auto">
                            {language === 'ar'
                                ? 'من التسجيل إلى قاعدة معرفية حية في أقل من 5 دقائق.'
                                : 'From sign up to live knowledge base in under 5 minutes.'}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {steps.map((step, index) => (
                            <div key={index} className="step-card relative">
                                <div className="bg-daleel-tech-slate rounded-2xl p-8 border border-daleel-cyan/20 hover:border-daleel-neon/60 transition-colors h-full border-glow-hover">
                                    <div className="text-6xl font-bold text-daleel-gradient mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                                        {step.number}
                                    </div>
                                    <div className="w-12 h-12 bg-daleel-gradient rounded-xl flex items-center justify-center mb-4 glow-neon">
                                        <step.icon className="w-6 h-6 text-daleel-deep-space" />
                                    </div>
                                    <h3 className="text-xl font-bold text-daleel-pure-light mb-2">{step.title[language]}</h3>
                                    <p className="text-daleel-pure-light/70">{step.description[language]}</p>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`hidden lg:block absolute top-1/2 ${isRTL ? '-left-4' : '-right-4'} transform -translate-y-1/2`}>
                                        <ArrowRight className="w-8 h-8 text-daleel-cyan/50" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section ref={ctaRef} className="py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="cta-content relative bg-daleel-gradient rounded-3xl p-12 text-center overflow-hidden glow-neon-lg">
                        {/* Circuit pattern overlay */}
                        <div className="absolute inset-0 circuit-pattern opacity-20" />

                        <div className="relative z-10">
                            <h2 className="text-4xl sm:text-5xl font-bold text-daleel-deep-space mb-6" style={{ fontFamily: 'Space Grotesk, Tajawal, sans-serif' }}>
                                {language === 'ar' ? 'جاهز لتحويل دعمك؟' : 'Ready to Transform Your Support?'}
                            </h2>
                            <p className="text-xl text-daleel-deep-space/80 mb-8 max-w-2xl mx-auto">
                                {language === 'ar'
                                    ? 'انضم إلى الفرق التي قللت تذاكر الدعم بنسبة تصل إلى 50٪ بقواعد المعرفة المدعومة بالذكاء الاصطناعي.'
                                    : 'Join teams who\'ve reduced support tickets by up to 50% with AI-powered knowledge bases.'}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    to="/signup"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-daleel-deep-space text-daleel-neon font-semibold rounded-full hover:shadow-xl transition-all text-lg border-2 border-daleel-deep-space hover:border-daleel-tech-slate"
                                >
                                    {t('landing.hero.cta')}
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            </div>
                            <div className={`flex items-center justify-center gap-6 mt-8 text-daleel-deep-space/80 text-sm flex-wrap`}>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5" />
                                    {language === 'ar' ? 'لا تحتاج بطاقة ائتمان' : 'No credit card required'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5" />
                                    {language === 'ar' ? 'إعداد 5 دقائق' : '5-minute setup'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5" />
                                    {language === 'ar' ? 'إلغاء في أي وقت' : 'Cancel anytime'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-daleel-tech-slate border-t border-daleel-cyan/20 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-daleel-neon/20 border-2 border-daleel-neon rounded-xl flex items-center justify-center glow-neon">
                                <CircuitBoard className="w-5 h-5 text-daleel-neon" />
                            </div>
                            <div>
                                <span className="text-xl font-bold text-daleel-pure-light">
                                    {language === 'ar' ? 'دليل' : 'Daleel'}
                                </span>
                                <p className="text-xs text-daleel-cyan">{t('brand.tagline')}</p>
                            </div>
                        </div>
                        <div className="text-center md:text-right text-daleel-pure-light/60">
                            <p>{t('landing.footer.copyright')}</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
