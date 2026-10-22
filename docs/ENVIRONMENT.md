# Accounts, keys and environment variables

Values go **only** into `api/.env`, `web/.env.local` (both git-ignored) and the Render / Vercel dashboards. This file lists names and sources, never values.

## Accounts to create (all free, no card)

| Service | Used for | Owner | Status |
|---|---|---|---|
| GitHub | Code, CI, scheduled jobs | Abdulraheem (add Wania as collaborator) | ✅ `raheemxghumman` |
| Supabase | PostgreSQL database | Abdulraheem | ☐ |
| Render | API hosting | Abdulraheem (sign in with GitHub) | ☐ |
| Vercel | Frontend hosting | Abdulraheem (sign in with GitHub) | ☐ |
| Cloudinary | Images | Abdulraheem | ☐ |
| Groq | AI stylist and tagging | Abdulraheem | ✅ keys available |
| Google AI Studio | Gemini try-on | Abdulraheem | ⚠️ verify key format (`AIza…`) |
| Hugging Face | Try-on fallback Space | Abdulraheem | ☐ |
| Stripe | Test-mode payments | Abdulraheem | ☐ |
| Resend | Receipt emails | Abdulraheem | ☐ (domain verification needed to email anyone other than the owner) |
| cron-job.org | Uptime pings | Abdulraheem | ☐ (after first deploy) |

## API (`api/.env`)

| Variable | Where it comes from |
|---|---|
| `NODE_ENV` | `development` locally, `production` on Render |
| `PORT` | `3000` locally; Render sets it automatically |
| `DATABASE_URL` | Supabase → Project settings → Database → connection string (session pooler) |
| `DATABASE_SSL` | `true` for Supabase, `false` for local Docker |
| `WEB_ORIGIN` | `http://localhost:5173` locally; Vercel URL in production (CORS) |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Long random strings we generate (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) |
| `GROQ_API_KEY` | console.groq.com → API keys |
| `GEMINI_API_KEY` | aistudio.google.com → Get API key |
| `HF_TOKEN` | huggingface.co → Settings → Access tokens (read) |
| `STRIPE_SECRET_KEY` | Stripe dashboard (test mode) → Developers → API keys (`sk_test_…`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → endpoint signing secret (`whsec_…`); locally from `stripe listen` |
| `RESEND_API_KEY`, `EMAIL_FROM` | resend.com → API keys; sender address on the verified domain |
| `CLOUDINARY_URL` | Cloudinary dashboard → API environment variable |
| `JOBS_SECRET` | Random string; GitHub Actions sends it to `/jobs/*` endpoints |
| `NOMINATIM_USER_AGENT` | `KapraPlanner/1.0 (<contact email>)` — required by Nominatim's usage policy |

## Web (`web/.env.local`)

| Variable | Value |
|---|---|
| `VITE_API_URL` | `http://localhost:3000/api/v1` locally; Render URL in production |
| `VITE_SOCKET_URL` | `http://localhost:3000` locally; Render URL in production |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_…` (public by design) |

## GitHub Actions secrets

`API_BASE_URL`, `JOBS_SECRET`, `DATABASE_URL` (sentiment job reads and updates reviews).
