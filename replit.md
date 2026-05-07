# Elite FF Tournament Platform

A Free Fire mobile tournament management app where players register for tournaments, track results, and receive notifications — powered by Clerk authentication.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, served at `/api`)
- `pnpm --filter @workspace/elite-ff run dev` — run the frontend Vite dev server
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite 7 + Tailwind CSS v4 + Wouter routing
- API: Express 5
- Auth: Clerk (`@clerk/react@^6`, `@clerk/express@^1`)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/elite-ff/src/` — React frontend
  - `pages/` — all page components (Home, Tournaments, TournamentDetail, Results, Alerts, Settings, HostSettings, Feedback, Profile, EditTournament, UploadResults, LiveScoreboard, PaymentVerification, HumanVerification)
  - `components/` — Header, BottomNav, LoginSheet, CreateTournamentModal
  - `contexts/AuthContext.tsx` — Clerk-backed auth context (user state, login/logout)
  - `contexts/AppContext.tsx` — theme + human verification state
  - `App.tsx` — ClerkProvider + QueryClientProvider + Router
- `artifacts/api-server/src/` — Express API
  - `routes/` — auth, tournaments, registrations, notifications, results, feedback, stats
  - `middlewares/authMiddleware.ts` — Clerk → DB user upsert
  - `middlewares/clerkProxyMiddleware.ts` — proxies Clerk FAPI for production
- `lib/db/src/schema/` — Drizzle schema (tournaments, registrations, notifications, results, users, etc.)
- `lib/api-spec/openapi.yaml` — source-of-truth OpenAPI spec
- `lib/api-zod/src/generated/api.ts` — generated Zod schemas
- `lib/api-client-react/src/generated/` — generated React Query hooks

## Architecture decisions

- **Clerk auth replaces custom OIDC**: The original app used a custom OIDC/JWT flow. Clerk replaces it entirely — `clerkMiddleware()` runs on all routes; `authMiddleware.ts` upserts Clerk users into the DB on first sign-in.
- **Host access via email allowlist**: `HOST_EMAILS = ["venomx2424@gmail.com", "knightxvenom@gmail.com"]` in both `authMiddleware.ts` (server) and `AuthContext.tsx` (client). The role is persisted to the DB on first login.
- **`users.mobile` stores Clerk user ID**: Rather than phone numbers, the `mobile` varchar column stores the Clerk `user_xxx` ID as the join key between Clerk and the DB.
- **Orval codegen post-processing**: The codegen script rewrites `lib/api-zod/src/index.ts` after orval runs because orval v8 in split mode generates an index referencing `api.schemas` that it doesn't actually produce for the Zod client.
- **`@clerk/shared` override**: pnpm-workspace.yaml overrides `@clerk/shared` to `>=4.0.0` because `@clerk/react@6` requires v4 but `@clerk/express` alone would resolve to v3.

## Product

- Human verification gate before app access
- Browse and register for Free Fire tournaments (solo, duo, squad)
- Pay entry fee via UPI (QR code generated client-side via external API)
- View room credentials (ID + password) once approved by host
- Live scoreboard per tournament
- Notification center for tournament updates
- Results/prize history
- Host panel: create/edit/cancel/delay tournaments, approve/decline registrations, upload results, manage scoreboard

## User preferences

- Host emails: venomx2424@gmail.com and knightxvenom@gmail.com (admin/host access)
- All other users get player role
- Keep all existing UI unchanged — auth-only changes to files

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`
- Run `pnpm --filter @workspace/db run push` after changing DB schema
- The `minimumReleaseAge: 1440` in pnpm-workspace.yaml blocks packages published <1 day ago — add to `minimumReleaseAgeExclude` if needed
- `BASE_PATH` defaults to `"/"` in `vite.config.ts` if not set by the platform
- Images used in app are at `/attached_assets/*.png` (workspace root `attached_assets/` folder)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `clerk-auth` skill for Clerk configuration
