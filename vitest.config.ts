import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const at = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@trip-itinerary/core": at("packages/core/src/index.ts"),
      "@trip-itinerary/ai-orchestration": at("packages/ai-orchestration/src/index.ts"),
      "@trip-itinerary/api-client": at("packages/api-client/src/index.ts"),
      "@trip-itinerary/ui": at("packages/ui/src/index.ts"),
    },
  },
  test: {
    include: ["**/*.test.ts"],
    environment: "node",
    server: { deps: { inline: [/@trip-itinerary\//] } },
  },
});
