import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { QuestionTable } from '../components/Admin/QuestionTable';
import { QuestionModal } from '../components/Admin/QuestionModal';
import { getAllContent, getCategories } from '../services/api';
import { getTenantBySlug, getUserTenantRole, UserRole } from '../services/tenantApi';
import { useAuth } from '../contexts/AuthContext';
import { Tenant } from '../contexts/TenantContext';
import { KnowledgeItem, CategoryData } from '../types';
import { Plus, LayoutDashboard, Loader2, Settings, ExternalLink, AlertCircle } from 'lucide-react';

// Simple translation mock for Navbar reuse
const TRANSLATIONS = {
    ar: {
        navSubtitle: 'لوحة تحكم المشرف',
        online: 'متصل',
    },
    en: {
        navSubtitle: 'Admin Dashboard',
        online: 'Online',
    }
};

export default function Admin() {
    const { slug } = useParams<{ slug: string }>();
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [lang, setLang] = useState<'ar' | 'en'>('en');
    const t = (key: string) => TRANSLATIONS[lang][key as keyof typeof TRANSLATIONS['ar']] || key;
    const toggleLang = () => setLang(l => l === 'ar' ? 'en' : 'ar');

    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [tenantLoading, setTenantLoading] = useState(true);
    const [userRole, setUserRole] = useState<UserRole>(null);
    const [unauthorized, setUnauthorized] = useState(false);

    const [data, setData] = useState<KnowledgeItem[]>([]);
    const [categories, setCategories] = useState<CategoryData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<KnowledgeItem | undefined>(undefined);

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

    const primaryColor = tenant?.primary_color || '#3B82F6';

    if (tenantLoading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (unauthorized) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                    <p className="text-gray-600 mb-6">You don't have permission to access this admin panel. Only owners and admins can manage content.</p>
                    <div className="flex gap-4 justify-center">
                        <Link
                            to="/login"
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                        >
                            Sign In
                        </Link>
                        <Link
                            to={slug ? `/kb/${slug}` : '/'}
                            className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                        >
                            View Knowledge Base
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Navbar
                lang={lang}
                toggleLang={toggleLang}
                t={t}
                tenantName={tenant?.name}
                primaryColor={primaryColor}
                tenantSlug={slug}
                isAdmin={canEdit}
            />

            <div className="container mx-auto px-4 py-8 max-w-6xl">

                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <LayoutDashboard className="w-8 h-8" style={{ color: primaryColor }} />
                            Admin Dashboard
                        </h1>
                        <p className="text-gray-500 mt-2">
                            Manage questions, answers, and categories.
                            {userRole === 'admin' && <span className="text-blue-600 ml-2">(Admin)</span>}
                            {userRole === 'owner' && <span className="text-green-600 ml-2">(Owner)</span>}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {userRole === 'owner' && (
                            <Link
                                to="/settings"
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                            >
                                <Settings className="w-4 h-4" />
                                Settings
                            </Link>
                        )}
                        <Link
                            to={`/kb/${slug}`}
                            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                        >
                            <ExternalLink className="w-4 h-4" />
                            View Site
                        </Link>
                        <button
                            onClick={handleAdd}
                            className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors font-bold flex items-center gap-2 shadow-lg"
                            style={{ backgroundColor: primaryColor }}
                        >
                            <Plus className="w-5 h-5" />
                            Add Question
                        </button>
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin" style={{ color: primaryColor }} />
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

        </div>
    );
}
