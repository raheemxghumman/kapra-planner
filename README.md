# Kapra Planner

AI stylist for Pakistani brands with virtual try-on, tailor booking, Stripe payments, order tracking and chat.
CS-301 Full Stack Web Development, Air University Islamabad, Fall 2026 — Abdulraheem (241854), Wania Rahman (241830).

**Stack:** React 19 + Vite + Tailwind CSS + Motion + React Three Fiber · NestJS 12 + TypeORM · PostgreSQL (Supabase) · Groq · Hugging Face try-on · Stripe (test) · OpenStreetMap · Cloudinary · GitHub Actions · Render · Vercel

## Start here

| Read | For |
|---|---|
| [docs/PLAN.md](docs/PLAN.md) | The build plan: stack, structure, decisions, timeline |
| [docs/BACKLOG.md](docs/BACKLOG.md) | Weekly tasks |
| [docs/CONVENTIONS.md](docs/CONVENTIONS.md) | Coding rules |
| [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) | Accounts and environment variables |
| [docs/VIVA.md](docs/VIVA.md) | Viva question bank |
| [docs/DESIGN-CHANGES.md](docs/DESIGN-CHANGES.md) | Changes since Deliverable 2 |

## Run locally

Requirements: Node.js 24+, npm 11+, and either Docker (local Postgres) or the Supabase connection string.

```bash
npm install                      # installs api and web (npm workspaces)
cp api/.env.example api/.env     # fill in the values (see docs/ENVIRONMENT.md)
cp web/.env.example web/.env.local
docker compose up -d             # optional: local PostgreSQL instead of Supabase
npm run dev:api                  # http://localhost:3000/api/v1, docs at /api/docs
npm run dev:web                  # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run lint` / `npm run typecheck` / `npm test` | Checks for both apps (also run by CI) |
| `npm run build` | Production builds of both apps |
| `npm run migration:generate -w api -- src/database/migrations/<Name>` | Create a migration from entity changes |
| `npm run migration:run -w api` | Apply pending migrations |
