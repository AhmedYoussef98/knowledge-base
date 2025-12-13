import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { QuestionTable } from '../components/Admin/QuestionTable';
import { QuestionModal } from '../components/Admin/QuestionModal';
import { getAllContent, getCategories } from '../services/api';
import { getTenantBySlug, getUserTenantRole, UserRole } from '../services/tenantApi';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../i18n/useTranslation';
import { Tenant } from '../contexts/TenantContext';
import { KnowledgeItem, CategoryData } from '../types';
import { Plus, LayoutDashboard, Loader2, Settings, ExternalLink, AlertCircle, Shield, Crown, Upload, Download } from 'lucide-react';
import { BulkImportModal } from '../components/Admin/BulkImportModal';
import { exportToCSV, exportToXLSX } from '../utils/bulkImport';

export default function Admin() {
    const { slug } = useParams<{ slug: string }>();
    const { user, loading: authLoading } = useAuth();
    const { language, isRTL } = useLanguage();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [tenantLoading, setTenantLoading] = useState(true);
    const [userRole, setUserRole] = useState<UserRole>(null);
    const [unauthorized, setUnauthorized] = useState(false);

    const [data, setData] = useState<KnowledgeItem[]>([]);
    const [categories, setCategories] = useState<CategoryData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<KnowledgeItem | undefined>(undefined);
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Check if user can edit (owner or admin)
    const canEdit = userRole === 'owner' || userRole === 'admin';

    // Fetch tenant and verify access
    useEffect(() => {
        const fetchTenant = async () => {
            if (!slug) {
                setUnauthorized(true);
                setTenantLoading(false);
                return;
            }

            const tenantData = await getTenantBySlug(slug);
            if (!tenantData) {
                setUnauthorized(true);
                setTenantLoading(false);
                return;
            }

            setTenant(tenantData);

            // Check user's role for this tenant
            if (user) {
                const role = await getUserTenantRole(tenantData.id);
                setUserRole(role);

                // If not admin or owner, deny access
                if (role !== 'owner' && role !== 'admin') {
                    setUnauthorized(true);
                }
            } else if (!authLoading) {
                // Not logged in, redirect to login
                navigate('/login');
                return;
            }

            setTenantLoading(false);
        };

        if (!authLoading) {
            fetchTenant();
        }
    }, [slug, user, authLoading, navigate]);

    const fetchData = async () => {
        if (!tenant?.id) return;

        setIsLoading(true);
        try {
            const [content, cats] = await Promise.all([
                getAllContent(tenant.id),
                getCategories(tenant.id)
            ]);
            setData(content);
            setCategories(cats);
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (tenant?.id && canEdit) {
            fetchData();
        }
    }, [tenant?.id, canEdit]);

    const handleEdit = (item: KnowledgeItem) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingItem(undefined);
        setIsModalOpen(true);
    };

    const handleSuccess = () => {
        fetchData();
    };

    const primaryColor = tenant?.primary_color || '#A3FF47';

    if (tenantLoading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-daleel-deep-space circuit-pattern">
                <Loader2 className="w-8 h-8 text-daleel-neon animate-spin" />
            </div>
        );
    }

    if (unauthorized) {
        return (
            <div className="min-h-screen bg-daleel-deep-space circuit-pattern flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
                <div className={`text-center ${isRTL ? 'text-right' : ''}`}>
                    <div className="w-16 h-16 bg-red-400/20 border-2 border-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-daleel-pure-light mb-2" style={{ fontFamily: 'Space Grotesk, Tajawal, sans-serif' }}>
                        {language === 'ar' ? 'الوصول مرفوض' : 'Access Denied'}
                    </h1>
                    <p className="text-daleel-pure-light/70 mb-6 max-w-md">
                        {language === 'ar'
                            ? 'ليس لديك صلاحية للوصول لهذه اللوحة. المالكون والمدراء فقط يمكنهم إدارة المحتوى.'
                            : "You don't have permission to access this admin panel. Only owners and admins can manage content."}
                    </p>
                    <div className={`flex gap-4 justify-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Link
                            to="/login"
                            className="px-6 py-3 bg-daleel-neon text-daleel-deep-space rounded-xl hover:bg-daleel-green transition-colors font-semibold glow-neon"
                        >
                            {t('common.login')}
                        </Link>
                        <Link
                            to={slug ? `/kb/${slug}` : '/'}
                            className="px-6 py-3 bg-daleel-tech-slate border border-daleel-cyan/30 text-daleel-pure-light rounded-xl hover:border-daleel-cyan transition-colors font-medium"
                        >
                            {language === 'ar' ? 'عرض القاعدة المعرفية' : 'View Knowledge Base'}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-daleel-deep-space circuit-pattern font-sans" dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar
                tenantName={tenant?.name}
                primaryColor={primaryColor}
                tenantSlug={slug}
                isAdmin={canEdit}
            />

            <div className="container mx-auto px-4 py-8 max-w-6xl">

                {/* Header */}
                <div className={`flex justify-between items-center mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={isRTL ? 'text-right' : ''}>
                        <h1 className={`text-3xl font-bold text-daleel-pure-light flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`} style={{ fontFamily: 'Space Grotesk, Tajawal, sans-serif' }}>
                            <LayoutDashboard className="w-8 h-8 text-daleel-neon" />
                            {t('admin.title')}
                        </h1>
                        <p className={`text-daleel-pure-light/70 mt-2 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            {language === 'ar' ? 'إدارة الأسئلة والأجوبة والتصنيفات.' : 'Manage questions, answers, and categories.'}
                            {userRole === 'admin' && (
                                <span className={`text-daleel-cyan font-medium flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    <Shield className="w-4 h-4" />
                                    ({language === 'ar' ? 'مدير' : 'Admin'})
                                </span>
                            )}
                            {userRole === 'owner' && (
                                <span className={`text-daleel-neon font-medium flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    <Crown className="w-4 h-4" />
                                    ({language === 'ar' ? 'مالك' : 'Owner'})
                                </span>
                            )}
                        </p>
                    </div>
                    <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {userRole === 'owner' && (
                            <Link
                                to="/settings"
                                className={`px-4 py-2 bg-daleel-tech-slate border border-daleel-cyan/30 text-daleel-pure-light rounded-lg hover:border-daleel-cyan transition-colors font-medium flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
                            >
                                <Settings className="w-4 h-4" />
                                {t('settings.title')}
                            </Link>
                        )}
                        <Link
                            to={`/kb/${slug}`}
                            className={`px-4 py-2 bg-daleel-tech-slate border border-daleel-cyan/30 text-daleel-pure-light rounded-lg hover:border-daleel-cyan transition-colors font-medium flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
                        >
                            <ExternalLink className="w-4 h-4" />
                            {language === 'ar' ? 'عرض الموقع' : 'View Site'}
                        </Link>

                        {/* Export Button with Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                disabled={data.length === 0}
                                className={`px-4 py-2 bg-daleel-tech-slate border border-daleel-cyan/30 text-daleel-pure-light rounded-lg hover:border-daleel-cyan transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${isRTL ? 'flex-row-reverse' : ''}`}
                            >
                                <Download className="w-4 h-4" />
                                {t('admin.export')}
                            </button>
                            {showExportMenu && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                                    <div className={`absolute top-full mt-2 ${isRTL ? 'left-0' : 'right-0'} bg-daleel-tech-slate border border-daleel-cyan/30 rounded-lg shadow-xl z-20 overflow-hidden min-w-[120px]`}>
                                        <button
                                            onClick={() => {
                                                exportToCSV(data);
                                                setShowExportMenu(false);
                                            }}
                                            className="w-full px-4 py-2 text-daleel-pure-light hover:bg-daleel-deep-space transition-colors text-left"
                                        >
                                            CSV
                                        </button>
                                        <button
                                            onClick={() => {
                                                exportToXLSX(data);
                                                setShowExportMenu(false);
                                            }}
                                            className="w-full px-4 py-2 text-daleel-pure-light hover:bg-daleel-deep-space transition-colors text-left"
                                        >
                                            XLSX
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Import Button */}
                        <button
                            onClick={() => setIsBulkImportOpen(true)}
                            className={`px-4 py-2 bg-daleel-tech-slate border border-daleel-cyan/30 text-daleel-pure-light rounded-lg hover:border-daleel-cyan transition-colors font-medium flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
                        >
                            <Upload className="w-4 h-4" />
                            {t('admin.import')}
                        </button>

                        <button
                            onClick={handleAdd}
                            className={`px-4 py-2 text-daleel-deep-space rounded-lg hover:opacity-90 transition-all font-bold flex items-center gap-2 shadow-lg glow-neon ${isRTL ? 'flex-row-reverse' : ''}`}
                            style={{ backgroundColor: primaryColor }}
                        >
                            <Plus className="w-5 h-5" />
                            {t('admin.addQuestion')}
                        </button>
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-daleel-neon" />
                    </div>
                ) : (
                    <QuestionTable
                        data={data}
                        onEdit={handleEdit}
                        onDelete={fetchData}
                    />
                )}

            </div>

            <QuestionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSuccess}
                existingCategories={categories}
                initialData={editingItem}
                tenantId={tenant?.id || ''}
                geminiApiKey={tenant?.gemini_api_key || undefined}
            />

            <BulkImportModal
                isOpen={isBulkImportOpen}
                onClose={() => setIsBulkImportOpen(false)}
                onSuccess={handleSuccess}
                tenantId={tenant?.id || ''}
            />

        </div>
    );
}
