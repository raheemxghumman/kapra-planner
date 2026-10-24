<div align="center">

# Kapra Planner

**Plan it. Try it. Get it stitched.**
An AI stylist for Pakistani fashion with virtual try-on, ranked local tailors, Stripe payments, live order tracking and chat.

[**Live app**](https://kapra-planner-app.alternatefutures.ai) ·
CS-301 Full Stack Web Development · Air University Islamabad · Fall 2026 ·
Deployed on **Alternate Clouds**

<br>

![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-0F172A?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8)
![Three.js](https://img.shields.io/badge/React_Three_Fiber-000000?style=for-the-badge&logo=threedotjs&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS_12-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_17-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe_(test)-635BFF?style=for-the-badge&logo=stripe&logoColor=white)
![Groq](https://img.shields.io/badge/Groq_LLM-F55036?style=for-the-badge&logoColor=white)
![Hugging Face](https://img.shields.io/badge/Hugging_Face-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)
![OpenStreetMap](https://img.shields.io/badge/OpenStreetMap-7EBC6F?style=for-the-badge&logo=openstreetmap&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)

<br>

<img src="docs/images/landing.webp" width="880" alt="Kapra Planner landing page: 'Plan it. Try it. Get it stitched.' with outfits from Pakistani brands">

</div>

---

## Contents

1. [The problem](#the-problem)
2. [What Kapra does](#what-kapra-does)
3. [Try it](#try-it)
4. [Screens](#screens)
5. [System architecture](#system-architecture)
6. [How the main features work](#how-the-main-features-work)
7. [Bookings and orders as state machines](#bookings-and-orders-as-state-machines)
8. [How Kapra picks the best tailor](#how-kapra-picks-the-best-tailor)
9. [Data model](#data-model)
10. [Security](#security)
11. [API overview](#api-overview)
12. [Tech stack](#tech-stack)
13. [Project structure](#project-structure)
14. [Run it locally](#run-it-locally)
15. [Testing and CI](#testing-and-ci)
16. [Deployment on Alternate Clouds](#deployment-on-alternate-clouds)
17. [Design system](#design-system)
18. [Limits and what's next](#limits-and-whats-next)
19. [Team](#team)

---

## The problem

Getting an outfit ready for an occasion in Pakistan usually means four separate jobs: scrolling a dozen brand websites, guessing whether a piece will suit you, finding a tailor you can trust, and then chasing them on WhatsApp for updates. Brand sites cannot style across brands, tailors are found by word of mouth, and nothing connects the outfit you picked to the person stitching it.

## What Kapra does

Kapra puts the whole journey in one place, for four kinds of users.

| | Role | What they get |
|:-:|---|---|
| 🛍️ | **Customer** | **AI stylist** that builds 2–3 complete looks from real, in-stock pieces in their size and budget · **virtual try-on** on their own photo · saved looks with piece swaps · **tailor map** ranked by reviews · **booking with Stripe**, live tracking and chat · checkout with partner brands |
| ✂️ | **Tailor** | Shop on the map with a pin, priced services and a gallery · paid booking requests with the customer's measurements and the look to stitch · accept, decline, progress, chat · reply to reviews · their **Kapra score** explained |
| 🏷️ | **Brand** | Catalogue synced every night from their shop feed · hide pieces, stock per size, hand-listed pieces · store locations on the map · orders with tracking numbers · 30-day sales and interest analytics |
| 🛡️ | **Admin** | Platform stats · approve or suspend accounts · link brand accounts to their brands · run the catalogue sync · moderate reviews flagged by the language model |

**By the numbers:** about **5,000 products** from **12 Pakistani brands**, **19 tailor shops** across Islamabad, Rawalpindi, Lahore and Karachi, **368 reviews** scored by a pre-trained language model, **72 automated tests**.

---

## Try it

> **Live:** **https://kapra-planner-app.alternatefutures.ai**

| Role | Email | Password |
|---|---|---|
| 🛍️ Customer | `customer@kapra.test` | `KapraDemo1` |
| ✂️ Tailor | `tailor@kapra.test` | `KapraDemo1` |
| 🏷️ Brand (manages Limelight) | `brand@kapra.test` | `KapraDemo1` |
| 🛡️ Admin | `admin@kapra.test` | ask the team |

> [!TIP]
> Payments run in **Stripe test mode**. Pay with card **`4242 4242 4242 4242`**, any future expiry date and any CVC. No real money moves.

**A two-minute walkthrough**

1. Log in as the **customer** → **AI stylist** → pick *Wedding*, Rs 15,000, a colour or two → **Style me**.
2. **Save** a look, then press **Try on** and upload a full-length photo.
3. Press **Get it stitched** → choose a tailor on the map → book and pay with the test card.
4. Log in as the **tailor** in another browser → accept the booking → **Start stitching** → **Mark ready**. The customer's timeline, notifications and chat update live.
5. Back as the customer → **I received it** → leave a review. The tailor's score updates immediately.

---

## Screens

<table>
  <tr>
    <td width="50%"><img src="web/public/showcase/stylist.webp" alt="AI stylist results with mood-board looks"><br><sub><b>AI stylist</b>: complete looks as mood boards, with reasons and a budget meter</sub></td>
    <td width="50%"><img src="web/public/showcase/tailors.webp" alt="Tailor map with ranked pins"><br><sub><b>Tailor map</b>: ranked by the Kapra score within the radius you choose</sub></td>
  </tr>
  <tr>
    <td><img src="docs/images/booking.webp" alt="Booking detail with timeline and chat"><br><sub><b>Booking</b>: tracking timeline, live chat with read ticks, the try-on to stitch</sub></td>
    <td><img src="web/public/showcase/home.webp" alt="Customer overview"><br><sub><b>Customer studio</b>: 3D tilt cards, live booking and order progress</sub></td>
  </tr>
  <tr>
    <td><img src="web/public/showcase/tailor.webp" alt="Tailor studio"><br><sub><b>Tailor studio</b>: new requests and how the score is built</sub></td>
    <td><img src="web/public/showcase/brand.webp" alt="Brand studio analytics"><br><sub><b>Brand studio</b>: revenue, orders, stylist picks and try-ons</sub></td>
  </tr>
</table>

---

## System architecture

Colour key: 🟫 **browser** · 🟩 **our server** · 🟦 **data** · 🟧 **AI services** · 🟪 **payments and maps** · ⬛ **scheduled jobs**

```mermaid
%%{init: {'theme':'base','themeVariables':{'fontFamily':'Inter, Segoe UI, sans-serif','fontSize':'14px','lineColor':'#7A746B','edgeLabelBackground':'#F4F1EA'}}}%%
flowchart LR
  subgraph Browser["Browser · React 19 + Vite"]
    UI["Pages and studios<br/>React Router · Motion · R3F"]
    CTX["Context: Auth · Realtime<br/>Cart · Wishlist · Toasts"]
  end

  subgraph Server["One container on Alternate Clouds"]
    STATIC["Static website<br/>(built React app)"]
    API["NestJS REST API<br/>/api/v1 · guards · DTOs"]
    WS["Socket.IO gateway<br/>per-user rooms"]
  end

  DB[("PostgreSQL 17<br/>Supabase")]
  IMG[("Cloudinary<br/>photos and results")]

  GROQ["Groq LLM<br/>gpt-oss-120b · 20b"]
  HF["Hugging Face Spaces<br/>IDM-VTON · Leffa"]
  STRIPE["Stripe Checkout<br/>test mode"]
  OSM["OpenStreetMap<br/>tiles · Nominatim"]
  FEEDS["12 brand<br/>Shopify feeds"]

  JOBS["GitHub Actions nightly<br/>sentiment model · sync"]

  UI -->|HTTPS JSON| API
  UI <-->|WebSocket| WS
  UI --> STATIC
  UI -->|map tiles| OSM
  API --> DB
  API --> IMG
  API -->|tool calling| GROQ
  API -->|try-on jobs| HF
  API -->|checkout, refunds| STRIPE
  API -->|geocoding| OSM
  API -->|catalogue sync| FEEDS
  JOBS -->|scores reviews, re-ranks| DB

  classDef client fill:#E8C9C0,stroke:#8C3B2E,color:#2B2926,stroke-width:1.5px
  classDef server fill:#DCE3CF,stroke:#4F5A3A,color:#2B2926,stroke-width:1.5px
  classDef data fill:#D6E4F0,stroke:#3460A8,color:#1F2A4D,stroke-width:1.5px
  classDef ai fill:#FBE3C8,stroke:#D9772B,color:#5A2E0C,stroke-width:1.5px
  classDef ext fill:#E6DDF2,stroke:#6A3D8F,color:#2E1A40,stroke-width:1.5px
  classDef job fill:#2B2926,stroke:#2B2926,color:#F4F1EA,stroke-width:1.5px
  class UI,CTX client
  class STATIC,API,WS server
  class DB,IMG data
  class GROQ,HF ai
  class STRIPE,OSM,FEEDS ext
  class JOBS job
```

**Why it is built this way**

- **One container, one address.** The NestJS server also serves the built website, so there is no cross-site setup and Socket.IO shares the same origin.
- **Heavy AI never runs in the web server.** The stylist runs on Groq, try-on on Hugging Face GPUs, and review sentiment in a nightly GitHub Actions job. The server stays small (1 CPU, 1 GB).
- **Every outside service sits behind an interface** (`LLM_CLIENT`, `TRY_ON_PROVIDERS`, `PAYMENT_GATEWAY`, `IMAGE_STORAGE`, `GEOCODER`, `EMAIL_SENDER`), injected by NestJS. Swapping a provider changes one module, not the features.

### Backend modules

```mermaid
%%{init: {'theme':'base','themeVariables':{'fontFamily':'Inter, Segoe UI, sans-serif','fontSize':'13px','lineColor':'#7A746B','edgeLabelBackground':'#F4F1EA'}}}%%
flowchart TB
  subgraph Core["Core"]
    AUTH["auth<br/>JWT + refresh rotation"]
    USERS["users · profiles<br/>sizes · measurements"]
    ADMIN["admin"]
  end
  subgraph Shop["Catalogue and shopping"]
    CAT["catalogue<br/>products · sync · tagging"]
    BRANDS["brands · brand-panel"]
    WISH["wishlist"]
    ORDERS["orders"]
  end
  subgraph AIF["AI features"]
    STY["stylist<br/>agent · rules · outfits"]
    TRY["tryon<br/>provider chain"]
  end
  subgraph Tail["Tailoring"]
    TAI["tailors<br/>search · ranking · reviews"]
    BOOK["bookings<br/>state machine · chat"]
  end
  subgraph Cross["Shared services"]
    PAY["payments<br/>Stripe · events"]
    NOTI["notifications"]
    RT["realtime<br/>Socket.IO"]
  end

  STY --> CAT
  STY --> USERS
  TRY --> CAT
  BOOK --> TAI
  BOOK --> PAY
  ORDERS --> PAY
  PAY -.->|payment.paid event| BOOK
  PAY -.->|payment.paid event| ORDERS
  BOOK --> NOTI
  ORDERS --> NOTI
  NOTI --> RT
  ADMIN --> TAI
  BRANDS --> CAT

  classDef core fill:#E8C9C0,stroke:#8C3B2E,color:#2B2926
  classDef shop fill:#D6E4F0,stroke:#3460A8,color:#1F2A4D
  classDef ai fill:#FBE3C8,stroke:#D9772B,color:#5A2E0C
  classDef tail fill:#DCE3CF,stroke:#4F5A3A,color:#2B2926
  classDef cross fill:#E6DDF2,stroke:#6A3D8F,color:#2E1A40
  class AUTH,USERS,ADMIN core
  class CAT,BRANDS,WISH,ORDERS shop
  class STY,TRY ai
  class TAI,BOOK tail
  class PAY,NOTI,RT cross
```

Payments know nothing about bookings or orders. When Stripe confirms a payment, `PaymentsService` publishes a `payment.paid` event and the owning module reacts (observer pattern), so bookings and product orders share one payment flow.

---

## How the main features work

### 1. AI stylist (tool-calling agent with a safety net)

```mermaid
%%{init: {'theme':'base','themeVariables':{'fontFamily':'Inter, Segoe UI, sans-serif','actorBkg':'#E8C9C0','actorBorder':'#8C3B2E','signalColor':'#2B2926','noteBkgColor':'#FBE3C8','noteBorderColor':'#D9772B'}}}%%
sequenceDiagram
  autonumber
  actor C as Customer
  participant W as Website
  participant S as StylistService
  participant L as Groq LLM
  participant DB as PostgreSQL

  C->>W: Occasion, budget, colours, notes
  W->>S: POST /stylist/requests
  S->>DB: Style profile, sizes, disliked pieces
  loop Up to 8 turns
    S->>L: Conversation + 2 tools
    L-->>S: call searchProducts(categories, maxPrice, colours)
    S->>DB: Real SQL search: in stock, in budget, ranked by match
    DB-->>S: Products with sizes in stock
    S-->>L: Product facts (ids, colours, fabric, price)
  end
  L-->>S: call submitOutfits(looks)
  S->>S: validateOutfit(): ids came from search? complete look? one per slot? within budget?
  alt Problems found
    S-->>L: The exact problems, fix once
  else AI down, slow (>50 s) or still invalid
    S->>DB: Rule-based stylist builds looks with the same checks
  end
  S->>DB: Save request, suggestions and pieces (one transaction)
  S-->>W: 2-3 complete looks
```

- The model **can only pick products our search returned**; anything else is rejected and sent back as an error, so it cannot invent items.
- `KeyPool` rotates four Groq keys and rests a key that hits a rate limit.
- Disliked looks are remembered and those pieces are left out next time.

### 2. Virtual try-on (background job + provider chain)

```mermaid
%%{init: {'theme':'base','themeVariables':{'fontFamily':'Inter, Segoe UI, sans-serif','actorBkg':'#E8C9C0','actorBorder':'#8C3B2E','signalColor':'#2B2926','noteBkgColor':'#FBE3C8','noteBorderColor':'#D9772B'}}}%%
sequenceDiagram
  autonumber
  actor C as Customer
  participant W as Website
  participant T as TryOnService
  participant H as Hugging Face
  participant CL as Cloudinary

  C->>W: Upload a full-length photo
  W->>T: POST /me/photos
  T->>CL: Store privately (max 3, deletable)
  C->>W: Try on this piece
  W->>T: POST /tryons
  T-->>W: 202 Accepted (job id)
  par Background job
    T->>H: IDM-VTON (3-minute timeout)
    alt Busy or failed
      T->>H: Leffa (fallback)
    end
    H-->>T: Result image
    T->>CL: Store result
  and Page polls every 3 s
    W->>T: GET /tryons/:id
  end
  T-->>W: completed + result URL
  W-->>C: Before / after slider
```

Results are cached per photo and piece, and each customer runs one job at a time because the free GPUs are shared.

### 3. Booking a tailor and paying with Stripe

```mermaid
%%{init: {'theme':'base','themeVariables':{'fontFamily':'Inter, Segoe UI, sans-serif','actorBkg':'#E8C9C0','actorBorder':'#8C3B2E','signalColor':'#2B2926','noteBkgColor':'#E6DDF2','noteBorderColor':'#6A3D8F'}}}%%
sequenceDiagram
  autonumber
  actor C as Customer
  participant W as Website
  participant B as BookingsService
  participant P as PaymentsService
  participant ST as Stripe
  actor T as Tailor

  C->>W: Service, date, measurements, the look
  W->>B: POST /bookings
  B->>P: start(payment)
  P->>ST: Create Checkout session (PKR)
  B-->>W: checkoutUrl
  W->>ST: Customer pays on Stripe's page
  ST-->>W: Redirect back with session_id
  W->>P: POST /payments/confirm
  P->>ST: Is this session paid?
  ST-->>P: paid
  P-->>B: event payment.paid
  B->>B: pending_payment → requested (+ timeline entry)
  B-->>T: Notification over Socket.IO + email receipt to customer
  T->>B: accept → start → ready
  B-->>C: Live timeline updates and notifications
```

- Card details never reach our server; customers pay on Stripe's hosted page.
- Payment is confirmed by **asking Stripe** on return, and by **signed webhooks** once a webhook secret is set. Both use one conditional update, so a payment is processed exactly once.
- Declines and cancellations after payment are **refunded automatically**.

### 4. Live updates

Every browser opens one Socket.IO connection, authenticated with the same access token as the REST API. The server puts it in a private room `user:<id>` and pushes **notifications, chat messages and status changes** there. Clients never choose rooms, so nobody can listen to someone else's booking.

---

## Bookings and orders as state machines

Every status change goes through one pure function, `nextStatus(current, action, actor)`. An action is allowed only from the right status **and** by the right person, and the database update only succeeds if nobody changed the booking in between (no double clicks).

```mermaid
%%{init: {'theme':'base','themeVariables':{'fontFamily':'Inter, Segoe UI, sans-serif','primaryColor':'#DCE3CF','primaryBorderColor':'#4F5A3A','primaryTextColor':'#2B2926','lineColor':'#7A746B','edgeLabelBackground':'#F4F1EA'}}}%%
stateDiagram-v2
  direction LR
  [*] --> pending_payment: customer books
  pending_payment --> requested: pay (Stripe confirms)
  pending_payment --> cancelled: cancel (customer)
  requested --> accepted: accept (tailor)
  requested --> declined: decline (tailor) · refund
  requested --> cancelled: cancel (customer) · refund
  accepted --> in_progress: start (tailor)
  in_progress --> ready: ready (tailor)
  ready --> completed: complete (customer or tailor)
  completed --> [*]
  cancelled --> [*]
  declined --> [*]

  classDef closed fill:#F3D9D3,stroke:#8C3B2E,color:#5A1D14
  classDef done fill:#2B2926,stroke:#2B2926,color:#F4F1EA
  class cancelled,declined closed
  class completed done
```

Product orders follow the same idea: `pending_payment → paid → shipped (tracking number) → delivered`, with cancellation and refund before shipping.

---

## How Kapra picks the best tailor

The instructor asked for tailors to be filtered by ratings and reviews, with a **pre-trained model** choosing the best. Every tailor gets a score from 0 to 100:

```mermaid
%%{init: {'theme':'base','themeVariables':{'fontFamily':'Inter, Segoe UI, sans-serif','fontSize':'14px','lineColor':'#7A746B','edgeLabelBackground':'#F4F1EA'}}}%%
flowchart LR
  R["⭐ Star ratings<br/>Bayesian average"] -->|55%| S(("Kapra<br/>score"))
  M["🧠 What reviews say<br/>multilingual BERT"] -->|30%| S
  C["✅ Reliability<br/>finished ÷ (finished + declined)"] -->|15%| S
  S --> RANK["Best match<br/>within your radius"]

  classDef rating fill:#FBE3C8,stroke:#D9772B,color:#5A2E0C
  classDef model fill:#E6DDF2,stroke:#6A3D8F,color:#2E1A40
  classDef rel fill:#DCE3CF,stroke:#4F5A3A,color:#2B2926
  classDef score fill:#8C3B2E,stroke:#8C3B2E,color:#F4F1EA
  classDef out fill:#2B2926,stroke:#2B2926,color:#F4F1EA
  class R rating
  class M model
  class C rel
  class S score
  class RANK out
```

| Part | How it is calculated | Why |
|---|---|---|
| **Rating (55%)** | `(5 × global mean + sum of ratings) ÷ (5 + number of ratings)` | One 5-star review should not beat fifty 4.8-star reviews |
| **Sentiment (30%)** | [`nlptown/bert-base-multilingual-uncased-sentiment`](https://huggingface.co/nlptown/bert-base-multilingual-uncased-sentiment) reads each comment (English, Urdu or Roman Urdu) and gives a probability for 1–5 stars; the expected stars, scaled to 0–1 | Catches complaints hidden behind generous star ratings |
| **Reliability (15%)** | Finished bookings ÷ (finished + declined), assumed 0.9 until there are 3 bookings | Rewards tailors who follow through |

The model runs in a nightly GitHub Actions job (`npm run job:reviews`) with Transformers.js, not in the web server, because it is about 170 MB. Admins can hide abusive reviews; the ranking recalculates at once. **Limitation:** Roman Urdu is scored less reliably than English and Urdu script, which is why sentiment is only 30% of the score.

---

## Data model

The main tables (33 in total, every one with row level security enabled in Supabase):

```mermaid
%%{init: {'theme':'base','themeVariables':{'fontFamily':'Inter, Segoe UI, sans-serif','fontSize':'12px','primaryColor':'#F4F1EA','primaryBorderColor':'#7A746B','primaryTextColor':'#2B2926','lineColor':'#A69E91'}}}%%
erDiagram
  USERS ||--o| STYLE_PROFILES : has
  USERS ||--o{ MEASUREMENT_PROFILES : saves
  USERS ||--o{ STYLIST_REQUESTS : asks
  STYLIST_REQUESTS ||--|{ OUTFIT_SUGGESTIONS : returns
  OUTFIT_SUGGESTIONS ||--|{ OUTFIT_ITEMS : contains
  USERS ||--o{ OUTFITS : saves
  OUTFITS ||--|{ OUTFIT_ITEMS : contains
  OUTFIT_ITEMS }o--|| PRODUCTS : uses
  BRANDS ||--o{ PRODUCTS : sells
  PRODUCTS ||--|{ PRODUCT_VARIANTS : "comes in"
  BRANDS ||--o{ BRAND_STORES : has
  USERS ||--o{ PERSON_PHOTOS : uploads
  PERSON_PHOTOS ||--o{ TRY_ONS : "used in"
  TRY_ONS }o--|| PRODUCTS : wears
  USERS ||--o| TAILOR_PROFILES : runs
  TAILOR_PROFILES ||--o{ TAILOR_SERVICES : offers
  TAILOR_PROFILES ||--o{ REVIEWS : receives
  USERS ||--o{ BOOKINGS : books
  TAILOR_PROFILES ||--o{ BOOKINGS : fulfils
  BOOKINGS ||--|{ BOOKING_EVENTS : "timeline of"
  BOOKINGS ||--o{ MESSAGES : "chat in"
  BOOKINGS ||--o| REVIEWS : "reviewed by"
  USERS ||--o{ ORDERS : places
  BRANDS ||--o{ ORDERS : ships
  ORDERS ||--|{ ORDER_ITEMS : contains
  USERS ||--o{ PAYMENTS : makes
  USERS ||--o{ NOTIFICATIONS : receives

  USERS {
    uuid id PK
    string email UK
    enum role "customer, brand, tailor, admin"
    enum status "active, pending, suspended"
  }
  PRODUCTS {
    uuid id PK
    enum category
    text_array colours
    enum_array occasions
    int price
  }
  TAILOR_PROFILES {
    uuid id PK
    float lat
    float lng
    float rank_score
  }
  BOOKINGS {
    uuid id PK
    string code UK
    enum status
    int price
    jsonb measurements
  }
  PAYMENTS {
    uuid id PK
    enum purpose "booking, order"
    uuid reference_id
    enum status
  }
```

Schema changes only happen through **TypeORM migrations** (`synchronize` is off). Prices are copied into bookings and orders when they are made, so later price changes never alter a past order.

---

## Security

| Area | What Kapra does |
|---|---|
| 🔑 **Passwords** | bcrypt (cost 12); a dummy hash is checked for unknown emails so response time does not reveal accounts; 5 failed logins lock the account for 15 minutes |
| 🎫 **Sessions** | 15-minute JWT access token kept only in memory; refresh tokens are random, stored hashed, **single use** and rotated; reusing an old one signs that user out everywhere |
| 🚦 **Access** | Global guards in order: rate limiter → JWT → role check. Every `:id` route checks the record belongs to the caller |
| 📥 **Input** | Every request body and query is validated by a DTO (unknown fields rejected); uploads checked by real file content, max 8 MB |
| 💳 **Payments** | Cards handled only by Stripe; amounts calculated on the server; webhook signatures verified and events processed once |
| 🗄️ **Database** | Row level security on every table, so Supabase's public REST API exposes nothing |
| 🧱 **Headers** | Helmet with a Content Security Policy, CORS limited to the site, request IDs on every log line |
| 🤫 **Secrets** | Only in `api/.env` locally and in the service settings in production; never in the repo or the image |

---

## API overview

REST under `/api/v1`, documented with **Swagger at `/api/docs`**.

| Area | Main endpoints |
|---|---|
| Auth | `POST /auth/register` · `/auth/login` · `/auth/refresh` · `/auth/logout` · `GET /auth/me` |
| Profile | `PATCH /me` · `GET/PUT /me/style-profile` · `CRUD /me/measurements` · `/me/wishlist` · `/me/photos` |
| Catalogue | `GET /products` (filters, search, paging) · `/products/:id` · `/products/:id/similar` · `/products/facets` · `/brands` · `/brands/stores` |
| Stylist | `POST /stylist/requests` · `GET /stylist/requests` · `POST /stylist/suggestions/:id/save` · `PUT .../feedback` · `/outfits` (rename, swap a piece, alternatives) |
| Try-on | `POST /tryons` (202) · `GET /tryons/:id` · `GET /tryons` · `DELETE /tryons/:id` |
| Tailors | `GET /tailors?lat&lng&radiusKm&sort` · `/tailors/:slug` · `/tailors/:slug/reviews` · `/geo/search` |
| Tailor panel | `GET/PUT /tailor/profile` · gallery · `CRUD /tailor/services` · `/tailor/reviews` and replies |
| Bookings | `POST /bookings` · `GET /bookings` · `/bookings/:id` · `/bookings/:id/actions` · `/pay` · `/review` · `/messages` |
| Orders | `POST /orders` · `GET /orders` · `/orders/:id` · `/orders/:id/actions` · `/pay` |
| Payments | `POST /payments/confirm` · `POST /payments/webhook` |
| Brand panel | `/brand/profile` · logo · `/brand/stores` · `/brand/products` (visibility, stock, photos) · `/brand/analytics` |
| Admin | `/admin/stats` · `/admin/users` · `/admin/brands/:id/owner` · `/admin/reviews` · `/admin/catalogue/sync` |
| Jobs | `POST /jobs/sync` · `POST /jobs/rank-tailors` (secret header) |

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | **React 19**, Vite 8, TypeScript, React Router | Course stack; fast builds |
| Styling and motion | **Tailwind CSS v4** with our own design tokens, **Motion**, **React Three Fiber**, Lenis | Editorial look, 3D scenes and smooth page transitions |
| State | Context API + custom hooks (`useApi`, `useAction`, `useForm`, `useRealtimeEvent`) | Small shared state; no Redux needed |
| Backend | **NestJS 12** (ES modules), TypeORM, class-validator, Swagger | Modules, dependency injection, guards, pipes, interceptors |
| Database | **PostgreSQL 17** on Supabase | Relational data, arrays, JSONB, row level security |
| Real time | **Socket.IO** | Notifications, chat, live statuses |
| AI | **Groq** (`gpt-oss-120b` stylist, `gpt-oss-20b` tagging) · **IDM-VTON / Leffa** on Hugging Face · **multilingual BERT** via Transformers.js | All free tiers; heavy work kept off the server |
| Payments | **Stripe Checkout** (test mode, PKR) | Hosted page keeps cards off our server |
| Maps | **OpenStreetMap** + Leaflet, **Nominatim** geocoding (cached, 1 request/second) | Free and open |
| Images | **Cloudinary** (signed REST uploads) | Photos, try-on results, galleries |
| DevOps | Docker, **GitHub Actions** (CI, image build, nightly jobs), **Alternate Clouds** | One-command deploys |
| Tests and quality | Vitest, Testing Library, oxlint (type-aware), Prettier | 72 tests, zero lint warnings |

---

## Project structure

```text
kapra-planner/
├── api/                          NestJS backend
│   ├── src/
│   │   ├── common/               guards, decorators, filters, pipes, interceptors
│   │   ├── config/               environment validation
│   │   ├── database/             TypeORM options, migrations, seed scripts
│   │   ├── integrations/         Groq, key pool, try-on providers, Stripe,
│   │   │                         Cloudinary, Nominatim, email, brand feeds
│   │   ├── jobs/                 review sentiment job (pre-trained model)
│   │   ├── modules/              auth · users · profiles · catalogue · brands ·
│   │   │                         wishlist · stylist · tryon · tailors · bookings ·
│   │   │                         payments · orders · notifications · realtime ·
│   │   │                         brand-panel · admin · health
│   │   ├── web-hosting.ts        serves the built website + security policy
│   │   └── main.ts
│   └── Dockerfile                builds API + website into one image
├── web/                          React frontend
│   ├── public/showcase/          screens used on the landing page
│   └── src/
│       ├── api/                  axios clients (single-flight token refresh)
│       ├── components/           ui kit · map · charts · 3D · outfit board · chat
│       ├── context/              auth · realtime · cart · wishlist · toasts
│       ├── hooks/                useApi · useAction · useRealtimeEvent · ...
│       ├── layouts/              site · auth · dashboard
│       └── pages/                landing · shop · tailors · customer · bookings ·
│                                 orders · tailor-panel · brand-panel · admin
├── docs/                         plan, backlog, viva notes, design changes
└── .github/workflows/            ci.yml · image.yml · jobs.yml
```

---

## Run it locally

**Requirements:** Node.js 24+, npm 11+, and either the Supabase connection string or Docker for a local PostgreSQL.

```bash
npm install                        # installs api and web (npm workspaces)
cp api/.env.example api/.env       # fill in the values (see docs/ENVIRONMENT.md)
cp web/.env.example web/.env.local
npm run migration:run -w api       # create the tables
npm run seed:admin -w api          # admin account from ADMIN_EMAIL / ADMIN_PASSWORD
npm run seed:catalogue -w api      # 12 brands and their products
npm run seed:tailors -w api        # 18 demo tailor shops with reviews
npm run job:reviews -w api         # score reviews with the language model
npm run dev:api                    # http://localhost:3000/api/v1 · docs at /api/docs
npm run dev:web                    # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run lint` · `npm run typecheck` · `npm test` | Checks for both apps (also run by CI) |
| `npm run build` | Production builds of both apps |
| `npm run migration:generate -w api -- src/database/migrations/<Name>` | New migration from entity changes |
| `npm run seed:admin -w api` | Creates the admin, or resets its password from `.env` |

---

## Testing and CI

- **72 automated tests** (Vitest): the outfit rules, the stylist key pool, the try-on provider chain, the tailor ranking maths, both state machines, auth tokens, the catalogue tagger and more.
- Business rules are **pure functions** (`validateOutfit`, `nextStatus`, `rankScore`, `runProviderChain`), so they are tested without a database.
- End-to-end flows were run against the real services: Stripe test payments through the hosted Checkout page, real try-ons, live stylist requests, and all four roles in a browser.

```mermaid
%%{init: {'theme':'base','themeVariables':{'fontFamily':'Inter, Segoe UI, sans-serif','fontSize':'13px','lineColor':'#7A746B','edgeLabelBackground':'#F4F1EA'}}}%%
flowchart LR
  P["git push"] --> CI["ci.yml<br/>lint · type-check · tests · build"]
  P --> IMG["image.yml<br/>Docker build"]
  IMG --> GHCR[("ghcr.io/raheemxghumman/<br/>kapra-planner:&lt;sha&gt;")]
  GHCR --> DEP["acc services deploy<br/>Alternate Clouds"]
  DEP --> LIVE["kapra-planner-app<br/>.alternatefutures.ai"]
  N["nightly 02:30 PKT"] --> J["jobs.yml<br/>review sentiment · catalogue sync"]

  classDef step fill:#DCE3CF,stroke:#4F5A3A,color:#2B2926
  classDef store fill:#D6E4F0,stroke:#3460A8,color:#1F2A4D
  classDef live fill:#8C3B2E,stroke:#8C3B2E,color:#F4F1EA
  classDef job fill:#2B2926,stroke:#2B2926,color:#F4F1EA
  class P,CI,IMG,DEP step
  class GHCR store
  class LIVE live
  class N,J job
```

---

## Deployment on Alternate Clouds

Kapra runs as **one Docker container** on Alternate Clouds (project `kapra-planner`, 1 CPU, 1 GB, pay as you go) at **https://kapra-planner-app.alternatefutures.ai**.

1. A push to `main` runs `image.yml`, which builds `ghcr.io/raheemxghumman/kapra-planner:<commit sha>`.
2. Deploy that tag:
   ```bash
   acc services deploy kapra-planner \
     --image ghcr.io/raheemxghumman/kapra-planner:<sha> \
     --cpu 1 --memory 1Gi --spend payg -y
   ```
3. Configuration lives in the service's environment variables (`acc services env list kapra-planner`). No secrets are in the repository or the image.

> [!NOTE]
> The container applies pending migrations when it starts. Each release builds its files into `assets/<commit sha>/`, so Cloudflare (in front of Alternate Clouds) can never serve a file from an older release.

---

## Design system

An editorial, paper-and-ink look: hairline borders, Bodoni Moda italics for accents, Instrument Sans for text, and motion that eases rather than bounces.

| Token | | Use |
|---|:-:|---|
| `paper` `#ECE7DE` | ![paper](https://img.shields.io/badge/-%20%20%20%20%20%20-ECE7DE?style=flat-square) | Page background |
| `card` `#F4F1EA` | ![card](https://img.shields.io/badge/-%20%20%20%20%20%20-F4F1EA?style=flat-square) | Panels and cards |
| `ink` `#2B2926` | ![ink](https://img.shields.io/badge/-%20%20%20%20%20%20-2B2926?style=flat-square) | Text and primary buttons |
| `olive` `#4F5A3A` | ![olive](https://img.shields.io/badge/-%20%20%20%20%20%20-4F5A3A?style=flat-square) | Progress, success, live states |
| `henna` `#8C3B2E` | ![henna](https://img.shields.io/badge/-%20%20%20%20%20%20-8C3B2E?style=flat-square) | Highlights, best match, alerts |
| `blush` `#E8C9C0` | ![blush](https://img.shields.io/badge/-%20%20%20%20%20%20-E8C9C0?style=flat-square) | Soft accents |
| `sand` `#D9CFBF` | ![sand](https://img.shields.io/badge/-%20%20%20%20%20%20-D9CFBF?style=flat-square) | Placeholders and image backgrounds |
| `hairline` `#CFC8BC` | ![hairline](https://img.shields.io/badge/-%20%20%20%20%20%20-CFC8BC?style=flat-square) | Borders |

Animations respect the system's **reduced motion** setting.

---

## Limits and what's next

| Now | Next |
|---|---|
| Payments in Stripe **test mode**; refunds wait for approval in the Stripe dashboard | Live mode with a webhook secret |
| Receipt emails are written to the server log | Resend with the project's own domain |
| Try-on cuts long kurtas to shirt length (IDM-VTON) | FASHN VTON v1.5 (open source) as the first try-on provider for full-length outfits |
| Roman Urdu reviews are scored less reliably | Fine-tune the sentiment model on Roman Urdu reviews |
| Brands without a linked account are catalogue only (buy on their site) | Onboard brands as partners |
| `kapra-planner-app.alternatefutures.ai` address | A custom domain once Alternate Clouds supports it |

---

## Team

| | Name | Student ID |
|:-:|---|---|
| 🧑‍💻 | **Abdulraheem** | 241854 |
| 🧑‍💻 | **Wania Rahman** | 241830 |

Course **CS-301 Full Stack Web Development**, Air University Islamabad, Fall 2026 · Instructor **Sir Obaidullah**.

More detail: [build plan](docs/PLAN.md) · [backlog](docs/BACKLOG.md) · [design changes since Deliverable 2](docs/DESIGN-CHANGES.md) · [viva notes](docs/VIVA.md) · [environment](docs/ENVIRONMENT.md) · [coding conventions](docs/CONVENTIONS.md)
