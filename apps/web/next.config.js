const path = require("path");
// Load the monorepo-root .env so NEXT_PUBLIC_* vars (e.g. the Google Maps key) are
// available to the web build without a separate apps/web/.env file.
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@chatr/core", "@chatr/api-client", "@chatr/ui"],
};
module.exports = nextConfig;
