import "./env.js";
import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import { itineraryRoutes } from "./routes/itineraries.js";
import { offerRoutes } from "./routes/offers.js";
import { adminRoutes } from "./routes/admin.js";
import { authRoutes } from "./routes/auth.js";
import { destinationRoutes } from "./routes/destinations.js";
import { getOfferRepository, seedIfEmpty } from "./repositories/offerRepository.js";
import { getUserRepository, seedAccountLimits } from "./repositories/userRepository.js";
import { availableProviders } from "./aiSetup.js";

const app = Fastify({ logger: true });
// Allow the web client origin(s); default open for local/demo. Set CORS_ORIGIN to lock down.
await app.register(cookie);
// Credentials enabled so the browser sends the httpOnly session cookie cross-origin.
await app.register(cors, { origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true, credentials: true });
// Abuse protection: global cap; auth routes set tighter per-route limits.
await app.register(rateLimit, { max: 200, timeWindow: "1 minute" });
app.get("/health", async () => ({ ok: true, service: "trip-itinerary-api", providers: availableProviders() }));
app.register(itineraryRoutes);
app.register(offerRoutes);
app.register(adminRoutes);
app.register(authRoutes);
app.register(destinationRoutes);

// Fail-closed check: in production an unset APP_API_KEYS locks the offers CMS.
// Warn loudly at boot so the cause is obvious in the deploy logs.
if (process.env.NODE_ENV === "production" && !process.env.APP_API_KEYS) {
  app.log.error("[admin] APP_API_KEYS not set — the offers CMS is LOCKED (503). Set it to enable admin access.");
}

try {
  await seedIfEmpty(getOfferRepository()); // ensure at least the default offer exists
  await seedAccountLimits(getUserRepository()); // ensure configurable rate limits exist (general=1/24h)
} catch (e) {
  app.log.warn(`seed skipped: ${(e as Error).message}`);
}

const port = Number(process.env.PORT ?? 4000);
app.listen({ port, host: "0.0.0.0" }).catch((e) => { app.log.error(e); process.exit(1); });
