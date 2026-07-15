import { describe, it, expect } from "vitest";
import { can, roleForToken } from "./auth";

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
