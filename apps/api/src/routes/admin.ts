import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { Offer, Partner } from "@trip-itinerary/core";
import { getOfferRepository } from "../repositories/offerRepository.js";
import { getOfferEventRepository } from "../repositories/offerEventRepository.js";
import type { OfferEvent } from "@trip-itinerary/core";
import { can, resolveAdminAuth, type Action, type Role } from "../auth.js";

declare const process: { env: Record<string, string | undefined> };
const offers = getOfferRepository();
const events = getOfferEventRepository();
const rid = () => Math.random().toString(36).slice(2, 12);

// Resolve the caller's role. Outside production a missing APP_API_KEYS yields the
// "dev" role so local development works. In production the same omission LOCKS the
// CMS (503) instead of granting access — the bypass must never reach the internet.
function resolveRole(req: FastifyRequest) {
  return resolveAdminAuth({
    token: (req.headers.authorization ?? "").replace(/^Bearer\s+/i, ""),
    keysJson: process.env.APP_API_KEYS,
    isProduction: process.env.NODE_ENV === "production",
  });
}

function authHook(action: Action) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const auth = resolveRole(req);
    if (!auth.ok) {
      if (auth.reason === "not_configured") {
        req.log.error("Admin CMS locked: APP_API_KEYS is not set in production.");
        return reply.code(503).send({
          error: "admin_not_configured",
          message: "Offer management is disabled until APP_API_KEYS is configured.",
        });
      }
      return reply.code(401).send({ error: "unauthorized" });
    }
    (req as any).appRole = auth.role;
    if (auth.role === "dev") return; // local-only bypass
    if (!can(auth.role, action)) return reply.code(403).send({ error: "forbidden", role: auth.role, action });
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

  // Partner dashboard summary: partners enriched with offer counts + top-line stats.
  app.get("/admin/partners/summary", { preHandler: authHook("read") }, async () => {
    const [partners, all] = await Promise.all([offers.listPartners(), offers.listOffers()]);
    const rows = partners.map((p) => {
      const own = all.filter((o) => o.partnerId === p.id);
      return {
        ...p,
        totalOffers: own.length,
        activeOffers: own.filter((o) => o.status === "live").length,
      };
    });
    const stats = {
      totalPartners: partners.length,
      activeOffers: all.filter((o) => o.status === "live").length,
      pendingApprovals: all.filter((o) => o.status === "pending").length,
    };
    return { partners: rows, stats };
  });

  // Delete a partner — blocked while it still has offers, to avoid orphaning them.
  app.delete("/admin/partners/:id", { preHandler: authHook("manage_partners") }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const own = (await offers.listOffers()).filter((o) => o.partnerId === id);
    if (own.length > 0) {
      return reply.code(409).send({ error: "partner_has_offers", message: `Remove or reassign this partner's ${own.length} offer(s) first.` });
    }
    await offers.deletePartner(id);
    return { ok: true };
  });

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
