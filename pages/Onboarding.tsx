import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createTenant, generateSlug, isSlugAvailable } from '../services/tenantApi';
import {
    BookOpen, Key, Palette, ArrowRight, ArrowLeft, Check,
    Loader2, AlertCircle, Sparkles, CheckCircle2, X, ExternalLink
} from 'lucide-react';

type Step = 1 | 2 | 3;

export default function Onboarding() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState<Step>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form data
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
    const [apiKey, setApiKey] = useState('');
    const [primaryColor, setPrimaryColor] = useState('#F97316');

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

    // Note: Removed the check validitating if user already has a tenant, as we support multiple now

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
            setError('Please provide a name for your knowledge base');
            return;
        }

        if (!slugAvailable) {
            setError('This URL is already taken. Please choose a different one.');
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
        { num: 1, title: 'Name', icon: BookOpen },
        { num: 2, title: 'AI Key', icon: Key },
        { num: 3, title: 'Style', icon: Palette },
    ];

    const colors = [
        '#F97316', // Orange
        '#3B82F6', // Blue
        '#8B5CF6', // Purple
        '#10B981', // Green
        '#EF4444', // Red
        '#EC4899', // Pink
        '#6366F1', // Indigo
        '#14B8A6', // Teal
    ];

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-orange-50 flex items-center justify-center p-4">
            <div className="w-full max-w-xl relative">

                {/* Close Button */}
                <Link
                    to="/dashboard"
                    className="absolute -top-12 right-0 p-2 bg-white/50 hover:bg-white rounded-full transition-colors"
                    title="Cancel"
                >
                    <X className="w-6 h-6 text-gray-600" />
                </Link>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg mb-4">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Create New Knowledge Base</h1>
                    <p className="text-gray-600 mt-2">Just a few quick steps to get started</p>
                </div>

                {/* Progress Steps */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-2">
                        {steps.map((s, idx) => (
                            <React.Fragment key={s.num}>
                                <div
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${step === s.num
                                        ? 'bg-blue-600 text-white'
                                        : step > s.num
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-400'
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
                                    <div className={`w-8 h-0.5 ${step > s.num ? 'bg-green-400' : 'bg-gray-200'}`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">

                    {/* Step 1: Name & URL */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Knowledge Base Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
                                    placeholder="My Company Knowledge Base"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    URL Slug
                                </label>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 text-sm">yoursite.com/kb/</span>
                                    <input
                                        type="text"
                                        value={slug}
                                        onChange={(e) => handleSlugChange(e.target.value)}
                                        className={`flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${slugAvailable === true ? 'border-green-300 bg-green-50' :
                                            slugAvailable === false ? 'border-red-300 bg-red-50' :
                                                'border-gray-200'
                                            }`}
                                        placeholder="my-company"
                                    />
                                </div>
                                {slugAvailable !== null && (
                                    <p className={`text-sm mt-2 ${slugAvailable ? 'text-green-600' : 'text-red-600'}`}>
                                        {slugAvailable ? '✓ This URL is available' : '✗ This URL is already taken'}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 2: API Key */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                <h3 className="font-medium text-blue-900 mb-1">Gemini AI API Key</h3>
                                <p className="text-sm text-blue-700">
                                    Add your Gemini API key to enable AI-powered features like smart search and auto-generated answers.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    API Key <span className="text-gray-400">(optional)</span>
                                </label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
                                    placeholder="AIzaSy..."
                                />
                                <div className="flex items-center justify-between text-xs mt-2">
                                    <p className="text-gray-500">Required for AI responses</p>
                                    <Link to="/gemini-guide" target="_blank" className="text-blue-600 hover:text-blue-700 font-medium hover:underline flex items-center gap-1">
                                        How to get a free key?
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

                            {/* Preview */}
                            <div className="mt-6 p-6 bg-gray-50 rounded-xl">
                                <p className="text-sm text-gray-500 mb-3">Preview</p>
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        {name ? name.charAt(0).toUpperCase() : 'K'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{name || 'Knowledge Base'}</h3>
                                        <p className="text-sm text-gray-500">yoursite.com/kb/{slug || 'your-kb'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mt-6">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-8">
                        {step > 1 ? (
                            <button
                                onClick={handleBack}
                                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Back
                            </button>
                        ) : (
                            <div />
                        )}

                        {step < 3 ? (
                            <button
                                onClick={handleNext}
                                disabled={!canProceed()}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={handleComplete}
                                disabled={loading || !canProceed()}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Check className="w-5 h-5" />
                                        Create Knowledge Base
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
