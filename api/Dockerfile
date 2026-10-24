# Production image: the API plus the built website in one container (the API serves both).
# Build from the repository root:
#   docker build -f api/Dockerfile -t kapra-planner .

# ---- build stage: install everything, compile the API, build the website ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY api/package.json api/
COPY web/package.json web/
RUN npm ci
COPY api api
COPY web web
# The website calls the API on its own address, so the API URL is relative.
ENV VITE_API_URL=/api/v1
RUN npm run build --workspace api && npm run build --workspace web

# ---- runtime stage: production dependencies, compiled API and the website files ----
FROM node:24-alpine AS runtime
ENV NODE_ENV=production
ENV WEB_DIST=/app/web-dist
WORKDIR /app
COPY package.json package-lock.json ./
COPY api/package.json api/
COPY web/package.json web/
RUN npm ci --workspace api --omit=dev && npm cache clean --force
COPY --from=build /app/api/dist api/dist
COPY --from=build /app/web/dist web-dist
WORKDIR /app/api
USER node
EXPOSE 3000
# Apply pending migrations, then start the server.
CMD ["sh", "-c", "npx typeorm -d dist/database/data-source.js migration:run && node dist/main.js"]
