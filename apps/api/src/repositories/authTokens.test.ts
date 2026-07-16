import { describe, it, expect } from "vitest";
import { InMemoryAuthTokenRepository } from "./authTokenRepository";
import { isExpired } from "@trip-itinerary/core";

const future = () => new Date(Date.now() + 3600 * 1000).toISOString();
const past = () => new Date(Date.now() - 1000).toISOString();

describe("isExpired", () => {
  it("detects past / future / invalid", () => {
    expect(isExpired(past())).toBe(true);
    expect(isExpired(future())).toBe(false);
    expect(isExpired("not-a-date")).toBe(true);
  });
});

describe("auth token repository", () => {
  it("consumes a valid token once, by matching type", async () => {
    const r = new InMemoryAuthTokenRepository();
    await r.create({ token: "t1", userId: "u1", type: "verify", expiresAt: future() });
    expect(await r.consume("t1", "reset")).toBeUndefined();   // wrong type
    expect(await r.consume("t1", "verify")).toBe("u1");        // ok
    expect(await r.consume("t1", "verify")).toBeUndefined();   // single-use
  });
  it("rejects expired tokens", async () => {
    const r = new InMemoryAuthTokenRepository();
    await r.create({ token: "t2", userId: "u2", type: "reset", expiresAt: past() });
    expect(await r.consume("t2", "reset")).toBeUndefined();
  });
});
