const path = require("path");
// Load the monorepo-root .env so NEXT_PUBLIC_* vars (e.g. the Google Maps key) are
// available to the web build without a separate apps/web/.env file.
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@trip-itinerary/core", "@trip-itinerary/api-client", "@trip-itinerary/ui"],
  // Type-checking + linting run in CI (`pnpm typecheck` / vitest). Next's bundled
  // type-check trips on @types/react version skew across the pnpm workspace
  // (Expo pins 18.2, web uses 18.3), so we don't run it again at build time.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};
module.exports = nextConfig;
