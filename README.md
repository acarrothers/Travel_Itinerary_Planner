# Trip Experience Planner — Monorepo

An **AI-driven travel offer finder** with an itinerary planner. A traveller enters a
destination and trip preferences; the app infers what they'll need and surfaces
**targeted partner offers**, and can build a **detailed day-by-day itinerary** with
offers embedded. Offer discovery is the primary flow; itinerary planning is secondary.

Shared **web + native mobile + API** codebase.

## Stack
- **Web:** Next.js 14 App Router (`apps/web`)
- **Mobile:** React Native via **Expo** (`apps/mobile`) — shares core/UI/client with web
- **API:** Fastify + TypeScript (`apps/api`)
- **AI:** provider-agnostic **model orchestration layer** (`packages/ai-orchestration`) — Anthropic, OpenAI, Gemini, Grok
- **Partner APIs:** provider-agnostic **partner-integration layer** (`apps/api/src/partners`) — Viator, GetYourGuide, G Adventures, Expedia; catalog fallback
- **POI grounding:** Foursquare Places · **Maps:** Google Maps Platform
- **DB:** PostgreSQL (`pg`) with an in-memory fallback
- **Design system:** "Vibrant Voyager" (purple + Chatr-yellow) tokens in `packages/ui`
- **Monorepo:** pnpm workspaces + Turborepo · **Tests:** Vitest · **CI:** GitHub Actions

## Layout
```
apps/
  web/     Next.js web client (landing, itinerary, offer finder, directory, CMS)
  mobile/  Expo React Native app (iOS + Android)
  api/     Fastify API: itinerary generation, offer finder + matching, partner APIs,
           auth/SSO, CMS/RBAC, click tracking
    src/partners/  partner-API integration layer (adapters + registry)
packages/
  core/             Domain model + pure logic: Trip/Offer/Partner types, offer matching,
                    needs inference, destination matching, CSV parsing, rate-limit rules
  ai-orchestration/ Model router + provider adapters (task -> best-value model)
  api-client/       One fetch client shared by web + mobile
  ui/               Vibrant Voyager design tokens (web + native)
```

## Core loop
1. **Find offers** — destination + prefs → AI infers travel *needs* → partner offers grouped by need (`/offers/find`). Runs on the landing page and the `/plan` finder tab; no login required.
2. **Plan itinerary** — `/itinerary` builds a day-by-day plan (map + timeline) with a localized partner offer embedded per day (`/offers/for-trip`, partner APIs + catalog).
3. **Browse directory** — `/plan` "Browse Directory": filterable catalog of all live offers.

## Access & rate limits
- **Guests** (no account): browse the directory, run the finder, and build **1 itinerary / 24h** (per IP). Itineraries are ephemeral.
- **Members**: **5 itineraries / 24h**, saved to their account (view/update/delete under `/trips`). Limits are configurable per account type (`guest`, `general`, `pro`, `unlimited`).
- Auth: email/password + Google/Apple SSO, email verification, password reset; httpOnly-cookie sessions.

## Key web routes
| Route | What |
|---|---|
| `/` | Landing: rotating destination hero, smart-search → offers inline / plan itinerary |
| `/itinerary` | Detailed itinerary (map + timeline + embedded partner offers); `?id=` opens a saved trip |
| `/plan` | Tabs: Find Offers · Browse Directory · Trip Planner |
| `/trips` | Members' saved itineraries (view / delete) |
| `/login` | Email + Google/Apple sign-in |
| `/admin`, `/admin/partners`, `/admin/reports` | Offers CMS · Partner management · Performance dashboard |

## Getting started
```bash
pnpm install
cp .env.example .env        # add keys (see below); all optional for local dev
pnpm dev                    # web + mobile + api via Turborepo
# or: pnpm --filter @trip-itinerary/api dev   (etc.)
```
With no keys the API runs on in-memory repositories and a deterministic itinerary
generator, so the app is fully usable locally without external services.

## Environment (see RAILWAY_ENV_CHECKLIST.md for the full list)
- **AI:** `GEMINI_API_KEY`, `XAI_API_KEY` (also `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`) — richer itineraries
- **Grounding/maps:** `FOURSQUARE_API_KEY` (real places + map pins), `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (web, build-time)
- **DB:** `DATABASE_URL` (Postgres; omit for in-memory)
- **Auth:** `JWT_SECRET`, `GOOGLE_CLIENT_ID`/`NEXT_PUBLIC_GOOGLE_CLIENT_ID`, Apple client IDs, `RESEND_API_KEY`/`APP_WEB_URL` (emails)
- **CMS/RBAC:** `APP_API_KEYS` (JSON key→role; **required in production** or the CMS is locked) + `NODE_ENV=production`
- **Partner APIs:** `VIATOR_API_KEY`, `GETYOURGUIDE_API_KEY`, `GADVENTURES_API_KEY`, `EXPEDIA_API_KEY` — see `docs/PARTNER_API_INTEGRATION.md`

`GET /health` reports which AI providers and partner APIs are live.

## CMS & RBAC
- `/admin` (offers), `/admin/partners` (partners + CSV import), `/admin/reports` (funnel: impressions, clicks, CTR, conversions, revenue, EPC).
- `APP_API_KEYS` maps an API key → role: **admin** (all) · **approver** (write+publish+delete) · **partnerships_manager** (write) · **analyst** (read).
- **Fails closed:** in production with `APP_API_KEYS` unset, the admin API returns 503 (locked) rather than granting access. Locally (non-production) it runs in dev mode with full access.

## Postgres & one-command stack (Docker)
```bash
pnpm db:up && pnpm db:migrate && pnpm dev    # Postgres + apps
pnpm stack:up                                # build + run Postgres AND API (auto-migrate/seed)
```
Without `DATABASE_URL` the API falls back to in-memory repositories.

## Testing
```bash
pnpm test        # Vitest across core + api (103+ tests)
```

## Deploy
Railway (web + API + Postgres). See `DEPLOY_RAILWAY.md` and `RAILWAY_ENV_CHECKLIST.md`.
