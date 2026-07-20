import type { FastifyInstance } from "fastify";
import { suggestDestinations } from "../services/destinationSuggest.js";
import { requireUser } from "../userAuth.js";

export async function destinationRoutes(app: FastifyInstance) {
  // Typeahead for the trip-destination field (auth required; the planner is gated).
  app.get("/destinations/suggest", { preHandler: requireUser() }, async (req) => {
    const { q } = req.query as { q?: string };
    return suggestDestinations(q ?? "");
  });
}
