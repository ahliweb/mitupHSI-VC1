export type TransactionType = 'income' | 'expense';

export interface FinanceCategory {
  id: string;
  tenant_id: string;
  name: string;
  type: TransactionType;
  code?: string;
  color?: string;
  icon?: string;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FinanceTransaction {
  id: string;
  tenant_id: string;
  category_id: string;
  wallet_id?: string;
  type: TransactionType;
  amount: number;
  currency_code: string;
  transaction_date: string;
  description?: string;
  reference_no?: string;
  status?: string;
  attachment_count: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type WalletType = 'cash' | 'bank' | 'credit' | 'e-wallet';

export interface FinanceWallet {
  id: string;
  tenant_id: string;
  name: string;
  type: WalletType;
  currency_code: string;
  balance: number;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface FinanceAttachment {
  id: string;
  tenant_id: string;
  transaction_id: string;
  file_name: string;
  storage_path: string;
  content_type?: string;
  file_size_bytes?: number;
  uploaded_at: string;
  uploaded_by?: string;
}

export interface FinanceSettings {
  id: string;
  tenant_id: string;
  default_currency: string;
  date_format?: string;
  fiscal_year_start?: string;
  module_enabled: boolean;
  allow_negative_balance: boolean;
  created_at: string;
  updated_at: string;
}

export type BudgetPeriod = 'monthly' | 'quarterly' | 'yearly';

export interface FinanceBudget {
  id: string;
  tenant_id: string;
  category_id: string;
  name: string;
  amount: number;
  period: BudgetPeriod;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface FinanceApproval {
  id: string;
  tenant_id: string;
  transaction_id: string;
  approver_id: string;
  status: ApprovalStatus;
  comments?: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

