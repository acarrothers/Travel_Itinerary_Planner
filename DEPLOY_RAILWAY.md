# Deploy Trip Itinerary Planner to Railway

Hosts the **web app**, the **API**, and **Postgres** in one Railway project.
(The mobile app ships separately via Expo EAS → App Store / Play Store.)

## 0. Prerequisites
- Push this repo to GitHub.
- Create a Railway account at railway.com.

## 1. Create the project + database
1. Railway → **New Project** → **Deploy from GitHub repo** → pick this repo.
2. In the project, **+ New** → **Database** → **PostgreSQL**. Railway provisions it and
   exposes a `DATABASE_URL` variable on that service. No SQL setup needed — the app
   migrates and seeds itself on first boot.

## 2. API service
1. **+ New** → **GitHub Repo** → this repo (creates a second service). Name it `api`.
2. **Settings → Config-as-code**: set the path to `railway.api.json`.
3. Keep **Root Directory** as `/` (repo root — required for the pnpm workspace).
4. **Variables** (Settings → Variables):
   - `DATABASE_URL` = reference the DB: `${{Postgres.DATABASE_URL}}`
   - `GEMINI_API_KEY`, `XAI_API_KEY`, `FOURSQUARE_API_KEY` = your keys
   - `VIATOR_AFFILIATE_ID` = your Viator PID (optional)
   - `APP_API_KEYS` = e.g. `{"admin-key":"admin"}` (optional; omit for open dev mode)
   - `CORS_ORIGIN` = your web URL (set in step 4 after the web domain exists)
   - `PGSSL` = `true` **only** if your DB needs SSL and its URL lacks `sslmode=require`
     (leave unset for Railway's internal DATABASE_URL and for Neon URLs).
5. **Settings → Networking → Generate Domain**. Copy the API URL (e.g.
   `https://trip-itinerary-api-production.up.railway.app`).
6. Verify: open `<api-url>/health` → `{"ok":true,...,"providers":[...]}`.

## 3. Web service
1. **+ New** → **GitHub Repo** → this repo again. Name it `web`.
2. **Settings → Config-as-code**: set the path to `railway.web.json`. Root Directory `/`.
3. **Variables**:
   - `NEXT_PUBLIC_API_BASE_URL` = the API URL from step 2.5
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` = your Maps JS API key
   (These are read at **build** time, so a redeploy is needed if you change them.)
4. **Generate Domain** → this is your app URL.

## 4. Wire CORS + finish
1. On the **api** service, set `CORS_ORIGIN` to the web domain from step 3.4
   (e.g. `https://trip-itinerary-web-production.up.railway.app`) and redeploy the API.
2. Open the web URL → plan a trip. Data now persists in Postgres.

## Notes
- **Pooled DB:** the API uses a bounded `pg` pool (`PG_POOL_MAX`, default 10). If you
  later move the API to a serverless host, point `DATABASE_URL` at your provider's
  pooled endpoint (e.g. Neon's `-pooler` host).
- **Migrations** run on every deploy via the start command; they're idempotent
  (`CREATE TABLE IF NOT EXISTS` + guarded seed).
- **Alternative:** the repo also has `docker-compose.yml` + `apps/api/Dockerfile` if you
  prefer a container host (Render/Fly.io) — the Dockerfile builds from the repo root.
