-- ABAC Tables Migration for Local Supabase
-- Creates roles, permissions, policies, and related tables

-- Create permissions table
CREATE TABLE IF NOT EXISTS "public"."permissions" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "resource" text NOT NULL,
    "action" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "deleted_at" timestamp with time zone,
    "created_by" uuid,
    "module" text
);

-- Create policies table
CREATE TABLE IF NOT EXISTS "public"."policies" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "definition" jsonb NOT NULL,
    "tenant_id" uuid,
    "created_at" timestamp with time zone DEFAULT now(),
    "deleted_at" timestamp with time zone
);

-- Create roles table with all ABAC flags
CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "deleted_at" timestamp with time zone,
    "created_by" uuid,
    "tenant_id" uuid,
    "is_system" boolean DEFAULT false,
    "is_platform_admin" boolean DEFAULT false,
    "is_tenant_admin" boolean DEFAULT false,
    "is_full_access" boolean DEFAULT false,
    "is_public" boolean DEFAULT false,
    "is_guest" boolean DEFAULT false,
    "is_staff" boolean DEFAULT false,
    "staff_level" integer,
    "scope" text
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "role_id" uuid,
    "permission_id" uuid,
    "created_at" timestamp with time zone DEFAULT now(),
    "created_by" uuid,
    "tenant_id" uuid,
    "deleted_at" timestamp with time zone
);

-- Create role_policies junction table
CREATE TABLE IF NOT EXISTS "public"."role_policies" (
    "role_id" uuid NOT NULL,
    "policy_id" uuid NOT NULL,
    "deleted_at" timestamp with time zone
);

-- Create tenants table
CREATE TABLE IF NOT EXISTS "public"."tenants" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "slug" text NOT NULL,
    "domain" text,
    "status" text DEFAULT 'active'::text,
    "subscription_tier" text DEFAULT 'free'::text,
    "config" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "deleted_at" timestamp with time zone,
    "subscription_expires_at" timestamp with time zone,
    "billing_amount" numeric(10,2) DEFAULT 0,
    "billing_cycle" text DEFAULT 'monthly'::text,
    "notes" text,
    "contact_email" text,
    "currency" text DEFAULT 'USD'::text,
    "locale" text DEFAULT 'en'::text,
    "host" text
);

-- Create users table
CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "email" text NOT NULL,
    "full_name" text,
    "avatar_url" text,
    "role_id" uuid,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "deleted_at" timestamp with time zone,
    "language" text DEFAULT 'id'::text,
    "created_by" uuid,
    "tenant_id" uuid,
    "approval_status" text DEFAULT 'approved'::text,
    "admin_approved_at" timestamp with time zone,
    "admin_approved_by" uuid,
    "super_admin_approved_at" timestamp with time zone,
    "super_admin_approved_by" uuid,
    "rejection_reason" text,
    "region_id" uuid
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON public.permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_name ON public.permissions(name);
CREATE INDEX IF NOT EXISTS idx_roles_tenant_id ON public.roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_roles_is_platform_admin ON public.roles(is_platform_admin);
CREATE INDEX IF NOT EXISTS idx_roles_is_full_access ON public.roles(is_full_access);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_role_policies_role_id ON public.role_policies(role_id);
CREATE INDEX IF NOT EXISTS idx_role_policies_policy_id ON public.role_policies(policy_id);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON public.users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Enable RLS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for permissions
CREATE POLICY "Anyone can read permissions" ON public.permissions
    AS PERMISSIVE FOR SELECT TO authenticated
    USING (true);

-- RLS Policies for policies
CREATE POLICY "Anyone can read policies" ON public.policies
    AS PERMISSIVE FOR SELECT TO authenticated
    USING (true);

-- RLS Policies for roles
CREATE POLICY "Anyone can read roles" ON public.roles
    AS PERMISSIVE FOR SELECT TO authenticated
    USING (true);

-- RLS Policies for role_permissions
CREATE POLICY "Anyone can read role_permissions" ON public.role_permissions
    AS PERMISSIVE FOR SELECT TO authenticated
    USING (true);

-- RLS Policies for role_policies
CREATE POLICY "Anyone can read role_policies" ON public.role_policies
    AS PERMISSIVE FOR SELECT TO authenticated
    USING (true);

-- RLS Policies for tenants
CREATE POLICY "Anyone can read tenants" ON public.tenants
    AS PERMISSIVE FOR SELECT TO authenticated
    USING (true);

-- RLS Policies for users
CREATE POLICY "Anyone can read users" ON public.users
    AS PERMISSIVE FOR SELECT TO authenticated
    USING (true);

-- Create helper function for tenant_id
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'tenant_id', '')::UUID;
$$ LANGUAGE sql STABLE;

-- Create is_platform_admin function
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
    AND (r.is_platform_admin = true OR r.is_full_access = true)
  );
$$ LANGUAGE sql STABLE;

-- Grant permissions
GRANT ALL ON public.permissions TO authenticated;
GRANT ALL ON public.policies TO authenticated;
GRANT ALL ON public.roles TO authenticated;
GRANT ALL ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_policies TO authenticated;
GRANT ALL ON public.tenants TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;
