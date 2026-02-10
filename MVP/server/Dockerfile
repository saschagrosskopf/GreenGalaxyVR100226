# ═══════════════════════════════════════════════════════════════════════════════
# 🐳 COLYSEUS SERVER DOCKERFILE
# Production-ready container for GreenGalaxy multiplayer server
# ═══════════════════════════════════════════════════════════════════════════════

FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build TypeScript
RUN npm run build

# ═══════════════════════════════════════════════════════════════════════════════
# Production stage
# ═══════════════════════════════════════════════════════════════════════════════

FROM node:20-alpine AS production

WORKDIR /app

# Copy package files and install production deps only
COPY package*.json ./
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/build ./build

# Environment variables
ENV NODE_ENV=production
ENV PORT=2567

# Expose Colyseus default port
EXPOSE 2567

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:2567/hello_world || exit 1

# Start server
CMD ["node", "build/index.js"]
