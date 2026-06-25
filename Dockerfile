# Bust cache with build timestamp
ARG BUILD_DATE=2026-06-25-0001

# ---- Stage 1: Build ----
FROM node:22-alpine AS build
ARG BUILD_DATE
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

# Verify build output exists
RUN test -f dist/src/main.js && echo "BUILD OK: dist/src/main.js exists" || (echo "BUILD FAILED" && find dist -name "main.*" && exit 1)

# ---- Stage 2: Runtime ----
FROM node:22-alpine
WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist/
COPY --from=build /app/prisma ./prisma/
RUN npx prisma generate

# Verify runtime files
RUN test -f dist/src/main.js && echo "RUNTIME OK: dist/src/main.js exists" || (echo "RUNTIME FAILED" && find dist -name "main.*" && exit 1)

EXPOSE 7860
ENV PORT=7860

CMD ["sh", "-c", "npx prisma db push && node dist/src/main.js"]
