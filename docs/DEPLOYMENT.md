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

Set on the host (not committed):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` (pk_* only)
- Server-only: `SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_*_SECRET_KEY`, `RESEND_API_KEY`

## Static-only hosting

`output: 'export'` is **not** used. Pure static Hostinger (`public_html` only) cannot run this app without a Node process or a platform like Vercel.
