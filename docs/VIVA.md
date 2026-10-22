# Viva preparation

Two parts:
1. **Concept questions**: answered now, with where to point in our code.
2. **Module notes**: filled in when each module is finished (what it does, request flow, key files, decisions, likely questions).

Practise by asking each other these questions out loud. If an answer is not in our own words, it is not ready.

---

## Part 1 — Concept questions

### Architecture
**Q: Describe your architecture and why you chose it.**
Layered client–server: React SPA (presentation) → NestJS REST + WebSocket API (application) → PostgreSQL (data). The backend is a modular monolith: one deployable app split into feature modules. It fits a two-person team and free hosting, and modules keep features separate. Microservices would add network calls, several deployments and distributed data for no benefit at our size.

**Q: What is a SPA and what does the server send?**
The server (Vercel) sends one `index.html` and JS bundles. React Router changes pages in the browser without reloading; data comes from the API as JSON.

**Q: REST vs WebSockets — why both?**
REST is request–response and fits CRUD. Chat and live notifications need the server to push messages, so we use Socket.IO (WebSocket with fallback). Polling would waste requests and be slower.

### NestJS
**Q: What is dependency injection? Show an example.**
Classes declare what they need in the constructor; Nest's container creates and passes them in. `BookingsService` receives `Repository<Booking>`, `PaymentsService`, `EventEmitter2`. Benefits: loose coupling and easy mocking in tests.

**Q: What is an injection token and why use one?**
A key for a provider that is not a concrete class, e.g. `TRY_ON_PROVIDERS` or `EMAIL_SENDER`. Services depend on an interface; the module decides which class is bound to the token, so Gemini can be swapped for Hugging Face, or a fake in tests.

**Q: Explain the request lifecycle in NestJS.**
Middleware → guards → interceptors (before) → pipes → controller → service → interceptors (after) → exception filters (if something throws). In our app: `RequestIdMiddleware` → `JwtAuthGuard`, `RolesGuard` → `LoggingInterceptor` → `ValidationPipe`, `ParseUUIDPipe` → controller → service → response or `AllExceptionsFilter`.

**Q: Difference between middleware, guard, pipe and interceptor?**
Middleware: raw request/response, runs first (request IDs, logging). Guard: returns true/false — may this request continue (auth, roles)? Pipe: transforms or validates input (DTO validation, UUID parsing). Interceptor: wraps the handler, can change the result or time it (logging, serialisation).

**Q: What does `ValidationPipe({ whitelist, forbidNonWhitelisted, transform })` do?**
Validates bodies against DTO decorators, strips (or rejects) properties not in the DTO — stops a user sending `role: "admin"` — and converts plain JSON into DTO class instances with correct types.

**Q: How does a module work?**
`@Module` lists controllers, providers, imported modules and exported providers. Providers are only visible to other modules if exported.

### Security
**Q: How do you store passwords?**
bcrypt hash with salt (cost 10+). We never store or log the plain password; login compares with `bcrypt.compare`.

**Q: Explain your JWT flow.**
Login returns an access token (15 min) and refresh token (7 days). The access token is sent as `Authorization: Bearer …`. When it expires, axios calls `/auth/refresh` once; the server checks the hashed refresh token in the database, issues a new pair and revokes the old one (rotation). Logout revokes the refresh token.

**Q: Authentication vs authorization?**
Authentication: who are you (JWT guard). Authorization: what may you do (roles guard + ownership check in the service).

**Q: How do you stop a customer reading another customer's booking?**
The service loads the booking and checks `booking.customerId === currentUser.id` (or tailor/admin); otherwise `404` so we do not reveal it exists.

**Q: XSS, CSRF, SQL injection — how are you protected?**
XSS: React escapes output; we never use `dangerouslySetInnerHTML`; helmet sets security headers. CSRF: we authenticate with a header token, not cookies, so a forged cross-site request has no token. SQL injection: TypeORM uses parameterised queries; we never build SQL from strings.

**Q: Supabase has its own public REST API for every table. How did you secure it?**
We never use it; all data goes through NestJS. Each migration enables row level security on its tables with no policies, so Supabase's `anon` and `authenticated` roles get zero rows (we verified the `users` table returns `[]`). Our backend connects as the table owner, which RLS does not restrict.

**Q: Why is login slow on purpose, and why the same error for wrong email and wrong password?**
bcrypt with cost 12 takes ~250 ms, which makes brute force expensive. For an unknown email we still compare against a dummy hash, so attackers cannot tell from the response time or the message whether an email is registered.

**Q: What is refresh token reuse detection?**
Every refresh token works once. If an already-used token comes back, either the user or a thief is replaying it, so we revoke all of that user's sessions. The update uses `WHERE revoked_at IS NULL`, so two simultaneous refreshes cannot both succeed.

**Q: Why verify the Stripe webhook signature?**
Anyone could POST "payment succeeded" to our URL. Stripe signs each event with our webhook secret; we verify the signature on the raw body before trusting it.

### Database
**Q: Why PostgreSQL and not MongoDB?**
Our data is relational with strong rules: bookings belong to customers and tailors, payments to bookings, stock must never go negative. Postgres gives foreign keys, constraints, joins and transactions. MongoDB suits flexible documents without many relations.

**Q: What is a transaction and where do you use one?**
A group of queries that all succeed or all roll back. Confirming a payment updates `payments` and `bookings` together; placing an order inserts order items and decrements stock together.

**Q: What are migrations and why not `synchronize: true`?**
Versioned SQL changes kept in git. `synchronize` can silently drop columns and data in production; migrations are reviewed and repeatable.

**Q: What indexes do you have and why?**
Foreign keys used in joins, plus (brand_id, category, price) for catalogue filters, (tailor_id) on reviews, (booking_id, created_at) on messages. Indexes speed up reads at a small cost on writes.

**Q: What is the N+1 problem?**
Loading a list, then one extra query per row for a relation. We avoid it with joins (`relations` / query builder `leftJoinAndSelect`).

### React
**Q: State vs props?**
Props are inputs passed from parent to child (read-only). State is data a component owns and can change with `setState`, causing a re-render.

**Q: Why Context API and not Redux?**
We only have three pieces of global state (auth, cart, notifications). Context removes prop drilling without extra libraries.

**Q: Explain `useEffect` and its dependency array.**
Runs side effects after render. Empty array: once on mount. With dependencies: when they change. Return a cleanup function for subscriptions (e.g. socket listeners).

**Q: What is a custom hook? Give one of yours.**
A function starting with `use` that reuses stateful logic. `useApi(fn)` returns `{ data, loading, error, reload }`; `useDebounce(value, 400)` delays search requests.

**Q: Controlled vs uncontrolled components?**
Controlled: input value comes from React state and changes through `onChange`. All our forms are controlled, via `useForm`.

**Q: Why keys in lists?**
They let React match items between renders; we use database IDs, never array indexes, for lists that change.

**Q: How does the frontend talk to the backend?**
Through an axios instance in `src/api/` with the base URL from env. A request interceptor adds the JWT; a response interceptor refreshes the token on a 401 and retries once.

### AI parts
**Q: How does the stylist avoid inventing products?**
It can only see products returned by our `searchProducts` tool and must answer with product IDs. The backend checks every ID, price, size, stock and the budget before saving; failures trigger one corrective retry.

**Q: What is tool calling?**
We describe functions (name, JSON parameters) to the LLM. Instead of answering, the model can ask us to call one; our code runs it and sends back the result. The model never runs code or queries the database itself.

**Q: How is the best tailor chosen? Where is the pre-trained model?**
`0.5 × Bayesian rating + 0.3 × mean review sentiment + 0.2 × completion rate`. Sentiment comes from a pre-trained multilingual RoBERTa model (`cardiffnlp/twitter-xlm-roberta-base-sentiment`) run hourly in GitHub Actions. Bayesian rating stops one 5-star review putting a new tailor at the top.

**Q: How does try-on work, and what happens if it fails?**
The photo and garment image are sent to IDM-VTON, a pre-trained diffusion try-on model hosted free on a Hugging Face Space. `TryOnService` tries providers in order through the `TRY_ON_PROVIDERS` token (IDM-VTON, then Leffa). If all fail, the try-on is marked failed with a retry button. We tested Gemini too, but its image models have no free quota.

**Q: How do you handle API rate limits with several keys?**
`KeyPool` keeps using one key until the provider answers with a rate-limit error (429), rests that key for the time the provider asks (or 60 s) and retries the same request with the next free key. Other errors are thrown at once, because another key would not fix them. It has unit tests with a fake clock.

### DevOps
**Q: What does your CI pipeline do?**
On every push and pull request: install, lint (oxlint), type-check, unit tests (Vitest), build both apps, and build the API Docker image. e2e tests against a Postgres service container are added with the first database features. Merging is blocked if it fails. Render and Vercel deploy `main` automatically.

**Q: What is Docker used for in your project?**
A Dockerfile packages the API with Node 24 so it runs the same everywhere; docker-compose starts a local Postgres for development and e2e tests.

**Q: How do you keep secrets safe?**
`.env` files are git-ignored; production values are set in the Render, Vercel and GitHub Actions secret settings. Config validation stops the app if one is missing.

---

## Part 2 — Module notes

Short notes per module: what it does, how a request flows, where the code is, and what we will be asked.

### Auth and roles
- **Does:** register, login, refresh, logout; four roles (customer, brand, tailor, admin); brand and tailor accounts start `pending`.
- **Flow (login):** `AuthController.login` → `AuthService` loads the user with the password hash → `bcrypt.compare` (a dummy hash is compared when the email does not exist, so the response time does not reveal accounts) → 5 failures lock the account for 15 minutes → `TokensService.issue` returns a 15-minute JWT access token and a random refresh token (only its SHA-256 hash is stored).
- **Refresh:** single use. `consume()` marks it used with a conditional update; using an old token again revokes every session of that user (theft detection). Refresh allows 40 calls a minute, login 10.
- **Guards (global, in order):** Throttler → `JwtAuthGuard` (skip with `@Public()`) → `RolesGuard` (`@Roles()`).
- **Files:** `api/src/modules/auth/*`, `api/src/common/guards/*`, `web/src/api/http.ts`, `web/src/api/session.ts`, `web/src/context/AuthContext.tsx`.
- **Q: Why is the access token not in localStorage?** It lives only in memory, so a script cannot read it later. The refresh token is in localStorage because the API and website are on different domains (cookies would be third-party).
- **Q: What happens when the access token expires mid-session?** The axios response interceptor sees 401, refreshes once (one shared request even if many calls fail together) and repeats the call.

### Catalogue and sync
- **Does:** imports about 5,000 products from 12 brands' public Shopify feeds every night and tags category, colours, occasions and fabric.
- **Flow:** `CatalogueSyncService.syncAll` → one brand at a time (`ShopifyFeedClient`, 250 per page, pauses and back-off) → `tagByRules` (keyword rules, unit tested) → upsert in chunks of 100 → products missing from the feed are hidden → Groq (`gpt-oss-20b`) refines up to 300 untagged products per run.
- **Q: Why rules first and AI second?** Rules are free, instant and testable; the AI only fixes what rules cannot, which keeps us inside the free Groq limits.

### AI stylist
- **Does:** 2-3 complete outfits for an occasion and budget, from real in-stock pieces in the customer's size.
- **Flow:** `StylistService.createRequest` builds the context (style profile, sizes, disliked products) → `StylistAgentService.run`: Groq `gpt-oss-120b` with two tools. `searchProducts` runs a real SQL query (gender, style, stock, price; ranked by occasion, colour and size match). `submitOutfits` is the only way to answer → every outfit is checked by `validateOutfit` (complete look, one piece per slot, within budget) and every id must have come from a search → problems go back to the model once → results saved in one transaction.
- **Fallback:** if the AI fails or takes more than 50 s, `RuleStylistService` builds looks from the same queries and the same validation (the UI shows "Classic picks").
- **Files:** `api/src/modules/stylist/agent/*` (the rules have their own tests), `web/src/pages/customer/stylist/*`.
- **Q: How do you stop the AI inventing products?** It can only use ids our search returned; anything else is rejected and sent back as an error.
- **Q: How does key rotation work?** `KeyPool` holds four Groq keys; on a 429 it rests that key (honouring `Retry-After`) and uses the next.

### Virtual try-on
- **Does:** dresses the customer's own photo in a chosen piece.
- **Flow:** `POST /tryons` returns 202 at once → a background job downloads both images → `runProviderChain([IdmVton, Leffa])` (chain of responsibility, 3-minute timeout each) → result stored on Cloudinary → the page polls `GET /tryons/:id` every 3 s. The same photo + piece is cached; one running job per customer.
- **Privacy:** photos are private, at most 3, and deleting a photo deletes its try-ons and files.
- **Q: Why not Gemini?** Its image models have no free quota (see `spikes.md`); it can be added as another provider without changing the service.

### Tailors, map and the "best tailor" ranking
- **Search:** `GET /tailors?lat&lng&radiusKm&sort`: a bounding box first (uses the lat/lng index), then the exact Haversine distance in SQL; sorts best, nearest, rating, price.
- **Score (pure functions, unit tested):** `0.55 × Bayesian rating + 0.30 × review sentiment + 0.15 × completion rate`. Bayesian rating = (5 × global mean + sum of ratings) / (5 + count), so one 5-star review does not beat fifty 4.8-star ones.
- **Pre-trained model:** `nlptown/bert-base-multilingual-uncased-sentiment` reads each review (English, Urdu, Roman Urdu) and gives a probability for 1-5 stars; the expected stars scaled to 0-1 is the sentiment. It runs in a nightly job (`npm run job:reviews`, GitHub Actions), not in the web server, because the model is about 170 MB.
- **Limitation we admit:** Roman Urdu is scored less reliably, which is why sentiment is only 30% of the score.
- **Map:** OpenStreetMap tiles with Leaflet; address search by Nominatim (one request per second, answers cached in `geocode_cache`).

### Bookings, payments, tracking and chat
- **State machine (`booking-status.ts`, tested):** pending_payment → requested → accepted → in_progress → ready → completed; cancel (customer, before acceptance) and decline (tailor) refund the card. `nextStatus(current, action, actor)` rejects the wrong action and the wrong person.
- **Race safety:** the status update has `WHERE status = <the one we read>`; if nothing changed, a second click gets 409.
- **Payment flow:** create booking → `PaymentsService.start` → Stripe Checkout page (card details never touch our server) → the return page calls `POST /payments/confirm` and the server asks Stripe → `payment.paid` event → `BookingsService.onPaymentPaid` moves the booking to requested, notifies the tailor and emails a receipt. The signed webhook does the same once a webhook secret is set; whichever arrives first wins and the other does nothing.
- **Refunds:** our restricted Stripe key needs dashboard approval for refunds, so they show as `refund_pending` until approved.
- **Live updates:** the Socket.IO gateway checks the JWT on connect and puts the socket in a private `user:<id>` room; notifications, chat messages and status changes are pushed there. Clients never choose rooms.
- **Q: Why an event between payments and bookings?** Payments do not need to know about bookings or orders (observer pattern), and orders reuse the same payment code.

### Product orders, brand panel, admin
- **Orders:** one order per partner brand (a brand an admin linked to an approved brand account). Only ids and quantities come from the browser; prices, stock and the delivery fee (Rs 250, free from Rs 5,000) are worked out on the server.
- **Brand panel:** hide or show products (`hidden_by_brand` survives feed syncs), stock per size, hand-listed products (live after the first photo), stores on the map, 30-day analytics.
- **Admin:** stats, approve or suspend users (suspension revokes refresh tokens), link brand accounts, hide reviews (the ranking recomputes), run the sync.

### Frontend architecture
- **Routing:** one `ProtectedRoute` per role area; each area uses `DashboardLayout` (the sidebar comes from `NAV_ITEMS[role]`).
- **State:** Context API for app-wide data: `AuthContext`, `ToastProvider`, `RealtimeProvider` (one socket), `WishlistProvider` (optimistic hearts) and `CartProvider` (localStorage, grouped by brand). Page data uses the `useApi` hook (aborts stale requests); buttons use `useAction` (loading state + error toast).
- **Animation:** Motion for page transitions, layout animations and springs; React Three Fiber for the fabric hero; CSS 3D (perspective + rotateX/Y) for tilt cards and the landing showcase. `prefers-reduced-motion` turns animations off.
- **Q: Why Context and not Redux?** The shared state is small (who is logged in, the socket, cart, wishlist); Context plus hooks is enough and easier to explain.

