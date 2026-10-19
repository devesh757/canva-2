# Libre Studio — design anything (Next.js edition)

An open, clean-room design platform inspired by Canva's public surface: full canvas editor,
original templates, text/shapes/photos tools, Magic AI (OpenAI **or** free NVIDIA NIM keys),
accounts, and subscriptions with Stripe (demo mode without keys).

**Clean-room product.** No Canva code, proprietary fonts, template artwork, or stock content.
All templates are generated from original geometry; fonts are SIL OFL Google Fonts.
See `docs/REVERSE_ENGINEERING.md` for the reverse-engineering evidence ledger.

## Stack

| Layer      | Tech |
|------------|------|
| Framework  | Next.js 15 (App Router) + TypeScript |
| Editor     | Fabric.js 6 client engine (`components/CanvasStage.jsx` + imperative API) |
| Data       | Prisma + SQLite (`prisma/schema.prisma`) — User, Design, Page, Subscription, Usage |
| Auth       | Demo email sign-in → HMAC-signed session cookie (no passwords) |
| AI         | Provider abstraction: offline heuristics (always), OpenAI, **NVIDIA NIM** (build.nvidia.com free keys) |
| Billing    | Stripe Checkout + webhooks when keys are set; explicit demo-activation mode otherwise |
| UI         | Custom design system + polish layer (`app/globals.css`, `app/polish.css`) |

The pre-migration Vite SPA is preserved in `legacy-vite/` (reference only, not part of the build).

## Run

```bash
npm install          # also runs prisma generate
npm run dev          # http://localhost:5173  (same port the old dev server used)
```

First run already has `DATABASE_URL` in `.env` → database auto-creates on first query
(`prisma db push` was run; re-run after schema edits).

Flow: `/login` (email only, demo) → dashboard → **Start with a template** or create a size →
`/editor/<id>` with autosave to the server (debounced PUT per change).

## Feature map

- **Editor**: fabric canvas with snap guides, undo/redo (60), multi-page strip, zoom fit,
  keyboard shortcuts, layers, filters, gradients, image uploads, free draw, object eraser,
  present/preview overlay, PNG/JPG/PDF/JSON export.
- **Dashboard**: size presets, template gallery (SVG server-free previews), recents with
  thumbnails, JSON import, plan chip + plan management links.
- **Magic Studio**: Design/Palette/Write heuristics run 100% locally; Write/Image call
  `/api/ai/*` which resolves provider from account settings → OpenAI `gpt-4o-mini` +
  `gpt-image-1` (falls back `dall-e-3`), or NVIDIA NIM `meta/llama-3.1-8b-instruct` +
  stable-diffusion. Quotas enforced server-side per calendar month (Free 5/25, Pro 60/300,
  Max 500/5000); usage meters in the panel and `/account`.
- **Subscriptions**: `/pricing` tier cards; `/account` shows status, demo toggles, key
  management, usage. Stripe: `STRIPE_SECRET_KEY` (+ optional `STRIPE_PRICE_PRO/MAX`)
  enables real checkout + webhook lifecycle (`/api/billing/webhook`).

## Environment (`.env`)

```
DATABASE_URL="file:./dev.db"
AUTH_SECRET="change-me"
STRIPE_SECRET_KEY=      # empty → demo billing
STRIPE_WEBHOOK_SECRET=  # webhook signature
STRIPE_PRICE_PRO= / STRIPE_PRICE_MAX=  # optional real Price IDs
OPENAI_API_KEY= / NVIDIA_API_KEY=      # optional env fallbacks for AI
NVIDIA_TEXT_MODEL="meta/llama-3.1-8b-instruct"
NVIDIA_IMAGE_MODEL="stabilityai/stable-diffusion-xl"
```

Users can also store their own keys at `/account` (or inline in the Magic panel) — stored
server-side on their user row, never echoed back to the client (masked booleans only).

## API

| Route | Purpose |
|-------|---------|
| `POST/GET/DELETE /api/auth` | sign in / whoami / sign out |
| `GET/POST /api/designs` | list / create (optionally with `templateId` → editor applies it) |
| `GET/PUT/DELETE /api/designs/:id` | load / full autosave (pages replace by index) / delete |
| `GET /api/usage` | monthly quota summary per plan |
| `GET/PUT /api/user/keys` | AI provider + key management (masked) |
| `POST /api/ai/text` `/api/ai/image` | provider-routed generation with quota enforcement (402 over limit) |
| `POST /api/billing/checkout` | Stripe Checkout session (or 503 without keys) |
| `POST /api/billing/demo` | demo plan activation (blocked when Stripe configured) |
| `POST /api/billing/cancel` | drop to Free |
| `POST /api/billing/webhook` | Stripe lifecycle → subscription row |

## Honest gaps

- Auth is demo-grade (no passwords); swap for NextAuth/Clerk in production.
- Magic Write results are simple; no streaming, no image editing/inpainting yet.
- Exports are client-side rendering (PNG/JPG/PDF/JSON) — no server-side render farm.
- Comments/brand kit/scheduled publishing (Canva features outside this scope) not built.
- Android: host this Next app and wrap the URL with Capacitor; a fully offline Android
  build would need the legacy static export path (`legacy-vite/`).

## Legacy

`legacy-vite/` keeps the original Vite SPA (phase 2). It is excluded from the Next build
(`tsconfig.json`) and from production; kept as reference for the offline-static path.
