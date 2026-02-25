FROM node:22-alpine AS builder
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/ .
RUN npx tsc
# Copy seed data from frontend src/data (referenced by seed.ts via relative path)
COPY src/data /app/src/data

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache curl
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 appuser
COPY --from=builder /app/server/package.json /app/server/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/src/data /src/data
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app/uploads
USER appuser
EXPOSE 3000
CMD ["node", "dist/index.js"]
