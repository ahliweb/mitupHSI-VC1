# meetuphsi-personalfinance

AWCMS 3.1.0 - Multi-tenant Finance Management Platform with Admin Panel and Public Portal.

## Status Snapshot (2026-03-09)

- Active Node runtime validated: `v22.12.0` (minimum required).
- Full AWCMS 3.1.0 monorepo structure implemented.
- Public portal: `personalfinance.ahlikoding.com`
- Cloudflare R2 media storage: `awcms-personalfinance`
- Finance module aligned with canonical `tenant.finance.*` permissions.

## Documentation Authority

This repository follows a strict documentation hierarchy:

1. **`SYSTEM_MODEL.md`** - System architecture and tech stack (Primary Source of Truth)
2. **`AGENTS.md`** - AI agent guidelines and coding standards
3. **`README.md`** - This file (monorepo entry point)
4. **`DOCS_INDEX.md`** - Documentation navigation
5. **`docs/`** - Implementation guides

> **For AI Agents**: Always follow `AGENTS.md` and `SYSTEM_MODEL.md` as primary authorities.

## Project Structure

| Directory | Description | Tech Stack |
|-----------|-------------|-------------|
| `apps/admin/` | Admin Panel | React 19.2.4, Vite 7.2.7 |
| `awcms-public/personalfinance/` | Public Portal | Astro 5.17.1, React 19.2.4 |
| `supabase/` | Database Migrations | Supabase CLI |
| `docs/` | Documentation | Markdown |

## Quick Start

### For Developers

1. Read **[SYSTEM_MODEL.md](./SYSTEM_MODEL.md)** - Understand the architecture (5 min)
2. Read **[AGENTS.md](./AGENTS.md)** - Coding standards and patterns
3. Install dependencies:
   ```bash
   cd apps/admin && npm install
   cd awcms-public/personalfinance && npm install
   ```
4. Set up environment:
   ```bash
   cp .env.example .env
   # Configure your Supabase and Cloudflare credentials
   ```
5. Run development servers:
   ```bash
   # Admin Panel
   cd apps/admin && npm run dev
   
   # Public Portal
   cd awcms-public/personalfinance && npm run dev
   ```

## Tech Stack Versions

| Technology | Version | Notes |
|------------|---------|-------|
| React | 19.2.4 | Admin + Public |
| Vite | 7.2.7 | Admin |
| Astro | 5.17.1 | Public Portal |
| TailwindCSS | 4.1.18 | Styling |
| Supabase JS | 2.93.3 | Database/Auth |
| Node.js | >= 22.12.0 | Required runtime |
| Cloudflare R2 | - | Media storage |

## Finance Module

The Finance module provides tenant-aware finance management:

### Permission Keys (Canonical Format)

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

## Documentation

- **[SYSTEM_MODEL.md](./SYSTEM_MODEL.md)**: System architecture and tech stack
- **[AGENTS.md](./AGENTS.md)**: AI agent guidelines and coding standards
- **[DOCS_INDEX.md](./DOCS_INDEX.md)**: Documentation navigation
- **[CHANGELOG.md](./CHANGELOG.md)**: Version history

## Environment Variables

### Admin Panel (.env)

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SECRET_KEY=your_secret_key
```

### Public Portal (.env)

```env
PUBLIC_TENANT_ID=your_tenant_id
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

## Cloudflare Configuration

- **R2 Bucket**: awcms-personalfinance
- **Account ID**: 5255727b7269584897c8c97ebdd3347f
- **Public URL**: personalfinance.ahlikoding.com

## Contributing

1. Follow the coding standards in `AGENTS.md`
2. Ensure all permissions use canonical `tenant.*` format
3. Run lint before committing: `npm run lint`
4. Update CHANGELOG.md for significant changes

## License

See [LICENSE](./LICENSE)
