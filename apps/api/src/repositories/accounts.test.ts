import { describe, it, expect } from "vitest";
import { InMemoryUserRepository, seedAccountLimits } from "./userRepository";
import { InMemoryTripRepository } from "./tripRepository";
import { dailyLimitFor, evaluateRateLimit, type Trip } from "@trip-itinerary/core";

const now = () => new Date().toISOString();
const iso = (ms: number) => new Date(ms).toISOString();
const dayAgo = () => iso(Date.now() - 24 * 3600 * 1000);
const mkTrip = (userId: string, createdAt: string): Trip => ({
  id: Math.random().toString(36).slice(2), userId, createdAt, updatedAt: createdAt,
  preferences: { destinations: ["X"], nights: 1, party: "solo", adults: 1, children: 0, budget: "mid", interests: [], pace: "balanced" },
  days: [],
});

describe("accounts + rate limiting", () => {
  it("seeds configurable limits with general = 1", async () => {
    const users = new InMemoryUserRepository();
    await seedAccountLimits(users);
    const limits = await users.getAccountLimits();
    expect(dailyLimitFor("general", limits)).toBe(1);
  });

  it("blocks a general user's 2nd trip within 24h, counts only the window", async () => {
    const users = new InMemoryUserRepository();
    await seedAccountLimits(users);
    const trips = new InMemoryTripRepository();
    const limit = dailyLimitFor("general", await users.getAccountLimits());

    expect(evaluateRateLimit(await trips.countTripsSince("u1", dayAgo()), limit).allowed).toBe(true);
    await trips.save(mkTrip("u1", now()));                                   // 1 in window
    await trips.save(mkTrip("u1", iso(Date.now() - 48 * 3600 * 1000)));      // outside window
    const used = await trips.countTripsSince("u1", dayAgo());
    expect(used).toBe(1);
    expect(evaluateRateLimit(used, limit).allowed).toBe(false);
  });

  it("stores + fetches a user by email (hash stays internal)", async () => {
    const users = new InMemoryUserRepository();
    const u = await users.createUser({ id: "u9", email: "A@B.com", accountType: "general", createdAt: now(), passwordHash: "hash", provider: "password", emailVerified: false });
    expect(u).not.toHaveProperty("passwordHash");
    const stored = await users.getByEmail("a@b.com"); // case-insensitive
    expect(stored?.passwordHash).toBe("hash");
  });
});


describe("findOrCreateByEmail (SSO)", () => {
  it("creates a general account with null password on first SSO sign-in, reuses it after", async () => {
    const { InMemoryUserRepository } = await import("./userRepository");
    const users = new InMemoryUserRepository();
    const a = await users.findOrCreateByEmail("sso@user.com", "google");
    expect(a.provider).toBe("google");
    expect(a.passwordHash).toBeNull();
    expect(a.accountType).toBe("general");
    const b = await users.findOrCreateByEmail("SSO@user.com", "google"); // case-insensitive
    expect(b.id).toBe(a.id);
  });
});
