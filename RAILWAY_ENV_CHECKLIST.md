# Railway environment checklist — Trip Itinerary Planner

Two services on Railway: **API** (`travelitineraryplanner-production…`) and **Web**
(`web-production-9a4fd…`), plus the **Postgres** plugin. Variables go on the service
noted below. After changing Web variables you must **redeploy the Web service** — Next.js
bakes `NEXT_PUBLIC_*` values in at build time. API variables take effect on the next API
deploy/restart.

Verify variable names exactly as written; they are read literally from the code.

---

## 1. API service — makes AI, POI, and email real

| Variable | Set to | Why it matters | Priority |
|---|---|---|---|
| `NODE_ENV` | `production` | Activates the fail-closed admin lock and production behavior. | Required |
| `APP_API_KEYS` | your JSON token→role map | Unlocks the offers CMS. Without it the CMS returns 503 by design. | Required |
| `JWT_SECRET` | a long random string (`openssl rand -hex 48`) | Signs login sessions. Without it the API uses an insecure dev default. | Required |
| `DATABASE_URL` | the Postgres plugin's connection string | Persists users/offers/trips. Without it data is in-memory and resets on redeploy. | Required |
| `GEMINI_API_KEY` | your Gemini key | Real AI itineraries. Until set, `/health` shows `providers:["stub"]` and generation uses the deterministic fallback. | High |
| `XAI_API_KEY` | your Grok/xAI key | Second live AI provider for the orchestration layer. | High |
| `FOURSQUARE_API_KEY` | your Foursquare key | Live global destination autocomplete + real map-pin coordinates (else curated fallback). | High |
| `CORS_ORIGIN` | `https://web-production-9a4fd.up.railway.app` | Locks API access to your web origin. Defaults to open if unset. | Recommended |
| `APP_WEB_URL` | `https://web-production-9a4fd.up.railway.app` | Base for links in verification/reset emails. Defaults to localhost. | If using email |
| `RESEND_API_KEY` | your Resend key | Sends real verification/reset emails (else they're logged, not delivered). | If using email |
| `EMAIL_FROM` | e.g. `Trip Itinerary Planner <onboarding@resend.dev>` | From-address on those emails. | If using email |
| `REQUIRE_EMAIL_VERIFICATION` | `true` | Blocks trip planning until a user verifies their email. Only turn on once email actually sends. | Optional |
| `VIATOR_AFFILIATE_ID` | your Viator PMID | Attaches your affiliate ID to outbound offer clicks so they earn. | When Viator signup done |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | respective keys | Optional extra AI providers if you want them in the routing pool. | Optional |
| `GOOGLE_CLIENT_ID` | your Google OAuth client ID | Server-side verification of Google sign-in tokens. Must match the web value below. | If using Google SSO |
| `APPLE_CLIENT_ID` | your Apple service ID | Server-side verification of Apple sign-in tokens. | If using Apple SSO |

---

## 2. Web service — points the browser at the API and turns on the map

Set these on **Web**, then **redeploy Web** (required — they're build-time).

| Variable | Set to | Why it matters | Priority |
|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `https://travelitineraryplanner-production.up.railway.app` | The API origin the browser calls. Must be the **API** URL, not the web app's own. | Required |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | your Google Maps JS key | Renders the interactive map. Blank = no map. | High |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | same Google OAuth client ID as API | Renders the Google sign-in button (only appears when set). | If using Google SSO |
| `NEXT_PUBLIC_APPLE_CLIENT_ID` | your Apple service ID | Renders the Apple sign-in button. | If using Apple SSO |
| `NEXT_PUBLIC_APPLE_REDIRECT_URI` | `https://web-production-9a4fd.up.railway.app/login` | Where Apple returns after sign-in. | If using Apple SSO |

---

## 3. Fastest path to a fully live site

1. **API:** confirm `NODE_ENV`, `APP_API_KEYS`, `JWT_SECRET`, `DATABASE_URL` are set.
2. **API:** add `GEMINI_API_KEY`, `XAI_API_KEY`, `FOURSQUARE_API_KEY` → redeploy.
3. Check `https://travelitineraryplanner-production.up.railway.app/health` — you should
   see `gemini` and `grok` in `providers` (no longer just `stub`).
4. **Web:** confirm `NEXT_PUBLIC_API_BASE_URL` points at the API; add
   `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` → **redeploy Web**.
5. Load the site: plan a trip (real AI), type a destination (live autocomplete),
   confirm the map renders, open the Offer Directory.
6. **API:** add `CORS_ORIGIN` to lock the API to your web origin.

## 4. Security reminders

- Every value above is a secret or config — set it in Railway's Variables UI, never in git.
- If any admin key or `JWT_SECRET` has been pasted into chat, rotate it: `openssl rand -hex 48`.
- Leave `REQUIRE_EMAIL_VERIFICATION` off until `RESEND_API_KEY` is set, or new users can't get their verification email.
