// Roles & permissions for the offers CMS (PRD §9.1). Pure + testable; the Fastify
// hook in routes/admin.ts uses these functions.
export type Role = "admin" | "partnerships_manager" | "approver" | "analyst";
export type Action = "read" | "write" | "publish" | "delete" | "manage_partners";

export const VALID_ROLES: Role[] = ["admin", "partnerships_manager", "approver", "analyst"];

const MATRIX: Record<Role, Action[]> = {
  admin: ["read", "write", "publish", "delete", "manage_partners"],
  approver: ["read", "write", "publish", "delete"],
  partnerships_manager: ["read", "write"],
  analyst: ["read"],
};

export function can(role: Role, action: Action): boolean {
  return MATRIX[role]?.includes(action) ?? false;
}

// Resolve a bearer token to a role using a JSON map (env APP_API_KEYS).
// Returns null if not configured or unknown token.
export function roleForToken(token: string | undefined, keysJson: string | undefined): Role | null {
  if (!keysJson) return null;
  try {
    const map = JSON.parse(keysJson) as Record<string, Role>;
    if (token && map[token] && VALID_ROLES.includes(map[token])) return map[token];
    return null;
  } catch {
    return null;
  }
}

export type AdminAuth =
  | { ok: true; role: Role | "dev" }
  | { ok: false; reason: "unauthorized" | "not_configured" };

/**
 * Decide who the caller is for an admin request. Fails CLOSED: in production a
 * missing APP_API_KEYS locks the CMS rather than granting the dev bypass, so a
 * config omission can never silently expose offer management to the internet.
 * Outside production a missing config still yields the "dev" role for local work.
 */
export function resolveAdminAuth(opts: {
  token?: string;
  keysJson?: string;
  isProduction: boolean;
}): AdminAuth {
  const { token, keysJson, isProduction } = opts;
  if (!keysJson) {
    return isProduction ? { ok: false, reason: "not_configured" } : { ok: true, role: "dev" };
  }
  const role = roleForToken(token, keysJson);
  return role ? { ok: true, role } : { ok: false, reason: "unauthorized" };
}
