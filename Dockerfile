# Multi-stage build for MUD Engine
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S mudengine -u 1001

# Dependencies stage
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Development dependencies stage
FROM base AS dev-deps
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Build stage
FROM dev-deps AS build
COPY . .
RUN npm run build

# Production stage
FROM base AS production

# Copy dependencies
COPY --from=deps --chown=mudengine:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=build --chown=mudengine:nodejs /app/dist ./dist

# Copy package files for scripts
COPY --from=build --chown=mudengine:nodejs /app/package*.json ./

# Copy configuration files
COPY --from=build --chown=mudengine:nodejs /app/.env.example ./
COPY --from=build --chown=mudengine:nodejs /app/scripts ./scripts
COPY --from=build --chown=mudengine:nodejs /app/engine ./engine
COPY --from=build --chown=mudengine:nodejs /app/data ./data

# Create necessary directories
RUN mkdir -p logs && chown -R mudengine:nodejs logs

# Switch to non-root user
USER mudengine

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Expose port
EXPOSE 3000

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "run", "start:prod"]