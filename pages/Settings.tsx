import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../i18n/useTranslation';
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
import logo from '../src/assets/logo.png';

export default function Settings() {
    const { user, signOut, loading: authLoading } = useAuth();
    const { language, isRTL, toggleLanguage } = useLanguage();
    const { t } = useTranslation();
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
    const [primaryColor, setPrimaryColor] = useState('#A3FF47');
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
            // Wait for auth to finish loading before fetching
            if (authLoading) return;
            if (!user?.id) return;

            const myTenant = await getMyTenant();
            if (myTenant) {
                setTenant(myTenant);
                setName(myTenant.name);
                setSlug(myTenant.slug);
                setOriginalSlug(myTenant.slug);
                setApiKey(myTenant.gemini_api_key || '');
                setPrimaryColor(myTenant.primary_color || '#A3FF47');

                // Fetch team members and invites
                fetchMembers(myTenant.id);
                fetchInvites(myTenant.id);
            } else {
                // User is authenticated but doesn't own a tenant
                navigate('/onboarding');
            }
            setLoading(false);
        };
        fetchTenant();
    }, [user?.id, authLoading, navigate]);

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
            setInviteSuccess(t('settings.inviteCreated'));
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
        if (!confirm(t('settings.cancelInviteConfirm'))) return;
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
        if (!confirm(t('settings.removeMemberConfirm'))) return;

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
                setError(t('settings.slugTaken'));
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
            setSuccess(t('settings.saveSuccess'));
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
        '#A3FF47', '#00C2CB', '#4ADE80', '#14B8A6',
        '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444',
    ];

    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-daleel-deep-space circuit-pattern">
                <Loader2 className="w-8 h-8 text-daleel-neon animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-daleel-deep-space circuit-pattern" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="bg-daleel-tech-slate border-b border-daleel-cyan/20 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-daleel-deep-space font-bold border-2 glow-neon p-1"
                            style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                        >
                            {name ? name.charAt(0).toUpperCase() : <img src={logo} alt="Logo" className="w-full h-full object-contain" />}
                        </div>
                        <div className={isRTL ? 'text-right' : ''}>
                            <h1 className="font-bold text-daleel-pure-light">{name}</h1>
                            <p className="text-sm text-daleel-cyan">{t('settings.title')}</p>
                        </div>
                    </div>
                    <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <button
                            onClick={toggleLanguage}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-daleel-neon/10 hover:bg-daleel-neon/20 transition-all text-sm border border-daleel-neon/30 hover:border-daleel-neon text-daleel-pure-light"
                        >
                            <Globe size={14} />
                            <span className="font-bold">{language === 'ar' ? 'EN' : 'ع'}</span>
                        </button>
                        <Link
                            to="/dashboard"
                            className={`px-4 py-2 text-daleel-pure-light/70 hover:text-daleel-neon transition-colors font-medium text-sm flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            {t('dashboard.title')}
                        </Link>
                        <Link
                            to={`/kb/${slug}`}
                            className={`px-4 py-2 bg-daleel-neon text-daleel-deep-space rounded-lg hover:bg-daleel-green transition-colors font-semibold text-sm flex items-center gap-2 glow-neon ${isRTL ? 'flex-row-reverse' : ''}`}
                        >
                            <ExternalLink className="w-4 h-4" />
                            {t('dashboard.view')}
                        </Link>
                        <button
                            onClick={handleSignOut}
                            className={`px-4 py-2 text-daleel-pure-light/70 hover:text-red-400 transition-colors flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">{t('common.logout')}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-2xl mx-auto px-4 py-8">

                {/* General Settings */}
                <div className="bg-daleel-tech-slate rounded-xl shadow-lg border border-daleel-cyan/20 p-6 mb-6">
                    <h2 className={`text-lg font-semibold text-daleel-neon flex items-center gap-2 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`} style={{ fontFamily: 'Space Grotesk, Tajawal, sans-serif' }}>
                        <Globe className="w-5 h-5" />
                        {t('settings.general')}
                    </h2>

                    <div className="space-y-5">
                        <div>
                            <label className={`block text-sm font-medium text-daleel-pure-light/80 mb-2 ${isRTL ? 'text-right' : ''}`}>
                                {t('onboarding.kbName')}
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className={`w-full px-4 py-3 bg-daleel-deep-space border border-daleel-cyan/30 text-daleel-pure-light rounded-xl focus:ring-2 focus:ring-daleel-neon focus:border-daleel-neon transition-all ${isRTL ? 'text-right' : ''}`}
                            />
                        </div>

                        <div>
                            <label className={`block text-sm font-medium text-daleel-pure-light/80 mb-2 ${isRTL ? 'text-right' : ''}`}>
                                {t('onboarding.kbSlug')}
                            </label>
                            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <span className="text-daleel-cyan text-sm whitespace-nowrap">/kb/</span>
                                <input
                                    type="text"
                                    value={slug}
                                    onChange={(e) => setSlug(generateSlug(e.target.value))}
                                    className={`flex-1 px-4 py-3 bg-daleel-deep-space border border-daleel-cyan/30 text-daleel-pure-light rounded-xl focus:ring-2 focus:ring-daleel-neon focus:border-daleel-neon transition-all ${isRTL ? 'text-right' : ''}`}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Team Management */}
                <div className="bg-daleel-tech-slate rounded-xl shadow-lg border border-daleel-cyan/20 p-6 mb-6">
                    <h2 className={`text-lg font-semibold text-daleel-cyan flex items-center gap-2 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`} style={{ fontFamily: 'Space Grotesk, Tajawal, sans-serif' }}>
                        <Users className="w-5 h-5" />
                        {t('settings.team')}
                    </h2>

                    {/* Owner info */}
                    <div className={`flex items-center justify-between p-4 bg-daleel-neon/10 border border-daleel-neon/30 rounded-xl mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <div className="w-10 h-10 bg-daleel-neon/20 border border-daleel-neon rounded-full flex items-center justify-center">
                                <Crown className="w-5 h-5 text-daleel-neon" />
                            </div>
                            <div className={isRTL ? 'text-right' : ''}>
                                <p className="font-medium text-daleel-pure-light">{user?.email}</p>
                                <p className="text-sm text-daleel-pure-light/60">
                                    {language === 'ar' ? 'أنت (المالك)' : 'You (Owner)'}
                                </p>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-daleel-neon/20 text-daleel-neon text-sm font-bold rounded-full border border-daleel-neon/30">
                            {language === 'ar' ? 'مالك' : 'Owner'}
                        </span>
                    </div>

                    {/* Members list */}
                    {loadingMembers ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="w-6 h-6 text-daleel-cyan animate-spin" />
                        </div>
                    ) : members.length > 0 ? (
                        <div className="space-y-3 mb-6">
                            {members.map(member => (
                                <div key={member.id} className={`flex items-center justify-between p-4 bg-daleel-deep-space/50 border border-daleel-cyan/30 rounded-xl ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${member.role === 'admin' ? 'bg-daleel-cyan/20 border border-daleel-cyan' : 'bg-daleel-pure-light/10 border border-daleel-pure-light/20'
                                            }`}>
                                            {member.role === 'admin'
                                                ? <Shield className="w-5 h-5 text-daleel-cyan" />
                                                : <Eye className="w-5 h-5 text-daleel-pure-light/50" />
                                            }
                                        </div>
                                        <div className={isRTL ? 'text-right' : ''}>
                                            <p className="font-medium text-daleel-pure-light">{member.email || member.user_id.slice(0, 8) + '...'}</p>
                                            <p className="text-sm text-daleel-pure-light/60 capitalize">
                                                {language === 'ar' ? (member.role === 'admin' ? 'مدير' : 'مشاهد') : member.role}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                        <select
                                            value={member.role}
                                            onChange={(e) => handleUpdateRole(member.id, e.target.value as 'admin' | 'viewer')}
                                            className={`px-3 py-1.5 bg-daleel-deep-space border border-daleel-cyan/30 text-daleel-pure-light rounded-lg text-sm focus:ring-2 focus:ring-daleel-neon ${isRTL ? 'text-right' : ''}`}
                                        >
                                            <option value="admin">{language === 'ar' ? 'مدير' : 'Admin'}</option>
                                            <option value="viewer">{language === 'ar' ? 'مشاهد' : 'Viewer'}</option>
                                        </select>
                                        <button
                                            onClick={() => handleRemoveMember(member.id)}
                                            className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors"
                                            title={t('common.delete')}
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
                            <h3 className={`text-sm font-medium text-daleel-pure-light/80 mb-3 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <Clock className="w-4 h-4" />
                                {t('settings.pendingInvites')}
                            </h3>
                            <div className="space-y-2">
                                {pendingInvites.map(invite => (
                                    <div key={invite.id} className={`flex items-center justify-between p-3 bg-daleel-green/10 border border-daleel-green/30 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                                        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                            <div className="w-8 h-8 bg-daleel-green/20 rounded-full flex items-center justify-center">
                                                <LinkIcon className="w-4 h-4 text-daleel-green" />
                                            </div>
                                            <div className={isRTL ? 'text-right' : ''}>
                                                <p className="font-medium text-daleel-pure-light text-sm">{invite.email}</p>
                                                <p className="text-xs text-daleel-pure-light/60 capitalize">
                                                    {language === 'ar' ? (invite.role === 'admin' ? 'مدير' : 'مشاهد') : invite.role} • {language === 'ar' ? 'ينتهي في' : 'Expires'} {new Date(invite.expires_at).toLocaleDateString(language === 'ar' ? 'ar' : 'en')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                            <button
                                                onClick={() => handleCopyInviteLink(invite)}
                                                className={`p-2 rounded-lg transition-colors ${copiedInviteId === invite.id
                                                    ? 'bg-daleel-green/20 text-daleel-green'
                                                    : 'text-daleel-pure-light/70 hover:bg-daleel-deep-space/50'
                                                    }`}
                                                title={t('common.copy')}
                                            >
                                                {copiedInviteId === invite.id ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleCancelInvite(invite.id)}
                                                className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors"
                                                title={t('common.cancel')}
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
                    <div className="border-t border-daleel-cyan/20 pt-6">
                        <h3 className={`text-sm font-medium text-daleel-pure-light/80 mb-3 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <UserPlus className="w-4 h-4" />
                            {t('settings.inviteTeamMember')}
                        </h3>

                        {inviteError && (
                            <div className={`flex items-center gap-2 p-3 bg-red-400/20 border border-red-400/30 rounded-lg text-red-400 text-sm mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{inviteError}</span>
                            </div>
                        )}

                        {inviteSuccess && (
                            <div className={`flex items-center gap-2 p-3 bg-daleel-green/20 border border-daleel-green/30 rounded-lg text-daleel-green text-sm mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                <span>{inviteSuccess}</span>
                            </div>
                        )}

                        <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <input
                                type="email"
                                placeholder="team@example.com"
                                value={newMemberEmail}
                                onChange={(e) => setNewMemberEmail(e.target.value)}
                                className={`flex-1 px-4 py-2.5 bg-daleel-deep-space border border-daleel-cyan/30 text-daleel-pure-light rounded-xl focus:ring-2 focus:ring-daleel-neon focus:border-daleel-neon transition-all ${isRTL ? 'text-right' : ''}`}
                            />
                            <select
                                value={newMemberRole}
                                onChange={(e) => setNewMemberRole(e.target.value as 'admin' | 'viewer')}
                                className={`px-4 py-2.5 bg-daleel-deep-space border border-daleel-cyan/30 text-daleel-pure-light rounded-xl focus:ring-2 focus:ring-daleel-neon ${isRTL ? 'text-right' : ''}`}
                            >
                                <option value="viewer">{language === 'ar' ? 'مشاهد' : 'Viewer'}</option>
                                <option value="admin">{language === 'ar' ? 'مدير' : 'Admin'}</option>
                            </select>
                            <button
                                onClick={handleCreateInvite}
                                disabled={creatingInvite || !newMemberEmail.trim()}
                                className={`px-4 py-2.5 bg-daleel-cyan text-daleel-deep-space font-semibold rounded-xl hover:bg-daleel-cyan/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
                            >
                                {creatingInvite ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <LinkIcon className="w-4 h-4" />
                                        {t('settings.createLink')}
                                    </>
                                )}
                            </button>
                        </div>
                        <p className={`text-xs text-daleel-pure-light/50 mt-2 ${isRTL ? 'text-right' : ''}`}>
                            {t('settings.inviteLinkDesc')}
                        </p>
                    </div>
                </div>

                {/* AI Settings */}
                <div className="bg-daleel-tech-slate rounded-xl shadow-lg border border-daleel-cyan/20 p-6 mb-6">
                    <h2 className={`text-lg font-semibold text-daleel-neon flex items-center gap-2 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`} style={{ fontFamily: 'Space Grotesk, Tajawal, sans-serif' }}>
                        <Key className="w-5 h-5" />
                        {t('settings.api')}
                    </h2>

                    <div>
                        <label className={`block text-sm font-medium text-daleel-pure-light/80 mb-2 ${isRTL ? 'text-right' : ''}`}>
                            {t('onboarding.geminiApiKey')}
                        </label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className={`w-full px-4 py-3 bg-daleel-deep-space border border-daleel-cyan/30 text-daleel-pure-light rounded-xl focus:ring-2 focus:ring-daleel-neon focus:border-daleel-neon transition-all font-mono ${isRTL ? 'text-right' : ''}`}
                            placeholder="AIzaSy..."
                        />
                        <div className={`flex items-center justify-between text-xs mt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <p className="text-daleel-pure-light/50">
                                {language === 'ar' ? 'مطلوب للإجابات الذكية' : 'Required for AI responses'}
                            </p>
                            <Link to="/gemini-guide" className={`text-daleel-cyan hover:text-daleel-neon font-medium hover:underline flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                {language === 'ar' ? 'كيف تحصل على مفتاح مجاني؟' : 'How to get a free key?'}
                                <ExternalLink className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Branding */}
                <div className="bg-daleel-tech-slate rounded-xl shadow-lg border border-daleel-cyan/20 p-6 mb-6">
                    <h2 className={`text-lg font-semibold text-daleel-cyan flex items-center gap-2 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`} style={{ fontFamily: 'Space Grotesk, Tajawal, sans-serif' }}>
                        <Palette className="w-5 h-5" />
                        {t('settings.appearance')}
                    </h2>

                    <div>
                        <label className={`block text-sm font-medium text-daleel-pure-light/80 mb-3 ${isRTL ? 'text-right' : ''}`}>
                            {t('onboarding.primaryColor')}
                        </label>
                        <div className={`flex flex-wrap gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            {colors.map(color => (
                                <button
                                    key={color}
                                    onClick={() => setPrimaryColor(color)}
                                    className={`w-10 h-10 rounded-full transition-all ${primaryColor === color
                                        ? 'ring-4 ring-offset-2 ring-offset-daleel-tech-slate ring-daleel-neon scale-110'
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
                    <div className={`flex items-center gap-2 p-4 bg-red-400/20 border border-red-400/30 rounded-xl text-red-400 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className={`flex items-center gap-2 p-4 bg-daleel-green/20 border border-daleel-green/30 rounded-xl text-daleel-green mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        <span>{success}</span>
                    </div>
                )}

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`w-full py-3 bg-daleel-neon text-daleel-deep-space font-bold rounded-xl hover:bg-daleel-green transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 glow-neon ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                    {saving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            {t('common.save')}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
