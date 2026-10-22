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
| 12 | 23 Oct 2026 | `brands.owner_id` is nullable; brands are created from their public Shopify feeds and a brand user claims one later | The catalogue must exist before brands sign up | 3.4 ERD |
| 13 | 23 Oct 2026 | `product_variants` stores `in_stock` (and `stock_qty` only when known) | Shop feeds give availability, not quantities | 3.4 ERD |
| 14 | 23 Oct 2026 | Profile split into `style_profiles` (one per customer) and `measurement_profiles` (up to 10, e.g. "Me", "Mother") | Style preferences and tailoring measurements change separately; customers book tailors for family too | 3.4 ERD, 3.6 Class diagram |
| 15 | 23 Oct 2026 | Stylist results stored as `stylist_requests` → `outfit_suggestions` → `outfit_items`; saving copies a suggestion into `outfits`. `suggestion_feedback` (like/dislike) | Customers can edit saved looks without changing the history; disliked products are left out next time | 3.4 ERD, Fig. 15 |
| 16 | 23 Oct 2026 | Rule-based fallback stylist with the same validation rules | Free Groq limits or outages must not break the main feature | D2 1.6, Fig. 15 |
| 17 | 23 Oct 2026 | Try-on: `person_photos` (max 3, deletable with their files) and `try_ons` (cached per photo + product, one running job per customer). Chain: IDM-VTON then Leffa | Testing showed IDM-VTON is better for every garment type, including suits; Leffa is the fallback when the free GPU is busy | 3.4 ERD, Fig. 16 |
| 18 | 23 Oct 2026 | Cloudinary used through its signed REST API (no SDK) behind an `IMAGE_STORAGE` interface | Fewer dependencies; the signing is easy to explain | D2 1.6 |
