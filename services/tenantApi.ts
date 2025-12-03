import { supabase } from './supabase';
import { Tenant } from '../contexts/TenantContext';

export interface CreateTenantInput {
    name: string;
    slug: string;
    gemini_api_key?: string;
    logo_url?: string;
    primary_color?: string;
}

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
 * Get current user's tenant
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
 * Check if current user has a tenant
 */
export const userHasTenant = async (): Promise<boolean> => {
    const tenant = await getMyTenant();
    return tenant !== null;
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
