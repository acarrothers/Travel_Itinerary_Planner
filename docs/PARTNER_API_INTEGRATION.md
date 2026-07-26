# Partner API Integration — setup & verification

How to turn on live partner content in the itinerary. Each partner brand that
exposes an API has an **adapter** in `apps/api/src/partners/adapters.ts`. An
adapter runs **only when its API key is set**; otherwise it's skipped and the
itinerary falls back to the CMS catalog. Nothing breaks when a key is missing.

## How the layer works

- `partners/types.ts` — the `PartnerAdapter` interface + `toPartnerOffer()` (maps a
  partner result into a localized, destination-scoped `Offer`).
- `partners/adapters.ts` — one adapter per partner. Each is env-gated (`enabled()`)
  and guarded (any error or a 3.5s timeout ⇒ it contributes nothing).
- `partners/registry.ts` — runs every enabled adapter in parallel and flattens results.
- `GET /offers/for-trip?tripId=` — merges live partner offers with catalog matches,
  ranks them together (localized-first), and the itinerary page embeds one per day.
- `GET /health` — the `partnerApis` array lists which integrations are currently live.

To verify an integration end to end: set the key on the **API** service, redeploy,
hit `/health` and confirm the partner id appears in `partnerApis`, then open an
itinerary for a destination that partner covers.

## Quick checklist per partner

1. Get API credentials from the partner's developer portal (links below).
2. Set the env var on the **Railway API service** (not the web service).
3. Ensure a matching **Partner** row exists in the CMS with the same `partnerId`
   (`viator`, `getyourguide`, `gadventures`, `expedia`) so names/branding resolve.
4. Redeploy the API; confirm `/health` → `partnerApis` includes the partner.
5. **Verify the field mapping** against a real response (see each table below) —
   the endpoints/shapes are coded to each partner's public docs but must be
   confirmed with live credentials, as contracts differ and evolve.
6. Replace the fallback `destinationUrl` with your **affiliate deep link** so
   clicks earn commission (click tracking already works via `/offers/:id/click`).

## Environment variables

| Partner | Env var (API service) | Category |
|---|---|---|
| Viator | `VIATOR_API_KEY` | tours |
| GetYourGuide | `GETYOURGUIDE_API_KEY` | tours |
| G Adventures | `GADVENTURES_API_KEY` | tours |
| Expedia | `EXPEDIA_API_KEY` | accommodation |

## Where to get each key

- **Viator** — Viator Partner Programme / affiliate API; request API access from the
  Viator Partner dashboard. Header used: `exp-api-key`; `Accept: application/json;version=2.0`.
- **GetYourGuide** — GetYourGuide Partner API (partner portal); issues an access
  token. Header used: `X-ACCESS-TOKEN`.
- **G Adventures** — developers.gadventures.com; create an Application Key. Header
  used: `X-Application-Key`.
- **Expedia** — Expedia Group / Expedia Partner Solutions **Rapid** API
  (developers.expediagroup.com). Note: Rapid needs a **signed** request (API key +
  shared secret → SHA-512 signature) and region resolution; the adapter is stubbed
  at the request-signing step and must be completed with your credentials.

## Field mapping to confirm

Each row is what the adapter currently reads. Confirm the live response uses these
paths; adjust the mapping in `apps/api/src/partners/adapters.ts` if not.

### Viator — `POST https://api.viator.com/partner/products/search`
Request: `{ filtering: { destination }, sorting: { sort: "TRAVELER_RATING" }, pagination: { start: 1, count: 4 } }`

| Offer field | Read from |
|---|---|
| id | `product.productCode` |
| title | `product.title` |
| body | `product.description` |
| destinationUrl | `product.productUrl` |
| (array path) | `data.products[]` |

Note: `destination` should be a Viator destination ID; you may need a first call to
Viator's destinations lookup to resolve the city name → ID.

### GetYourGuide — `GET https://api.getyourguide.com/1/tours?q={destination}&limit=4`

| Offer field | Read from |
|---|---|
| id | `tour.tour_id` |
| title | `tour.title` |
| body | `tour.abstract` |
| destinationUrl | `tour.url` |
| (array path) | `data.data.tours[]` |

### G Adventures — `GET https://rest.gadventures.com/tours?name={destination}&limit=4`

| Offer field | Read from |
|---|---|
| id | `tour.id` |
| title | `tour.name` |
| body | `tour.description` |
| destinationUrl | `tour.href` |
| (array path) | `data.results[]` |

### Expedia (Rapid) — `GET https://api.ean.com/v3/properties/search?destination={destination}&limit=4`

| Offer field | Read from |
|---|---|
| id | `property.propertyId` |
| title | `property.name` |
| destinationUrl | `property.deepLink` |
| (array path) | `data.properties[]` |

Rapid's real flow is more involved (auth signature, region ID resolution, price
check). Treat this adapter as a scaffold: wire the signature + region lookup, then
confirm the mapping.

## Notes

- **Localization:** partner offers are tagged with a `destination` targeting rule
  built from the trip's city, so they rank localized-first and show the "Local"
  treatment automatically.
- **Cost/rate limits:** adapters run on itinerary view. If a partner has tight rate
  limits, add caching (by destination) in the registry before scaling traffic.
- **Failure is safe:** a missing key, error, or timeout on any partner just means
  that partner contributes nothing that request — the catalog still fills the itinerary.
