
# Stage 1: Base Node image (consistent across stages)
FROM node:18-alpine AS base
WORKDIR /app

# Stage 2: Install ONLY production dependencies
FROM base AS deps
COPY package.json package-lock.json ./
# --omit=dev is equivalent to --production for npm v7+
RUN npm ci --omit=dev

# Stage 3: Build the application
FROM base AS builder
# First copy package files and install ALL dependencies (including dev)
COPY package.json package-lock.json ./
RUN npm ci
# Then copy the rest of the source code
COPY . .
# Generate Prisma Client (needs schema and dev deps)
# Ensure your schema is correctly referenced in package.json or prisma cmd
RUN npx prisma generate
# Build TypeScript to JavaScript (needs typescript dev dep)
RUN npm run build

# Stage 4: Production image
FROM base AS runner
WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy necessary files from previous stages
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/build ./build
# Copy package.json in case runtime needs it (e.g., for version info)
COPY package.json .

# Expose the port the app runs on (make sure it matches your server's config)
EXPOSE 8000

# Command to run the application
# Ensure your build output entry point is correct
CMD ["node", "build/index.js"]