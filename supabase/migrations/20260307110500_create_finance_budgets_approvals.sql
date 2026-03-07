-- Create current_tenant_id() helper function for RLS (Skipped if already created in Phase 1 / 2)


-- Create finance_budgets table
CREATE TABLE IF NOT EXISTS public.finance_budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    category_id UUID NOT NULL REFERENCES public.finance_categories(id),
    name VARCHAR(255) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    period VARCHAR(50) NOT NULL, -- 'monthly', 'quarterly', 'yearly'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- Create finance_approvals table
CREATE TABLE IF NOT EXISTS public.finance_approvals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    transaction_id UUID NOT NULL REFERENCES public.finance_transactions(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    comments TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_finance_budgets_tenant_id ON public.finance_budgets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_finance_approvals_tenant_id ON public.finance_approvals(tenant_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.finance_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_approvals ENABLE ROW LEVEL SECURITY;

-- Budgets Policies
CREATE POLICY "Tenant isolation for budgets" ON public.finance_budgets
    AS PERMISSIVE FOR ALL
    TO authenticated
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

-- Approvals Policies
CREATE POLICY "Tenant isolation for approvals" ON public.finance_approvals
    AS PERMISSIVE FOR ALL
    TO authenticated
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());
