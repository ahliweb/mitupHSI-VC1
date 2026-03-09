# AI Agents Documentation

meetuphsi-personalfinance is architected to be "AI-Native", meaning the codebase structure, naming conventions, and documentation are optimized for collaboration with AI Coding Assistants (Agents) like GitHub Copilot, Cursor, Claude, and Gemini.

## Documentation Authority

All agent work must respect this chain:

1. `SYSTEM_MODEL.md` (primary source of truth)
2. `AGENTS.md` (this file)
3. `README.md` (canonical monorepo operational baseline)
4. `DOCS_INDEX.md` (documentation routing)
5. implementation/module docs in `docs/**`

---

## Agent Overview

In the meetuphsi-personalfinance ecosystem, AI Agents are treated as specialized team members. We define three primary personas for AI interactions:

### 1. The Coding Agent (Architect/Builder)

- **Focus**: Implementation, Refactoring, Bug Fixing.
- **Capabilities**:
  - Full context awareness of React 19/Vite 7/Supabase constraints.
  - Ability to generate complex UI components using `shadcn/ui` patterns.
  - Writing SQL migrations for Supabase.
  - Updating system hooks (e.g., `useSearch`, `useAdminMenu`, `useMedia`, `useTwoFactor`).
- **Responsibility**: Ensuring code quality, functional patterns, and adhering to the "Single Source of Truth" principle.

### 2. The Communication Agent (Documenter/Explainer)

- **Focus**: Documentation, Changelogs, PR Descriptions.
- **Capabilities**:
  - Summarizing technical changes for non-technical stakeholders.
  - Updating Markdown files in `docs/` folder.
  - Generating "How-to" guides based on code analysis.
- **Responsibility**: Maintaining the accuracy of documentation relative to the codebase state.

### 3. The Public Experience Agent (Frontend Specialist)

- **Focus**: Public Portal (`awcms-public/personalfinance`), Astro Islands, Performance.
- **Capabilities**:
  - Working with **Astro 5.17.1** and **React 19.2.4** (Static output + Islands).
  - Implementing **Zod** schemas for component prop validation.
  - Optimizing for Cloudflare Pages static builds (cache headers, asset optimization).
- **Constraints**:
  - **NO** direct database access (must use Supabase JS Client or Functions).
  - **NO** Puck editor runtime in the public portal (use `Render` from `@puckeditor/core` only).

---

## Current Tech Stack

Agents must be aware of the exact versions in use:

| Technology | Version | Notes |
|------------|---------|-------|
| React | 19.2.4 | Functional components only |
| Vite | 7.2.7 | Build tool & dev server |
| TailwindCSS | 4.1.18 | Admin uses CSS-based config |
| Supabase JS | 2.93.3 | Admin / Public clients |
| React Router DOM | 7.10.1 | Client-side routing |
| Puck | 0.21.0 | Visual Editor (`@puckeditor/core`) |
| TipTap | 3.13.0 | Rich text editor (XSS-safe) |
| Framer Motion | 12.23.26 | Animations |
| Radix UI | Latest | Accessible UI primitives |
| Lucide React | Latest | Admin / Public icon library |
| i18next | 25.7.2 | Internationalization |
| Recharts | 3.5.1 | Charts & Data Visualization |
| Leaflet | 1.9.4 | Maps |
| React Leaflet | 5.0.0 | React bindings for Leaflet |
| Vitest | 4.0.16 | Unit/Integration testing |
| Astro | 5.17.1 | Public portal |
| Cloudflare Workers | Latest | Edge Logic |
| Cloudflare R2 | - | Media storage |

**Important**:
- **React Version Alignment**: The Admin Panel and Public Portal both use React 19.2.4. Ensure full compatibility with all dependencies.
- **Vite 7**: This project uses Vite 7.2.7. Be aware of deprecation warnings for `ViteDevServer` APIs in `future` config.
- **Node.js**: Minimum required version is **22.12.0**. Managed via `nvm`.

---

## Agent Guidelines

To ensure successful code generation and integration, Agents must adhere to the following strict guidelines:

### Core Principles

1. **Context First**: Before generating code, read `README.md` and related component files to understand the existing patterns.

2. **Multi-Tenancy Awareness**:
   - **RLS is Sacred**: Never bypass RLS unless explicitly creating a Platform Admin feature (using `auth_is_admin()` or a server-side `SUPABASE_SECRET_KEY` path inside approved edge runtimes).
   - **Tenant Context**: Always use `useTenant()` or `usePermissions()` to get `tenantId`.
   - **Public Portal Tenant Context**: Static builds use `PUBLIC_TENANT_ID`/`VITE_PUBLIC_TENANT_ID`; avoid `Astro.locals` in build-time code.
   - **Tenancy**: Use `tenant_id` for all isolation. Respect the **5-level** hierarchy limit.
   - **Roles**: Use the **10-level** Staff Hierarchy (`public.roles.staff_level`) for workflow logic.
   - **Soft Delete**: `deleted_at` IS NULL check is mandatory.
   - **Permission Keys**: Use the strict format `scope.resource.action` (e.g., `tenant.finance.transactions.view`).
   - **Channel Restrictions**:
     - Governance/Publishing = `web` only.
     - Content Creation = `mobile` or `web`.
     - API = Read-heavy.

3. **Atomic Changes**: Do not attempt to rewrite the entire application in one pass. Break tasks into:
   - Database Schema Updates (SQL migrations)
   - Utility/Hook Creation
   - Component Implementation
   - Documentation Updates

4. **Strict Technology Constraints**:

| Rule | Requirement |
|------|-------------|
| Language | Admin Panel: JavaScript ES2022+; Public Portal: TypeScript/TSX |
| Admin Panel | React 19.2.4, Vite 7 |
| Public Portal | Astro 5.17.1 (static output), React 19.2.4 |
| Styling | TailwindCSS 4 utilities (Public uses Vite plugin + `tailwind.config.mjs`) |
| Backend | Supabase (Auth, DB, RLS) + Cloudflare Workers (Edge Logic) + R2 (Media) |

5. **Environment Security**:
   - **Ignored Files**: Ensure `.env`, `.env.local`, `.env.production`, and `.env.remote` are always ignored by Git.
   - **Template Updates**: `.env.example` must contain ALL keys found in any `.env` file, but populated ONLY with dummy secrets.
   - **Key Naming**: Use `VITE_SUPABASE_PUBLISHABLE_KEY` (public) and `SUPABASE_SECRET_KEY` (private/server-only). Avoid `ANON` or `SERVICE_ROLE` terminology.
   - **Vite Env Prefix**: Only `VITE_`-prefixed variables are exposed to client code; use `loadEnv` in `vite.config` when config values need env access.

6. **Routing & URL Security**:
   - **Sub-Slug Routing**: Use sub-slugs for tabbed/trash/approval views so refreshes work (add `*` to routes and use `useSplatSegments`).
   - **Signed IDs**: Edit/detail routes must use signed IDs (`{uuid}.{signature}`) via `encodeRouteParam` and `useSecureRouteParam`.
   - **Extension Routes**: Routes with identifiers must declare `secureParams` + `secureScope` in `admin_routes` and read values via `useRouteSecurityParams`.
   - **No Guessable URLs**: Avoid raw UUIDs in query strings or direct routes except for legacy redirect support.

7. **Dashboard UI Conventions**:
   - **Widget Headers**: Use `title`, `icon`, `badge`, or a `header` object for plugin widgets so the dashboard renders consistent headers.
   - **Widget Frames**: Prefer the default widget frame; avoid wrapping plugin widgets in custom cards unless `frame` is disabled.

### Context7 (Primary Reference)

When updating docs or implementing library usage, **Context7 is the primary reference**. Use the following verified library IDs:

- `supabase/supabase` (Platform guidance: database, RLS, migrations)
- `supabase/supabase-js` (Auth, Database)
- `supabase/cli` (Migration/CLI workflows)
- `vitejs/vite` (Build Tooling)
- `cloudflare/cloudflare-docs` (Workers, R2, Platform guidance)
- `withastro/docs` (Public Portal)
- `remix-run/react-router` (Routing v7)
- `websites/react_dev` (React 19)
- `websites/tailwindcss` (v4 CSS-first)
- `ueberdosis/tiptap-docs` (Rich Text)
- `puckeditor/puck` (Visual Editor)
- `grx7/framer-motion` (Animations)
- `ollama/ollama` (Self-hosted LLM runtime)
- `ollama/ollama-js` (Ollama Node.js SDK)

### Code Patterns

```javascript
// ✅ CORRECT: ES2022+ with hooks
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

function MyComponent({ data }) {
  const [state, setState] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    // Effect logic
  }, []);

  const handleAction = async () => {
    try {
      await doSomething();
      toast({ title: "Success", description: "Action completed" });
    } catch (error) {
      toast({
        variant: "destructive",
        "title": "Error",
        description: error.message,
      });
    }
  };

  return <Button onClick={handleAction}>Action</Button>;
}

export default MyComponent;

// ❌ INCORRECT: Class components, TypeScript, external imports
import React, { Component } from 'react';
import styles from './MyComponent.module.css'; // NO!
interface Props { data: any } // NO TypeScript!

class MyComponent extends Component<Props> { } // NO class components!
```

---

## Key Files Reference

### Contexts (Global State)

| File | Purpose |
|------|---------|
| `src/contexts/SupabaseAuthContext.jsx` | Authentication state & methods |
| `src/contexts/PermissionContext.jsx` | ABAC permissions & role checks |
| `src/contexts/PluginContext.jsx` | Extension system & hook provider |
| `src/contexts/ThemeContext.jsx` | Dark/Light theme management |
| `src/contexts/TenantContext.jsx` | Multi-tenant context & resolution |
| `src/contexts/DarkModeContext.jsx` | Dark mode toggle state |

### Core Hooks

| Hook | File | Purpose |
|------|------|---------|
| useAdminMenu | `src/hooks/useAdminMenu.js` | Sidebar menu loading & state |
| useAuditLog | `src/hooks/useAuditLog.js` | ERP Audit Logging & Compliance |
| useDashboardData | `src/hooks/useDashboardData.js` | Dashboard statistics |
| useMedia | `src/hooks/useMedia.js` | Media library operations |
| useNotifications | `src/hooks/useNotifications.js` | Notification system |
| usePlatformStats | `src/hooks/usePlatformStats.js` | Platform-wide statistics |
| useRegions | `src/hooks/useRegions.js` | 10-level region hierarchy |
| useSearch | `src/hooks/useSearch.js` | Debounced search logic |
| useSplatSegments | `src/hooks/useSplatSegments.js` | Sub-slug routing segments |
| useSecureRouteParam | `src/hooks/useSecureRouteParam.js` | Signed route param decoding |
| useTenantTheme | `src/hooks/useTenantTheme.js` | Per-tenant theming |
| useTwoFactor | `src/hooks/useTwoFactor.js` | 2FA setup & verification |
| useWidgets | `src/hooks/useWidgets.js` | Widget system management |
| useWorkflow | `src/hooks/useWorkflow.js` | Content workflow engine |

### Utility Libraries

| File | Purpose |
|------|---------|
| `src/lib/customSupabaseClient.js` | Public Supabase client (respects RLS) |
| `src/lib/supabaseAdmin.js` | Admin client (bypasses RLS) |
| `src/lib/utils.js` | Helper functions (`cn()`, etc.) |
| `src/lib/hooks.js` | WordPress-style Action/Filter system |
| `src/lib/i18n.js` | i18next configuration |
| `src/lib/routeSecurity.js` | Signed route param helpers |

---

## Supabase Integration Patterns

### Data Fetching

```javascript
import { supabase } from "@/lib/customSupabaseClient";

// Select with relations
const { data, error } = await supabase
  .from("finance_transactions")
  .select(`
    *,
    category:finance_categories(id, name, type)
  `)
  .eq("tenant_id", tenantId)
  .is("deleted_at", null)
  .order("transaction_date", { ascending: false });
```

### Client Initialization (Context7)

```javascript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      flowType: "pkce",
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: "supabase-auth-token",
    },
    db: { schema: "public" },
    global: {
      headers: { "x-application-name": "meetuphsi-personalfinance" },
    },
  }
);
```

### Soft Delete Pattern

// AWCMS uses soft delete - never use .delete()
```javascript
const { error } = await supabase
  .from("finance_transactions")
  .update({ deleted_at: new Date().toISOString() })
  .eq("id", transactionId);
```

### User Profile Details (Extended)

Store extended profile metadata in `user_profiles` and keep admin-only data in `user_profile_admin` with pgcrypto encryption.

---

## Permission Checks

### Key Format Compliance

Agents must use the standardized permission keys: `scope.resource.action`.

- **Scopes**: `platform`, `tenant`, `content`, `module`
- **Actions**: `create` (C), `read` (R), `update` (U), `publish` (P), `delete` (SD), `restore` (RS), `permanent_delete` (DP).
- **Special Flags**: `U-own` (Update Own Only) - requires checking `user_id` against resource owner.

### Finance Module Permission Keys

| Permission | Key |
|------------|-----|
| Dashboard View | `tenant.finance.dashboard.view` |
| Transactions View | `tenant.finance.transactions.view` |
| Transactions Create | `tenant.finance.transactions.create` |
| Transactions Update | `tenant.finance.transactions.update` |
| Transactions Delete | `tenant.finance.transactions.delete` |
| Categories View | `tenant.finance.categories.view` |
| Categories Manage | `tenant.finance.categories.manage` |
| Reports View | `tenant.finance.reports.view` |
| Reports Export | `tenant.finance.reports.export` |
| Settings Configure | `tenant.finance.settings.configure` |

### Implementation Pattern

```javascript
import { usePermissions } from "@/contexts/PermissionContext";

function FinanceComponent() {
  const { hasPermission, isPlatformAdmin, isFullAccess } = usePermissions();

  // Platform admin/full access bypasses all checks
  if (isPlatformAdmin || isFullAccess) {
    // Full access
  }

  // Permission-based rendering
  if (hasPermission("tenant.finance.transactions.view")) {
    return <TransactionsList />;
  }

  return null;
}
```

---

## Documentation Standards

When updating documentation:

1. Use tables for structured data
2. Include code examples with proper syntax highlighting
3. Keep version numbers accurate (check `package.json`)
4. Use relative links between docs files
5. Update `CHANGELOG.md` for significant changes

---

## Workflow Standards

For standardized AI-assisted development workflows:

- **`.agents/workflows/`** — Step-by-step procedures:
  - `migration-workflow.md` — Safe database migration creation
  - `rls-change-workflow.md` — RLS/ABAC policy changes
  - `ui-change-workflow.md` — UI component changes
  - `ci-validation-workflow.md` — Build/lint/test gate
- **`.agents/rules/`** — Guardrail playbooks:
  - `tenancy-guard.md` — Tenant isolation enforcement
  - `rls-policy-auditor.md` — RLS coverage audit
  - `abac-enforcer.md` — Permission naming and enforcement
  - `migration-guardian.md` — Migration safety
  - `no-secrets-ever.md` — Secret prevention
  - `sanitize-and-render.md` — Content sanitization
  - `release-readiness.md` — Pre-release checklist
  - `styling-guard.md` — Semantic CSS variables enforcement
  - `soft-delete-enforcer.md` — Soft delete lifecycle enforcement
  - `edge-function-safety.md` — Supabase-only backend architecture
