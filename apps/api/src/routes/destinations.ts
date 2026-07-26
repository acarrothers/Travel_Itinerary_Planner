import type { FastifyInstance } from "fastify";
import { suggestDestinations } from "../services/destinationSuggest.js";

export async function destinationRoutes(app: FastifyInstance) {
  // Typeahead for the trip-destination field. Public: guests plan on the landing
  // page too, so the suggestions must be reachable without auth.
  app.get("/destinations/suggest", async (req) => {
    const { q } = req.query as { q?: string };
    return suggestDestinations(q ?? "");
  });
}
