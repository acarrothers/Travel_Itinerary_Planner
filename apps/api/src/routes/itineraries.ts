import type { FastifyInstance } from "fastify";
import { reorderItem, dailyLimitFor, evaluateRateLimit, type TripPreferences, type ReorderInput } from "@trip-itinerary/core";
import { generateItinerary, editItinerary } from "../services/itineraryService.js";
import { getTripRepository } from "../repositories/tripRepository.js";
import { getUserRepository } from "../repositories/userRepository.js";
import { requireUser, optionalUser, userOf, maybeUserOf, clientIp } from "../userAuth.js";

declare const process: { env: Record<string, string | undefined> };
const repo = getTripRepository();
const users = getUserRepository();
const dayAgo = () => new Date(Date.now() - 24 * 3600 * 1000).toISOString();

export async function itineraryRoutes(app: FastifyInstance) {
  // Generate an itinerary. Guests may generate too (their trips are ephemeral —
  // stored only under a guest:<ip> key for rate counting, not linked to an account).
  // Both guests and members get 5 per 24h; members' trips are saved to their account.
  app.post("/itineraries", { preHandler: optionalUser() }, async (req, reply) => {
    const user = maybeUserOf(req);
    const limits = await users.getAccountLimits();

    if (user && process.env.REQUIRE_EMAIL_VERIFICATION === "true") {
      const stored = await users.getById(user.id);
      if (stored && !stored.emailVerified) return reply.code(403).send({ error: "please verify your email to plan trips" });
    }

    // Rate-limit key + limit: member account vs anonymous IP. Guests use the
    // configurable "general" limit so one knob controls the baseline.
    const key = user ? user.id : `guest:${clientIp(req)}`;
    const limit = user ? dailyLimitFor(user.accountType, limits) : dailyLimitFor("general", limits);
    const used = await repo.countTripsSince(key, dayAgo());
    const rate = evaluateRateLimit(used, limit);
    if (!rate.allowed) {
      const who = user ? `Your ${user.accountType} account allows` : "Guests can create";
      return reply.code(429).send({ error: "daily trip limit reached", ...rate, message: `${who} ${limit} itineraries per 24 hours.${user ? "" : " Log in for your own allowance."}` });
    }

    const trip = await generateItinerary(req.body as TripPreferences);
    trip.userId = key; // real user id, or guest:<ip>
    await repo.save(trip);
    return { ...trip, _rate: evaluateRateLimit(used + 1, limit), _guest: !user };
  });

  app.get("/itineraries/:id", { preHandler: requireUser() }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const trip = await repo.get(id);
    if (!trip) return reply.code(404).send({ error: "not found" });
    if (trip.userId !== userOf(req).id) return reply.code(403).send({ error: "forbidden" });
    return trip;
  });

  app.post("/itineraries/:id/edit", { preHandler: requireUser() }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { instruction } = (req.body ?? {}) as { instruction?: string };
    const trip = await repo.get(id);
    if (!trip) return reply.code(404).send({ error: "not found" });
    if (trip.userId !== userOf(req).id) return reply.code(403).send({ error: "forbidden" });
    if (!instruction) return reply.code(400).send({ error: "instruction required" });
    return repo.save(await editItinerary(trip, instruction));
  });

  app.post("/itineraries/:id/reorder", { preHandler: requireUser() }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const trip = await repo.get(id);
    if (!trip) return reply.code(404).send({ error: "not found" });
    if (trip.userId !== userOf(req).id) return reply.code(403).send({ error: "forbidden" });
    return repo.save(reorderItem(trip, req.body as ReorderInput));
  });
}
