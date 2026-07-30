# Stage 1: Build the Next.js application
FROM --platform=linux/amd64 node:20-slim AS builder

# Install build dependencies
RUN apt-get update && \
    apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

# Install dependencies
RUN \
    if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
    else echo "Warning: Lockfile not found. It is recommended to commit lockfiles to version control." && npm install; \
    fi

# Copy application code
COPY . .

# Build application
RUN npm run build

# Stage 2: Production image
FROM --platform=linux/amd64 node:20-slim

WORKDIR /app

# Install bitcoin-cli only
RUN apt-get update && \
    apt-get install -y \
    wget \
    && wget https://bitcoincore.org/bin/bitcoin-core-25.0/bitcoin-25.0-x86_64-linux-gnu.tar.gz \
    && tar xzf bitcoin-25.0-x86_64-linux-gnu.tar.gz \
    && install -m 0755 -o root -g root -t /usr/local/bin bitcoin-25.0/bin/bitcoin-cli \
    && rm -rf bitcoin-25.0-x86_64-linux-gnu.tar.gz bitcoin-25.0 \
    && apt-get remove -y wget \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# Create a non-root user
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nextjs

# Copy built application from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/next.config.ts ./
# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Install production dependencies only
RUN npm install --production

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]