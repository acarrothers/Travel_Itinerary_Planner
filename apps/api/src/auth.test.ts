import { describe, it, expect } from "vitest";
import { can, roleForToken, resolveAdminAuth } from "./auth";

describe("RBAC can()", () => {
  it("admin can do everything", () => {
    for (const a of ["read", "write", "publish", "delete", "manage_partners"] as const) expect(can("admin", a)).toBe(true);
  });
  it("partnerships_manager can write but not publish/delete/partners", () => {
    expect(can("partnerships_manager", "write")).toBe(true);
    expect(can("partnerships_manager", "publish")).toBe(false);
    expect(can("partnerships_manager", "delete")).toBe(false);
    expect(can("partnerships_manager", "manage_partners")).toBe(false);
  });
  it("approver can publish + delete, not partners", () => {
    expect(can("approver", "publish")).toBe(true);
    expect(can("approver", "delete")).toBe(true);
    expect(can("approver", "manage_partners")).toBe(false);
  });
  it("analyst is read-only", () => {
    expect(can("analyst", "read")).toBe(true);
    expect(can("analyst", "write")).toBe(false);
  });
});

describe("roleForToken()", () => {
  const keys = JSON.stringify({ "k-admin": "admin", "k-pm": "partnerships_manager" });
  it("maps a known token to its role", () => { expect(roleForToken("k-admin", keys)).toBe("admin"); });
  it("returns null for unknown token / no config / bad json / invalid role", () => {
    expect(roleForToken("nope", keys)).toBeNull();
    expect(roleForToken("k-admin", undefined)).toBeNull();
    expect(roleForToken("k-admin", "{bad json")).toBeNull();
    expect(roleForToken("x", JSON.stringify({ x: "wizard" }))).toBeNull();
  });
});

describe("resolveAdminAuth() — fails closed in production", () => {
  const keys = JSON.stringify({ "k-admin": "admin", "k-analyst": "analyst" });

  it("LOCKS the CMS when production has no APP_API_KEYS", () => {
    // The regression this guards: an unset env var previously granted full admin
    // access to anyone who found the URL on the public deployment.
    const auth = resolveAdminAuth({ token: undefined, keysJson: undefined, isProduction: true });
    expect(auth).toEqual({ ok: false, reason: "not_configured" });
  });

  it("stays locked in production even if a caller invents a token", () => {
    const auth = resolveAdminAuth({ token: "guessed-key", keysJson: undefined, isProduction: true });
    expect(auth.ok).toBe(false);
  });

  it("enforces RBAC in production once keys are configured", () => {
    expect(resolveAdminAuth({ token: "k-admin", keysJson: keys, isProduction: true })).toEqual({ ok: true, role: "admin" });
    expect(resolveAdminAuth({ token: "k-analyst", keysJson: keys, isProduction: true })).toEqual({ ok: true, role: "analyst" });
    expect(resolveAdminAuth({ token: "wrong", keysJson: keys, isProduction: true })).toEqual({ ok: false, reason: "unauthorized" });
    expect(resolveAdminAuth({ token: undefined, keysJson: keys, isProduction: true })).toEqual({ ok: false, reason: "unauthorized" });
  });

  it("still allows the dev bypass locally so local development works", () => {
    expect(resolveAdminAuth({ token: undefined, keysJson: undefined, isProduction: false })).toEqual({ ok: true, role: "dev" });
  });

  it("honours configured keys locally too (no dev bypass once keys exist)", () => {
    expect(resolveAdminAuth({ token: "bad", keysJson: keys, isProduction: false })).toEqual({ ok: false, reason: "unauthorized" });
  });

  it("an analyst key cannot write or delete", () => {
    const auth = resolveAdminAuth({ token: "k-analyst", keysJson: keys, isProduction: true });
    expect(auth.ok && auth.role !== "dev" && can(auth.role, "write")).toBe(false);
    expect(auth.ok && auth.role !== "dev" && can(auth.role, "delete")).toBe(false);
  });
});
