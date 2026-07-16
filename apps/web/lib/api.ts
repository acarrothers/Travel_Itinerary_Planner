import { createClient } from "@trip-itinerary/api-client";

declare const process: { env: Record<string, string | undefined> };
// Web uses an httpOnly session cookie (credentials: include) — no token in JS.
export const api = createClient(process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000", {
  credentials: "include",
});
