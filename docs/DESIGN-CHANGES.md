# Design changes since Deliverable 2

Changes to the Deliverable 2 design found while planning or coding. Each entry: what changed, why, and which D2 section it affects, so the next deliverable can include an accurate design.

| # | Date | Change | Why | D2 section |
|---|---|---|---|---|
| 1 | 23 Oct 2026 | Added `refresh_tokens` table (user_id, token_hash, expires_at, revoked_at) | Refresh-token rotation and logout need server-side records | 3.4 ERD, 3.6 Class diagram |
| 2 | 23 Oct 2026 | Added `notifications` table (user_id, type, title, body, link, read_at) | In-app notifications must survive page reloads | 3.4 ERD |
| 3 | 23 Oct 2026 | Added `stripe_events` table (event_id unique, processed_at) | Makes the webhook handler idempotent when Stripe resends an event | 3.4 ERD, 3.10 Fig. 17 |
| 4 | 23 Oct 2026 | Added `geocode_cache` table (query, lat, lng) | Nominatim allows 1 request/second; repeat lookups come from the cache | 3.4 ERD |
| 5 | 23 Oct 2026 | Users get a `status` column (active, pending, suspended) and `failed_logins`, `locked_until` | Admin verification and login lockout (FR-01, FR-02) | 3.4 ERD |
| 6 | 23 Oct 2026 | Styling with Bootstrap 5 instead of Tailwind (named in Deliverable 1) | Bootstrap is taught in the course (week 2) | D1 2.6 |
