# Coding conventions

Short rules so the codebase reads as if one person wrote it, and so every line can be defended in the viva.

## General

- TypeScript `strict: true` in both apps. No `any`; use `unknown` and narrow it.
- Prettier formats everything (2 spaces, single quotes, trailing commas). ESLint must pass before commit.
- Names say what things are: `bookingsService.confirmPayment()`, not `handle()`; booleans start with `is/has/can`.
- Small functions (aim under 30 lines). If a comment explains *what* the code does, rename things instead; comments explain *why*.
- No dead code, no commented-out code, no `console.log` (use Nest `Logger` in the API).
- Constants and enums instead of magic strings and numbers (`BookingStatus.STITCHING`, `MAX_TOOL_CALLS = 6`).
- Dates are stored in UTC; money is integer rupees.

## Backend (NestJS)

- One module per feature; files named `<feature>.<type>.ts` (`bookings.service.ts`, `create-booking.dto.ts`).
- **Controller:** routing, guards, DTOs, status codes, Swagger decorators. No business logic, no repository access.
- **Service:** all business rules and data changes. Throws Nest HTTP exceptions (`NotFoundException`, `ForbiddenException`, `ConflictException`).
- **Relations:** type every relation property as `Relation<Other>` (TypeORM's ES-module fix; without it, two entities that import each other crash at startup with "Cannot access before initialization").
- **Entities:** TypeORM classes, `snake_case` column names, `camelCase` properties, explicit relations, `createdAt`/`updatedAt` on every table.
- **DTOs:** every body and query param has a DTO with class-validator decorators. Response shapes never expose `passwordHash` (use `@Exclude()` + `ClassSerializerInterceptor`).
- **External services:** interface + injection token in `integrations/<service>/`; feature modules depend on the interface, never on the SDK.
- Ownership: any route with `:id` checks that the resource belongs to the current user (or the user is admin) in the service.
- Use transactions whenever two or more tables must change together.
- Schema changes only through migrations (`npm run migration:generate -w api -- src/database/migrations/<Name> -p`).
- **Every new table enables row level security in its migration** (`ALTER TABLE "x" ENABLE ROW LEVEL SECURITY`). Supabase exposes the `public` schema through its own REST API; RLS with no policies blocks that API, while our backend (table owner) keeps full access.
- REST: plural nouns, correct verbs (`GET` read, `POST` create, `PATCH` partial update, `DELETE` remove), status codes 200/201/202/204/400/401/403/404/409/422/429.

## Frontend (React)

- Function components and hooks only. One component per file, `PascalCase.tsx`.
- Pages in `pages/<role>/`, reusable pieces in `components/`, API calls only in `api/` (components never call axios directly).
- Data loading through `useApi`; forms through `useForm`; global state only in Context (auth, cart, notifications). Everything else is local state.
- Every request shows loading, error and empty states.
- Tailwind utility classes for layout and spacing; colours and fonts only from the `@theme` tokens in `index.css` (`bg-paper`, `text-ink`, `font-logo`).
- Animations with Motion; every animation respects `prefers-reduced-motion`. 3D scenes live in `components/three/` and are lazy-loaded.
- Accessible by default: labels on inputs, `alt` on images, buttons are `<button>`.

## Git

- Branch per task: `feat/…`, `fix/…`, `docs/…`, `test/…`, `chore/…`.
- Conventional commits: `feat(stylist): validate budget before saving suggestions`.
- Pull request template: what, why, how to test, screenshots, viva notes added (yes/no).
- Never commit `.env`, keys, real personal photos, or `node_modules`.
