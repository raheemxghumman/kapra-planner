# Kapra Planner

AI stylist for Pakistani brands with virtual try-on, tailor booking, Stripe payments, order tracking and chat.
CS-301 Full Stack Web Development, Air University Islamabad, Fall 2026 — Abdulraheem (241854), Wania Rahman (241830).

**Stack:** React 19 + Vite + Tailwind CSS + Motion + React Three Fiber · NestJS 12 + TypeORM · PostgreSQL (Supabase) · Groq · Hugging Face try-on · Stripe (test) · OpenStreetMap · Cloudinary · GitHub Actions · Render · Vercel

## What it does

| For | Features |
|---|---|
| Customers | AI stylist (Groq tool calling, rule-based fallback) · virtual try-on on your own photo · saved looks with piece swaps · tailor map ranked by a pre-trained sentiment model · booking with Stripe, live tracking and chat · checkout with partner brands |
| Tailors | Shop profile with map pin, priced services, gallery · accept / decline / progress bookings · chat · reply to reviews · score explained |
| Brands | Nightly catalogue sync from their shop feed · hide products, stock per size, hand-listed products · store locations · orders with tracking numbers · 30-day analytics |
| Admins | Platform stats · approve or suspend accounts · link brand accounts · catalogue sync · review moderation |

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
| `npm run seed:admin -w api` | Create the admin account from `ADMIN_EMAIL` / `ADMIN_PASSWORD` |
| `npm run seed:catalogue -w api` | Create the 12 brands and import their catalogues |
| `npm run seed:tailors -w api` | 18 demo tailor shops with services and reviews |
| `npm run job:reviews -w api` | Score review sentiment with the pre-trained model, then re-rank tailors |

## Demo accounts (local)

| Role | Email | Password |
|---|---|---|
| Customer | `customer@kapra.test` | `KapraDemo1` |
| Tailor | `tailor@kapra.test` | `KapraDemo1` |
| Brand (manages Limelight) | `brand@kapra.test` | `KapraDemo1` |
| Admin | `admin@kapra.test` | from `ADMIN_PASSWORD` in `api/.env` |

Stripe is in test mode: pay with card `4242 4242 4242 4242`, any future date and any CVC.
