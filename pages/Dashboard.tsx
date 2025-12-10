import React, { useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../i18n/useTranslation';
import { getMyTenants, autoAcceptPendingInvites, getUserTenantRole, UserRole } from '../services/tenantApi';
import { Tenant } from '../contexts/TenantContext';
import {
    Loader2, Plus, ExternalLink, Settings, Shield, Eye, Crown,
    CircuitBoard, LayoutDashboard, LogOut, BookOpen, Globe
} from 'lucide-react';

interface TenantWithRole extends Tenant {
    userRole: UserRole;
}

export default function Dashboard() {
    const { user, signOut, loading: authLoading } = useAuth();
    const { language, toggleLanguage, isRTL } = useLanguage();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [tenants, setTenants] = useState<TenantWithRole[]>([]);
    const [loading, setLoading] = useState(true);

    const containerRef = React.useRef<HTMLDivElement>(null);
    const hasAnimated = React.useRef(false);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        const loadDashboard = async () => {
            if (!user) return;

            // Auto-accept any pending invites first
            await autoAcceptPendingInvites();

            // Then fetch all tenants
            const allTenants = await getMyTenants();

            // Get role for each tenant
            const tenantsWithRoles: TenantWithRole[] = await Promise.all(
                allTenants.map(async (t) => {
                    const role = await getUserTenantRole(t.id);
                    return { ...t, userRole: role };
                })
            );

            setTenants(tenantsWithRoles);
            setLoading(false);
        };

        loadDashboard();
    }, [user]);

    // Animation Effect
    useEffect(() => {
        if (!loading && tenants.length > 0 && !hasAnimated.current && containerRef.current) {
            const ctx = gsap.context(() => {
                const tl = gsap.timeline();

                tl.from(".dashboard-header", {
                    y: -20,
                    opacity: 0,
                    duration: 0.6,
                    ease: "power2.out"
                })
                    .from(".dashboard-title", {
                        x: isRTL ? 20 : -20,
                        opacity: 0,
                        duration: 0.6,
                        ease: "power2.out"
                    }, "-=0.4")
                    .from(".tenant-card", {
                        y: 30,
                        opacity: 0,
                        duration: 0.6,
                        stagger: 0.1,
                        ease: "back.out(1.5)"
                    }, "-=0.2")
                    .from(".help-section", {
                        y: 20,
                        opacity: 0,
                        duration: 0.6,
                        ease: "power2.out"
                    }, "-=0.4");

                hasAnimated.current = true;
            }, containerRef);

            return () => ctx.revert();
        }
    }, [loading, tenants, isRTL]);

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const getRoleIcon = (role: UserRole) => {
        switch (role) {
            case 'owner': return <Crown className="w-4 h-4 text-daleel-neon" />;
            case 'admin': return <Shield className="w-4 h-4 text-daleel-cyan" />;
            case 'viewer': return <Eye className="w-4 h-4 text-daleel-pure-light/50" />;
            default: return null;
        }
    };

    const getRoleBadge = (role: UserRole) => {
        const styles = {
            owner: 'bg-daleel-neon/20 text-daleel-neon border border-daleel-neon/30',
            admin: 'bg-daleel-cyan/20 text-daleel-cyan border border-daleel-cyan/30',
            viewer: 'bg-daleel-pure-light/10 text-daleel-pure-light/60 border border-daleel-pure-light/20'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${styles[role || 'viewer']}`}>
                {language === 'ar' ? (
                    role === 'owner' ? 'مالك' : role === 'admin' ? 'مدير' : 'مشاهد'
                ) : role || 'viewer'}
            </span>
        );
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-daleel-deep-space circuit-pattern">
                <div className={`${isRTL ? 'text-right' : 'text-center'}`}>
                    <Loader2 className="w-10 h-10 text-daleel-neon animate-spin mx-auto mb-4" />
                    <p className="text-daleel-pure-light/70">
                        {language === 'ar' ? 'جاري تحميل قواعدك المعرفية...' : 'Loading your knowledge bases...'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="min-h-screen bg-daleel-deep-space circuit-pattern">
            {/* Header */}
            <header className="bg-daleel-tech-slate border-b border-daleel-cyan/20 sticky top-0 z-10 dashboard-header">
                <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-daleel-neon/20 border-2 border-daleel-neon rounded-xl flex items-center justify-center glow-neon">
                            <CircuitBoard className="w-5 h-5 text-daleel-neon" />
                        </div>
                        <div>
                            <h1 className="font-bold text-daleel-pure-light">{t('brand.name')}</h1>
                            <p className="text-sm text-daleel-cyan">{t('dashboard.title')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleLanguage}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-daleel-neon/10 hover:bg-daleel-neon/20 transition-all text-sm border border-daleel-neon/30 hover:border-daleel-neon text-daleel-pure-light"
                        >
                            <Globe size={14} />
                            <span className="font-bold">{language === 'ar' ? 'EN' : 'ع'}</span>
                        </button>
                        <span className="text-sm text-daleel-pure-light/70 hidden sm:inline">{user?.email}</span>
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-2 px-3 py-2 text-daleel-pure-light/70 hover:text-red-400 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">{t('common.logout')}</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* Welcome Section */}
                <div className={`mb-8 dashboard-title ${isRTL ? 'text-right' : ''}`}>
                    <h2 className="text-3xl font-bold text-daleel-pure-light mb-2 flex items-center gap-3" style={{ fontFamily: 'Space Grotesk, Tajawal, sans-serif' }}>
                        <LayoutDashboard className="w-8 h-8 text-daleel-neon" />
                        {t('dashboard.title')}
                    </h2>
                    <p className="text-daleel-pure-light/70">
                        {language === 'ar' ? 'إدارة جميع قواعدك المعرفية في مكان واحد' : 'Manage all your knowledge bases in one place'}
                    </p>
                </div>

                {/* Tenants Grid */}
                {tenants.length === 0 ? (
                    <div className="bg-daleel-tech-slate rounded-2xl border border-daleel-cyan/20 p-12 text-center glow-cyan">
                        <div className="w-20 h-20 bg-daleel-neon/20 border-2 border-daleel-neon rounded-full flex items-center justify-center mx-auto mb-6 glow-neon">
                            <BookOpen className="w-10 h-10 text-daleel-neon" />
                        </div>
                        <h3 className="text-2xl font-bold text-daleel-pure-light mb-2" style={{ fontFamily: 'Space Grotesk, Tajawal, sans-serif' }}>
                            {t('dashboard.noKnowledgeBases')}
                        </h3>
                        <p className="text-daleel-pure-light/70 mb-8 max-w-md mx-auto">
                            {language === 'ar'
                                ? 'أنشئ قاعدتك المعرفية الأولى لبدء مساعدة عملائك بإجابات مدعومة بالذكاء الاصطناعي.'
                                : 'Create your first knowledge base to start helping your customers with AI-powered answers.'}
                        </p>
                        <Link
                            to="/onboarding"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-daleel-neon text-daleel-deep-space font-semibold rounded-xl hover:bg-daleel-green transition-all glow-neon"
                        >
                            <Plus className="w-5 h-5" />
                            {t('dashboard.createFirst')}
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {tenants.map((tenant) => (
                                <div
                                    key={tenant.id}
                                    className="bg-daleel-tech-slate rounded-xl border border-daleel-cyan/20 overflow-hidden hover:border-daleel-cyan/60 transition-all group tenant-card border-glow-hover"
                                >
                                    {/* Color Bar */}
                                    <div
                                        className="h-2"
                                        style={{ backgroundColor: tenant.primary_color || '#A3FF47' }}
                                    />

                                    <div className="p-6">
                                        {/* Header */}
                                        <div className={`flex items-start justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                                <div
                                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-daleel-deep-space font-bold text-lg"
                                                    style={{ backgroundColor: tenant.primary_color || '#A3FF47' }}
                                                >
                                                    {tenant.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className={isRTL ? 'text-right' : ''}>
                                                    <h3 className="font-bold text-daleel-pure-light group-hover:text-daleel-neon transition-colors">
                                                        {tenant.name}
                                                    </h3>
                                                    <p className="text-sm text-daleel-cyan/70" dir="ltr">/kb/{tenant.slug}</p>
                                                </div>
                                            </div>
                                            {getRoleBadge(tenant.userRole)}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <Link
                                                to={`/kb/${tenant.slug}`}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-daleel-deep-space text-daleel-pure-light rounded-lg hover:bg-daleel-deep-space/80 border border-daleel-cyan/30 hover:border-daleel-cyan transition-all font-medium text-sm"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                {t('dashboard.view')}
                                            </Link>
                                            {(tenant.userRole === 'owner' || tenant.userRole === 'admin') && (
                                                <Link
                                                    to={`/kb/${tenant.slug}/admin`}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-daleel-deep-space rounded-lg hover:opacity-90 transition-all font-medium text-sm glow-neon"
                                                    style={{ backgroundColor: tenant.primary_color || '#A3FF47' }}
                                                >
                                                    <Shield className="w-4 h-4" />
                                                    {t('dashboard.admin')}
                                                </Link>
                                            )}
                                            {tenant.userRole === 'owner' && (
                                                <Link
                                                    to="/settings"
                                                    className="flex items-center justify-center px-3 py-2.5 text-daleel-pure-light/70 hover:text-daleel-neon hover:bg-daleel-deep-space/50 rounded-lg transition-all"
                                                    title={t('settings.title')}
                                                >
                                                    <Settings className="w-4 h-4" />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Create New Card */}
                            <Link
                                to="/onboarding"
                                className="bg-daleel-tech-slate rounded-xl border-2 border-dashed border-daleel-cyan/30 p-6 flex flex-col items-center justify-center text-center hover:border-daleel-neon hover:bg-daleel-tech-slate/80 transition-all group min-h-[200px] tenant-card"
                            >
                                <div className="w-14 h-14 bg-daleel-neon/10 group-hover:bg-daleel-neon/20 rounded-full flex items-center justify-center mb-4 transition-all border border-daleel-neon/30 group-hover:border-daleel-neon">
                                    <Plus className="w-7 h-7 text-daleel-neon transition-colors" />
                                </div>
                                <h3 className="font-semibold text-daleel-pure-light group-hover:text-daleel-neon transition-colors">
                                    {t('dashboard.createNew')}
                                </h3>
                                <p className="text-sm text-daleel-pure-light/50 mt-1">
                                    {language === 'ar' ? 'ابدأ من جديد بقاعدة معرفية جديدة' : 'Start fresh with a new KB'}
                                </p>
                            </Link>
                        </div>
                    </>
                )}

                {/* Help Section */}
                <div className="mt-12 bg-daleel-gradient rounded-2xl p-8 text-daleel-deep-space help-section glow-neon-lg">
                    <div className={`flex flex-col md:flex-row items-center justify-between gap-6 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
                        <div className={isRTL ? 'text-right' : ''}>
                            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk, Tajawal, sans-serif' }}>
                                {language === 'ar' ? 'تحتاج مساعدة للبدء؟' : 'Need help getting started?'}
                            </h3>
                            <p className="text-daleel-deep-space/80">
                                {language === 'ar'
                                    ? 'تحقق من وثائقنا أو اتصل بالدعم للحصول على المساعدة.'
                                    : 'Check out our documentation or contact support for assistance.'}
                            </p>
                        </div>
                        <Link
                            to="/gemini-guide"
                            className="px-6 py-3 bg-daleel-deep-space text-daleel-neon font-semibold rounded-xl hover:shadow-xl transition-all whitespace-nowrap border-2 border-daleel-deep-space"
                        >
                            {language === 'ar' ? 'عرض الوثائق' : 'View Documentation'}
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
