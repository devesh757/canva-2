# Reverse-Engineering Ledger — Canva → Libre Studio (clean-room rebuild)

Target: Canva (desktop web + Android app, as listed on Google Play).
Method: feature-level observation of **publicly available** surfaces + clean-room reimplementation.
Boundary: **no proprietary code, fonts, template designs, or licensed stock content were copied.**
All conclusions below inform *functionality*, reimplemented from scratch with original code and
open-licensed assets (Google Fonts, generated CC0-style patterns/patrial images, original templates).

## Evidence inventory

| # | Evidence | Type | Confidence |
|---|----------|------|------------|
| E1 | Google Play Store listing for `com.canva.editor` (fetched Nov 2026) — official developer feature catalog | public doc | high |
| E2 | canva.com public homepage HTML (755 KB, auth-gated beyond marketing shell) | passive artifact | high |
| E3 | Well-known editor UX structure observable in screenshots on E1 (left rail, context toolbar, canvas) | public doc | high |

*Not analyzed*: Canva's minified editor bundles (proprietary; auth-gated SPA; out of clean-room scope).
*Unknowns*: internal feature-flag names, server APIs — declared unknown, not inferred.

## Feature map (from E1, E2, E3)

1. **Editor core** — drag/resize/rotate objects, multi-page designs, layering, zooming, snapping,
   copy/paste, undo/redo. (E3, universally observable in E1 screenshots.)
2. **Tools / left-side categories (E1 catalog)** — Templates, Elements (shapes/stickers),
   Text (500+ fonts & effects), Photos (2M+ royalty-free), Uploads, Draw, Backgrounds/Adjust,
   Grids & collages, Charts/tables (web), Brand Kit (Pro).
3. **AI section ("Canva AI / Magic Studio", E1)** — Magic Design (templates from prompt),
   Text-to-Image generator, Magic Write, Magic Eraser / Background Remover, Beat Sync (video),
   auto-translate; Veo 3 integration on Android (partner model — out of scope for clone).
4. **Templates & documents (E1)** — social posts, reels, posters, invitations, CV/resume,
   presentations/slides, multi-language support.
5. **Video/audio (E1)** — video editor, audio overlay, beat sync — *Android/heavy pipeline*;
   clone scope: static frame export + placeholders (declared unknown/unbuilt).
6. **Export (E1/E3)** — PNG/JPG/PDF download, watermark-free free tier; "Magic Resize" (Pro).
7. **Brand assets** — brand colors/logos stored in one place (Brand Hub).
8. **Content Planner** — post scheduling (backend product — out of scope; UI stub only).

## Clone decisions (design choices, not observations)

- Web app: Vite + React + Fabric.js canvas engine (user-selected).
- AI panel: local heuristics offline + optional BYO API key (OpenAI/Gemini) for real
  text-to-image and magic-write (user-selected).
- Fonts: curated Google Fonts set (SIL/OFL licensed).
- Photos: user uploads + remote placeholder service (external, replaceable).
- Templates: original in-repo JSON presets (no Canva design copies).
- Name/brand: distinct ("Libre Studio") — no Canva marks.

## Build status

Phase 2 complete: Vite + React + Fabric.js editor implemented and building clean.
Feature coverage is versioned in the repo README. Verified: `npm run build` passes,
dev server serves all modules (HTTP 200 across the module graph).
Known follow-ons: Android wrap via Capacitor, asset search backends, real bg-removal.

---

# Phase 3 ledger — platform hardening (Next.js + Prisma + AI providers + subscriptions)

## New evidence

| # | Evidence | Type | Confidence |
|---|----------|------|------------|
| E4 | canva.com/pro public pricing/marketing page (fetched Oct 2026) — plan tiers, Pro feature claims (premium templates, brand kit, AI credits model) | public doc | high |

REA note: for this phase the target was *feature parity + platform*, so evidence remains
public-page observation; no shipped binary decompilation applies (nothing new shipped to
reverse — the behaviors ported were already mapped in Phase 1/2).

## Ported/commercial facts derived from E4 (functional level only)

- Tiered subscription model with a generous free tier and paid tiers unlocking
  higher AI-usage caps + premium content. (Clean-room: our tiers Free/Pro($12)/Max($29)
  are our own pricing, enforced server-side by usage-count rows.)
- AI features metered per-plan rather than pay-walled outright.

## Phase 3 build decisions

- **Stack migration**: Next.js 15 App Router + TS (`app/`, `components/`, `lib/`, `data/`,
  `prisma/`), Prisma + SQLite. Legacy SPA preserved read-only in `legacy-vite/` (reference).
- **Auth**: demo email → HMAC cookie (`lib/auth.ts`) — declared demo-grade.
- **AI providers**: `lib/ai.ts` abstraction — offline heuristics (client) + OpenAI +
  NVIDIA NIM (`https://integrate.api.nvidia.com/v1`chat, `https://ai.api.nvidia.com/v1/genai/{model}` image).
  Keys: user rows (masked to clients) with env fallback.
- **Entitlements**: server-enforced monthly quotas per Usage rows (`lib/entitlements.ts`),
  plan gate at `/api/ai/*` (402 over limit).
- **Billing**: Stripe Checkout + webhook lifecycle (`lib/billing.ts`), explicit demo
  mode when keys absent (demo route blocked when Stripe configured).

## Phase 3 status

- `npm run build` passes (Next build + prisma generate); `/editor/[id]` code-split.
- Smoke-tested on dev: auth cookie flow, design create/save/load/delete, editor SSR page,
  usage quotas flip with demo plan upgrade (Free→Pro 5/60 images), keys PUT/GET masking,
  graceful provider-absence (502), Stripe-absence (503) responses.

