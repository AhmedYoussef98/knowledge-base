import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getInviteByToken, acceptInvite, PendingInvite } from '../services/tenantApi';
import {
    Loader2, CheckCircle2, XCircle, UserPlus, Shield, Eye,
    Sparkles, LogIn, UserCheck
} from 'lucide-react';

export default function AcceptInvite() {
    const { token } = useParams<{ token: string }>();
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [invite, setInvite] = useState<PendingInvite | null>(null);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [acceptedTenant, setAcceptedTenant] = useState<{ slug: string; name: string } | null>(null);

    // Fetch invite details
    useEffect(() => {
        const fetchInvite = async () => {
            if (!token) {
                setError('Invalid invite link');
                setLoading(false);
                return;
            }

            const inviteData = await getInviteByToken(token);

            if (!inviteData) {
                setError('Invite not found or has expired');
                setLoading(false);
                return;
            }

            if (inviteData.accepted_at) {
                setError('This invite has already been used');
                setLoading(false);
                return;
            }

            if (new Date(inviteData.expires_at) < new Date()) {
                setError('This invite has expired');
                setLoading(false);
                return;
            }

            setInvite(inviteData);
            setLoading(false);
        };

        fetchInvite();
    }, [token]);

    // Auto-accept if user is logged in
    useEffect(() => {
        const autoAccept = async () => {
            if (user && invite && !accepting && !success && !error) {
                handleAccept();
            }
        };

        if (!authLoading) {
            autoAccept();
        }
    }, [user, invite, authLoading]);

    const handleAccept = async () => {
        if (!token) return;

        setAccepting(true);
        setError('');

        const result = await acceptInvite(token);

        if (result.success) {
            setSuccess(true);
            setAcceptedTenant({
                slug: result.tenant_slug || '',
                name: result.tenant_name || ''
            });
        } else {
            setError(result.error || 'Failed to accept invite');
        }

        setAccepting(false);
    };

    const getRoleInfo = (role: string) => {
        if (role === 'admin') {
            return {
                icon: <Shield className="w-6 h-6 text-blue-600" />,
                label: 'Admin',
                description: 'You can add, edit, and manage content'
            };
        }
        return {
            icon: <Eye className="w-6 h-6 text-gray-600" />,
            label: 'Viewer',
            description: 'You can view content and use AI search'
        };
    };

    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-orange-50">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading invite...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error && !invite) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-orange-50 p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <XCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invite</h1>
                    <p className="text-gray-600 mb-8">{error}</p>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        Go to Homepage
                    </Link>
                </div>
            </div>
        );
    }

    // Success state
    if (success && acceptedTenant) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-orange-50 p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">You're In!</h1>
                    <p className="text-gray-600 mb-2">
                        You've joined <strong>{acceptedTenant.name}</strong>
                    </p>
                    <p className="text-sm text-gray-500 mb-8">
                        You now have access to this knowledge base.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Link
                            to={`/kb/${acceptedTenant.slug}`}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                        >
                            <Sparkles className="w-5 h-5" />
                            Go to Knowledge Base
                        </Link>
                        <Link
                            to="/dashboard"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all"
                        >
                            Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Show invite details - need to login/signup first
    if (!user && invite) {
        const roleInfo = getRoleInfo(invite.role);

        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-orange-50 p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <UserPlus className="w-8 h-8 text-blue-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">You're Invited!</h1>
                        <p className="text-gray-600">
                            You've been invited to join a knowledge base
                        </p>
                    </div>

                    {/* Invite Details */}
                    <div className="bg-gray-50 rounded-xl p-6 mb-8">
                        <div className="flex items-center gap-4 mb-4">
                            <div
                                className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                                style={{ backgroundColor: (invite.tenant as any)?.primary_color || '#3B82F6' }}
                            >
                                {(invite.tenant as any)?.name?.charAt(0).toUpperCase() || 'K'}
                            </div>
                            <div>
                                <h2 className="font-bold text-gray-900 text-lg">
                                    {(invite.tenant as any)?.name || 'Knowledge Base'}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    /kb/{(invite.tenant as any)?.slug}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                            {roleInfo.icon}
                            <div>
                                <p className="font-medium text-gray-900">{roleInfo.label} Access</p>
                                <p className="text-sm text-gray-500">{roleInfo.description}</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <Link
                            to={`/signup?returnTo=/invite/${token}`}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                        >
                            <UserCheck className="w-5 h-5" />
                            Sign Up to Join
                        </Link>
                        <Link
                            to={`/login?returnTo=/invite/${token}`}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all"
                        >
                            <LogIn className="w-5 h-5" />
                            Already have an account? Sign In
                        </Link>
                    </div>

                    <p className="text-center text-sm text-gray-500 mt-6">
                        Invited by: {invite.email}
                    </p>
                </div>
            </div>
        );
    }

    // Accepting state (user is logged in)
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-orange-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
                <h1 className="text-xl font-bold text-gray-900 mb-2">Accepting Invite...</h1>
                <p className="text-gray-600">Just a moment while we add you to the team.</p>

                {error && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
