import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { FastifyRequest, FastifyReply } from "fastify";

declare const process: { env: Record<string, string | undefined> };

const SECRET = process.env.JWT_SECRET ?? "dev-insecure-secret-change-me";
if (!process.env.JWT_SECRET) console.warn("[auth] JWT_SECRET not set — using an insecure dev default. Set JWT_SECRET in production.");

const COOKIE = "tip_token";
const prod = process.env.NODE_ENV === "production";
const cookieOpts = () => ({ httpOnly: true, secure: prod, sameSite: (prod ? "none" : "lax") as "none" | "lax", path: "/", maxAge: 7 * 24 * 3600 });

export function setAuthCookie(reply: FastifyReply, token: string) { reply.setCookie(COOKIE, token, cookieOpts()); }
export function clearAuthCookie(reply: FastifyReply) { reply.clearCookie(COOKIE, { path: "/" }); }

export interface AuthedUser { id: string; email: string; accountType: string; }
interface TokenPayload { sub: string; email: string; accountType: string; }

export const hashPassword = (pw: string) => bcrypt.hash(pw, 10);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

export function signToken(u: AuthedUser): string {
  return jwt.sign({ sub: u.id, email: u.email, accountType: u.accountType } as TokenPayload, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthedUser | null {
  try {
    const p = jwt.verify(token, SECRET) as TokenPayload;
    return { id: p.sub, email: p.email, accountType: p.accountType };
  } catch {
    return null;
  }
}

// Fastify preHandler: require a valid bearer token; attaches req.user.
export function requireUser() {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const cookieToken = (req as any).cookies?.tip_token as string | undefined;
    const token = cookieToken ?? (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
    const user = token ? verifyToken(token) : null;
    if (!user) return reply.code(401).send({ error: "authentication required" });
    (req as any).user = user;
  };
}

export const userOf = (req: FastifyRequest): AuthedUser => (req as any).user;
export const isValidEmail = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
