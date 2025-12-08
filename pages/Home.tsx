import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { KnowledgeCard } from '../components/KnowledgeCard';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { AIAssistant } from '../components/AIAssistant';
import { getAllContent, getCategories, getAnalytics, getRecentSearches, logSearchEvent, logQuestionClickEvent } from '../services/api';
import { getTenantBySlug } from '../services/tenantApi';
import { Tenant } from '../contexts/TenantContext';
import { useAuth } from '../contexts/AuthContext';
import { KnowledgeItem, CategoryData, AnalyticsData, SearchLog, SortOption } from '../types';
import { Search, Filter, SortAsc, History, BarChart2, Loader2, Sparkles, AlertCircle } from 'lucide-react';

// Translation Dictionary
const TRANSLATIONS = {
    ar: {
        navSubtitle: 'القاعدة المعرفية لخدمة العملاء',
        online: 'متصل',
        searchPlaceholder: 'ابحث عن سؤال...',
        allCategories: 'جميع الفئات',
        sortRecent: 'الأكثر استخداماً',
        sortCategory: 'حسب الفئة',
        sortAlpha: 'أبجدي',
        add: 'إضافة',
        recent: 'سجل البحث',
        analytics: 'الإحصائيات',
        loading: 'جاري تحميل قاعدة المعرفة...',
        noResults: 'لم يتم العثور على نتائج',
        noResultsSub: 'جرب البحث بكلمات مختلفة',
        showAll: 'عرض جميع النتائج',
        analyticsTitle: 'إحصائيات القاعدة المعرفية',
        topKeywords: 'الكلمات الأكثر بحثاً',
        topQuestions: 'الأسئلة الأكثر شيوعاً',
        views: 'مشاهدة',
        copyAnswer: 'نسخ الإجابة',
        copied: 'تم النسخ',
        footerRights: 'جميع الحقوق محفوظة.',
        recentSearchTitle: 'بحث مؤخراً',
        noRecentSearch: 'لا يوجد سجل بحث',
        notFound: 'لم يتم العثور على قاعدة المعرفة',
        notFoundSub: 'تأكد من الرابط أو ارجع للصفحة الرئيسية',
    },
    en: {
        navSubtitle: 'Customer Service Knowledge Base',
        online: 'Online',
        searchPlaceholder: 'Search for a question...',
        allCategories: 'All Categories',
        sortRecent: 'Most Viewed',
        sortCategory: 'By Category',
        sortAlpha: 'Alphabetical',
        add: 'Add',
        recent: 'History',
        analytics: 'Stats',
        loading: 'Loading Knowledge Base...',
        noResults: 'No results found',
        noResultsSub: 'Try different keywords',
        showAll: 'Show all results',
        analyticsTitle: 'Knowledge Base Analytics',
        topKeywords: 'Top Keywords',
        topQuestions: 'Top Questions',
        views: 'views',
        copyAnswer: 'Copy Answer',
        copied: 'Copied',
        footerRights: 'All rights reserved.',
        recentSearchTitle: 'Recent Searches',
        noRecentSearch: 'No search history',
        notFound: 'Knowledge Base Not Found',
        notFoundSub: 'Check the URL or go back to home',
    }
};

export default function Home() {
    // Get tenant slug from URL
    const { slug } = useParams<{ slug: string }>();

    // Auth context
    const { user } = useAuth();

    // Tenant state
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [tenantLoading, setTenantLoading] = useState(true);
    const [tenantNotFound, setTenantNotFound] = useState(false);

    // Check if current user is the owner
    const isOwner = user?.id === tenant?.owner_id;

    // Language State
    const [lang, setLang] = useState<'ar' | 'en'>('en');
    const t = (key: string) => TRANSLATIONS[lang][key as keyof typeof TRANSLATIONS['ar']] || key;
    const toggleLang = () => {
        const newLang = lang === 'ar' ? 'en' : 'ar';
        setLang(newLang);
        document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = newLang;
    };

    useEffect(() => {
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
    }, [lang]);

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
            } else {
                setTenantNotFound(true);
            }
            setTenantLoading(false);
        };
        fetchTenant();
    }, [slug]);

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

    // Get primary color from tenant or use default
    const primaryColor = tenant?.primary_color || '#F97316';

    // Tenant not found state
    if (tenantNotFound) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('notFound')}</h1>
                    <p className="text-gray-600 mb-6">{t('notFoundSub')}</p>
                    <Link
                        to="/"
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                    >
                        Go Home
                    </Link>
                </div>
            </div>
        );
    }

    // Loading state
    if (tenantLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${lang === 'ar' ? 'font-arabic' : 'font-sans'} bg-squad-bg flex flex-col`}>
            <Navbar
                lang={lang}
                toggleLang={toggleLang}
                t={t}
                tenantName={tenant?.name}
                primaryColor={primaryColor}
                tenantSlug={slug}
                isOwner={isOwner}
            />

            <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">

                {/* Search & Filter Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-squad-softPurple/30 p-6 mb-8 sticky top-24 z-30 transition-shadow hover:shadow-md">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                        {/* Category Filter */}
                        <div className="md:col-span-3">
                            <div className="relative">
                                <Filter className="absolute top-1/2 rtl:right-3 ltr:left-3 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <select
                                    className="w-full bg-squad-bg/50 border border-gray-200 text-squad-primary text-sm rounded-lg focus:ring-squad-orange focus:border-squad-orange block p-3 rtl:pr-10 ltr:pl-10 appearance-none transition-colors font-medium"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    <option value="">{t('allCategories')}</option>
                                    {uniqueCategories.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Sort Option */}
                        <div className="md:col-span-2">
                            <div className="relative">
                                <SortAsc className="absolute top-1/2 rtl:right-3 ltr:left-3 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <select
                                    className="w-full bg-squad-bg/50 border border-gray-200 text-squad-primary text-sm rounded-lg focus:ring-squad-orange focus:border-squad-orange block p-3 rtl:pr-10 ltr:pl-10 appearance-none transition-colors font-medium"
                                    value={sortOption}
                                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                                >
                                    <option value="mostClicked">{t('sortRecent')}</option>
                                    <option value="category">{t('sortCategory')}</option>
                                    <option value="alphabetical">{t('sortAlpha')}</option>
                                </select>
                            </div>
                        </div>

                        {/* Main Search */}
                        <div className="md:col-span-5">
                            <div className="relative">
                                <input
                                    type="text"
                                    className="w-full bg-squad-bg/50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-squad-orange focus:border-squad-orange block p-3 rtl:pr-10 ltr:pl-10 shadow-sm transition-all focus:shadow-md"
                                    placeholder={t('searchPlaceholder')}
                                    value={searchQuery}
                                    onChange={handleSearch}
                                />
                                <Search className="absolute top-1/2 rtl:right-3 ltr:left-3 -translate-y-1/2 w-5 h-5" style={{ color: primaryColor }} />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="md:col-span-2 flex gap-2">
                            <button
                                onClick={() => setShowRecentSearches(!showRecentSearches)}
                                className="flex items-center justify-center p-3 text-gray-500 bg-squad-bg/50 border border-gray-200 hover:bg-white hover:border-gray-300 rounded-lg transition-all relative w-12"
                                title={t('recent')}
                            >
                                <History size={20} />
                                {showRecentSearches && (
                                    <div className="absolute top-full mt-2 rtl:left-0 ltr:right-0 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                        <div className="text-xs font-semibold text-gray-400 mb-2 px-2">{t('recentSearchTitle')}</div>
                                        {recentSearches.length > 0 ? (
                                            recentSearches.map((s, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => handleRecentSearchClick(s.query)}
                                                    className="px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer text-sm text-gray-700 truncate rtl:text-right ltr:text-left"
                                                >
                                                    {s.query}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-4 text-xs text-gray-400">{t('noRecentSearch')}</div>
                                        )}
                                    </div>
                                )}
                            </button>
                            <button
                                onClick={() => setShowAnalytics(true)}
                                className="flex items-center justify-center p-3 text-gray-500 bg-squad-bg/50 border border-gray-200 hover:bg-white hover:border-gray-300 rounded-lg transition-all w-12"
                                title={t('analytics')}
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
                        <p className="text-squad-primary animate-pulse font-medium">{t('loading')}</p>
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
                                    lang={lang}
                                />
                            ))
                        ) : (
                            <div className="text-center py-16 bg-white rounded-2xl border border-squad-palePurple border-dashed">
                                <div className="bg-squad-bg w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Sparkles className="text-squad-lavender" size={32} />
                                </div>
                                <h3 className="text-lg font-medium text-squad-primary">{t('noResults')}</h3>
                                <p className="text-gray-500 mt-1">{t('noResultsSub')}</p>
                                <div className="mt-4 flex gap-4 justify-center">
                                    <button
                                        onClick={() => { setSearchQuery(''); setSelectedCategory(''); }}
                                        className="hover:underline text-sm font-medium"
                                        style={{ color: primaryColor }}
                                    >
                                        {t('showAll')}
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
                    t={t}
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
            <footer className="bg-white border-t border-gray-200 mt-auto">
                <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-500 flex flex-col items-center gap-4">
                    <p>&copy; {new Date().getFullYear()} {tenant?.name || 'Knowledge Base'}. {t('footerRights')}</p>
                </div>
            </footer>
        </div>
    );
}
