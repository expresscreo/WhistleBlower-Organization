# Deployment (Next.js standalone)

This app uses Next.js **standalone** output for Node hosting (VPS, Hostinger with Node, etc.).

## Build locally

```bash
npm install
npm run build
```

## Deploy bundle

After `npm run build`, copy to the server:

1. `.next/standalone/` — application server
2. `.next/static/` → `.next/standalone/.next/static/`
3. `public/` → `.next/standalone/public/`

Example rsync layout on the server:

```
~/domains/your-domain/next-app/
  server.js
  .next/
  public/
```

## Run on the server

```bash
cd ~/domains/your-domain/next-app
PORT=3000 node server.js
```

Point your reverse proxy (nginx/Apache) at `http://127.0.0.1:3000`.

## Environment variables

Set on the host (not committed). **Do not copy placeholder values from `env.example`** (e.g. `your-project.supabase.co`) — login and API calls will fail with `ERR_NAME_NOT_RESOLVED`.

Use your real Supabase project URL and anon key from the Supabase dashboard → Project Settings → API.

- `NEXT_PUBLIC_SUPABASE_URL` — e.g. `https://<project-ref>.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — full `eyJ...` anon key (not `eyJ...` truncated)
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` (pk_* only)
- Server-only: `SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_*_SECRET_KEY`, `RESEND_API_KEY`
- Optional email overrides: `RESEND_FROM_EMAIL` (default `WhistleBlower.ng <noreply@WhistleBlower.ng>`), `NOTIFICATION_SUPPORT_EMAIL` (default `support@whistleblower.ng`)

## Static-only hosting

`output: 'export'` is **not** used. Pure static Hostinger (`public_html` only) cannot run this app without a Node process or a platform like Vercel.
