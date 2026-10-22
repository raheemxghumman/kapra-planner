# Kapra Planner — Build Plan

> Master plan for building Kapra Planner as our CS-301 Full Stack Web Development semester project.
> The design it implements is in `../Deliverable-2/241854_241830.pdf` (requirements, use cases, ERD, diagrams, API list).
> Whenever a deliverable is announced, we take the needed parts from this repository; nothing here depends on a deliverable number.

| Document | Purpose |
|---|---|
| `PLAN.md` (this file) | What we build, with which tools, in what order, and why |
| `BACKLOG.md` | Week-by-week task checklist with requirement IDs |
| `CONVENTIONS.md` | Coding rules both of us follow so the code reads like one person wrote it |
| `ENVIRONMENT.md` | Every account, key and environment variable, and where it comes from |
| `DESIGN-CHANGES.md` | Changes to the Deliverable 2 design discovered while coding (for future deliverables) |
| `VIVA.md` | Growing question bank and answers, filled in as each module is finished |

---

## 1. Principles

1. **Viva first.** Every file must be explainable by both of us. Prefer the plain, course-taught approach over a clever library. No code is merged that the author cannot explain line by line.
2. **Course concepts on purpose.** Each course topic is used somewhere visible in the code (see section 3), so in the viva we can point to it.
3. **Everything free.** Only free plans with no card (Deliverable 2, section 1.6).
4. **Build in thin vertical slices.** Each week ends with something working end to end and deployed, not half of everything.
5. **Design is the contract.** Entities, endpoints and statuses follow Deliverable 2. Any change goes into `DESIGN-CHANGES.md` the same day.
6. **Secrets never in git.** Keys live in `.env` files (git-ignored) and in the Render and Vercel dashboards only.

## 2. Final tech stack

| Layer | Choice | Why | Course week |
|---|---|---|---|
| Language | **TypeScript** everywhere (strict mode) | Types catch bugs early and make the code easier to explain | 3–5 (JS, ES6) |
| Frontend | **React 19 + Vite**, single-page app | Required stack; Vite is the standard fast dev server | 11–14 |
| Routing | **React Router** | Separate customer, brand, tailor and admin areas | 14 |
| State | **Context API** (auth, cart, notifications) + **custom hooks** | Taught in the course; no Redux needed at this size | 13 |
| HTTP client | **axios** instance with interceptors (adds JWT, refreshes token) | Clear, easy to explain | 14 |
| Styling | **Bootstrap 5** + our own theme (CSS variables with the Kapra colours and fonts) | Course teaches Bootstrap; grid makes every page responsive | 2 |
| Forms | Controlled components + a small `useForm` hook of our own | Course teaches controlled components; we can explain every line | 14 |
| Maps | **react-leaflet** + OpenStreetMap tiles; Nominatim through our API | Free, no key | — |
| Real-time | **socket.io-client** | Chat and live notifications | — |
| Backend | **NestJS** (Node.js) | Required stack | 8–9 |
| Validation | **class-validator + class-transformer** with a global `ValidationPipe` | Course week 9 | 9 |
| Database | **PostgreSQL on Supabase** | Required; free | 10 |
| ORM | **TypeORM** with migrations (never `synchronize` in production) | Course week 10 | 10 |
| Auth | **JWT** (passport-jwt), bcrypt password hashing, role guard | Course week 9 security topics | 9 |
| Events | **@nestjs/event-emitter** (built on Node's EventEmitter) | Course week 7 events module; decouples bookings from emails and notifications | 7 |
| API docs | **Swagger (OpenAPI)** at `/api/docs` | Live, clickable API documentation; export to Postman | 7 |
| AI stylist | **Groq** (Llama 3.3 70B, tool calling) | Free, fast | — |
| Try-on | **Gemini** image model, fallback **Hugging Face IDM-VTON Space** (`@gradio/client`) | Free; fallback when one fails | — |
| Sentiment | **cardiffnlp/twitter-xlm-roberta-base-sentiment** in a Python GitHub Actions job | Pre-trained model the instructor asked for; free; too big for Render | — |
| Payments | **Stripe** test mode, hosted Checkout + webhooks | Instructor asked for Stripe; test mode is free | — |
| Email | **Resend** | Free 3,000/month | — |
| Images | **Cloudinary** | Free storage and resizing | — |
| Testing | **Jest** (unit), **Supertest** (API e2e), **Postman** collection, **Vitest + React Testing Library** (a few components) | Course week 7 Postman; week 15 CI | 7, 15 |
| DevOps | **GitHub Actions** (CI, sync job, sentiment job), **Docker** (API image + local Postgres), Render, Vercel | Course week 15 | 15 |
| Runtime | Node.js **24 LTS** on Render, CI and Docker (local Node 26 also works) | Long-term support version in production | 7 |

## 3. Course concepts and where they appear

| Course topic | Where in our code |
|---|---|
| Agile, Scrum, sprint planning (wk 1) | Weekly sprints in `BACKLOG.md`, GitHub Projects board, stand-up notes |
| Responsive design, grid, Bootstrap (wk 2) | Bootstrap grid on every page; mobile-first layouts |
| ES6: classes, arrow functions, destructuring, spread/rest, modules, promises, async/await (wk 3–5) | Everywhere; services are classes, all I/O is async/await |
| DOM events, JSON, forms (wk 6) | React forms, JSON APIs |
| Node modules, EventEmitter, files (wk 7) | Domain events (`booking.confirmed` → email + notification); seed data read from JSON files |
| REST anatomy, HTTP verbs, Postman (wk 7) | REST API with correct verbs and status codes; Postman collection in `docs/postman/` |
| NestJS DI: services, providers, injection tokens (wk 8) | Every module; adapters injected by tokens (`TRY_ON_PROVIDERS`, `LLM_CLIENT`, `EMAIL_SENDER`, `GEOCODER`, `IMAGE_STORAGE`, `PAYMENT_GATEWAY`) |
| Request lifecycle (wk 8) | Middleware → guards → interceptors → pipes → controller → service → interceptors → exception filters; documented in `VIVA.md` |
| DTOs + ValidationPipe (wk 9) | Every request body and query has a DTO class |
| Security: validation, authentication, authorization (wk 9) | bcrypt, JWT, `JwtAuthGuard`, `RolesGuard` + `@Roles()`, ownership checks in services, helmet, CORS, rate limiting |
| Middleware, guards, pipes, interceptors (wk 9) | `RequestIdMiddleware`, `JwtAuthGuard`/`RolesGuard`, `ParseUUIDPipe`/`ValidationPipe`, `LoggingInterceptor`/`ClassSerializerInterceptor` |
| PostgreSQL, SQL vs NoSQL (wk 10) | Supabase Postgres; indexes, constraints, transactions; why relational fits (bookings, payments) |
| TypeORM entities, relations, repositories (wk 10) | 23+ entities with `@OneToMany`, `@ManyToOne`, migrations, repositories injected into services |
| React components, JSX, props, state (wk 11) | Component library in `web/src/components` |
| Lifecycle, reusable components, external APIs (wk 12) | `useEffect` data loading; shared `ProductCard`, `TailorCard`, `StatusTimeline` |
| Hooks, custom hooks, Context API (wk 13) | `useAuth`, `useApi`, `useForm`, `useDebounce`, `useGeolocation`, `useSocket`; `AuthContext`, `CartContext`, `NotificationContext` |
| Controlled forms, React Router, REST integration (wk 14) | All forms; route tree with role-protected layouts; axios service layer |
| DevOps, deployment, CI/CD, Docker (wk 15) | GitHub Actions CI on every PR, auto-deploy from `main`, Dockerfile for the API, docker-compose for local Postgres |

## 4. Repository layout

One GitHub repository (monorepo with npm workspaces), so issues, pull requests and CI live in one place.

```
kapra-planner/
├── api/                      NestJS backend
│   ├── src/
│   │   ├── main.ts           bootstrap: global pipes, filters, helmet, CORS, Swagger
│   │   ├── app.module.ts
│   │   ├── config/           typed config + env validation
│   │   ├── common/           decorators (@Roles, @CurrentUser), guards, filters,
│   │   │                     interceptors, middleware, pipes, pagination DTOs, enums
│   │   ├── database/         data-source.ts, migrations/, seeds/ (JSON seed files)
│   │   ├── integrations/     one folder per external service, each behind an interface
│   │   │   ├── groq/  gemini/  hf-tryon/  stripe/  resend/
│   │   │   ├── nominatim/  cloudinary/  brand-feeds/
│   │   └── modules/          one folder per feature
│   │       ├── auth/  users/  profiles/  admin/
│   │       ├── brands/  catalogue/  stylist/  outfits/  tryon/
│   │       ├── tailors/  bookings/  chat/  reviews/  orders/  payments/
│   │       ├── notifications/  jobs/  health/
│   └── test/                 e2e tests (Supertest)
├── web/                      React frontend
│   └── src/
│       ├── main.tsx  App.tsx  routes.tsx
│       ├── api/              axios instance + one file per backend module
│       ├── context/          AuthContext, CartContext, NotificationContext
│       ├── hooks/            useApi, useForm, useDebounce, useGeolocation, useSocket
│       ├── components/       shared UI (buttons, cards, map, timeline, chat box)
│       ├── layouts/          PublicLayout, CustomerLayout, BrandLayout, TailorLayout, AdminLayout
│       ├── pages/            customer/  brand/  tailor/  admin/  auth/
│       ├── styles/           theme.css (Kapra tokens over Bootstrap)
│       └── utils/            formatters, validators
├── jobs/sentiment/           Python job: score new reviews (requirements.txt, score.py)
├── docs/                     this plan, Postman collection, viva notes, screenshots
├── .github/workflows/        ci.yml, catalogue-sync.yml, sentiment.yml
├── docker-compose.yml        local PostgreSQL for development and e2e tests
├── render.yaml               Render blueprint for the API
└── README.md
```

### Backend module anatomy (every feature module looks the same)

```
modules/bookings/
├── bookings.module.ts        wires controller, service, repositories
├── bookings.controller.ts    HTTP only: routes, guards, DTOs, status codes
├── bookings.service.ts       business rules; the only place that changes data
├── entities/booking.entity.ts, booking-update.entity.ts
├── dto/create-booking.dto.ts, update-booking-status.dto.ts, booking-query.dto.ts
├── booking-status.machine.ts allowed status transitions (state machine from D2 Fig. 22)
├── events/booking-confirmed.event.ts
└── bookings.service.spec.ts  unit tests
```

Rule: **controllers never touch repositories; services never read `req`.** This keeps each layer explainable.

## 5. Key technical decisions

| Decision | Choice | Reason we can give in the viva |
|---|---|---|
| Architecture | Layered SPA + modular monolith (D2 section 3.7) | One deployable, free hosting, clear module boundaries |
| IDs | UUID primary keys | Not guessable in URLs; safe to generate anywhere |
| Money | Integer rupees (`int`), never floats | Floats round badly (0.1 + 0.2) |
| Time | `timestamptz` in UTC; displayed in Asia/Karachi | Avoids timezone bugs |
| Auth tokens | Access JWT (15 min) + refresh token (7 days), refresh tokens stored hashed in DB and rotated on every use, revoked on logout | Short-lived access limits damage; rotation detects stolen refresh tokens |
| Where tokens live | Access token in memory (React state); refresh token in `localStorage` | Frontend (Vercel) and API (Render) are on different sites, so cookies would be third-party and blocked by some browsers. If we later put both on `*.notesbyraheem.xyz`, we switch the refresh token to an httpOnly cookie |
| Authorization | Role guard for "what kind of user" + ownership check in the service for "is this yours" | Guards alone cannot know that booking 42 belongs to this customer |
| Validation | Global `ValidationPipe({ whitelist, forbidNonWhitelisted, transform })` | Rejects unknown fields (mass-assignment protection) |
| Errors | One global exception filter → `{ statusCode, message, error, requestId }` | Consistent error shape for the frontend |
| Pagination | `?page=&limit=` (max 50) → `{ data, meta: { page, limit, total } }` | Predictable, bounded queries |
| Transactions | `DataSource.transaction()` for booking + payment updates and stock changes | All-or-nothing changes |
| Status changes | State machine object; illegal transitions throw `409 Conflict` | Enforces D2 Fig. 22 and 23 in code |
| Webhooks | Verify Stripe signature on the raw body; store processed event IDs; handler is idempotent | Stripe can resend the same event |
| External APIs | Interface + injection token + adapter class; timeouts; retries only where safe | Swap or mock providers; tests never call real APIs |
| AI safety | Stylist can only pick products by ID from tool results; backend re-validates ID, price, size, stock, budget | No invented products |
| Real-time | Socket.IO gateway; JWT checked on connection; rooms per booking and per user | Only the two parties see a chat |
| Images | Uploaded to Cloudinary from the API, never stored in Postgres | Database stays small (500 MB limit) |
| Config | `@nestjs/config` + validated env schema; app refuses to start if a variable is missing | Fails fast instead of failing at demo time |

## 6. Feature build order and how each AI part works

**Order:** foundation → auth and roles → catalogue and sync → AI stylist and outfits → try-on → tailors and map → bookings and payments → tracking, chat, notifications, email → reviews and ranking → product orders → admin and analytics → hardening and polish.
This order means every feature builds on finished ones (outfits need products, bookings need outfits and tailors, reviews need bookings).

**Product sync and tagging.** For each verified brand with a feed URL, fetch the public product feed page by page, upsert products and size variants, hide products that disappeared, then send only *new* products to Groq in batches of 20 with a strict JSON prompt that returns `{colour, occasion, gender, style}` per ID. Tags are stored, so each product is tagged once.

**AI stylist agent.** `StylistService.plan()` starts a Groq chat with three tools: `searchProducts(filters)`, `buildOutfit(productIds)`, `checkBudget(outfit)`. Loop: send messages → if the model asks for a tool, our code runs it against PostgreSQL and returns the result → repeat (max 6 tool calls, 30 s timeout) → final answer is JSON with product IDs and reasons → we validate every ID, price, size and stock and the budget → if anything fails, one corrective retry with the error message → save suggestions. The model never sees anything except what our tools return.

**Try-on.** `TryOnService` receives a list of providers through the `TRY_ON_PROVIDERS` token: `[GeminiTryOnProvider, HfTryOnProvider]`. It tries them in order (strategy and chain-of-responsibility patterns). The request returns `202 Accepted` immediately; the work runs in the background and the frontend polls `GET /tryons/:id` every 3 s.

**Ranking.** `bestScore = 0.5 × Bayesian rating + 0.3 × mean sentiment + 0.2 × completion rate`, each scaled to 0–1. Bayesian rating = `(C × m + Σ ratings) / (C + n)` with `m` = platform average, `C` = 5. Recomputed when a review is added (rating part) and after the hourly sentiment job (sentiment part).

## 7. Data for the demo

- **Brands:** 6 brands with working public product feeds, chosen and tested in week 1 (candidates: Nishat Linen, Limelight, Edenrobe, Gul Ahmed Ideas, Bonanza Satrangi, Alkaram). We store product links and images by URL and always link back to the brand.
- **Tailors:** 15–20 demo tailors in real Islamabad/Rawalpindi areas with made-up shop names, services, prices and 3–8 seeded reviews each (mixed English, Urdu, Roman Urdu) so ranking and sentiment have data.
- **Demo accounts:** one per role (`customer@`, `brand@`, `tailor@`, `admin@`), created by the seed script; passwords only in the private `.env`.
- **Try-on photos:** 3–4 full-length photos of people who agreed (kept out of the public repo).
- Seed data lives in `api/src/database/seeds/*.json` and is loaded by `npm run seed`.

## 8. Testing strategy

| Level | Tool | What | Target |
|---|---|---|---|
| Unit | Jest | Services: stylist validation, status machines, ranking formula, budget checks, auth | 70% line coverage on services |
| API e2e | Jest + Supertest against Docker Postgres | Auth flow, booking + webhook flow, role and ownership denial (403/404) | Main use cases UC-01, 04, 08, 09, 10, 12 |
| Manual API | Postman collection with environments (local, production) | Every endpoint, with example bodies | Exported to `docs/postman/` |
| Frontend | Vitest + React Testing Library | `useForm`, protected routes, `StatusTimeline`, cart totals | Key components only |
| AI quality | Fixed set of 10 stylist requests in `docs/stylist-eval.md` | Real products, within budget, under 30 s | Re-run after prompt changes |
| Before each release | Checklist in `BACKLOG.md` | Login per role, one full booking with test card, chat, review | Every demo |

CI (`ci.yml`) runs on every pull request: install → lint → type-check → unit tests → e2e tests (Postgres service container) → build both apps. A red CI blocks merging.

## 9. Environments and deployment

| Environment | Frontend | API | Database |
|---|---|---|---|
| Local | `npm run dev -w web` (Vite, port 5173) | `npm run start:dev -w api` (port 3000) | Docker Postgres (`docker compose up -d`) or Supabase |
| Production | Vercel, auto-deploy from `main` | Render, auto-deploy from `main` (Node 24) | Supabase |

- Migrations run automatically before the API starts on Render (`npm run migration:run && node dist/main`).
- Scheduled jobs: `catalogue-sync.yml` (02:00 PKT daily), `sentiment.yml` (hourly), cron-job.org pings `/api/health` every 10 minutes.
- Stripe webhook points at `https://<render-url>/api/v1/payments/webhook`; locally we use the Stripe CLI to forward webhooks.

## 10. Git and teamwork

- `main` is always deployable and protected: changes only by pull request with green CI and one review from the other member.
- Branches: `feat/bookings-status`, `fix/login-error`, `docs/viva-auth`.
- Commits follow Conventional Commits: `feat(bookings): add status state machine`.
- GitHub Projects board with columns Backlog → This week → In progress → Review → Done; one issue per task in `BACKLOG.md`.
- **Viva rule:** the reviewer must be able to explain the pull request before approving it. Each finished module adds its section to `VIVA.md`.
- Short stand-up message three times a week: done, next, blocked.

### Who leads what (both must understand everything)

| Abdulraheem (241854) | Wania Rahman (241830) |
|---|---|
| NestJS foundation, auth, database and migrations | React foundation, theme, layouts, routing, auth screens |
| Catalogue sync, Groq tagging, AI stylist, try-on | Catalogue browsing, stylist and outfit screens, try-on screen |
| Tailor ranking, bookings, Stripe, webhooks, email, chat gateway | Tailor map, booking flow, tracking timeline, chat UI |
| CI/CD, Docker, deployment, jobs | Brand panel, tailor panel, admin panel screens |
| Unit and e2e tests (backend) | Component tests, Postman collection, manual test checklist |

Every week, each person explains one of the other person's modules to them (rehearsal for the viva).

## 11. Timeline (weekly sprints)

Detailed tasks are in `BACKLOG.md`. Each sprint ends with a deployed demo.

| Week | Dates | Goal | Demo at the end |
|---|---|---|---|
| 0 | 23 – 29 Oct | Setup, walking skeleton, four technical spikes | Empty app live on Vercel + Render + Supabase; Gemini try-on, Groq tool call, Stripe webhook and one brand feed proven |
| 1 | 30 Oct – 5 Nov | Auth, users, roles, refresh tokens; frontend shell | Register and log in as each role; protected pages |
| 2 | 6 – 12 Nov | Profiles, style preferences, measurements, brand/tailor onboarding, admin verification | Brand and tailor sign-up approved by admin |
| 3 | 13 – 19 Nov | Brands, stores, products, variants, feed sync, Groq tagging, catalogue UI | Browse and filter real products |
| 4 | 20 – 26 Nov | Brand panel products and stores, wishlist, AI stylist backend | Stylist returns valid outfits through Swagger |
| 5 | 27 Nov – 3 Dec | Stylist UI, outfits, swap, feedback, try-on | Plan an outfit and try it on |
| 6 | 4 – 10 Dec | Tailors, services, map, geocoding, filters, ranking v1 | Find and rank tailors on the map |
| 7 | 11 – 17 Dec | Bookings, Stripe Checkout, webhook, receipts, notifications | Book and pay a tailor with a test card |
| 8 | 18 – 24 Dec | Tracking timeline, chat, reviews, sentiment job, product orders | Full tailor journey to review |
| 9 | 25 – 31 Dec | Admin panel, analytics, security hardening, test coverage | All roles complete; CI green with coverage |
| 10 | 1 – 8 Jan | Polish, performance, demo data, final deploy, viva rehearsal | Final demo; viva practice round |

Buffer: if a week slips, cut in this order: brand analytics (FR-27), product orders (FR-19), refunds automation (FR-20) — all "Should/Could" in D2.

## 12. Risks

| Risk | Plan |
|---|---|
| Gemini image generation unavailable on the free key | Week 0 spike; Hugging Face Space fallback is already in the design |
| Groq rate limits during the demo | Tag products once; cache stylist results for identical requests for 10 minutes |
| Render free server sleeps or restarts | cron-job.org ping; Socket.IO client reconnects automatically |
| Supabase pauses after 7 idle days | Hourly job touches the database |
| A brand blocks its feed | Keep last good data; 6 brands so one failure does not matter |
| One of us is unavailable for a week | Both know every module through weekly explanations; tasks are small issues anyone can pick up |
| Viva questions on code we did not write ourselves | Viva rule in section 10; `VIVA.md` filled in per module; no copy-pasted code without understanding |

## 13. Definition of done (every task)

- [ ] Works end to end on the deployed site, not only locally
- [ ] DTO validation and correct HTTP status codes
- [ ] Role and ownership checks
- [ ] Unit tests for the service logic; Postman request added
- [ ] No secrets, no `console.log`, no unused code; lint and type-check pass
- [ ] Reviewed and explained by the other member
- [ ] `VIVA.md` section updated if the module is finished
