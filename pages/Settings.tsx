import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    getMyTenant,
    updateTenantSettings,
    generateSlug,
    isSlugAvailable,
    getTenantMembers,
    updateMemberRole,
    removeTenantMember,
    createInvite,
    getPendingInvites,
    cancelInvite,
    getInviteUrl,
    TenantMember,
    PendingInvite
} from '../services/tenantApi';
import { Tenant } from '../contexts/TenantContext';
import {
    Key, Palette, Globe, Save,
    Loader2, AlertCircle, CheckCircle2, LogOut, ExternalLink,
    Users, UserPlus, Trash2, Shield, Eye, Crown, Copy, Link as LinkIcon,
    Clock, X, LayoutDashboard
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

    // Team management
    const [members, setMembers] = useState<TenantMember[]>([]);
    const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newMemberRole, setNewMemberRole] = useState<'admin' | 'viewer'>('viewer');
    const [creatingInvite, setCreatingInvite] = useState(false);
    const [inviteError, setInviteError] = useState('');
    const [inviteSuccess, setInviteSuccess] = useState('');
    const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

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

                    // Fetch team members and invites
                    fetchMembers(myTenant.id);
                    fetchInvites(myTenant.id);
                } else {
                    navigate('/dashboard');
                }
                setLoading(false);
            }
        };
        fetchTenant();
    }, [user, navigate]);

    const fetchMembers = async (tenantId: string) => {
        setLoadingMembers(true);
        const memberList = await getTenantMembers(tenantId);
        setMembers(memberList);
        setLoadingMembers(false);
    };

    const fetchInvites = async (tenantId: string) => {
        const invites = await getPendingInvites(tenantId);
        setPendingInvites(invites.filter(i => !i.accepted_at && new Date(i.expires_at) > new Date()));
    };

    const handleCreateInvite = async () => {
        if (!tenant || !newMemberEmail.trim()) return;

        setInviteError('');
        setInviteSuccess('');
        setCreatingInvite(true);

        const { data: invite, error: inviteErr } = await createInvite(
            tenant.id,
            newMemberEmail.trim(),
            newMemberRole
        );

        if (inviteErr) {
            setInviteError(inviteErr.message);
        } else if (invite) {
            setInviteSuccess('Invite created! Copy the link and send it to the user.');
            setNewMemberEmail('');
            fetchInvites(tenant.id);
            // Auto-copy to clipboard
            const url = getInviteUrl(invite.token);
            navigator.clipboard.writeText(url);
            setCopiedInviteId(invite.id);
            setTimeout(() => setCopiedInviteId(null), 3000);
        }

        setCreatingInvite(false);
    };

    const handleCopyInviteLink = async (invite: PendingInvite) => {
        const url = getInviteUrl(invite.token);
        await navigator.clipboard.writeText(url);
        setCopiedInviteId(invite.id);
        setTimeout(() => setCopiedInviteId(null), 3000);
    };

    const handleCancelInvite = async (inviteId: string) => {
        if (!confirm('Cancel this invite?')) return;
        await cancelInvite(inviteId);
        if (tenant) fetchInvites(tenant.id);
    };

    const handleUpdateRole = async (memberId: string, role: 'admin' | 'viewer') => {
        const { error } = await updateMemberRole(memberId, role);
        if (!error && tenant) {
            fetchMembers(tenant.id);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm('Are you sure you want to remove this team member?')) return;

        const { error } = await removeTenantMember(memberId);
        if (!error && tenant) {
            fetchMembers(tenant.id);
        }
    };

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
        navigate('/');
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
                            to="/dashboard"
                            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm flex items-center gap-2"
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                        </Link>
                        <Link
                            to={`/kb/${slug}`}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2"
                        >
                            <ExternalLink className="w-4 h-4" />
                            View KB
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

                {/* Team Management */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-6">
                        <Users className="w-5 h-5 text-gray-400" />
                        Team Members
                    </h2>

                    {/* Owner info */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <Crown className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">{user?.email}</p>
                                <p className="text-sm text-gray-500">You (Owner)</p>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                            Owner
                        </span>
                    </div>

                    {/* Members list */}
                    {loadingMembers ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                        </div>
                    ) : members.length > 0 ? (
                        <div className="space-y-3 mb-6">
                            {members.map(member => (
                                <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${member.role === 'admin' ? 'bg-blue-100' : 'bg-gray-100'
                                            }`}>
                                            {member.role === 'admin'
                                                ? <Shield className="w-5 h-5 text-blue-600" />
                                                : <Eye className="w-5 h-5 text-gray-500" />
                                            }
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{member.email || member.user_id.slice(0, 8) + '...'}</p>
                                            <p className="text-sm text-gray-500 capitalize">{member.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={member.role}
                                            onChange={(e) => handleUpdateRole(member.id, e.target.value as 'admin' | 'viewer')}
                                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="viewer">Viewer</option>
                                        </select>
                                        <button
                                            onClick={() => handleRemoveMember(member.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Remove member"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : null}

                    {/* Pending Invites */}
                    {pendingInvites.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Pending Invites
                            </h3>
                            <div className="space-y-2">
                                {pendingInvites.map(invite => (
                                    <div key={invite.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                                <LinkIcon className="w-4 h-4 text-yellow-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 text-sm">{invite.email}</p>
                                                <p className="text-xs text-gray-500 capitalize">{invite.role} • Expires {new Date(invite.expires_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleCopyInviteLink(invite)}
                                                className={`p-2 rounded-lg transition-colors ${copiedInviteId === invite.id
                                                    ? 'bg-green-100 text-green-600'
                                                    : 'text-gray-500 hover:bg-gray-100'
                                                    }`}
                                                title="Copy invite link"
                                            >
                                                {copiedInviteId === invite.id ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleCancelInvite(invite.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Cancel invite"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Create invite form */}
                    <div className="border-t border-gray-100 pt-6">
                        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                            <UserPlus className="w-4 h-4" />
                            Invite Team Member
                        </h3>

                        {inviteError && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{inviteError}</span>
                            </div>
                        )}

                        {inviteSuccess && (
                            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-4">
                                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                <span>{inviteSuccess}</span>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <input
                                type="email"
                                placeholder="team@example.com"
                                value={newMemberEmail}
                                onChange={(e) => setNewMemberEmail(e.target.value)}
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                            <select
                                value={newMemberRole}
                                onChange={(e) => setNewMemberRole(e.target.value as 'admin' | 'viewer')}
                                className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="viewer">Viewer</option>
                                <option value="admin">Admin</option>
                            </select>
                            <button
                                onClick={handleCreateInvite}
                                disabled={creatingInvite || !newMemberEmail.trim()}
                                className="px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {creatingInvite ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <LinkIcon className="w-4 h-4" />
                                        Create Link
                                    </>
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            A unique invite link will be created. Share it with the user to let them join your team.
                        </p>
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
                        <div className="flex items-center justify-between text-xs mt-2">
                            <p className="text-gray-500">Required for AI responses</p>
                            <Link to="/gemini-guide" className="text-blue-600 hover:text-blue-700 font-medium hover:underline flex items-center gap-1">
                                How to get a free key?
                                <ExternalLink className="w-3 h-3" />
                            </Link>
                        </div>
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
