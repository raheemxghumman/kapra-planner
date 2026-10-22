# Design changes since Deliverable 2

Changes to the Deliverable 2 design found while planning or coding. Each entry: what changed, why, and which D2 section it affects, so the next deliverable can include an accurate design.

| # | Date | Change | Why | D2 section |
|---|---|---|---|---|
| 1 | 23 Oct 2026 | Added `refresh_tokens` table (user_id, token_hash, expires_at, revoked_at) | Refresh-token rotation and logout need server-side records | 3.4 ERD, 3.6 Class diagram |
| 2 | 23 Oct 2026 | Added `notifications` table (user_id, type, title, body, link, read_at) | In-app notifications must survive page reloads | 3.4 ERD |
| 3 | 23 Oct 2026 | Added `stripe_events` table (event_id unique, processed_at) | Makes the webhook handler idempotent when Stripe resends an event | 3.4 ERD, 3.10 Fig. 17 |
| 4 | 23 Oct 2026 | Added `geocode_cache` table (query, lat, lng) | Nominatim allows 1 request/second; repeat lookups come from the cache | 3.4 ERD |
| 5 | 23 Oct 2026 | Users get a `status` column (active, pending, suspended) and `failed_logins`, `locked_until` | Admin verification and login lockout (FR-01, FR-02) | 3.4 ERD |
| 6 | 23 Oct 2026 | Frontend uses Tailwind CSS v4 (as in Deliverable 1) plus Motion for animation and React Three Fiber for 3D | Goal of a top-quality animated UI | D1 2.6, D2 3.12 |
| 7 | 23 Oct 2026 | Try-on: Hugging Face IDM-VTON is the main provider; Gemini becomes optional | Gemini image models have no free-tier quota (spike) | D2 1.5, 1.6, Fig. 16 |
| 8 | 23 Oct 2026 | Groq model is `openai/gpt-oss-120b` (stylist) and `gpt-oss-20b` (tagging) | Llama 3.3 70B was retired by Groq | D2 1.5 |
| 9 | 23 Oct 2026 | Stylist agent finishes through a `submitOutfit` tool | Structured final answer; spike showed free-text JSON can fail | D2 Fig. 15 |
| 10 | 23 Oct 2026 | Several Groq and Gemini keys rotated automatically (`KeyPool`) | Stay within free limits | D2 1.6 |
| 11 | 23 Oct 2026 | Row level security enabled on every table | Supabase's public REST API would otherwise expose tables (including password hashes) | D2 1.6, NFR-03 |
