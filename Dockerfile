# Stage 1: Install dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN apk update && apk upgrade # Update alpine packages.
RUN npm install --production

# Stage 2: Build the application
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client (important step)
# Use --no-engine flag if the build environment architecture differs from runtime
# Or ensure build/runtime use compatible architectures
RUN npx prisma generate

# Build TypeScript to JavaScript
RUN npm run build

# Stage 3: Production image
FROM node:18-alpine AS runner
WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules
# Copy Prisma schema (needed by Prisma Client at runtime) and migrations (optional but good practice)
COPY --from=builder /app/prisma ./prisma
# Copy compiled JavaScript output
COPY --from=builder /app/build ./build

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["node", "build/index.js"]