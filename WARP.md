# WARP.md — Architecture and Delivery Guide (Boots & Honey)

Updated: 2025-10-14

This document steers how we evolve from a single online PO form into a multi‑app ecosystem: public marketing, customer portal, and internal admin. It is opinionated to keep velocity high without sacrificing security or maintainability.


## TL;DR

- Use one monorepo with multiple deployable Next.js apps: marketing, web (customer portal), admin.
- Share code via internal packages (ui, types, utils, pdf-templates, config).
- Prefer subdomains (www, app, admin) mapped to separate deployments for clear boundaries, caching, and SEO.
- Supabase for auth and data with strict RLS. Admin actions run server-side with service role; never expose service role to clients.
- Deploy each app independently (Vercel projects), share a cohesive design system and configs.
- Incrementally migrate the current PO flow into apps/web and extract shared pieces as packages.


## Goals and Scope

- Public experience: marketing/landing, docs/blog, SEO-friendly.
- Authenticated experience: customer portal (today’s PO flow + future features).
- Private/internal: admin dashboard and ops tools.
- Cross-cutting: shared design system, utilities, Supabase types, and document/PDF generation.


## Repository strategy

Default: single monorepo with multiple apps. Split into separate repos only if team/org boundaries, compliance, or radically different runtimes emerge.

Suggested layout:

```
.
├─ apps/
│  ├─ marketing/        # Public site (landing, docs/blog)
│  ├─ web/              # Customer portal (PO flow, user features)
│  └─ admin/            # Internal dashboard & ops tools
│
├─ packages/
│  ├─ ui/               # Design system (shadcn/ui, Tailwind preset, tokens)
│  ├─ types/            # Supabase-generated types and shared TS types
│  ├─ utils/            # Shared helpers (currency, dates, validation)
│  ├─ pdf-templates/    # HTML/React templates and helpers for receipts/POs
│  └─ config/           # tsconfig, eslint, prettier, tailwind presets, turbo config
│
└─ tooling/             # Optional: scripts, schema migration helpers, CI bits
```

Benefits
- Clear boundaries per app (builds, caching, auth) with shared code reuse.
- Independent deployments and rollbacks per app.
- Scales better than a single giant app with path-based sections.


## Domain and routing

Prefer subdomains for separation and SEO:
- www.example.com → apps/marketing
- app.example.com → apps/web (customer portal)
- admin.example.com → apps/admin (internal)
- api.example.com (optional) → if/when we extract a public API or service

Alternative (not preferred long-term): a single app with paths (/, /app, /admin). Good for very early stage, but it couples caching/runtime/security and inflates build size.


## Authentication and authorization

- Auth provider: Supabase Auth.
- Sessions: cookie-based. If you want SSO across subdomains, set the cookie domain to `.example.com` and align session settings across apps.
- RBAC: gate admin with role checks in middleware/server components.
- Admin privilege: perform admin-sensitive actions server-side using the Supabase Service Role key. Never expose this key to the browser.
- Database security: keep strict RLS; normal users access only their rows via `auth.uid()`. Admin flows bypass RLS via service role in server routes.

Environment variables (examples; do not commit values):
- SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_URL (client-safe)
- SUPABASE_ANON_KEY (client-safe)
- SUPABASE_SERVICE_ROLE_KEY (server-only; NEVER sent to client)
- NEXTAUTH_SECRET or similar if using a hybrid auth layer (server-only)


## Database and RLS guidance

- Keep RLS ON for all user-facing tables.
- Users: policies based on `auth.uid()` to restrict to their own resources.
- Admin: do not weaken RLS. Use server-only service role for admin routes.
- Optionally, create an `admin_ops` schema for internal/operational tables and logs.

Example (conceptual) policy pattern:
- orders table
  - SELECT/UPDATE/DELETE for owner: `using (user_id = auth.uid())` and `with check (user_id = auth.uid())`.
  - INSERT: `with check (user_id = auth.uid())`.
- Admin read/write: only via server route handler with service role (bypasses RLS). No browser access.


## API and backend shape

- App-facing APIs: Next.js Route Handlers in each app.
- Workflows: webhooks (e.g., Supabase triggers → webhook → Next route handler → storage/DB), background jobs as needed.
- When heavier isolation/perf is needed: move tasks to Supabase Edge Functions or a small services package and expose behind `api.example.com`.
- Document generation: keep HTML/PDF logic in `packages/pdf-templates`. Server-only code renders, stores in Supabase Storage, and updates DB.


## Performance and caching

- Marketing: static/ISR. Aggressive cache headers, image optimization, SEO.
- App/Admin: streaming SSR and segment-level caching (Next 15). Use `revalidateTag`/`revalidatePath` and RSC patterns. Avoid mixing heavy SSR with marketing.
- Partial prerendering: use for shells while streaming dynamic data.


## Developer experience

- Monorepo tool: Turborepo (preferred) or Nx.
- Shared configuration in `packages/config` (tsconfig, eslint, prettier, tailwind preset, commit hooks).
- Design system in `packages/ui` (shadcn/ui + tokens), consumed by all apps.
- Types in `packages/types` (generated Supabase types + shared domain types).
- Scripts for type generation after schema changes.

Package manager: pnpm (recommended). yarn/npm acceptable if already in use—standardize to one.

Suggested root scripts (example):
```
# package.json (root) — conceptual example
{
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo run dev --parallel",
    "dev:web": "turbo run dev --filter=web",
    "dev:admin": "turbo run dev --filter=admin",
    "dev:marketing": "turbo run dev --filter=marketing",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "typegen": "pnpm --filter @org/types run gen"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  }
}
```


## Environments and configuration

- Environments: local, staging, production.
- Vercel: separate projects per app (marketing, web, admin). Assign subdomains per environment, e.g.:
  - www.example.com (prod), www-staging.example.com (staging)
  - app.example.com (prod), app-staging.example.com (staging)
  - admin.example.com (prod), admin-staging.example.com (staging)
- Supabase: start with one project per environment (dev/staging/prod) once you need safer change promotion.
- Ensure your type generation points at the correct environment when schemas change.

Per-app .env examples (names only; no values):
- apps/web: SUPABASE_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- apps/admin: same as above; plus any ADMIN-specific flags
- apps/marketing: typically no service role; keep it static where possible

Secrets handling
- Never echo secrets to terminal/logs.
- Use environment variables; prefer Vercel encrypted envs and local `.env.local` (gitignored).


## Observability and safety

- Error tracking: Sentry (all apps). Include server and client integrations.
- Structured logs on server (request IDs, user IDs where appropriate).
- Rate limiting for public endpoints (middleware or edge).
- Audit logs for admin actions (append-only).
- Backups + migration scripts; use review for destructive migrations.
- CSP, XSS protections, dependency auditing (e.g., `pnpm audit` in CI).


## Testing strategy

- Unit tests: critical utils and domain logic in packages.
- Integration tests: API routes and key flows (orders, payments, receipts) per app.
- E2E tests: Playwright or Cypress for the portal and admin. Smoke tests for marketing.
- Minimal happy-path smoke tests run on every PR; deeper suites on main and scheduled.


## Deployment model (Vercel)

- Create three Vercel projects pointing to:
  - apps/marketing
  - apps/web
  - apps/admin
- Connect domains/subdomains accordingly.
- Configure per-project environment variables.
- Preview deployments per PR for each app.
- Use Vercel’s monorepo detection or configure `rootDirectory` per project.


## When to split into separate repos

- Team/process boundaries (different release cadences and owners).
- Compliance/isolation requirements.
- Fundamentally different stacks/runtimes that don’t fit the repo tools.

Until then, monorepo provides the best speed and shared quality bar.


## Incremental plan (from current state)

1) Decide domain plan
   - Prefer subdomains: www, app, admin.

2) Introduce monorepo scaffold
   - Create folders: apps/{marketing,web,admin}, packages/{ui,types,utils,pdf-templates,config}.
   - Move the current PO app into apps/web.

3) Extract shared configs and UI
   - Tailwind preset, ESLint/Prettier, tsconfig → packages/config.
   - shadcn/ui tokens/components → packages/ui.

4) Centralize types
   - Move Supabase generated types to packages/types and wire a `gen` script.

5) Harden auth/RBAC
   - Add middleware for admin routes, verify roles server-side.
   - Confirm all admin-sensitive writes use service role in server code only.

6) PDFs and documents
   - Move existing receipt/PO templates into packages/pdf-templates.
   - Update server route handlers to import from the package.

7) Deploy
   - Create three Vercel projects and map domains.
   - Configure env vars per app and verify log/error tracking.

8) Test and iterate
   - Add smoke E2E tests for order creation and receipt generation.
   - Add dashboards/landing enhancements incrementally.


## Conventions

- Naming: kebab-case for packages/apps, PascalCase for components, camelCase for functions/vars.
- Commits: Conventional Commits (feat, fix, chore, refactor, docs, test, build, ci).
- CI: lint + typecheck + unit on PR; build + e2e on main and scheduled.
- Code owners: define per app/package once team grows.


## Command cheat sheet (examples)

Local dev (run apps concurrently):
```
pnpm install
pnpm dev          # runs all dev servers via turbo
pnpm dev:web     # runs only web
pnpm dev:admin   # runs only admin
pnpm dev:marketing
```

Generate Supabase types (example):
```
# in packages/types
pnpm run gen
```

Build & test:
```
pnpm build
pnpm test
```


## Risk and trade‑offs

- Single Next app with path segmentation is simpler short-term but hurts caching, TTFB, and security boundaries as you scale.
- Monorepo with multiple apps yields clear ownership and performance profiles. Slightly more setup, big payoff.
- Multiple repos add coordination overhead; only move there when constraints demand it.


## Appendix: Example package boundaries

- packages/ui
  - Component primitives, design tokens, Tailwind preset.
  - Zero business logic; safe to share everywhere.
- packages/types
  - Supabase `Database` types, domain types (Order, Receipt), Zod schemas.
- packages/utils
  - Formatting (currency, dates), parsing, guards, feature flags.
- packages/pdf-templates
  - HTML/react-based templates, render helpers (server-only).
- packages/config
  - Shared tsconfig, eslint, prettier, tailwind. Optional husky/lint-staged.


## Appendix: Security checklist (server/client)

- Do not expose service role keys in client bundles.
- Enforce RLS on all tables; verify with tests.
- Validate inputs with Zod on server routes; never trust client.
- Rate limit public endpoints and bots.
- Implement CSP and escape all user content in UI.
- Session cookie: `HttpOnly`, `Secure`, `SameSite` tuned for subdomains if SSO.
- Audit logs for admin write actions.


---

This guide is intentionally practical. As we build, we will keep it living—record deviations in a small "Decisions" section at the top if we consciously diverge from defaults.
