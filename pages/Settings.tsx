import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { getMyTenant, updateTenantSettings, generateSlug, isSlugAvailable } from '../services/tenantApi';
import { Tenant } from '../contexts/TenantContext';
import {
    Settings as SettingsIcon, Key, Palette, Globe, Save,
    Loader2, AlertCircle, CheckCircle2, LogOut, ExternalLink
} from 'lucide-react';

export default function Settings() {
    const { user, signOut, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form data
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [primaryColor, setPrimaryColor] = useState('#F97316');
    const [originalSlug, setOriginalSlug] = useState('');

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        const fetchTenant = async () => {
            if (user) {
                const myTenant = await getMyTenant();
                if (myTenant) {
                    setTenant(myTenant);
                    setName(myTenant.name);
                    setSlug(myTenant.slug);
                    setOriginalSlug(myTenant.slug);
                    setApiKey(myTenant.gemini_api_key || '');
                    setPrimaryColor(myTenant.primary_color || '#F97316');
                } else {
                    navigate('/onboarding');
                }
                setLoading(false);
            }
        };
        fetchTenant();
    }, [user, navigate]);

    const handleSave = async () => {
        if (!tenant) return;

        setError('');
        setSuccess('');
        setSaving(true);

        // Check slug availability if changed
        if (slug !== originalSlug) {
            const available = await isSlugAvailable(slug);
            if (!available) {
                setError('This URL is already taken. Please choose a different one.');
                setSaving(false);
                return;
            }
        }

        const { error: updateError } = await updateTenantSettings(tenant.id, {
            name,
            slug: generateSlug(slug),
            gemini_api_key: apiKey || undefined,
            primary_color: primaryColor
        });

        if (updateError) {
            setError(updateError.message);
        } else {
            setSuccess('Settings saved successfully!');
            setOriginalSlug(slug);
            setTimeout(() => setSuccess(''), 3000);
        }

        setSaving(false);
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const colors = [
        '#F97316', '#3B82F6', '#8B5CF6', '#10B981',
        '#EF4444', '#EC4899', '#6366F1', '#14B8A6',
    ];

    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: primaryColor }}
                        >
                            {name ? name.charAt(0).toUpperCase() : 'K'}
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900">{name}</h1>
                            <p className="text-sm text-gray-500">Settings</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            to={`/kb/${slug}/admin`}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Admin Panel
                        </Link>
                        <button
                            onClick={handleSignOut}
                            className="px-4 py-2 text-gray-600 hover:text-red-600 transition-colors flex items-center gap-2"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-2xl mx-auto px-4 py-8">

                {/* General Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-6">
                        <Globe className="w-5 h-5 text-gray-400" />
                        General Settings
                    </h2>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Knowledge Base Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                URL Slug
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-sm whitespace-nowrap">/kb/</span>
                                <input
                                    type="text"
                                    value={slug}
                                    onChange={(e) => setSlug(generateSlug(e.target.value))}
                                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-6">
                        <Key className="w-5 h-5 text-gray-400" />
                        AI Settings
                    </h2>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Gemini API Key
                        </label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
                            placeholder="AIzaSy..."
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Get your API key from{' '}
                            <a
                                href="https://aistudio.google.com/app/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                            >
                                Google AI Studio
                            </a>
                        </p>
                    </div>
                </div>

                {/* Branding */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-6">
                        <Palette className="w-5 h-5 text-gray-400" />
                        Branding
                    </h2>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Primary Color
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {colors.map(color => (
                                <button
                                    key={color}
                                    onClick={() => setPrimaryColor(color)}
                                    className={`w-10 h-10 rounded-full transition-all ${primaryColor === color
                                            ? 'ring-4 ring-offset-2 ring-blue-400 scale-110'
                                            : 'hover:scale-105'
                                        }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Messages */}
                {error && (
                    <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 mb-6">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 mb-6">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        <span>{success}</span>
                    </div>
                )}

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {saving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            Save Changes
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
