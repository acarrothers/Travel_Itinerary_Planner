import type { FastifyInstance } from "fastify";
import { dailyLimitFor, evaluateRateLimit } from "@trip-itinerary/core";
import { getUserRepository, type StoredUser } from "../repositories/userRepository.js";
import { getTripRepository } from "../repositories/tripRepository.js";
import { hashPassword, verifyPassword, signToken, requireUser, userOf, isValidEmail } from "../userAuth.js";

const users = getUserRepository();
const trips = getTripRepository();
const uid = () => Math.random().toString(36).slice(2, 14);
const dayAgo = () => new Date(Date.now() - 24 * 3600 * 1000).toISOString();

async function rateStatus(userId: string, accountType: string) {
  const limit = dailyLimitFor(accountType, await users.getAccountLimits());
  const used = await trips.countTripsSince(userId, dayAgo());
  return evaluateRateLimit(used, limit);
}

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (req, reply) => {
    const { email, password } = (req.body ?? {}) as { email?: string; password?: string };
    if (!email || !isValidEmail(email)) return reply.code(400).send({ error: "valid email required" });
    if (!password || password.length < 8) return reply.code(400).send({ error: "password must be at least 8 characters" });
    if (await users.getByEmail(email)) return reply.code(409).send({ error: "email already registered" });
    const stored: StoredUser = { id: uid(), email, accountType: "general", createdAt: new Date().toISOString(), passwordHash: await hashPassword(password) };
    const user = await users.createUser(stored);
    return { token: signToken({ id: user.id, email: user.email, accountType: user.accountType }), user };
  });

  app.post("/auth/login", async (req, reply) => {
    const { email, password } = (req.body ?? {}) as { email?: string; password?: string };
    const stored = email ? await users.getByEmail(email) : undefined;
    if (!stored || !(await verifyPassword(password ?? "", stored.passwordHash))) {
      return reply.code(401).send({ error: "invalid email or password" });
    }
    const user = { id: stored.id, email: stored.email, accountType: stored.accountType };
    return { token: signToken(user), user: { ...user, createdAt: stored.createdAt } };
  });

  app.get("/auth/me", { preHandler: requireUser() }, async (req) => {
    const u = userOf(req);
    return { user: u, rate: await rateStatus(u.id, u.accountType) };
  });
}
