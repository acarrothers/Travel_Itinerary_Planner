import { config } from "dotenv";
import { fileURLToPath } from "node:url";

// Load the monorepo-root .env (where .env.example lives) before anything reads
// process.env. Real environment variables take precedence over the file.
config({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });
