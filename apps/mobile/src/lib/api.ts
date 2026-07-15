import { createClient } from "@chatr/api-client";

declare const process: { env: Record<string, string | undefined> };
// Android emulator can't reach localhost; override via EXPO_PUBLIC_API_BASE_URL.
const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
export const api = createClient(baseUrl);
