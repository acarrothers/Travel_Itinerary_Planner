# Chatr Trip Planner — Monorepo

Shared **web + native mobile + API** codebase for Chatr Trip Planner, reflecting the
decisions in the PRD, MVP Build Plan, and Technical Architecture Outline.

## Decided stack
- **Web:** Next.js (`apps/web`)
- **Mobile:** React Native via **Expo** (`apps/mobile`) — built in parallel with web
- **API:** Fastify + TypeScript (`apps/api`)
- **AI:** provider-agnostic **model orchestration layer** (`packages/ai-orchestration`)
- **Maps:** Google Maps Platform (render) · **POI:** hand-curated seed cities, Foursquare at scale
- **Anchor affiliate:** **Viator** (tours & activities)
- **Monorepo:** pnpm workspaces + Turborepo

## Layout
```
apps/
  web/     Next.js web client
  mobile/  Expo React Native app (iOS + Android)
  api/     Fastify API: itinerary generation, offer matching, click tracking
packages/
  core/             Domain model (Trip/Day/Item/Offer), signals, offer matching
  ai-orchestration/ Model router + provider adapters (task -> best-value model)
  api-client/       One fetch client shared by web + mobile
  ui/               Design tokens shared across web + native
  config/           Shared tsconfig
```

## The shared core (why this works)
`packages/core`, `packages/api-client`, and `packages/ui` are imported by **both**
`apps/web` and `apps/mobile`. Business logic, the API client, and design tokens are
written once; each platform renders them natively. This is the payoff of the React
Native decision.

## Getting started
```bash
pnpm install
cp .env.example .env        # add API keys (Anthropic/OpenAI, Google Maps, Viator)
pnpm dev                    # runs web, mobile, and api via Turborepo
# or individually:
pnpm --filter @chatr/api dev
pnpm --filter @chatr/web dev
pnpm --filter @chatr/mobile dev
```

## Sprint 1 wiring TODOs
- Onboarding form (web + mobile) -> `api.createItinerary(prefs)`
- POI grounding + schema validation in `itineraryService` (replace stub)
- Swap AI stub providers for real Anthropic/OpenAI SDKs
- Postgres repository (replace in-memory maps)
- Wire the Viator offer card + click tracking to a real affiliate ID

## Run with a real Postgres (Docker)
```bash
cp .env.example .env       # DATABASE_URL points at the docker DB by default
pnpm db:up                 # start Postgres (waits until healthy)
pnpm db:migrate            # apply schema + seed the offer catalog
pnpm dev                   # web + mobile + api against Postgres
# or all at once:
pnpm dev:full
```
Without `DATABASE_URL`, the API transparently falls back to in-memory repositories.

## CMS admin & RBAC
- Admin UI: `apps/web` → `/admin` (manage partners, offers, and targeting rules).
- Roles (`CHATR_API_KEYS` maps API key → role):
  - **admin** — everything
  - **approver** — read/write + publish (set status=live) + delete
  - **partnerships_manager** — read/write (cannot publish or delete)
  - **analyst** — read-only
- Leave `CHATR_API_KEYS` unset for **dev mode** (full access). Once set, the admin
  API enforces RBAC; pass the key in the admin UI's "API key" field.

## One-command stack (Docker)
```bash
pnpm stack:up      # builds + runs Postgres AND the API (migrates + seeds automatically)
# API on http://localhost:4000 ; then run the web client:
pnpm --filter @chatr/web dev
```
`pnpm stack:down` stops everything.

## Offer performance dashboard
`apps/web` → `/admin/reports`: live funnel per offer (impressions, clicks, CTR,
conversions, revenue, EPC) from `/offers/report`. Click **Seed demo events** to
populate sample activity for a quick demo.
