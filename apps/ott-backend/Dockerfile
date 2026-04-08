FROM node:20-alpine
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace manifests first — layer is cached until any package.json changes
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json turbo.json ./
COPY packages/database/package.json packages/database/
COPY apps/ott/package.json apps/ott/
COPY apps/ott-backend/package.json apps/ott-backend/

RUN pnpm install --frozen-lockfile

# Copy source after deps to maximise cache reuse
COPY packages/database/ packages/database/
COPY apps/ott-backend/ apps/ott-backend/

# Generate Prisma client types from schema (no database connection required)
RUN pnpm --filter @ott/database exec prisma generate

WORKDIR /app/apps/ott-backend
RUN pnpm build

EXPOSE 3001
ENV NODE_ENV=production PORT=3001

# server.ts and @ott/database are TypeScript; use tsx to run them
CMD ["pnpm", "exec", "tsx", "server.ts"]
