# syntax=docker/dockerfile:1
# Embat Pulse web app (Next.js standalone). Reads PULSE and Advisor data from the API
# when PULSE_API_URL is set, otherwise from the JSON bundled under src/data.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx next build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Bundled JSON fallback (used when PULSE_API_URL is unset).
COPY --from=builder /app/src/data ./src/data
EXPOSE 3000
CMD ["node", "server.js"]
