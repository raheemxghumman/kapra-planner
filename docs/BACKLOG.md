# Backlog

Task IDs (`T0.1`) become GitHub issues. Requirement IDs (FR/NFR/UC) refer to Deliverable 2.
Lead: **A** = Abdulraheem, **W** = Wania (the other member reviews).

## Week 0 — Setup and spikes (23 – 29 Oct)

- [x] T0.1 A: Create GitHub repo `kapra-planner`, npm workspaces, `.gitignore`, `.editorconfig`, Prettier, ESLint, branch protection on `main`
- [x] T0.2 A: Scaffold `api` with Nest CLI; config module with env validation; `/api/v1/health` endpoint; Swagger at `/api/docs`
- [x] T0.3 A: TypeORM data source for Supabase + `docker-compose.yml` local Postgres; first empty migration runs
- [x] T0.4 W: Scaffold `web` with Vite (React + TypeScript); Tailwind theme with Kapra colours and fonts; Motion page transitions; 3D fabric hero; React Router
- [x] T0.5 W: axios instance with base URL from env; health check shown on home page
- [ ] T0.6 A: Deploy API to Render (Docker or Node 24), web to Vercel, set env vars, CORS between them
- [x] T0.7 A: GitHub Actions `ci.yml` (lint, type-check, test, build for both apps)
- [x] T0.8 A: **Spike** Gemini try-on with one photo and two garments; **spike** HF IDM-VTON Space via `@gradio/client`; record quality, time and limits in `docs/spikes.md`
- [x] T0.9 A: **Spike** Groq tool calling with a fake `searchProducts` tool
- [x] T0.10 A: **Spike** Stripe test Checkout (webhook delivery tested in week 7 with the Stripe CLI)
- [x] T0.11 W: **Spike** read one brand product feed; list 6 brands whose feeds work
- [ ] T0.12 W: GitHub Projects board with all issues from this file

## Week 1 — Auth and roles (30 Oct – 5 Nov) · FR-01, FR-02, NFR-03, UC-01

- [x] T1.1 A: `User` entity (role enum: customer, brand, tailor, admin; status: active, pending, suspended), migration
- [x] T1.2 A: `POST /auth/register`, `POST /auth/login` with bcrypt; DTOs; login lockout after 5 failures for 15 min
- [x] T1.3 A: Access + refresh tokens; `refresh_tokens` table (hashed, rotated); `POST /auth/refresh`, `POST /auth/logout`
- [x] T1.4 A: `JwtAuthGuard` (global, with `@Public()` opt-out), `RolesGuard` + `@Roles()`, `@CurrentUser()` decorator
- [x] T1.5 A: Global exception filter, `LoggingInterceptor`, `RequestIdMiddleware`, helmet, throttler
- [ ] T1.6 A: Unit tests for auth service; e2e test register → login → refresh → logout
- [ ] T1.7 W: `AuthContext` + `useAuth`; axios interceptors (attach token, refresh on 401 once)
- [ ] T1.8 W: Login and register pages (role choice), `useForm` hook with validation, error display
- [ ] T1.9 W: `ProtectedRoute` by role; four layouts with navigation; logout
- [ ] T1.10 W: Postman collection started (auth folder, environments)

## Week 2 — Profiles and onboarding (6 – 12 Nov) · FR-03, FR-04, FR-32, FR-33, UC-02, UC-15, UC-25, UC-26

- [ ] T2.1 A: `style_profiles`, `measurement_profiles` entities + CRUD endpoints (`/me/...`)
- [ ] T2.2 A: Brand and tailor onboarding: `brands`, `tailors` records created as pending
- [ ] T2.3 A: Admin endpoints: list pending, approve/reject with reason, suspend/reactivate users
- [ ] T2.4 A: Cloudinary adapter (`IMAGE_STORAGE` token) + avatar upload with size/type validation
- [ ] T2.5 W: Customer profile pages: style preferences form, measurement profiles list/edit
- [ ] T2.6 W: Brand and tailor "pending approval" screens; admin verification page
- [ ] T2.7 W: Notification toasts component (used everywhere later)

## Week 3 — Catalogue and sync (13 – 19 Nov) · FR-05, FR-36, UC-03, UC-29

- [ ] T3.1 A: `brand_stores`, `products`, `product_variants` entities, indexes on (brand, category, price), migration
- [ ] T3.2 A: Brand feed adapter + `CatalogueSyncService` (upsert, hide missing, report)
- [ ] T3.3 A: Groq tagging of new products (batch 20, strict JSON, retry on rate limit)
- [ ] T3.4 A: `GET /products` with filters, search, pagination; `GET /products/:id`
- [ ] T3.5 A: `POST /jobs/sync` (secret header) + `catalogue-sync.yml` workflow
- [ ] T3.6 A: Seed script: 6 brands + first sync
- [ ] T3.7 W: Catalogue page: filter sidebar, search with `useDebounce`, product grid, pagination
- [ ] T3.8 W: Product detail page with size availability and "view on brand site"

## Week 4 — Brand panel, wishlist, stylist backend (20 – 26 Nov) · FR-06, FR-24, FR-25, FR-08, UC-17, UC-18, UC-14, UC-04

- [ ] T4.1 A: Brand panel endpoints: products and variants CRUD (own brand only), stores CRUD
- [ ] T4.2 A: Nominatim adapter (`GEOCODER` token) with 1 req/s limit and DB cache; `GET /geocode`
- [ ] T4.3 A: Wishlist endpoints (`saved_products`)
- [ ] T4.4 A: `stylist_requests`, `outfit_suggestions`, `outfit_items` entities; `StylistService` agent loop with 3 tools and validation
- [ ] T4.5 A: Unit tests: validation rejects fake IDs, over-budget and out-of-stock items
- [ ] T4.6 W: Brand panel: product list, add/edit product form with variants and image upload, store locations with map pin
- [ ] T4.7 W: Wishlist page; heart button on product cards

## Week 5 — Stylist UI, outfits, try-on (27 Nov – 3 Dec) · FR-08 – FR-13, UC-04 – UC-06

- [ ] T5.1 A: Outfits CRUD, swap item, suggestion feedback endpoints
- [ ] T5.2 A: `tryons` entity; `TryOnService` with `TRY_ON_PROVIDERS` (Gemini, HF); background processing; delete endpoint removes images
- [ ] T5.3 A: `docs/stylist-eval.md`: 10 fixed requests and results
- [ ] T5.4 W: Stylist request page (pre-filled from preferences), loading state, outfit cards with reasons and totals
- [ ] T5.5 W: Swap piece dialog; save outfit; like/dislike with reason; My outfits page
- [ ] T5.6 W: Try-on page: photo upload, polling with progress, result, retry, delete

## Week 6 — Tailors and map (4 – 10 Dec) · FR-14 – FR-16, FR-28, UC-07, UC-21

- [ ] T6.1 A: `tailor_services` entity; tailor profile and services endpoints (own profile only)
- [ ] T6.2 A: `GET /tailors` with radius (Haversine in SQL), rating, price, specialty filters, sort by best score/distance/price
- [ ] T6.3 A: `TailorRankingService` (Bayesian rating + sentiment + completion) with unit tests
- [ ] T6.4 A: Seed 15–20 tailors with services and reviews
- [ ] T6.5 W: Tailors page: map with pins (react-leaflet) + list, filters, `useGeolocation`
- [ ] T6.6 W: Tailor profile page: services, portfolio, reviews, score breakdown, directions link
- [ ] T6.7 W: Tailor panel: profile, location pin, services, portfolio upload

## Week 7 — Bookings and payments (11 – 17 Dec) · FR-17, FR-18, FR-20, FR-29, UC-08, UC-09, UC-22

- [ ] T7.1 A: `bookings`, `booking_updates`, `payments` entities; booking state machine with tests
- [ ] T7.2 A: `POST /bookings` → Stripe Checkout session (`PAYMENT_GATEWAY` token); webhook with signature check, idempotency, transaction
- [ ] T7.3 A: Tailor accept/decline (decline → refund); `PATCH /bookings/:id/status`
- [ ] T7.4 A: Domain events: `booking.confirmed`, `booking.status-changed` → notifications + Resend email (`EMAIL_SENDER` token)
- [ ] T7.5 A: `notifications` table + endpoints; Socket.IO gateway with JWT auth, per-user rooms
- [ ] T7.6 A: e2e test: book → webhook → confirmed → tailor accepts
- [ ] T7.7 W: Booking flow: choose service, outfit, measurements, due date, summary, redirect to Stripe, success/cancel pages
- [ ] T7.8 W: Notification bell with `NotificationContext` + `useSocket`
- [ ] T7.9 W: Tailor panel bookings list: accept/decline, post update with note/photo

## Week 8 — Tracking, chat, reviews, orders (18 – 24 Dec) · FR-19, FR-21 – FR-23, FR-26, FR-31, UC-10 – UC-13, UC-19, UC-23, UC-24

- [ ] T8.1 A: Chat: `messages` entity, gateway events (join, message, read), history endpoint, only booking parties
- [ ] T8.2 A: Reviews endpoint (delivered + not reviewed); rating part of score updated immediately
- [ ] T8.3 A: `jobs/sentiment/score.py` + `sentiment.yml` hourly; `POST /jobs/rank-tailors`
- [ ] T8.4 A: Product orders: `orders`, `order_items`; checkout per brand; stock decrement in a transaction; brand status updates
- [ ] T8.5 W: Booking detail page: `StatusTimeline`, chat box, review form after delivery
- [ ] T8.6 W: Cart (`CartContext`) and checkout; My orders page
- [ ] T8.7 W: Brand panel orders page; tailor panel reviews and earnings

## Week 9 — Admin, analytics, hardening (25 – 31 Dec) · FR-27, FR-34, FR-35, NFR-01 – NFR-12

- [ ] T9.1 A: Admin: hide reviews, sync reports, rerun sync; brand analytics endpoint
- [ ] T9.2 A: Security pass: ownership checks on every `:id` route, rate limits on auth and AI routes, upload limits, helmet CSP
- [ ] T9.3 A: Performance: indexes from slow queries, pagination everywhere, N+1 check
- [ ] T9.4 A: Coverage to 70% on services; e2e for denial cases (403/404)
- [ ] T9.5 W: Admin panel pages: users, pending, reviews, sync reports
- [ ] T9.6 W: Brand analytics charts (if time; FR-27 is Could)
- [ ] T9.7 W: Accessibility pass (contrast, labels, keyboard), responsive check at 360 px

## Week 10 — Release and viva prep (1 – 8 Jan)

- [ ] T10.1 Both: Fix bug list; final demo data; final deploy
- [ ] T10.2 Both: Screenshots and short demo video in `docs/`
- [ ] T10.3 Both: Complete `VIVA.md`; two mock vivas (each asks the other 20 questions)
- [ ] T10.4 Both: Release checklist below passes on production

## Release checklist

- [ ] Log in as customer, brand, tailor, admin
- [ ] Stylist returns valid outfits; try-on works (or falls back)
- [ ] Find tailor on map; book; pay with Stripe test card 4242 4242 4242 4242; receipt email received
- [ ] Tailor accepts and updates status; customer sees timeline and notification; chat both ways
- [ ] Deliver → review → score updates after the hourly job
- [ ] Brand adds product; it appears in catalogue
- [ ] CI green; no secrets in repo; `/api/docs` loads
