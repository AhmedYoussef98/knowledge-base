import React, { useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMyTenants, autoAcceptPendingInvites, getUserTenantRole, UserRole } from '../services/tenantApi';
import { Tenant } from '../contexts/TenantContext';
import {
    Loader2, Plus, ExternalLink, Settings, Shield, Eye, Crown,
    Sparkles, LayoutDashboard, LogOut, BookOpen
} from 'lucide-react';

interface TenantWithRole extends Tenant {
    userRole: UserRole;
}

export default function Dashboard() {
    const { user, signOut, loading: authLoading } = useAuth();
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
                        x: -20,
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
    }, [loading, tenants]);

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const getRoleIcon = (role: UserRole) => {
        switch (role) {
            case 'owner': return <Crown className="w-4 h-4 text-yellow-600" />;
            case 'admin': return <Shield className="w-4 h-4 text-blue-600" />;
            case 'viewer': return <Eye className="w-4 h-4 text-gray-500" />;
            default: return null;
        }
    };

    const getRoleBadge = (role: UserRole) => {
        const styles = {
            owner: 'bg-yellow-100 text-yellow-700',
            admin: 'bg-blue-100 text-blue-700',
            viewer: 'bg-gray-100 text-gray-600'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${styles[role || 'viewer']}`}>
                {role || 'viewer'}
            </span>
        );
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Loading your knowledge bases...</p>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10 dashboard-header">
                <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900">KnowledgeHub</h1>
                            <p className="text-sm text-gray-500">Dashboard</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">{user?.email}</span>
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-red-600 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Sign Out</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* Welcome Section */}
                <div className="mb-8 dashboard-title">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                        <LayoutDashboard className="w-8 h-8 text-blue-600" />
                        Your Knowledge Bases
                    </h2>
                    <p className="text-gray-600">
                        Manage all your knowledge bases in one place
                    </p>
                </div>

                {/* Tenants Grid */}
                {tenants.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <BookOpen className="w-10 h-10 text-blue-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No Knowledge Bases Yet</h3>
                        <p className="text-gray-600 mb-8 max-w-md mx-auto">
                            Create your first knowledge base to start helping your customers with AI-powered answers.
                        </p>
                        <Link
                            to="/onboarding"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            Create Your First Knowledge Base
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {tenants.map((tenant) => (
                                <div
                                    key={tenant.id}
                                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all group tenant-card"
                                >
                                    {/* Color Bar */}
                                    <div
                                        className="h-2"
                                        style={{ backgroundColor: tenant.primary_color || '#3B82F6' }}
                                    />

                                    <div className="p-6">
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                                                    style={{ backgroundColor: tenant.primary_color || '#3B82F6' }}
                                                >
                                                    {tenant.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                        {tenant.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">/kb/{tenant.slug}</p>
                                                </div>
                                            </div>
                                            {getRoleBadge(tenant.userRole)}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <Link
                                                to={`/kb/${tenant.slug}`}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                View
                                            </Link>
                                            {(tenant.userRole === 'owner' || tenant.userRole === 'admin') && (
                                                <Link
                                                    to={`/kb/${tenant.slug}/admin`}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-lg hover:opacity-90 transition-colors font-medium text-sm"
                                                    style={{ backgroundColor: tenant.primary_color || '#3B82F6' }}
                                                >
                                                    <Shield className="w-4 h-4" />
                                                    Admin
                                                </Link>
                                            )}
                                            {tenant.userRole === 'owner' && (
                                                <Link
                                                    to="/settings"
                                                    className="flex items-center justify-center px-3 py-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                                    title="Settings"
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
                                className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-6 flex flex-col items-center justify-center text-center hover:border-blue-400 hover:bg-blue-50 transition-all group min-h-[200px] tenant-card"
                            >
                                <div className="w-14 h-14 bg-gray-100 group-hover:bg-blue-100 rounded-full flex items-center justify-center mb-4 transition-colors">
                                    <Plus className="w-7 h-7 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                </div>
                                <h3 className="font-semibold text-gray-600 group-hover:text-blue-600 transition-colors">
                                    Create New Knowledge Base
                                </h3>
                                <p className="text-sm text-gray-400 mt-1">
                                    Start fresh with a new KB
                                </p>
                            </Link>
                        </div>
                    </>
                )}

                {/* Help Section */}
                <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white help-section">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h3 className="text-xl font-bold mb-2">Need help getting started?</h3>
                            <p className="text-blue-100">
                                Check out our documentation or contact support for assistance.
                            </p>
                        </div>
                        <a
                            href="https://docs.example.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:shadow-lg transition-all whitespace-nowrap"
                        >
                            View Documentation
                        </a>
                    </div>
                </div>
            </main>
        </div>
    );
}
