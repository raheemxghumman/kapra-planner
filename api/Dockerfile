# Production image for the API. Build from the repository root:
#   docker build -f api/Dockerfile -t kapra-api .

# ---- build stage: install everything and compile TypeScript ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY api/package.json api/
COPY web/package.json web/
RUN npm ci --workspace api
COPY api api
RUN npm run build --workspace api

# ---- runtime stage: only production dependencies and compiled code ----
FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY api/package.json api/
COPY web/package.json web/
RUN npm ci --workspace api --omit=dev && npm cache clean --force
COPY --from=build /app/api/dist api/dist
WORKDIR /app/api
USER node
EXPOSE 3000
# Apply pending migrations, then start the server.
CMD ["sh", "-c", "npx typeorm -d dist/database/data-source.js migration:run && node dist/main.js"]
