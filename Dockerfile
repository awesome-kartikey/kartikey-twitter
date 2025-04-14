# twitter-clone-server/Dockerfile

# Stage 1: Base Node image (Pinning to Alpine 3.18)
# Use node:18-alpine3.18 specifically
FROM node:18-alpine3.18 AS base
WORKDIR /app

# Stage 2: Install ONLY production dependencies
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Stage 3: Build the application
FROM base AS builder
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 4: Production image
FROM base AS runner
WORKDIR /app

# ---> Keep this line, it should work with Alpine 3.18 <---
RUN apk update && apk add --no-cache libssl1.1 && rm -rf /var/cache/apk/*

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/build ./build
COPY package.json .

EXPOSE 8000
CMD ["node", "build/index.js"]