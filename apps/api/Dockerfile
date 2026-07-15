# Build context is the repo root: docker build -f apps/api/Dockerfile .
FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

# Only the API + shared packages are needed (web/mobile are excluded).
COPY pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN pnpm install --no-frozen-lockfile

EXPOSE 4000
# Run migrations then start (idempotent; seedIfEmpty guards re-seeding).
CMD ["sh", "-c", "pnpm --filter @chatr/api migrate && pnpm --filter @chatr/api start"]
