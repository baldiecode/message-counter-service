# syntax=docker/dockerfile:1

# Base image with pnpm via corepack
FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate
WORKDIR /app

# Install dependencies (cached layer)
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build the app
FROM deps AS build
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
COPY eslint.config.mjs ./
RUN pnpm build

# Install only production dependencies
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Runtime image
FROM node:22-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app
# Use non-root user provided by Node image
USER node
# Copy production node_modules first (better layer caching)
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
# Copy built files
COPY --chown=node:node --from=build /app/dist ./dist
# Copy package.json for metadata (not strictly required)
COPY --chown=node:node package.json ./
EXPOSE 3000
ENV PORT=3000
# Healthcheck (simple HTTP ping to '/')
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/').then(r=>process.exit(0)).catch(()=>process.exit(1))" || exit 1
CMD ["node", "dist/main.js"]