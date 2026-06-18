# --- build ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

# --- runtime (saída standalone do Next) ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# Sem isto, o server standalone do Next pode ligar-se só a localhost
# e o proxy do Coolify (Traefik) não o alcança.
ENV HOSTNAME=0.0.0.0
ENV DATA_DIR=/data
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
RUN mkdir -p /data
EXPOSE 3000
CMD ["node", "server.js"]
