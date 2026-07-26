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
  it("seeds configurable limits with general = 5", async () => {
    const users = new InMemoryUserRepository();
    await seedAccountLimits(users);
    const limits = await users.getAccountLimits();
    expect(dailyLimitFor("general", limits)).toBe(5);
  });

  it("blocks the 6th trip within 24h, counts only the window", async () => {
    const users = new InMemoryUserRepository();
    await seedAccountLimits(users);
    const trips = new InMemoryTripRepository();
    const limit = dailyLimitFor("general", await users.getAccountLimits()); // 5

    for (let i = 0; i < 5; i++) await trips.save(mkTrip("u1", now()));       // 5 in window
    await trips.save(mkTrip("u1", iso(Date.now() - 48 * 3600 * 1000)));      // outside window
    const used = await trips.countTripsSince("u1", dayAgo());
    expect(used).toBe(5);
    expect(evaluateRateLimit(used, limit).allowed).toBe(false);             // 6th blocked
    expect(evaluateRateLimit(4, limit).allowed).toBe(true);                 // 5th still allowed
  });

  it("keys guest counts separately (guest:<ip>)", async () => {
    const trips = new InMemoryTripRepository();
    await trips.save(mkTrip("guest:1.2.3.4", now()));
    await trips.save(mkTrip("guest:1.2.3.4", now()));
    await trips.save(mkTrip("guest:9.9.9.9", now()));
    expect(await trips.countTripsSince("guest:1.2.3.4", dayAgo())).toBe(2);
    expect(await trips.countTripsSince("guest:9.9.9.9", dayAgo())).toBe(1);
  });

  it("caps guests at 1 itinerary/24h, members at 5", async () => {
    const users = new InMemoryUserRepository();
    await seedAccountLimits(users);
    const limits = await users.getAccountLimits();
    expect(dailyLimitFor("guest", limits, 1)).toBe(1);
    expect(dailyLimitFor("general", limits)).toBe(5);
    expect(evaluateRateLimit(1, dailyLimitFor("guest", limits, 1)).allowed).toBe(false); // guest 2nd blocked
    expect(evaluateRateLimit(4, dailyLimitFor("general", limits)).allowed).toBe(true);    // member 5th allowed
  });

  it("lists a user's saved itineraries, newest first", async () => {
    const trips = new InMemoryTripRepository();
    await trips.save(mkTrip("u1", iso(Date.now() - 2000)));
    await trips.save(mkTrip("u1", iso(Date.now() - 1000)));
    await trips.save(mkTrip("other", now()));
    const mine = await trips.listByUser("u1");
    expect(mine).toHaveLength(2);
    expect(mine[0].createdAt >= mine[1].createdAt).toBe(true);
  });

  it("deletes a saved itinerary", async () => {
    const trips = new InMemoryTripRepository();
    const t = mkTrip("u1", now());
    await trips.save(t);
    expect(await trips.get(t.id)).toBeDefined();
    await trips.delete(t.id);
    expect(await trips.get(t.id)).toBeUndefined();
    expect(await trips.listByUser("u1")).toHaveLength(0);
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
