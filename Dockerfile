
FROM node:18-alpine AS base
WORKDIR /app


FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev


FROM base AS builder

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npx prisma Generate

RUN npm run build


FROM base AS runner
WORKDIR /app

RUN apk update && apk add --no-cache libssl1.1 && rm -rf /var/cache/apk/*

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/build ./build
COPY package.json .

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["node", "build/index.js"]