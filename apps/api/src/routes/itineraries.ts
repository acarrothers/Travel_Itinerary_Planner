import type { FastifyInstance } from "fastify";
import { reorderItem, type TripPreferences, type ReorderInput } from "@chatr/core";
import { generateItinerary, editItinerary } from "../services/itineraryService.js";
import { getTripRepository } from "../repositories/tripRepository.js";

const repo = getTripRepository();

export async function itineraryRoutes(app: FastifyInstance) {
  app.post("/itineraries", async (req) => repo.save(await generateItinerary(req.body as TripPreferences)));

  app.get("/itineraries/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    return (await repo.get(id)) ?? reply.code(404).send({ error: "not found" });
  });

  // Natural-language edit (PRD §6.3 / §6.9).
  app.post("/itineraries/:id/edit", async (req, reply) => {
    const { id } = req.params as { id: string };
    const { instruction } = (req.body ?? {}) as { instruction?: string };
    const trip = await repo.get(id);
    if (!trip) return reply.code(404).send({ error: "not found" });
    if (!instruction) return reply.code(400).send({ error: "instruction required" });
    return repo.save(await editItinerary(trip, instruction));
  });

  // Drag-to-reorder (PRD §6.3).
  app.post("/itineraries/:id/reorder", async (req, reply) => {
    const { id } = req.params as { id: string };
    const trip = await repo.get(id);
    if (!trip) return reply.code(404).send({ error: "not found" });
    return repo.save(reorderItem(trip, req.body as ReorderInput));
  });
}
