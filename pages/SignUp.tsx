import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { autoAcceptPendingInvites } from '../services/tenantApi';
import { Mail, Lock, UserPlus, Loader2, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [existingUser, setExistingUser] = useState(false);
    const { signUp, user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const containerRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLDivElement>(null);

    // Animation
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(formRef.current, {
                y: 20,
                opacity: 0,
                duration: 0.6,
                ease: "power2.out"
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    // Get return URL from query params
    const returnTo = searchParams.get('returnTo');

    // If already logged in, redirect
    useEffect(() => {
        if (user) {
            handlePostSignup();
        }
    }, [user]);

    const handlePostSignup = async () => {
        // Auto-accept any pending invites for this user
        await autoAcceptPendingInvites();

        // Redirect to returnTo or dashboard
        if (returnTo) {
            navigate(returnTo);
        } else {
            navigate('/dashboard');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        const { data, error: signUpError } = await signUp(email, password);

        if (signUpError) {
            console.log("Signup error:", signUpError.message);
            // Handle existing user specifically
            if (signUpError.message.toLowerCase().includes('already registered')) {
                setExistingUser(true);
            }
            // Check for rate limits or other specific errors
            else if (signUpError.message.includes('rate limit')) {
                setError('Too many requests. Please try again later.');
            }
            else {
                setError(signUpError.message);
            }
            setLoading(false);
            return;
        }

        // If data.session is null, it means email confirmation is required (and enabled)
        // If data.session is present, they are logged in (auto-confirm or disabled)
        if (data && !data.session && data.user) {
            setEmailSent(true);
        }

        // If session exists, the useEffect watching 'user' will handle the redirect
        setLoading(false);
    };

    const getLoginLink = () => {
        if (returnTo) {
            return `/login?returnTo=${encodeURIComponent(returnTo)}`;
        }
        return '/login';
    };

    // Email confirmation sent
    if (emailSent) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-orange-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h1>
                        <p className="text-gray-600 mb-6">
                            We've sent a confirmation link to <strong>{email}</strong>
                        </p>
                        <p className="text-sm text-gray-500 mb-8">
                            Click the link in the email to activate your account, then come back and sign in.
                        </p>
                        <Link
                            to={getLoginLink()}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                        >
                            Go to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Existing User Found
    if (existingUser) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-orange-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center animate-fade-in-up">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Sparkles className="w-8 h-8 text-blue-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">You already have an account</h1>
                        <p className="text-gray-600 mb-8">
                            The email <strong>{email}</strong> is already registered.
                        </p>
                        <Link
                            to={getLoginLink()}
                            className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all w-full justify-center"
                        >
                            Sign In Instead
                        </Link>
                        <button
                            onClick={() => setExistingUser(false)}
                            className="mt-4 text-sm text-gray-500 hover:text-gray-700 underline"
                        >
                            Use a different email
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-orange-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-block">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg mb-4">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Create your account</h1>
                    <p className="text-gray-600 mt-2">
                        {returnTo?.includes('invite')
                            ? 'Sign up to accept your invitation'
                            : 'Start building your knowledge base in minutes'
                        }
                    </p>
                </div>

                {/* Form Card */}
                <div ref={formRef} className="bg-white rounded-2xl shadow-xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="you@company.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5" />
                                    Create Account
                                </>
                            )}
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-6 text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to={getLoginLink()} className="text-blue-600 hover:underline font-medium">
                            Sign in
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-gray-500 mt-6">
                    By signing up, you agree to our Terms of Service and Privacy Policy.
                </p>

                {/* Back to Home */}
                <div className="text-center mt-4">
                    <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                        ← Back to home
                    </Link>
                </div>
            </div>
        </div>
    );
}
