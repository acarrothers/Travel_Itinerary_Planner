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
