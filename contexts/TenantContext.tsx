import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

export interface Tenant {
    id: string;
    name: string;
    slug: string;
    owner_id: string;
    gemini_api_key: string | null;
    logo_url: string | null;
    primary_color: string;
    created_at: string;
}

interface TenantContextType {
    currentTenant: Tenant | null;
    loading: boolean;
    isOwner: boolean;
    setTenantBySlug: (slug: string) => Promise<void>;
    refreshTenant: () => Promise<void>;
    updateTenant: (updates: Partial<Tenant>) => Promise<{ error: Error | null }>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const useTenant = () => {
    const context = useContext(TenantContext);
    if (!context) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
};

interface TenantProviderProps {
    children: ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
    const { user } = useAuth();
    const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(false);

    const isOwner = !!(user && currentTenant && currentTenant.owner_id === user.id);

    // Fetch tenant by slug (for public KB access)
    const setTenantBySlug = async (slug: string) => {
        if (!slug) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('tenants')
                .select('*')
                .eq('slug', slug)
                .single();

            if (error) {
                console.error('Error fetching tenant:', error);
                setCurrentTenant(null);
            } else {
                setCurrentTenant(data as Tenant);
            }
        } finally {
            setLoading(false);
        }
    };

    // Refresh current tenant data
    const refreshTenant = async () => {
        if (!currentTenant?.id) return;

        const { data, error } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', currentTenant.id)
            .single();

        if (!error && data) {
            setCurrentTenant(data as Tenant);
        }
    };

    // Update tenant (owner only)
    const updateTenant = async (updates: Partial<Tenant>) => {
        if (!currentTenant?.id || !isOwner) {
            return { error: new Error('Not authorized') };
        }

        const { error } = await supabase
            .from('tenants')
            .update(updates)
            .eq('id', currentTenant.id);

        if (!error) {
            await refreshTenant();
        }

        return { error: error as Error | null };
    };

    // Auto-fetch user's tenant when logged in
    useEffect(() => {
        if (user && !currentTenant) {
            const fetchUserTenant = async () => {
                setLoading(true);
                const { data } = await supabase
                    .from('tenants')
                    .select('*')
                    .eq('owner_id', user.id)
                    .single();

                if (data) {
                    setCurrentTenant(data as Tenant);
                }
                setLoading(false);
            };
            fetchUserTenant();
        }
    }, [user]);

    return (
        <TenantContext.Provider value={{
            currentTenant,
            loading,
            isOwner,
            setTenantBySlug,
            refreshTenant,
            updateTenant
        }}>
            {children}
        </TenantContext.Provider>
    );
};
