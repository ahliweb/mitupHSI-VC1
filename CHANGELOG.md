# Changelog

All notable changes to the **meetuphsi-personalfinance** project will be documented in this file.

## [Unreleased]

## [3.1.0] - 2026-03-09

### Added

- Initial AWCMS 3.1.0 alignment
- Full monorepo structure with public portal support
- Cloudflare R2 media storage integration
- Public-facing Finance module pages
- Canonical `tenant.finance.*` permission format

### Changed

- Upgraded to AWCMS 3.1.0 documentation standards
- Updated package version from 2.33.0 to 3.1.0
- Refactored Finance module to use canonical tenant-scoped permissions
- Aligned with AWCMS AGENTS.md documentation patterns

### Migration Details

- Permission keys migrated to canonical format:
  - `finance.dashboard` → `tenant.finance.dashboard.view`
  - `finance.transactions` → `tenant.finance.transactions.*`
  - `finance.categories` → `tenant.finance.categories.*`
  - `finance.reports` → `tenant.finance.reports.*`
  - `finance.settings` → `tenant.finance.settings.configure`

### Dependencies

- Node.js: >= 22.12.0 (required)
- React: 19.2.4
- Vite: 7.2.7
- Astro: 5.17.1 (public portal)
- TailwindCSS: 4.1.18
- Supabase JS: 2.93.3
- Cloudflare R2: awcms-personalfinance bucket

### Documentation

- Created AGENTS.md with full Context7 integration
- Created DOCS_INDEX.md for documentation navigation
- Updated SYSTEM_MODEL.md with 3.1.0 specifications
- Added markdownlint configuration files
- Added mcp.json for MCP server configuration
