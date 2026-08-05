# Product & Architecture Overview (current)

Authoritative snapshot of what's built. Supersedes the older planning docs
(`Trip_Itinerary_Planner_*` Word files), which are point-in-time records from the
initial planning phase — see "Document status" at the end.

## What the product is (post-pivot)

An **AI-driven partner travel offer finder** with an itinerary planner. The primary
job is helping travellers discover **targeted, localized partner offers** for their
trip; the day-by-day itinerary is a supporting surface that also embeds offers.
(Originally scoped as an itinerary planner with offers; pivoted to offers-first.)

Revenue model: affiliate/commission on partner offers. Offers come from a CMS-managed
catalog and, where configured, **live partner APIs**.

## The three discovery surfaces

1. **Offer finder** — destination + preferences → AI infers travel *needs*
   (accommodation, things to do, insurance, connectivity, transfers, getting around,
   comfort) → partner offers grouped by need. Runs inline on the landing page and the
   `/plan` "Find Offers" tab. Guest-accessible. Endpoint: `POST /offers/find`.
2. **Itinerary** — `/itinerary` builds a day-by-day plan (map + timeline) and embeds a
   localized partner offer per day. Endpoint: `POST /itineraries` (build),
   `GET /offers/for-trip` (localized offers = partner APIs + catalog).
3. **Directory** — `/plan` "Browse Directory": filterable catalog (category chips +
   partner-brand filter + search). Endpoint: `GET /offers/directory`.

## Access, accounts, limits

- **Guests**: directory + finder + build **1 itinerary / 24h** (per IP, ephemeral).
- **Members**: **5 itineraries / 24h**, saved to their account; view/update/delete at `/trips`.
- Configurable per account type (`account_limits`: guest/general/pro/unlimited).
- Auth: email+password, Google + Apple SSO, email verification, password reset,
  httpOnly-cookie sessions. Admin API fails closed in production (`APP_API_KEYS` + `NODE_ENV`).

## Architecture

- **Monorepo** (pnpm + Turborepo): `apps/web` (Next.js 14), `apps/mobile` (Expo RN),
  `apps/api` (Fastify), shared `packages/core|ai-orchestration|api-client|ui`.
- **Shared core** — domain types + pure logic (offer matching, needs inference,
  destination token matching, partner CSV parsing, rate-limit rules) imported by both clients.
- **AI orchestration layer** — provider-agnostic router (task → best-value model),
  adapters for Anthropic/OpenAI/Gemini/Grok, deterministic fallback so it always returns something.
- **Partner integration layer** (`apps/api/src/partners`) — adapter registry;
  env-gated adapters for Viator, GetYourGuide, G Adventures, Expedia; per-adapter
  timeout + error isolation; CMS catalog fallback. See `docs/PARTNER_API_INTEGRATION.md`.
- **Data** — PostgreSQL via a `Db` seam with in-memory fallback; offers/partners/trips/
  users/offer-events/account-limits.
- **Grounding/maps** — Google Places API (real POIs + coordinates), Google Maps (render;
  geocodes the destination so the map shows even before per-stop coordinates exist).
- **Design system** — "Vibrant Voyager": vibrant purple + Chatr-yellow (CTAs/partner
  accents), Hanken Grotesk / Inter / JetBrains Mono; tokens shared web + mobile.

## CMS

- **Offers** (`/admin`): CRUD, targeting-rule builder (destination/interests/nights/
  budget/party), draft↔live, RBAC (admin/approver/partnerships_manager/analyst).
- **Partners** (`/admin/partners`): CRUD, per-partner offer counts, stats, **CSV import**
  for bulk onboarding (matches the partner reference sheet columns).
- **Reports** (`/admin/reports`): funnel per offer — impressions, clicks, CTR,
  conversions, revenue, EPC.

## Localized offers

Offers can be **global** or **destination-scoped** (a `destination` targeting rule).
Destination matching is token-based (case-insensitive, `City, Country` aware), and
localized offers rank above global ones for the matching city. Live partner-API
results are localized by construction.

## Quality

Vitest suite across core + api (103+ tests): offer matching, needs inference,
localized ranking, rate limits (guest 1 / member 5), partner CSV parsing, partner
registry (enabled-only, fallback, failure isolation), fail-closed admin auth,
Postgres integration (PGlite). GitHub Actions CI on every push.

## Deployment

Railway: web + API + Postgres. Config in `DEPLOY_RAILWAY.md`; env in
`RAILWAY_ENV_CHECKLIST.md`.

## Document status

Current & maintained: this file, `README.md`, `RAILWAY_ENV_CHECKLIST.md`,
`docs/PARTNER_API_INTEGRATION.md`, `DEPLOY_RAILWAY.md`.

Historical (initial-planning records; not updated to the pivot):
`Trip_Itinerary_Planner_PRD.docx` (refreshed separately), `…_MVP_Build_Plan.docx`,
`…_Tech_Architecture.docx`, `…_Sprint1_Decisions.docx`, `…_POI_Data_Sourcing.docx`,
`…_Mobile_Approach.docx` (RN decision still holds), `…_MultiDestination_Design.docx`
(explicitly *considered & declined* — single-destination by choice).
