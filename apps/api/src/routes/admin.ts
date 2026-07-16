import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { Offer, Partner } from "@trip-itinerary/core";
import { getOfferRepository } from "../repositories/offerRepository.js";
import { getOfferEventRepository } from "../repositories/offerEventRepository.js";
import type { OfferEvent } from "@trip-itinerary/core";
import { can, roleForToken, type Action, type Role } from "../auth.js";

declare const process: { env: Record<string, string | undefined> };
const offers = getOfferRepository();
const events = getOfferEventRepository();
const rid = () => Math.random().toString(36).slice(2, 12);

// Resolve the caller's role. If no APP_API_KEYS are configured we run in dev mode
// (treated as admin) so local development works; once keys are set, RBAC is enforced.
function resolveRole(req: FastifyRequest): Role | "dev" | null {
  const keys = process.env.APP_API_KEYS;
  if (!keys) return "dev";
  const token = (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
  return roleForToken(token, keys);
}

function authHook(action: Action) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const role = resolveRole(req);
    if (role === null) return reply.code(401).send({ error: "unauthorized" });
    (req as any).appRole = role;
    if (role === "dev") return; // dev bypass
    if (!can(role, action)) return reply.code(403).send({ error: "forbidden", role, action });
  };
}

const roleOf = (req: FastifyRequest) => (req as any).appRole as Role | "dev";

export async function adminRoutes(app: FastifyInstance) {
  app.get("/admin/offers", { preHandler: authHook("read") }, async () => offers.listOffers());

  app.post("/admin/offers", { preHandler: authHook("write") }, async (req, reply) => {
    const offer = req.body as Offer;
    // Publishing (status=live) requires the publish permission specifically (PRD §9.1).
    const role = roleOf(req);
    if (offer.status === "live" && role !== "dev" && !can(role, "publish")) {
      return reply.code(403).send({ error: "publish requires approver/admin" });
    }
    return offers.saveOffer(offer);
  });

  app.delete("/admin/offers/:id", { preHandler: authHook("delete") }, async (req) => {
    const { id } = req.params as { id: string };
    await offers.deleteOffer(id);
    return { ok: true };
  });

  app.get("/admin/partners", { preHandler: authHook("read") }, async () => offers.listPartners());
  app.post("/admin/partners", { preHandler: authHook("manage_partners") }, async (req) => offers.savePartner(req.body as Partner));

  // Dev convenience: generate sample funnel events so the dashboard is demoable.
  app.post("/admin/dev/seed-events", { preHandler: authHook("write") }, async () => {
    const live = await offers.listLiveOffers();
    let n = 0;
    for (const o of live) {
      const impressions = 8 + Math.floor(Math.random() * 12);
      const clicks = Math.floor(impressions * (0.15 + Math.random() * 0.2));
      const conversions = Math.floor(clicks * (0.1 + Math.random() * 0.25));
      const now = () => new Date().toISOString();
      const mk = (type: OfferEvent["type"], commissionUsd?: number): OfferEvent =>
        ({ id: rid(), offerId: o.id, partnerId: o.partnerId, type, commissionUsd, timestamp: now() });
      for (let i = 0; i < impressions; i++) { await events.log(mk("impression")); n++; }
      for (let i = 0; i < clicks; i++) { await events.log(mk("click")); n++; }
      for (let i = 0; i < conversions; i++) { await events.log(mk("conversion", 12 + Math.round(Math.random() * 40))); n++; }
    }
    return { seeded: n };
  });

  // Lets the UI show what the current key can do.
  app.get("/admin/me", { preHandler: authHook("read") }, async (req) => {
    const role = roleOf(req);
    return { role, can: { read: true, write: role === "dev" || can(role as Role, "write"), publish: role === "dev" || can(role as Role, "publish"), delete: role === "dev" || can(role as Role, "delete") } };
  });
}
