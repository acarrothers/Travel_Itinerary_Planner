import type { FastifyInstance } from "fastify";
import { randomBytes } from "node:crypto";
import { dailyLimitFor, evaluateRateLimit } from "@trip-itinerary/core";
import { getUserRepository, type StoredUser } from "../repositories/userRepository.js";
import { getTripRepository } from "../repositories/tripRepository.js";
import { getAuthTokenRepository } from "../repositories/authTokenRepository.js";
import { hashPassword, verifyPassword, signToken, requireUser, userOf, isValidEmail, setAuthCookie, clearAuthCookie } from "../userAuth.js";
import { verifyProviderToken, type SsoProvider } from "../oauth.js";
import { sendEmail } from "../emailSender.js";

declare const process: { env: Record<string, string | undefined> };
const users = getUserRepository();
const trips = getTripRepository();
const authTokens = getAuthTokenRepository();
const uid = () => Math.random().toString(36).slice(2, 14);
const genToken = () => randomBytes(24).toString("hex");
const dayAgo = () => new Date(Date.now() - 24 * 3600 * 1000).toISOString();
const webUrl = () => process.env.APP_WEB_URL ?? "http://localhost:3000";

// Tighter rate limit for auth endpoints (brute-force / abuse protection).
const authLimit = { config: { rateLimit: { max: 15, timeWindow: "1 minute" } } };

async function rateStatus(userId: string, accountType: string) {
  const limit = dailyLimitFor(accountType, await users.getAccountLimits());
  return evaluateRateLimit(await trips.countTripsSince(userId, dayAgo()), limit);
}
async function sendVerification(userId: string, email: string) {
  const token = genToken();
  await authTokens.create({ token, userId, type: "verify", expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString() });
  await sendEmail(email, "Verify your email", `Confirm your email for Trip Itinerary Planner:\n${webUrl()}/verify?token=${token}\n\nThis link expires in 24 hours.`);
}

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/register", authLimit, async (req, reply) => {
    const { email, password } = (req.body ?? {}) as { email?: string; password?: string };
    if (!email || !isValidEmail(email)) return reply.code(400).send({ error: "valid email required" });
    if (!password || password.length < 8) return reply.code(400).send({ error: "password must be at least 8 characters" });
    if (await users.getByEmail(email)) return reply.code(409).send({ error: "email already registered" });
    const stored: StoredUser = { id: uid(), email, accountType: "general", createdAt: new Date().toISOString(), passwordHash: await hashPassword(password), provider: "password", emailVerified: false };
    const user = await users.createUser(stored);
    await sendVerification(user.id, user.email);
    const token = signToken({ id: user.id, email: user.email, accountType: user.accountType });
    setAuthCookie(reply, token);
    return { token, user: { ...user, emailVerified: false } };
  });

  app.post("/auth/login", authLimit, async (req, reply) => {
    const { email, password } = (req.body ?? {}) as { email?: string; password?: string };
    const stored = email ? await users.getByEmail(email) : undefined;
    if (!stored || !stored.passwordHash || !(await verifyPassword(password ?? "", stored.passwordHash))) {
      return reply.code(401).send({ error: "invalid email or password" });
    }
    const user = { id: stored.id, email: stored.email, accountType: stored.accountType };
    const token = signToken(user);
    setAuthCookie(reply, token);
    return { token, user: { ...user, createdAt: stored.createdAt, emailVerified: stored.emailVerified } };
  });

  app.post("/auth/oauth", authLimit, async (req, reply) => {
    const { provider, idToken } = (req.body ?? {}) as { provider?: SsoProvider; idToken?: string };
    if (!provider || !idToken) return reply.code(400).send({ error: "provider and idToken required" });
    let info;
    try { info = await verifyProviderToken(provider, idToken); }
    catch (e) { return reply.code(401).send({ error: `invalid ${provider} sign-in`, detail: (e as Error).message }); }
    const stored = await users.findOrCreateByEmail(info.email, provider);
    const user = { id: stored.id, email: stored.email, accountType: stored.accountType };
    const token = signToken(user);
    setAuthCookie(reply, token);
    return { token, user: { ...user, createdAt: stored.createdAt, emailVerified: stored.emailVerified } };
  });

  app.post("/auth/logout", async (_req, reply) => { clearAuthCookie(reply); return { ok: true }; });

  app.post("/auth/verify", authLimit, async (req, reply) => {
    const { token } = (req.body ?? {}) as { token?: string };
    const userId = token ? await authTokens.consume(token, "verify") : undefined;
    if (!userId) return reply.code(400).send({ error: "invalid or expired token" });
    await users.setEmailVerified(userId, true);
    return { ok: true };
  });

  app.post("/auth/resend-verification", { preHandler: requireUser() }, async (req) => {
    const u = userOf(req); await sendVerification(u.id, u.email); return { ok: true };
  });

  app.post("/auth/forgot", authLimit, async (req) => {
    const { email } = (req.body ?? {}) as { email?: string };
    const stored = email ? await users.getByEmail(email) : undefined;
    if (stored && stored.provider === "password") {
      const token = genToken();
      await authTokens.create({ token, userId: stored.id, type: "reset", expiresAt: new Date(Date.now() + 3600 * 1000).toISOString() });
      await sendEmail(stored.email, "Reset your password", `Reset your Trip Itinerary Planner password:\n${webUrl()}/reset?token=${token}\n\nThis link expires in 1 hour. If you didn't request this, ignore it.`);
    }
    return { ok: true };
  });

  app.post("/auth/reset", authLimit, async (req, reply) => {
    const { token, password } = (req.body ?? {}) as { token?: string; password?: string };
    if (!password || password.length < 8) return reply.code(400).send({ error: "password must be at least 8 characters" });
    const userId = token ? await authTokens.consume(token, "reset") : undefined;
    if (!userId) return reply.code(400).send({ error: "invalid or expired token" });
    await users.setPasswordHash(userId, await hashPassword(password));
    return { ok: true };
  });

  app.get("/auth/me", { preHandler: requireUser() }, async (req) => {
    const u = userOf(req);
    const stored = await users.getById(u.id);
    return { user: { ...u, emailVerified: stored?.emailVerified ?? false }, rate: await rateStatus(u.id, u.accountType) };
  });
}
