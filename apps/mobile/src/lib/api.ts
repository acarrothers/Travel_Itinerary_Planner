import { createClient } from "@trip-itinerary/api-client";
import { getToken } from "./auth";

declare const process: { env: Record<string, string | undefined> };
const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
export const api = createClient(baseUrl, { getAuthToken: () => getToken() ?? undefined });
