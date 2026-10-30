# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Clipper is a booking app for an at-home dog grooming service in Seoul. It is a Next.js App Router-style app running on **vinext** (Vite-based Next.js reimplementation) deployed to **Cloudflare Workers**, with **Cloudflare D1** (SQLite) accessed through **Drizzle ORM**. `next/*` imports (`next/link`, `next/navigation`, etc.) are provided by vinext, not by the `next` package.

## Commands

```sh
npm install
npm run db:migrate:local   # apply drizzle/ migrations to local D1 (wrangler d1 migrations apply DB --local)
npm run db:seed:local      # DESTRUCTIVE: wipes all tables, then loads scripts/seed.sql
npm run dev                # vinext dev server, http://localhost:3000
npm run build              # build Worker output into dist/
npm run start              # run built Worker with wrangler (uses dist/server/wrangler.json)
npm run preview            # build + start
npm run cf-typegen         # regenerate worker-configuration.d.ts after changing bindings in wrangler.jsonc
npm run deploy
```

There is no test suite or linter configured. Use `npx tsc --noEmit` for type-checking. Local D1 state lives in `.wrangler/` (gitignored); to run ad-hoc SQL: `npx wrangler d1 execute DB --local --command "SELECT ..."`.

## Architecture

- **Database access**: the D1 binding is `DB` (see `wrangler.jsonc`), read via `import { env } from "cloudflare:workers"`. `lib/clipper/db.ts#getDatabase()` returns the Drizzle client — use it rather than constructing `drizzle()` inline.
- **Schema & migrations**: `db/schema.ts` is the Drizzle schema; migrations are SQL files in `drizzle/` (also wrangler's `migrations_dir`). Generate new migrations with `npx drizzle-kit generate`, then apply with `npm run db:migrate:local`. Timestamps are stored as `integer` `timestamp_ms` (Drizzle returns `Date`); money is integer `priceCents` (KRW, formatted as `₩`).
- **Data layer**: `lib/clipper/data.ts` holds queries used by server components and routes. It maps DB rows to the `AppointmentDetails` shape in `lib/clipper/types.ts` (ISO-string dates, nested `pet`/`groomer`/`package`).
- **Booking flow**:
  1. `components/clipper/booking-flow.tsx` (client component, rendered from the home page via `home-variants.tsx`) fetches `GET /api/booking-options` once for packages + neighborhoods, and `GET /api/availability?neighborhood=…&packageId=…` whenever either selection changes. Availability comes from `getAvailableSlots()` in `lib/clipper/data.ts`: hourly KST start times for the next 7 days where some groomer is scheduled and free for the whole package duration (one `db.batch()` round trip).
  2. It `POST`s to `/api/bookings`, which validates input, computes `endsAt` from the package duration, and calls `findAvailableGroomer()`.
  3. `findAvailableGroomer()` matches groomers by neighborhood (`groomer_service_areas`), weekday schedule (`groomer_schedules`, `HH:MM` strings compared lexically, using **Seoul (KST)** weekday/time via `lib/clipper/time.ts`; a visit can't cross midnight), and no overlapping non-cancelled appointment. Returns 409 if none.
  4. On success the client navigates to `/appointments/[reference]` (reference format `CLP-XXXXXX`), a `force-dynamic` server component.
- **UI**: shadcn/ui (new-york style) primitives in `components/ui/` re-exported from `components/ui/index.ts`; app-specific components in `components/clipper/`. Tailwind v4 via PostCSS, styles in `app/globals.css`. Path alias `@/*` maps to the repo root.

## Windows note

`scripts/*.mjs` wrap `npx wrangler` with `spawnSync`, pick `npx.cmd` on win32, and pass `shell: true` (Node refuses to spawn `.cmd` files without a shell) — keep both when adding similar scripts.

## Time zones

All times are Seoul (KST, UTC+9, no DST). Workers run in UTC, so never format dates with `getHours()`/`getDay()` or format them without a timezone. Use the helpers in `lib/clipper/time.ts`.

## Conventions
- No test runner exists. Don't invent one; use 'npx tsc --noEmit'.
