import { supabase } from './supabase';
import { Tenant } from '../contexts/TenantContext';

export interface CreateTenantInput {
    name: string;
    slug: string;
    gemini_api_key?: string;
    logo_url?: string;
    primary_color?: string;
}

export interface TenantMember {
    id: string;
    tenant_id: string;
    user_id: string;
    role: 'admin' | 'viewer';
    invited_by: string | null;
    created_at: string;
    email?: string; // Joined from auth.users
}

export type UserRole = 'owner' | 'admin' | 'viewer' | null;

/**
 * Create a new tenant for the currently authenticated user
 */
export const createTenant = async (input: CreateTenantInput): Promise<{ data: Tenant | null; error: Error | null }> => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { data: null, error: new Error('Not authenticated') };
    }

    const { data, error } = await supabase
        .from('tenants')
        .insert([{
            ...input,
            owner_id: user.id
        }])
        .select()
        .single();

    return {
        data: data as Tenant | null,
        error: error as Error | null
    };
};

/**
 * Get tenant by slug (public access)
 */
export const getTenantBySlug = async (slug: string): Promise<Tenant | null> => {
    const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error) {
        console.error('Error fetching tenant by slug:', error);
        return null;
    }

    return data as Tenant;
};

/**
 * Get current user's tenant (where they are owner)
 */
export const getMyTenant = async (): Promise<Tenant | null> => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('owner_id', user.id)
        .single();

    if (error) {
        console.error('Error fetching user tenant:', error);
        return null;
    }

    return data as Tenant;
};

/**
 * Get all tenants where user is a member (or owner)
 */
export const getMyTenants = async (): Promise<Tenant[]> => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    // Get owned tenants
    const { data: ownedData } = await supabase
        .from('tenants')
        .select('*')
        .eq('owner_id', user.id);

    // Get member tenants
    const { data: memberData } = await supabase
        .from('tenant_members')
        .select('tenant_id')
        .eq('user_id', user.id);

    if (!memberData || memberData.length === 0) {
        return (ownedData || []) as Tenant[];
    }

    const memberTenantIds = memberData.map(m => m.tenant_id);
    const { data: memberTenants } = await supabase
        .from('tenants')
        .select('*')
        .in('id', memberTenantIds);

    const allTenants = [...(ownedData || []), ...(memberTenants || [])];
    // Remove duplicates
    const uniqueTenants = allTenants.filter((t, i, arr) =>
        arr.findIndex(x => x.id === t.id) === i
    );

    return uniqueTenants as Tenant[];
};

/**
 * Check if current user has a tenant (owner)
 */
export const userHasTenant = async (): Promise<boolean> => {
    const tenant = await getMyTenant();
    return tenant !== null;
};

/**
 * Get user's role for a specific tenant
 */
export const getUserTenantRole = async (tenantId: string): Promise<UserRole> => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Check if owner
    const { data: tenant } = await supabase
        .from('tenants')
        .select('owner_id')
        .eq('id', tenantId)
        .single();

    if (tenant?.owner_id === user.id) {
        return 'owner';
    }

    // Check membership
    const { data: member } = await supabase
        .from('tenant_members')
        .select('role')
        .eq('tenant_id', tenantId)
        .eq('user_id', user.id)
        .single();

    if (member) {
        return member.role as 'admin' | 'viewer';
    }

    return null;
};

/**
 * Check if user can edit (owner or admin)
 */
export const canUserEdit = async (tenantId: string): Promise<boolean> => {
    const role = await getUserTenantRole(tenantId);
    return role === 'owner' || role === 'admin';
};

/**
 * Get all members of a tenant
 */
export const getTenantMembers = async (tenantId: string): Promise<TenantMember[]> => {
    const { data, error } = await supabase
        .from('tenant_members')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching members:', error);
        return [];
    }

    return (data || []) as TenantMember[];
};

/**
 * Add a member to a tenant by email
 */
export const addTenantMember = async (
    tenantId: string,
    userEmail: string,
    role: 'admin' | 'viewer'
): Promise<{ error: Error | null }> => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: new Error('Not authenticated') };
    }

    // First, find the user by email using the admin API or a lookup
    // Since we can't directly query auth.users, we'll use invites by email
    // For now, we'll need the user to exist first

    // Look up user by email in the users table (if you have one) or use RPC
    // For MVP, we'll require the user to sign up first
    const { data: authUser, error: authError } = await supabase.rpc('get_user_id_by_email', {
        p_email: userEmail
    });

    if (authError || !authUser) {
        // If RPC doesn't exist, we'll create the member record anyway
        // and it will work once the user signs up
        return { error: new Error('User not found. They must sign up first.') };
    }

    const { error } = await supabase
        .from('tenant_members')
        .insert([{
            tenant_id: tenantId,
            user_id: authUser,
            role: role,
            invited_by: user.id
        }]);

    return { error: error as Error | null };
};

/**
 * Add a member by user ID (internal use)
 */
export const addTenantMemberById = async (
    tenantId: string,
    userId: string,
    role: 'admin' | 'viewer'
): Promise<{ error: Error | null }> => {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
        .from('tenant_members')
        .insert([{
            tenant_id: tenantId,
            user_id: userId,
            role: role,
            invited_by: user?.id
        }]);

    return { error: error as Error | null };
};

/**
 * Update a member's role
 */
export const updateMemberRole = async (
    memberId: string,
    role: 'admin' | 'viewer'
): Promise<{ error: Error | null }> => {
    const { error } = await supabase
        .from('tenant_members')
        .update({ role })
        .eq('id', memberId);

    return { error: error as Error | null };
};

/**
 * Remove a member from a tenant
 */
export const removeTenantMember = async (memberId: string): Promise<{ error: Error | null }> => {
    const { error } = await supabase
        .from('tenant_members')
        .delete()
        .eq('id', memberId);

    return { error: error as Error | null };
};

/**
 * Update tenant settings
 */
export const updateTenantSettings = async (
    tenantId: string,
    updates: Partial<CreateTenantInput>
): Promise<{ error: Error | null }> => {
    const { error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', tenantId);

    return { error: error as Error | null };
};

/**
 * Check if a slug is available
 */
export const isSlugAvailable = async (slug: string): Promise<boolean> => {
    const { data } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', slug)
        .single();

    return data === null;
};

/**
 * Generate a slug from a name
 */
export const generateSlug = (name: string): string => {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};
