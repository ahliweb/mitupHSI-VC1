-- Create current_tenant_id() helper function for RLS
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'tenant_id', '')::UUID;
$$ LANGUAGE sql STABLE;

-- Create finance_categories table
CREATE TABLE IF NOT EXISTS public.finance_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
    code VARCHAR(100),
    color VARCHAR(50),
    icon VARCHAR(100),
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    updated_by UUID
);

-- Create finance_transactions table
CREATE TABLE IF NOT EXISTS public.finance_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    category_id UUID NOT NULL REFERENCES public.finance_categories(id),
    type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC(15, 2) NOT NULL,
    currency_code VARCHAR(10) DEFAULT 'IDR',
    transaction_date DATE NOT NULL,
    description TEXT,
    reference_no VARCHAR(100),
    status VARCHAR(50),
    attachment_count INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    updated_by UUID
);

-- Create finance_settings table
CREATE TABLE IF NOT EXISTS public.finance_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL UNIQUE,
    default_currency VARCHAR(10) DEFAULT 'IDR',
    date_format VARCHAR(50),
    fiscal_year_start VARCHAR(50),
    module_enabled BOOLEAN DEFAULT TRUE,
    allow_negative_balance BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for querying performance
CREATE INDEX IF NOT EXISTS idx_finance_categories_tenant_id ON public.finance_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_tenant_id ON public.finance_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_tenant_id_date ON public.finance_transactions(tenant_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_category_id ON public.finance_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_finance_settings_tenant_id ON public.finance_settings(tenant_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_settings ENABLE ROW LEVEL SECURITY;

-- Categories Policies
CREATE POLICY "Tenant isolation for categories" ON public.finance_categories
    AS PERMISSIVE FOR ALL
    TO authenticated
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

-- Transactions Policies
CREATE POLICY "Tenant isolation for transactions" ON public.finance_transactions
    AS PERMISSIVE FOR ALL
    TO authenticated
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

-- Settings Policies
CREATE POLICY "Tenant isolation for settings" ON public.finance_settings
    AS PERMISSIVE FOR ALL
    TO authenticated
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());
