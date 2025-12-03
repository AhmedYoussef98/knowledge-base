-- Squad Knowledge Base SaaS - Supabase Schema Migration
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- ============================================
-- 1. CREATE TENANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  gemini_api_key TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#F97316',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_owner ON tenants(owner_id);

-- ============================================
-- 2. ADD TENANT_ID TO EXISTING TABLES
-- ============================================

-- Add tenant_id to knowledge_items
ALTER TABLE knowledge_items 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Add tenant_id to search_logs
ALTER TABLE search_logs 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Create indexes for tenant lookups
CREATE INDEX IF NOT EXISTS idx_knowledge_items_tenant ON knowledge_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_tenant ON search_logs(tenant_id);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. RLS POLICIES FOR TENANTS TABLE
-- ============================================

-- Drop existing policies if they exist (for re-running)
DROP POLICY IF EXISTS "Tenants: owner full access" ON tenants;
DROP POLICY IF EXISTS "Tenants: public read by slug" ON tenants;
DROP POLICY IF EXISTS "Tenants: authenticated insert" ON tenants;

-- Owner can do anything with their tenant
CREATE POLICY "Tenants: owner full access" ON tenants
  FOR ALL 
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Anyone can read tenant info (for public KB access)
CREATE POLICY "Tenants: public read by slug" ON tenants
  FOR SELECT 
  USING (true);

-- Authenticated users can create tenants
CREATE POLICY "Tenants: authenticated insert" ON tenants
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());

-- ============================================
-- 5. RLS POLICIES FOR KNOWLEDGE_ITEMS TABLE
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Knowledge: tenant read access" ON knowledge_items;
DROP POLICY IF EXISTS "Knowledge: tenant owner write access" ON knowledge_items;

-- Anyone can read knowledge items (public KB)
CREATE POLICY "Knowledge: tenant read access" ON knowledge_items
  FOR SELECT 
  USING (true);

-- Only tenant owner can insert/update/delete
CREATE POLICY "Knowledge: tenant owner write access" ON knowledge_items
  FOR ALL
  USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );

-- ============================================
-- 6. RLS POLICIES FOR SEARCH_LOGS TABLE
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "SearchLogs: tenant access" ON search_logs;
DROP POLICY IF EXISTS "SearchLogs: public insert" ON search_logs;

-- Tenant owner can read their logs
CREATE POLICY "SearchLogs: tenant access" ON search_logs
  FOR SELECT
  USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );

-- Anyone can insert search logs (for analytics)
CREATE POLICY "SearchLogs: public insert" ON search_logs
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 7. HELPER FUNCTION: GET USER'S TENANT
-- ============================================
CREATE OR REPLACE FUNCTION get_user_tenant()
RETURNS UUID AS $$
  SELECT id FROM tenants WHERE owner_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- 8. UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DONE! Your schema is ready for multi-tenancy
-- ============================================
