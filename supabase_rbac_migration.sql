-- Role-Based Access Control Migration
-- Run this in Supabase SQL Editor AFTER the initial schema

-- ============================================
-- 1. CREATE TENANT_MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure a user can only be a member of a tenant once
  UNIQUE(tenant_id, user_id)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant ON tenant_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_user ON tenant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_role ON tenant_members(role);

-- ============================================
-- 2. ENABLE RLS ON TENANT_MEMBERS
-- ============================================
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. RLS POLICIES FOR TENANT_MEMBERS
-- ============================================

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Members: tenant read access" ON tenant_members;
DROP POLICY IF EXISTS "Members: owner/admin manage" ON tenant_members;

-- All members can see other members of their tenant
CREATE POLICY "Members: tenant read access" ON tenant_members
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
      UNION
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- Only owner or admin can manage members
CREATE POLICY "Members: owner/admin manage" ON tenant_members
  FOR ALL
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE owner_id = auth.uid()
      UNION
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM tenants WHERE owner_id = auth.uid()
      UNION
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 4. UPDATE KNOWLEDGE_ITEMS POLICIES
-- ============================================

-- Drop and recreate write policy to include admin members
DROP POLICY IF EXISTS "Knowledge: tenant owner write access" ON knowledge_items;

CREATE POLICY "Knowledge: tenant admin write access" ON knowledge_items
  FOR ALL
  USING (
    -- Owner has access
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
    OR
    -- Admin members have access
    tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
    OR
    tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 5. UPDATE SEARCH_LOGS POLICIES
-- ============================================

-- Drop and recreate read policy to include all members
DROP POLICY IF EXISTS "SearchLogs: tenant access" ON search_logs;

CREATE POLICY "SearchLogs: tenant member access" ON search_logs
  FOR SELECT
  USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
    OR
    tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid())
  );

-- ============================================
-- 6. HELPER FUNCTION: GET USER'S ROLE FOR A TENANT
-- ============================================
CREATE OR REPLACE FUNCTION get_user_tenant_role(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Check if user is owner (owner is always 'owner' role)
  SELECT 'owner' INTO v_role 
  FROM tenants 
  WHERE id = p_tenant_id AND owner_id = auth.uid();
  
  IF v_role IS NOT NULL THEN
    RETURN v_role;
  END IF;
  
  -- Check tenant_members
  SELECT role INTO v_role 
  FROM tenant_members 
  WHERE tenant_id = p_tenant_id AND user_id = auth.uid();
  
  RETURN v_role; -- Returns NULL if not a member
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. HELPER FUNCTION: CHECK IF USER CAN EDIT
-- ============================================
CREATE OR REPLACE FUNCTION can_edit_tenant(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  v_role := get_user_tenant_role(p_tenant_id);
  RETURN v_role IN ('owner', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DONE! Role-based access is now enabled
-- ============================================
