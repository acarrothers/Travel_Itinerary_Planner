import { createClient } from "@trip-itinerary/api-client";
import { getToken } from "./auth";

declare const process: { env: Record<string, string | undefined> };
export const api = createClient(process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000", {
  getAuthToken: () => getToken(),
});
