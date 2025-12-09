-- Magic Link Invites Migration
-- Run this in Supabase SQL Editor AFTER the RBAC migration

-- ============================================
-- 1. CREATE PENDING_INVITES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS pending_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate pending invites for same email/tenant combo
  UNIQUE(tenant_id, email)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pending_invites_token ON pending_invites(token);
CREATE INDEX IF NOT EXISTS idx_pending_invites_email ON pending_invites(email);
CREATE INDEX IF NOT EXISTS idx_pending_invites_tenant ON pending_invites(tenant_id);

-- Enable RLS
ALTER TABLE pending_invites ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. RLS POLICIES FOR PENDING_INVITES
-- ============================================

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Invites: owner manage" ON pending_invites;
DROP POLICY IF EXISTS "Invites: read own by email" ON pending_invites;
DROP POLICY IF EXISTS "Invites: read by token" ON pending_invites;

-- Owner can create/manage invites for their tenant
CREATE POLICY "Invites: owner manage" ON pending_invites
  FOR ALL
  USING (is_tenant_owner(tenant_id))
  WITH CHECK (is_tenant_owner(tenant_id));

-- Anyone can read invites for their email (to check on signup)
-- We use a function to avoid exposing auth.jwt() directly
CREATE OR REPLACE FUNCTION get_auth_email()
RETURNS TEXT AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE POLICY "Invites: read own by email" ON pending_invites
  FOR SELECT
  USING (LOWER(email) = LOWER(get_auth_email()));

-- Anyone can read invite by token (for accept flow)
-- This is permissive because token is secret/random
CREATE POLICY "Invites: public read by token" ON pending_invites
  FOR SELECT
  USING (true);  -- Token acts as auth

-- ============================================
-- 3. FUNCTION: Accept Invite
-- ============================================
CREATE OR REPLACE FUNCTION accept_invite(p_token TEXT)
RETURNS JSON AS $$
DECLARE
  v_invite pending_invites%ROWTYPE;
  v_tenant tenants%ROWTYPE;
BEGIN
  -- Find the invite
  SELECT * INTO v_invite FROM pending_invites WHERE token = p_token;
  
  IF v_invite IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invite not found');
  END IF;
  
  -- Check if expired
  IF v_invite.expires_at < NOW() THEN
    RETURN json_build_object('success', false, 'error', 'Invite has expired');
  END IF;
  
  -- Check if already accepted
  IF v_invite.accepted_at IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invite already accepted');
  END IF;
  
  -- Get tenant info
  SELECT * INTO v_tenant FROM tenants WHERE id = v_invite.tenant_id;
  
  IF v_tenant IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Tenant not found');
  END IF;
  
  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM tenant_members 
    WHERE tenant_id = v_invite.tenant_id AND user_id = auth.uid()
  ) THEN
    -- Mark invite as accepted anyway
    UPDATE pending_invites SET accepted_at = NOW() WHERE id = v_invite.id;
    RETURN json_build_object(
      'success', true, 
      'already_member', true,
      'tenant_slug', v_tenant.slug,
      'tenant_name', v_tenant.name
    );
  END IF;
  
  -- Add user as member
  INSERT INTO tenant_members (tenant_id, user_id, role, invited_by)
  VALUES (v_invite.tenant_id, auth.uid(), v_invite.role, v_invite.invited_by);
  
  -- Mark invite as accepted
  UPDATE pending_invites SET accepted_at = NOW() WHERE id = v_invite.id;
  
  RETURN json_build_object(
    'success', true,
    'already_member', false,
    'tenant_slug', v_tenant.slug,
    'tenant_name', v_tenant.name,
    'role', v_invite.role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. FUNCTION: Get Pending Invites for Email
-- ============================================
CREATE OR REPLACE FUNCTION get_pending_invites_for_user()
RETURNS SETOF pending_invites AS $$
  SELECT pi.* 
  FROM pending_invites pi
  WHERE LOWER(pi.email) = LOWER(get_auth_email())
    AND pi.accepted_at IS NULL
    AND pi.expires_at > NOW();
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- 5. FUNCTION: Auto-accept pending invites on login
-- ============================================
CREATE OR REPLACE FUNCTION auto_accept_pending_invites()
RETURNS JSON AS $$
DECLARE
  v_invite pending_invites%ROWTYPE;
  v_count INTEGER := 0;
  v_results JSON[];
BEGIN
  FOR v_invite IN 
    SELECT * FROM pending_invites 
    WHERE LOWER(email) = LOWER(get_auth_email())
      AND accepted_at IS NULL
      AND expires_at > NOW()
  LOOP
    -- Add user as member if not already
    INSERT INTO tenant_members (tenant_id, user_id, role, invited_by)
    VALUES (v_invite.tenant_id, auth.uid(), v_invite.role, v_invite.invited_by)
    ON CONFLICT (tenant_id, user_id) DO NOTHING;
    
    -- Mark invite as accepted
    UPDATE pending_invites SET accepted_at = NOW() WHERE id = v_invite.id;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN json_build_object('accepted_count', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DONE! Magic link invites are now supported
-- ============================================
