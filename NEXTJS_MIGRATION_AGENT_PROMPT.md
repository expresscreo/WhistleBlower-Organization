# Agent Prompt: Full Vite/React SPA → Next.js App Router Migration

Use this prompt when migrating **the-organization-whistleblower** (or a similar Vite + React Router + Supabase whistleblower app) to Next.js.

---

## Your role

You are a senior full-stack engineer performing a **complete, production-ready migration** from Vite + React SPA to **Next.js 15 App Router**. Work autonomously: audit the codebase, implement all changes, run `npm run build`, fix errors, and verify key routes. Minimize scope creep but do not leave half-migrated routing or broken auth.

---

## Project context (adapt after audit)

Expected stack (confirm in target repo):

- **Build:** Vite (`vite.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`)
- **Routing:** `react-router-dom` v6 with nested routes (public layout, auth, `/dashboard/*`)
- **UI:** React 18, Tailwind, Radix/shadcn-style components, Framer Motion
- **Backend:** Supabase client + Edge Functions (keep as-is; do not rewrite backend unless broken)
- **Deploy:** Static `dist/` upload to Hostinger (will need to change to Node standalone or Vercel)

**Important:** If `src/pages/` exists, Next.js will treat it as the **Pages Router** and conflict with `app/`. Rename legacy page components to `src/views/` during migration.

---

## Goals

1. Replace Vite with Next.js 15 App Router.
2. Preserve all existing routes and UX (public, auth, dashboard).
3. Keep Supabase auth + permissions behavior equivalent to today.
4. Migrate env vars from `VITE_*` / `import.meta.env` to `NEXT_PUBLIC_*` / `process.env`.
5. Secure secrets (never `NEXT_PUBLIC_` on `sk_*`, Resend, service role, etc.).
6. Remove Vite-only artifacts after migration.
7. `npm run build` must pass with all App Router routes listed.

---

## Phase 1 — Audit (do this first)

1. Read `package.json`, `vite.config.js`, `src/App.jsx` (or equivalent router file), `src/main.jsx`, `index.html`, `deploy.sh`, `.env` / `env.example`.
2. List every route (path → component). Include dynamic routes like `/dashboard/reports/:reportId`.
3. Find all `react-router-dom` usage: `Link`, `NavLink`, `useNavigate`, `useParams`, `useLocation`, `useSearchParams`, `Navigate`, `Outlet`.
4. Find all `import.meta.env.VITE_*` references.
5. Find browser-only code: `window`, `document`, `localStorage`, `MediaRecorder`, `html2canvas`, `jspdf`, Paystack inline script.
6. Note dead code (e.g. ecommerce routes not in router) — delete only if unreferenced.
7. Check deployment target (static Hostinger vs Node). Plan **standalone** output if staying on custom VPS.

Document findings briefly before coding.

---

## Phase 2 — Next.js scaffold

### 2.1 Dependencies

**Remove:** `vite`, `@vitejs/plugin-react`, Vite-only plugins, `react-router-dom` (after adapter in place).

**Add:** `next@^15`, `eslint-config-next`.

**Scripts in `package.json`:**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

### 2.2 Config files

**`next.config.mjs`:**

```js
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // for Node deployment
  env: {
    // Client-safe only. Map legacy VITE_* during transition:
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY:
      process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || process.env.VITE_PAYSTACK_PUBLIC_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || process.env.VITE_APP_URL,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
      'react-router-dom': path.resolve(__dirname, './src/lib/router.jsx'),
    };
    return config;
  },
};

export default nextConfig;
```

**`jsconfig.json`:**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

**`.gitignore` additions:** `.next`, `.deploy`

### 2.3 Root layout & providers

**`app/layout.jsx`** (server component):

- Import global CSS: `@/index.css`, `react-datepicker/dist/react-datepicker.css`
- Export `metadata` (title, description, OG, Twitter) from former `index.html`
- Load Paystack via `next/script` (`strategy="afterInteractive"`)
- JSON-LD scripts if present in old `index.html`
- Wrap children in `<Providers />`

**`app/providers.jsx`** (`'use client'`):

- `HelmetProvider` (keep until metadata migrated per page)
- `ThemeProvider`, `AuthProvider`, `PermissionsProvider`, `MobileMenuProvider`
- `ScrollToTop`, `ScrollToTopButton`
- Wrap app chrome in `<Suspense fallback={null}>` (required for `useSearchParams` in router adapter)

---

## Phase 3 — Router compatibility layer (minimize churn)

Create **`src/lib/router.jsx`** mapping react-router APIs to Next.js:

| react-router-dom | Next.js equivalent |
|------------------|-------------------|
| `Link` | `next/link` |
| `NavLink` | `next/link` + `usePathname` active state |
| `useNavigate` | `useRouter().push/replace/back` |
| `useParams` | `useParams` from `next/navigation` |
| `useLocation` | `usePathname` + `useSearchParams` (+ optional sessionStorage for `navigate(..., { state })`) |
| `useSearchParams` | `useSearchParams` from `next/navigation` |
| `Navigate` | `useEffect` + `router.replace` |
| `Outlet` | React context (optional; prefer layout `children`) |
| `BrowserRouter`, `Routes`, `Route` | no-ops |

Use `'use client'` at top of file.

**Do not** rewrite every component to `next/link` in the first pass unless time permits; the webpack alias keeps existing imports working.

---

## Phase 4 — App Router file structure

Rename **`src/pages/` → `src/views/`** and update all imports `@/pages/` → `@/views/`.

Create thin route files under `app/` that re-export or wrap view components.

### Example structure

```
app/
  layout.jsx
  providers.jsx
  not-found.jsx
  (public)/
    layout.jsx          # Navbar + Footer
    page.jsx            # Home
    about-us/page.jsx
    submit-report/page.jsx
    track-report/page.jsx
    ...
  login/page.jsx
  register/page.jsx
  forgot-password/page.jsx
  auth/
    reset/page.jsx
    confirm/page.jsx
  dashboard/
    layout.jsx          # DashboardLayout wrapper
    page.jsx            # redirect → /dashboard/overview
    overview/page.jsx
    reports/page.jsx
    reports/[reportId]/page.jsx
    ...
```

### Route wrapper pattern

**Public page:**

```jsx
'use client';
import HomePage from '@/views/HomePage';
export default HomePage;
```

**Protected dashboard page:**

```jsx
'use client';
import ProtectedPage from '@/components/auth/ProtectedPage';
import ReportsPage from '@/views/dashboard/ReportsPage';

export default function DashboardReportsPage() {
  return (
    <ProtectedPage pageName="Reports">
      <ReportsPage />
    </ProtectedPage>
  );
}
```

Extract `ProtectedRoute` logic from old `App.jsx` into **`src/components/auth/ProtectedPage.jsx`** (suspended company rules, `hasPermission`, redirect to `/dashboard/overview`).

### Layout changes

**`app/(public)/layout.jsx`:** Navbar + `<main>{children}</main>` + Footer

**`app/dashboard/layout.jsx`:** `<DashboardLayout>{children}</DashboardLayout>`

Update **`DashboardLayout`**: replace `<Outlet />` with `{children}`, keep auth redirect via `<Navigate to="/login" />`.

**`app/dashboard/page.jsx`:**

```js
import { redirect } from 'next/navigation';
export default function DashboardIndex() {
  redirect('/dashboard/overview');
}
```

Mirror **every route** from the old `App.jsx` — do not skip any.

---

## Phase 5 — Environment variables

### Client-safe (`NEXT_PUBLIC_`)

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...   # pk_* only
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Server-only (no `NEXT_PUBLIC_`)

```
SUPABASE_SERVICE_ROLE_KEY=
PAYSTACK_TEST_SECRET_KEY=sk_test_...
PAYSTACK_LIVE_SECRET_KEY=sk_live_...
RESEND_API_KEY=re_...
```

Create **`src/lib/env.js`**:

- `publicEnv` / `getPaystackPublicKey()`
- `serverEnv` for secrets (document: import only in server code)

Replace all `import.meta.env.VITE_*` with `process.env.NEXT_PUBLIC_*`.

Update **`src/lib/customSupabaseClient.js`:**

```js
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

// Validate URL (catch typos like ".https://...")
try { new URL(supabaseUrl); } catch { throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL'); }

const isBrowser = typeof window !== 'undefined';
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: isBrowser,
    autoRefreshToken: isBrowser,
    detectSessionInUrl: isBrowser,
  },
});
```

Update `env.example` with clear client vs server sections.

---

## Phase 6 — SSR / client boundaries

1. Mark interactive route wrappers with `'use client'`.
2. Guard `localStorage` / `window` in initial state (e.g. `ThemeContext`).
3. Wrap root providers in `Suspense` if using `useSearchParams`.
4. Heavy browser libs (`html2canvas`, `jspdf`) — keep in client components only; use `dynamic(..., { ssr: false })` if build warns.
5. Do **not** import `serverEnv` secrets in any `'use client'` file.

---

## Phase 7 — Delete Vite artifacts

After `npm run build` passes:

| Delete | Reason |
|--------|--------|
| `vite.config.js` | Replaced by Next |
| `index.html` | Replaced by `app/layout.jsx` |
| `src/main.jsx`, `src/App.jsx` | Replaced by App Router |
| `plugins/visual-editor/*` | Vite-only Hostinger Horizons |
| `dist/` | Old static build |
| `tools/generate-llms.js` | Parsed deleted App.jsx |
| Dead ecommerce files | If unrouted and unused |
| `@babel/*`, `terser` from devDeps | Vite editor tooling |

Keep: `src/components`, `src/views`, `src/contexts`, `src/hooks`, `src/lib`, `public/`, `supabase/`.

---

## Phase 8 — Deployment

Old: `npm run build` → `dist/` → rsync to `public_html`.

New: Next **standalone** Node server.

Update `deploy.sh` to:

1. `npm run build`
2. Copy `.next/standalone`, `.next/static`, `public` to deploy bundle
3. rsync to server path (e.g. `~/domains/.../next-app/`)
4. Document: `PORT=3000 node server.js` + reverse proxy

Update `docs/DEPLOYMENT.md` accordingly.

**Do not** use `output: 'export'` unless the user explicitly requires static-only hosting (loses middleware, dynamic SSR, and most Next benefits).

---

## Phase 9 — Tailwind

Update `tailwind.config.js` content paths:

```js
content: ['./app/**/*.{js,jsx}', './src/**/*.{js,jsx}'],
```

Remove obsolete `./pages/**` unless a top-level `pages/` dir exists.

---

## Phase 10 — Verification

### Build

```bash
npm install
npm run build
```

Expect ~30–40 `Route (app)` entries. Fix:

- **Invalid URL** on Supabase → check `.env` for typos (e.g. leading `.` before `https`)
- **useSearchParams without Suspense** → wrap providers in Suspense
- **Pages Router conflict** → ensure `src/pages` was renamed to `src/views`
- **usePermissions outside provider** → same as above (stale Pages Router build)

### Dev smoke test (`npm run dev` → port 3000)

- [ ] `/` home loads
- [ ] `/submit-report`, `/track-report`
- [ ] `/login`, `/register`, logout
- [ ] `/dashboard/overview` after login
- [ ] Permission-gated page redirects when unauthorized
- [ ] `/dashboard/reports/[id]` dynamic route
- [ ] Paystack billing/register flow (public key only in bundle)
- [ ] Theme toggle / dark mode
- [ ] 404 page

### Security audit

- [ ] No `NEXT_PUBLIC_` on `sk_*`, Resend, service role, Monnify secrets
- [ ] Rotate any secrets that were previously exposed with `NEXT_PUBLIC_`

---

## Optional follow-ups (after stable migration)

1. Replace `react-helmet-async` with per-route `export const metadata` / `generateMetadata`.
2. Adopt `@supabase/ssr` + `middleware.ts` for session refresh.
3. Remove `src/lib/router.jsx` shim; migrate to `next/link` and `useRouter` directly.
4. Add `eslint-config-next` and fix lint warnings.

---

## Constraints

- **Do not** change Supabase Edge Functions unless required for env renames.
- **Do not** refactor unrelated business logic during migration.
- **Do not** commit `.env` or secrets.
- **Do not** force-push or amend git history unless user asks.
- Match existing code style and naming conventions.
- Run `npm run build` before declaring done.

---

## Deliverables

When finished, report:

1. Summary of changes (config, routes, env, deploy).
2. Full route table (app paths).
3. Build output confirmation.
4. List of deleted files/folders.
5. Deployment instructions for production.
6. Any blockers (e.g. Hostinger static-only hosting requires VPS upgrade).

---

## Reference: sibling project

This prompt was derived from a successful migration of **the-business-whistleblower**. Reuse patterns from that repo if available:

- `app/` route wrappers
- `src/lib/router.jsx` compatibility shim
- `src/components/auth/ProtectedPage.jsx`
- `src/lib/env.js` + `customSupabaseClient.js` auth options
- `next.config.mjs` standalone + webpack aliases
- `docs/DEPLOYMENT.md` for Node hosting

Adapt route names and page counts to **the-organization-whistleblower** after auditing its `App.jsx` (or equivalent).
