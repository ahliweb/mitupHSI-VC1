-- Create current_tenant_id() helper function for RLS (Skipped if already created in Phase 1)
-- CREATE OR REPLACE FUNCTION public.current_tenant_id() ...

-- Create finance_wallets table
CREATE TABLE IF NOT EXISTS public.finance_wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL DEFAULT 'cash', -- 'cash', 'bank', 'credit', 'e-wallet'
    currency_code VARCHAR(10) DEFAULT 'IDR',
    balance NUMERIC(15, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    updated_by UUID
);

-- Note: We need to alter finance_transactions to link to a wallet if we want double-entry or explicit cashboxes
ALTER TABLE public.finance_transactions 
ADD COLUMN IF NOT EXISTS wallet_id UUID REFERENCES public.finance_wallets(id);

-- Create finance_transaction_attachments table
CREATE TABLE IF NOT EXISTS public.finance_transaction_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    transaction_id UUID NOT NULL REFERENCES public.finance_transactions(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    storage_path VARCHAR(1000) NOT NULL,
    content_type VARCHAR(100),
    file_size_bytes BIGINT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_finance_wallets_tenant_id ON public.finance_wallets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_wallet_id ON public.finance_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_finance_attachments_tenant_transaction ON public.finance_transaction_attachments(tenant_id, transaction_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.finance_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transaction_attachments ENABLE ROW LEVEL SECURITY;

-- Wallets Policies
CREATE POLICY "Tenant isolation for wallets" ON public.finance_wallets
    AS PERMISSIVE FOR ALL
    TO authenticated
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

-- Attachments Policies
CREATE POLICY "Tenant isolation for transaction attachments" ON public.finance_transaction_attachments
    AS PERMISSIVE FOR ALL
    TO authenticated
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());
