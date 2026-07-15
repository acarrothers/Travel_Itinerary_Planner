import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const at = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@chatr/core": at("packages/core/src/index.ts"),
      "@chatr/ai-orchestration": at("packages/ai-orchestration/src/index.ts"),
      "@chatr/api-client": at("packages/api-client/src/index.ts"),
      "@chatr/ui": at("packages/ui/src/index.ts"),
    },
  },
  test: {
    include: ["**/*.test.ts"],
    environment: "node",
    server: { deps: { inline: [/@chatr\//] } },
  },
});
