import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Navbar } from '../components/Navbar';
import { KnowledgeCard } from '../components/KnowledgeCard';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { AIAssistant } from '../components/AIAssistant';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../i18n/useTranslation';
import { getAllContent, getCategories, getAnalytics, getRecentSearches, logSearchEvent, logQuestionClickEvent } from '../services/api';
import { getTenantBySlug, getUserTenantRole, UserRole } from '../services/tenantApi';
import { Tenant } from '../contexts/TenantContext';
import { useAuth } from '../contexts/AuthContext';
import { KnowledgeItem, CategoryData, AnalyticsData, SearchLog, SortOption } from '../types';
import { Search, Filter, SortAsc, History, BarChart2, Loader2, AlertCircle } from 'lucide-react';
import logo from '../src/assets/logo.png';
import { AnimatedBackground, BackgroundPresets } from '../animations';
import { EASING, STAGGER } from '../animations/config/animationConfig';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
    // Get tenant slug from URL
    const { slug } = useParams<{ slug: string }>();

    // Auth context
    const { user } = useAuth();

    // Language context
    const { language, isRTL } = useLanguage();
    const { t } = useTranslation();

    // Tenant state
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [tenantLoading, setTenantLoading] = useState(true);
    const [tenantNotFound, setTenantNotFound] = useState(false);

    // User role state
    const [userRole, setUserRole] = useState<UserRole>(null);

    // Check if current user can edit (owner or admin)
    const canEdit = userRole === 'owner' || userRole === 'admin';

    // Data State
    const [data, setData] = useState<KnowledgeItem[]>([]);
    const [categories, setCategories] = useState<CategoryData[]>([]);
    const [recentSearches, setRecentSearches] = useState<SearchLog[]>([]);
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [sortOption, setSortOption] = useState<SortOption>('mostClicked');
    const [showRecentSearches, setShowRecentSearches] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);

    // Fetch tenant first
    useEffect(() => {
        const fetchTenant = async () => {
            if (!slug) {
                setTenantNotFound(true);
                setTenantLoading(false);
                return;
            }

            const tenantData = await getTenantBySlug(slug);
            if (tenantData) {
                setTenant(tenantData);

                // Fetch user's role for this tenant
                if (user) {
                    const role = await getUserTenantRole(tenantData.id);
                    setUserRole(role);
                }
            } else {
                setTenantNotFound(true);
            }
            setTenantLoading(false);
        };
        fetchTenant();
    }, [slug, user]);

    // Fetch data once tenant is loaded
    const fetchData = async () => {
        if (!tenant?.id) return;

        setIsLoading(true);
        try {
            const [content, cats, searches, stats] = await Promise.all([
                getAllContent(tenant.id),
                getCategories(tenant.id),
                getRecentSearches(tenant.id),
                getAnalytics(tenant.id)
            ]);
            setData(content);
            setCategories(cats);
            setRecentSearches(searches);
            setAnalyticsData(stats);
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (tenant?.id) {
            fetchData();
        }
    }, [tenant?.id]);

    // Filtering & Sorting Logic
    const filteredData = useMemo(() => {
        let result = data;

        if (selectedCategory) {
            result = result.filter(item => item.category === selectedCategory);
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(item =>
                item.question.toLowerCase().includes(q) ||
                item.answer.toLowerCase().includes(q) ||
                (item.keywords && item.keywords.toLowerCase().includes(q))
            );
        }

        return [...result].sort((a, b) => {
            switch (sortOption) {
                case 'mostClicked':
                    return b.views - a.views;
                case 'category':
                    return a.category.localeCompare(b.category);
                case 'alphabetical':
                    return a.question.localeCompare(b.question);
                default:
                    return 0;
            }
        });
    }, [data, searchQuery, selectedCategory, sortOption]);

    // Event Handlers
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        if (e.target.value.length > 3 && tenant?.id) {
            logSearchEvent(tenant.id, e.target.value, true);
        }
    };

    const handleRecentSearchClick = (query: string) => {
        setSearchQuery(query);
        setShowRecentSearches(false);
    };

    const uniqueCategories = useMemo(() => categories.map(c => c.mainCategory), [categories]);

    // Get primary color from tenant or use default Daleel neon
    const primaryColor = tenant?.primary_color || '#A3FF47';

    // Tenant not found state
    if (tenantNotFound) {
        return (
            <div className="min-h-screen bg-daleel-deep-space circuit-pattern flex items-center justify-center p-4">
                <div className={`text-center max-w-md`}>
                    <div className="w-16 h-16 bg-red-500/20 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-daleel-pure-light mb-2" style={{ fontFamily: 'Space Grotesk, Tajawal, sans-serif' }}>
                        {language === 'ar' ? 'لم يتم العثور على قاعدة المعرفة' : 'Knowledge Base Not Found'}
                    </h1>
                    <p className="text-daleel-pure-light/70 mb-6">
                        {language === 'ar' ? 'تأكد من الرابط أو ارجع للصفحة الرئيسية' : 'Check the URL or go back to home'}
                    </p>
                    <Link
                        to="/"
                        className="inline-block px-6 py-3 bg-daleel-neon text-daleel-deep-space rounded-xl hover:bg-daleel-green transition-all font-medium glow-neon"
                    >
                        {language === 'ar' ? 'العودة للرئيسية' : 'Go Home'}
                    </Link>
                </div>
            </div>
        );
    }

    // Loading state
    if (tenantLoading) {
        return (
            <div className="min-h-screen bg-daleel-deep-space circuit-pattern flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-daleel-neon animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-daleel-deep-space circuit-pattern flex flex-col relative overflow-hidden">
            {/* Animated Background */}
            <AnimatedBackground
                {...BackgroundPresets.minimal}
                showMouseGlow={true}
                primaryColor={primaryColor}
                className="fixed inset-0 -z-5"
            />

            <Navbar
                tenantName={tenant?.name}
                primaryColor={primaryColor}
                tenantSlug={slug}
                isAdmin={canEdit}
            />

            <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">

                {/* Search & Filter Section */}
                <div className="bg-daleel-tech-slate rounded-2xl shadow-lg border border-daleel-cyan/20 p-6 mb-8 sticky top-24 z-30 glow-cyan">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                        {/* Category Filter */}
                        <div className="md:col-span-3">
                            <div className="relative">
                                <Filter className={`absolute top-1/2 ${isRTL ? 'right-3' : 'left-3'} -translate-y-1/2 text-daleel-cyan w-4 h-4`} />
                                <select
                                    className={`w-full bg-daleel-deep-space border border-daleel-cyan/30 text-daleel-pure-light text-sm rounded-lg focus:ring-2 focus:ring-daleel-neon focus:border-daleel-neon block p-3 ${isRTL ? 'pr-10' : 'pl-10'} appearance-none transition-all font-medium`}
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    <option value="">{t('kb.allCategories')}</option>
                                    {uniqueCategories.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Sort Option */}
                        <div className="md:col-span-2">
                            <div className="relative">
                                <SortAsc className={`absolute top-1/2 ${isRTL ? 'right-3' : 'left-3'} -translate-y-1/2 text-daleel-cyan w-4 h-4`} />
                                <select
                                    className={`w-full bg-daleel-deep-space border border-daleel-cyan/30 text-daleel-pure-light text-sm rounded-lg focus:ring-2 focus:ring-daleel-neon focus:border-daleel-neon block p-3 ${isRTL ? 'pr-10' : 'pl-10'} appearance-none transition-all font-medium`}
                                    value={sortOption}
                                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                                >
                                    <option value="mostClicked">{language === 'ar' ? 'الأكثر استخداماً' : 'Most Viewed'}</option>
                                    <option value="category">{language === 'ar' ? 'حسب الفئة' : 'By Category'}</option>
                                    <option value="alphabetical">{language === 'ar' ? 'أبجدي' : 'Alphabetical'}</option>
                                </select>
                            </div>
                        </div>

                        {/* Main Search */}
                        <div className="md:col-span-5">
                            <div className="relative">
                                <input
                                    type="text"
                                    className={`w-full bg-daleel-deep-space border border-daleel-cyan/30 text-daleel-pure-light text-sm rounded-lg focus:ring-2 focus:ring-daleel-neon focus:border-daleel-neon block p-3 ${isRTL ? 'pr-10' : 'pl-10'} shadow-sm transition-all placeholder:text-daleel-pure-light/40`}
                                    placeholder={t('kb.searchPlaceholder')}
                                    value={searchQuery}
                                    onChange={handleSearch}
                                    dir={isRTL ? 'rtl' : 'ltr'}
                                />
                                <Search className={`absolute top-1/2 ${isRTL ? 'right-3' : 'left-3'} -translate-y-1/2 w-5 h-5`} style={{ color: primaryColor }} />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="md:col-span-2 flex gap-2">
                            <button
                                onClick={() => setShowRecentSearches(!showRecentSearches)}
                                className="flex items-center justify-center p-3 text-daleel-pure-light/70 bg-daleel-deep-space border border-daleel-cyan/30 hover:bg-daleel-tech-slate hover:border-daleel-cyan transition-all rounded-lg relative w-12"
                                title={language === 'ar' ? 'سجل البحث' : 'History'}
                            >
                                <History size={20} />
                                {showRecentSearches && (
                                    <div className={`absolute top-full mt-2 ${isRTL ? 'left-0' : 'right-0'} w-64 bg-daleel-tech-slate rounded-xl shadow-xl border border-daleel-cyan/30 p-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2`}>
                                        <div className="text-xs font-semibold text-daleel-cyan mb-2 px-2">
                                            {language === 'ar' ? 'بحث مؤخراً' : 'Recent Searches'}
                                        </div>
                                        {recentSearches.length > 0 ? (
                                            recentSearches.map((s, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => handleRecentSearchClick(s.query)}
                                                    className={`px-3 py-2 hover:bg-daleel-deep-space rounded-lg cursor-pointer text-sm text-daleel-pure-light truncate ${isRTL ? 'text-right' : 'text-left'}`}
                                                >
                                                    {s.query}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-4 text-xs text-daleel-pure-light/50">
                                                {language === 'ar' ? 'لا يوجد سجل بحث' : 'No search history'}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </button>
                            <button
                                onClick={() => setShowAnalytics(true)}
                                className="flex items-center justify-center p-3 text-daleel-pure-light/70 bg-daleel-deep-space border border-daleel-cyan/30 hover:bg-daleel-tech-slate hover:border-daleel-cyan transition-all rounded-lg w-12"
                                title={t('analytics.title')}
                            >
                                <BarChart2 size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin mb-4" style={{ color: primaryColor }} />
                        <p className="text-daleel-pure-light animate-pulse font-medium">
                            {language === 'ar' ? 'جاري تحميل قاعدة المعرفة...' : 'Loading Knowledge Base...'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredData.length > 0 ? (
                            filteredData.map((item) => (
                                <KnowledgeCard
                                    key={item.id}
                                    item={item}
                                    categoryIndex={uniqueCategories.indexOf(item.category)}
                                    onView={(id) => logQuestionClickEvent(id)}
                                    t={t}
                                    lang={language}
                                />
                            ))
                        ) : (
                            <div className="text-center py-16 bg-daleel-tech-slate rounded-2xl border border-daleel-cyan/30 border-dashed">
                                <div className="bg-daleel-neon/20 border-2 border-daleel-neon w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 glow-neon p-3">
                                    <img src={logo} alt="Daleel Logo" className="w-full h-full object-contain" />
                                </div>
                                <h3 className="text-lg font-medium text-daleel-pure-light" style={{ fontFamily: 'Space Grotesk, Tajawal, sans-serif' }}>
                                    {t('kb.noResults')}
                                </h3>
                                <p className="text-daleel-pure-light/60 mt-1">
                                    {language === 'ar' ? 'جرب البحث بكلمات مختلفة' : 'Try different keywords'}
                                </p>
                                <div className="mt-4 flex gap-4 justify-center">
                                    <button
                                        onClick={() => { setSearchQuery(''); setSelectedCategory(''); }}
                                        className="hover:underline text-sm font-medium text-daleel-cyan hover:text-daleel-neon transition-colors"
                                    >
                                        {language === 'ar' ? 'عرض جميع النتائج' : 'Show all results'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Analytics Modal */}
            {analyticsData && (
                <AnalyticsDashboard
                    data={analyticsData}
                    isOpen={showAnalytics}
                    onClose={() => setShowAnalytics(false)}
                />
            )}

            {/* AI Assistant - only show if tenant has API key */}
            {tenant?.gemini_api_key && (
                <AIAssistant
                    apiKey={tenant.gemini_api_key}
                    knowledgeBase={data}
                    tenantName={tenant.name}
                />
            )}

            {/* Footer */}
            <footer className="bg-daleel-tech-slate border-t border-daleel-cyan/20 mt-auto">
                <div className="container mx-auto px-4 py-6 text-center text-sm text-daleel-pure-light/60 flex flex-col items-center gap-4">
                    <p>&copy; {new Date().getFullYear()} {tenant?.name || t('brand.name')}. {language === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
                </div>
            </footer>
        </div>
    );
}
