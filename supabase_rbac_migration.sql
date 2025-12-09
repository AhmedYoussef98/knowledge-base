-- Role-Based Access Control Migration - FIXED VERSION
-- This fixes the infinite recursion error in RLS policies
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. DROP EXISTING PROBLEMATIC POLICIES
-- ============================================
DROP POLICY IF EXISTS "Members: tenant read access" ON tenant_members;
DROP POLICY IF EXISTS "Members: owner/admin manage" ON tenant_members;
DROP POLICY IF EXISTS "Knowledge: tenant admin write access" ON knowledge_items;
DROP POLICY IF EXISTS "Knowledge: tenant owner write access" ON knowledge_items;
DROP POLICY IF EXISTS "SearchLogs: tenant member access" ON search_logs;
DROP POLICY IF EXISTS "SearchLogs: tenant access" ON search_logs;

-- ============================================
-- 2. CREATE TENANT_MEMBERS TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant ON tenant_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_user ON tenant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_role ON tenant_members(role);

-- Enable RLS
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. HELPER FUNCTION: Check if user is owner or member
-- Uses SECURITY DEFINER to bypass RLS and avoid recursion
-- ============================================
CREATE OR REPLACE FUNCTION is_tenant_member_or_owner(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if owner
  IF EXISTS (SELECT 1 FROM tenants WHERE id = p_tenant_id AND owner_id = auth.uid()) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if member (this bypasses RLS due to SECURITY DEFINER)
  IF EXISTS (SELECT 1 FROM tenant_members WHERE tenant_id = p_tenant_id AND user_id = auth.uid()) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. HELPER FUNCTION: Check if user can edit (owner or admin)
-- ============================================
CREATE OR REPLACE FUNCTION can_edit_tenant(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if owner
  IF EXISTS (SELECT 1 FROM tenants WHERE id = p_tenant_id AND owner_id = auth.uid()) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if admin member
  IF EXISTS (SELECT 1 FROM tenant_members WHERE tenant_id = p_tenant_id AND user_id = auth.uid() AND role = 'admin') THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. HELPER FUNCTION: Check if user is owner
-- ============================================
CREATE OR REPLACE FUNCTION is_tenant_owner(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM tenants WHERE id = p_tenant_id AND owner_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. RLS POLICIES FOR TENANT_MEMBERS
-- Using helper functions to avoid recursion
-- ============================================

-- Anyone in the tenant (owner or member) can read members
CREATE POLICY "Members: read access" ON tenant_members
  FOR SELECT
  USING (is_tenant_member_or_owner(tenant_id));

-- Only owner can insert/update/delete members
CREATE POLICY "Members: owner manage" ON tenant_members
  FOR INSERT
  WITH CHECK (is_tenant_owner(tenant_id));

CREATE POLICY "Members: owner update" ON tenant_members
  FOR UPDATE
  USING (is_tenant_owner(tenant_id))
  WITH CHECK (is_tenant_owner(tenant_id));

CREATE POLICY "Members: owner delete" ON tenant_members
  FOR DELETE
  USING (is_tenant_owner(tenant_id));

-- ============================================
-- 7. RLS POLICIES FOR KNOWLEDGE_ITEMS
-- ============================================

-- Read access is already public (existing policy should be fine)
-- Write access for owner or admin
CREATE POLICY "Knowledge: admin write access" ON knowledge_items
  FOR INSERT
  WITH CHECK (can_edit_tenant(tenant_id));

CREATE POLICY "Knowledge: admin update access" ON knowledge_items
  FOR UPDATE
  USING (can_edit_tenant(tenant_id))
  WITH CHECK (can_edit_tenant(tenant_id));

CREATE POLICY "Knowledge: admin delete access" ON knowledge_items
  FOR DELETE
  USING (can_edit_tenant(tenant_id));

-- ============================================
-- 8. RLS POLICIES FOR SEARCH_LOGS
-- ============================================

-- Members can read logs
CREATE POLICY "SearchLogs: member read" ON search_logs
  FOR SELECT
  USING (is_tenant_member_or_owner(tenant_id));

-- ============================================
-- 9. GET USER'S ROLE FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION get_user_tenant_role(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Check if user is owner
  IF EXISTS (SELECT 1 FROM tenants WHERE id = p_tenant_id AND owner_id = auth.uid()) THEN
    RETURN 'owner';
  END IF;
  
  -- Check member role
  SELECT role INTO v_role 
  FROM tenant_members 
  WHERE tenant_id = p_tenant_id AND user_id = auth.uid();
  
  RETURN v_role; -- Returns NULL if not a member
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DONE! The recursion issue should now be fixed.
-- ============================================
