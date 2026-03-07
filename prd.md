# Product Requirements Document (PRD)

## AWCMS Finance Module

## 1. Executive Summary

This PRD defines the Finance Module, an AWCMS-native, multi-tenant, ABAC-governed application module. It enables AWCMS tenants to securely track income and expenses, manage localized categories, review financial reports, and maintain strict tenant data isolation. 

The module is explicitly designed around the canonical AWCMS architecture, utilizing Context7-guided implementation workflows to ensure library integration (e.g., Supabase RLS, TanStack Query) adheres to the latest industry standards.

---

## 2. Product Vision

Enable every AWCMS tenant to manage operational finance, organizational cash flow, or lightweight tracking operations in a secure, performant, and deeply integrated multi-tenant environment.

## 3. Product Mission

Provide a frictionless, natively integrated finance module that allows tenants to record income and expenses, manage categories, review summaries and reports, and eventually evolve into budgeting, wallets, and approval workflows, without relying on external accounting systems for lightweight needs.

---

## 4. Product Positioning in AWCMS

This product is defined as:
* An AWCMS-native module.
* A strictly tenant-aware finance management capability.
* A resource-driven admin feature set bound by ABAC policies.
* A future-ready foundation for lightweight SME, nonprofit, and organizational finance tracking.

It is **not** intended to be:
* A full ERP or double-entry accounting engine.
* A banking core system or regulated payment processor.

---

## 5. Architectural & Implementation Strategy

### 5.1 Technology Stack & Context7 Alignment

Implementation of this module must rely on **Context7** as the definitive authority for library-specific syntax and best practices.

* **Frontend:** React, Vite, AWCMS UI Shared Components.
* **Server State & Caching:** TanStack Query.
* **Database & Auth:** Supabase (PostgreSQL), strict Row Level Security (RLS).

### 5.2 Supabase RLS Best Practices (via Context7)

Multi-tenancy is enforced primarily at the database layer using Postgres RLS policies.
* All data access must evaluate the `tenant_id` associated with the active user context.
* Policies should dynamically resolve the tenant ID using canonical AWCMS helpers or standard JWT extraction strategies:
  ```sql
  -- Example of Context7-guided tenant isolation policy
  CREATE POLICY "Tenant isolation for transactions" ON public.finance_transactions
      AS PERMISSIVE FOR ALL TO authenticated
      USING (tenant_id = public.current_tenant_id())
      WITH CHECK (tenant_id = public.current_tenant_id());
  ```
* **Critical:** Application-level code filtering is insufficient. The database must enforce isolation even if the client mistakenly requests cross-tenant resources.

### 5.3 TanStack Query Architecture (via Context7)

For a scalable and predictable frontend architecture:
* **Custom Hooks:** Wrap all `useQuery` and `useMutation` calls in custom hooks (e.g., `useFinanceTransactions()`) to ensure type inference via `Promise<Transaction[]>` and to centralize fetching logic.
* **Query Key Factories:** Structure query keys predictably: `['finance', 'transactions', tenantId, filters]`.
* **Dependent Queries:** When transaction data depends on the successful resolution of tenant boundaries or user metadata, use the `enabled: !!tenantId` pattern to prevent race conditions and unnecessary waterfalls.

---

## 6. Goals

### 6.1 Product Goals
* Provide a seamless, in-system finance tracking experience.
* Ensure immediate, mathematically sound reporting at the tenant level.

### 6.2 Technical Goals
* Guarantee 100% strict tenant data isolation via Supabase RLS.
* Align all access with AWCMS ABAC permissions.
* Centralize all data fetching via strongly typed TanStack Query setups.

### 6.3 Governance Goals
* Keep all features discoverable in `RESOURCE_MAP.md` and `SYSTEM_MODEL.md`.
* Ensure every architectural boundary follows canonical AWCMS guidelines.

---

## 7. Primary Use Cases

1. **Nonprofit/NGO:** Track incoming contributions and disbursements securely per chapter.
2. **School/Clinic:** Track petty cash, donations, and routine operational expenses.
3. **General SME:** Use the module for lightweight income-expense journaling instead of spreadsheets.

---

## 8. AWCMS Product Scope

### 8.1 In-Scope for Initial Release
* Tenant-scoped Finance Dashboard.
* Transaction CRUD (Income & Expense).
* Finance Categories Management.
* Financial Summary Reports.
* Finance Settings configuration per tenant.
* Admin navigation and ABAC resource registration.
* RLS-safe backend access patterns.

### 8.2 In-Scope for Phase 2 / Later
* Wallets / Accounts / Cash boxes.
* Recurring transactions and Budgets.
* Approvals and review workflows.
* Attachment uploads for physical receipts.
* CSV/PDF Exporting and Dashboard Widgets.

---

## 9. Module Placement in AWCMS

**Module Key:** `finance`
**Feature Label:** `Finance`

### 9.1 Admin Navigation Placement
* Dashboard
* Finance
  * Overview
  * Transactions
  * Categories
  * Reports
  * Settings

---

## 10. Resource Model & ABAC Registration

The module is fundamentally represented by explicit AWCMS resources governing UI rendering and data access payloads.

### Core Resources
* `finance.dashboard`
* `finance.transactions`
* `finance.categories`
* `finance.reports`
* `finance.settings`

### Recommended Actions / Permissions
* `tenant.finance.dashboard.view`
* `tenant.finance.transactions.view`
* `tenant.finance.transactions.create`
* `tenant.finance.transactions.update`
* `tenant.finance.transactions.delete`
* `tenant.finance.categories.view`
* `tenant.finance.categories.manage`
* `tenant.finance.reports.view`
* `tenant.finance.reports.export`
* `tenant.finance.settings.configure`

---

## 11. Role and Access Model

### Platform Scope
**Platform Admin** may:
* Enable or disable the finance module globally.
* Manage default global module configuration.

### Tenant Scope
**Tenant Admin** may:
* Enable the module for their specific workspace.
* Assign roles and permissions to staff.
* View and configure all tenant finance data.

**Finance Manager / Staff:**
* Manage transactions, categories, and operate the module within normal boundaries.

**Auditor / Read-Only Analyst:**
* Has standard `view` permissions for reporting, but cannot mutate ledgers.

---

## 12. Multi-Tenancy Requirements

Multi-tenancy is mandatory and non-negotiable.

### Mandatory Rules
* All tenant-owned finance records **MUST** include `tenant_id`.
* No finance record may be mutated or returned across tenants.
* Resource access must honor both UI permission checks and DB-level PostgreSQL RLS policy enforcement.
* Every list, report, chart, summary, and export must be inherently tenant-filtered.

---

## 13. Data Architecture Requirements

### Minimum Required Tables

#### `finance_categories`
* `id` (UUID, PK)
* `tenant_id` (UUID, Not Null)
* `name` (String)
* `type` ('income' | 'expense')
* `is_active` (Boolean)
* `created_at` / `updated_at` / `deleted_at`

#### `finance_transactions`
* `id` (UUID, PK)
* `tenant_id` (UUID, Not Null)
* `category_id` (UUID, FK)
* `type` ('income' | 'expense')
* `amount` (Numeric)
* `transaction_date` (Date)
* `currency_code` (String)
* `description` / `metadata` / `attachment_count`
* `created_at` / `updated_at` / `deleted_at`

#### `finance_settings`
* `id` (UUID, PK)
* `tenant_id` (UUID, Not Null, Unique)
* `default_currency` (String)
* `module_enabled` (Boolean)
* `created_at` / `updated_at`

---

## 14. Functional Requirements

### 14.1 Finance Dashboard
Displays tenant-scoped summaries:
* Total income and expense for a selected period.
* Net balance.
* Recent transaction ticker.

### 14.2 Transactions Management
Users with permission can:
* Create, update, soft delete, and view transactions.
* Filter by date, type, category, and keyword.

### 14.3 Categories Management
Users with permission can:
* List, create, update, and deactivate categories.
* Differentiate between system defaults and custom inputs.

### 14.4 Reports
Reports must aggregate values to support:
* Date range and type/category filers.
* Income vs. Expense net variance.

### 14.5 Finance Settings
Tenant admins can configure:
* Default currency and global module availability status.

---

## 15. Validation & Non-Functional Rules

### Security
* RLS enforced at layer 0 (Database). ABAC enforced at Gateway and UI.
* Audit logging on critical finance mutations where relevant.
* Soft-deletion for all transactional data.

### Performance
* Add compound indexes on `(tenant_id, transaction_date)` and `(tenant_id, category_id)` to optimize high-volume queries.

### UX & Maintainability
* Utilize customized TanStack query hooks to avoid inline `fetch` noise.
* Maintain strict typing across the module boundaries.

---

## 16. Acceptance Criteria

* **Security:** `auth.uid()` / RLS tests demonstrate that cross-tenant read/writes are impossible.
* **Architecture:** Custom TanStack Query hooks utilize standard `enabled: !!tenantId` dependencies and explicit return typing.
* **Product:** Tenant admins can fully access, configure, and operate the finance dashboards within their bounds.
* **Documentation:** `RESOURCE_MAP.md` and `SYSTEM_MODEL.md` perfectly reflect the implemented permissions and infrastructure.
