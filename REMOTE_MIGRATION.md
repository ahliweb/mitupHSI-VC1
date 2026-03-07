# Remote Database Migration Instructions

## Project ID: pzenkzipagidjtsdxaxe

### Option 1: Run via Supabase Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard/project/pzenkzipagidjtsdxaxe/sql-editor

2. Copy and paste the SQL below into the SQL Editor

3. Click "Run" to execute

### Option 2: Run via CLI (if network allows)

```bash
psql "postgresql://postgres:3ZmPHN0xDBTrRoi1@db.pzenkzipagidjtsdxaxe.supabase.co:5432/postgres" -f supabase_migrations/migration.sql
```

---

## SQL Migration Script

```sql
-- ABAC Tables

-- Permissions Table
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

-- Policies Table
CREATE TABLE IF NOT EXISTS "public"."policies" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "definition" jsonb NOT NULL,
    "tenant_id" uuid,
    "created_at" timestamp with time zone DEFAULT now(),
    "deleted_at" timestamp with time zone
);

-- Roles Table
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

-- Role Permissions Junction Table
CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "role_id" uuid,
    "permission_id" uuid,
    "created_at" timestamp with time zone DEFAULT now(),
    "created_by" uuid,
    "tenant_id" uuid,
    "deleted_at" timestamp with time zone
);

-- Role Policies Junction Table
CREATE TABLE IF NOT EXISTS "public"."role_policies" (
    "role_id" uuid NOT NULL,
    "policy_id" uuid NOT NULL,
    "deleted_at" timestamp with time zone
);

-- Tenants Table
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

-- Users Table
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

-- User Management Tables

-- User Sessions Table
CREATE TABLE IF NOT EXISTS "public"."user_sessions" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "device_name" text,
    "browser" text,
    "os" text,
    "ip_address" text,
    "user_agent" text,
    "country" text,
    "city" text,
    "created_at" timestamp with time zone DEFAULT now(),
    "last_activity_at" timestamp with time zone DEFAULT now(),
    "expires_at" timestamp with time zone,
    "revoked_at" timestamp with time zone
);

-- User Invitations Table
CREATE TABLE IF NOT EXISTS "public"."user_invitations" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "email" text NOT NULL,
    "role_id" uuid,
    "tenant_id" uuid,
    "invited_by" text,
    "token" text UNIQUE,
    "status" text DEFAULT 'pending'::text,
    "message" text,
    "expires_at" timestamp with time zone,
    "accepted_at" timestamp with time zone,
    "cancelled_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now()
);

-- User Profiles Table
CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "user_id" uuid NOT NULL,
    "tenant_id" uuid,
    "job_title" text,
    "department" text,
    "phone" text,
    "location" text,
    "website_url" text,
    "linkedin_url" text,
    "twitter_url" text,
    "github_url" text,
    "description" text,
    "avatar_url" text,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    PRIMARY KEY ("user_id")
);

-- User Security Table
CREATE TABLE IF NOT EXISTS "public"."user_security" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "two_factor_enabled" boolean DEFAULT false,
    "two_factor_secret" text,
    "backup_codes" text[],
    "password_hash" text,
    "last_password_change" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "tenant_id" uuid,
    "user_id" uuid,
    "action" text NOT NULL,
    "resource" text,
    "channel" text,
    "ip_address" text,
    "user_agent" text,
    "details" jsonb,
    "created_at" timestamp with time zone DEFAULT now()
);
```

