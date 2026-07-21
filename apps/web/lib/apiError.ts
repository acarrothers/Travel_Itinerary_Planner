declare const process: { env: Record<string, string | undefined> };

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

/**
 * Turn a failed API call into a message that names the actual cause.
 *
 * The previous admin-page handler collapsed every non-401 failure into "run the
 * API locally", which hid real production problems (misconfigured base URL,
 * the 503 the CMS now returns when APP_API_KEYS is unset, plain 404s). Each
 * distinct failure should point at its own fix.
 */
export function describeApiError(e: any, base: string = API_BASE): string {
  const status: number | undefined = e?.status;
  const code = e?.body?.error;

  if (code === "admin_not_configured" || status === 503) {
    return "Offer management is locked: APP_API_KEYS is not set on the API service. Set it in Railway, then redeploy.";
  }
  if (status === 401) return "Unauthorized — enter a valid API key above.";
  if (status === 403) return `Forbidden — your role can't do that${e?.body?.role ? ` (role: ${e.body.role})` : ""}.`;
  if (status === 404) {
    return `Not found (404) at ${base}. Check NEXT_PUBLIC_API_BASE_URL points at the API service, not the web app.`;
  }
  if (status === 429) return "Rate limited — wait a moment and retry.";
  if (typeof status === "number") return `API error ${status} from ${base}. ${e?.message ?? ""}`.trim();

  // No status: the request never completed (DNS, CORS, TLS, offline) or the
  // response body wasn't JSON. Naming the base URL makes a wrong host obvious.
  return `Couldn't reach the API at ${base} — ${e?.message ?? "network or CORS error"}. Check NEXT_PUBLIC_API_BASE_URL and that the API service is running.`;
}
