import { createClient } from "@chatr/api-client";
export const api = createClient(process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000");
