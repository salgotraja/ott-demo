FROM node:20-alpine
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace manifests first — layer is cached until any package.json changes
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json turbo.json ./
COPY packages/database/package.json packages/database/
COPY apps/ott-backend/package.json apps/ott-backend/
COPY apps/ott/package.json apps/ott/

RUN pnpm install --frozen-lockfile

# Copy source after deps to maximise cache reuse
COPY apps/ott/ apps/ott/

WORKDIR /app/apps/ott
RUN pnpm build

EXPOSE 3000
ENV NODE_ENV=production PORT=3000

CMD ["pnpm", "start"]
