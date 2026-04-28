FROM node:20-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --include=dev

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx next build --no-lint

FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs

EXPOSE 3000
CMD ["npm", "run", "start"]
