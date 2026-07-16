import type { FastifyInstance } from "fastify";
import { reorderItem, dailyLimitFor, evaluateRateLimit, type TripPreferences, type ReorderInput } from "@trip-itinerary/core";
import { generateItinerary, editItinerary } from "../services/itineraryService.js";
import { getTripRepository } from "../repositories/tripRepository.js";
import { getUserRepository } from "../repositories/userRepository.js";
import { requireUser, userOf } from "../userAuth.js";

const repo = getTripRepository();
const users = getUserRepository();
const dayAgo = () => new Date(Date.now() - 24 * 3600 * 1000).toISOString();

export async function itineraryRoutes(app: FastifyInstance) {
  // Create — auth required; enforces the per-account-type daily limit.
  app.post("/itineraries", { preHandler: requireUser() }, async (req, reply) => {
    const user = userOf(req);
    const limit = dailyLimitFor(user.accountType, await users.getAccountLimits());
    const used = await repo.countTripsSince(user.id, dayAgo());
    const rate = evaluateRateLimit(used, limit);
    if (!rate.allowed) {
      return reply.code(429).send({ error: "daily trip limit reached", ...rate, message: `Your ${user.accountType} account allows ${limit} trip(s) per 24 hours.` });
    }
    const trip = await generateItinerary(req.body as TripPreferences);
    trip.userId = user.id;
    await repo.save(trip);
    return { ...trip, _rate: evaluateRateLimit(used + 1, limit) };
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
