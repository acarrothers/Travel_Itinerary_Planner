import "./env.js";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { itineraryRoutes } from "./routes/itineraries.js";
import { offerRoutes } from "./routes/offers.js";
import { adminRoutes } from "./routes/admin.js";
import { getOfferRepository, seedIfEmpty } from "./repositories/offerRepository.js";
import { availableProviders } from "./aiSetup.js";

const app = Fastify({ logger: true });
// Allow the web client origin(s); default open for local/demo. Set CORS_ORIGIN to lock down.
await app.register(cors, { origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true });
app.get("/health", async () => ({ ok: true, service: "trip-itinerary-api", providers: availableProviders() }));
app.register(itineraryRoutes);
app.register(offerRoutes);
app.register(adminRoutes);

try {
  await seedIfEmpty(getOfferRepository()); // ensure at least the default offer exists
} catch (e) {
  app.log.warn(`seed skipped: ${(e as Error).message}`);
}

const port = Number(process.env.PORT ?? 4000);
app.listen({ port, host: "0.0.0.0" }).catch((e) => { app.log.error(e); process.exit(1); });
