FROM node:22-alpine AS builder
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/ .
RUN npx tsc

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache curl
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 appuser
COPY --from=builder /app/server/package.json /app/server/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/server/dist ./dist
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app/uploads
USER appuser
EXPOSE 3000
CMD ["node", "dist/index.js"]
