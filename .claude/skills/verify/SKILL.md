---
name: verify
description: Run and drive the Clipper booking app locally to verify changes end-to-end (booking flow, appointment pages, API routes).
---

# Verify Clipper locally

## Launch

```sh
npm run db:migrate:local   # once per fresh .wrangler/ state
npm run dev                # http://localhost:3000
```

Check it's up first: `Invoke-WebRequest http://localhost:3000 -UseBasicParsing` → 200. The user often already has it running; don't start a second one.

`npm run db:seed:local` wipes all tables — only run it if the user agrees.

## Drive (Chrome via claude-in-chrome)

1. Open `http://localhost:3000/#book`, `find` the "Book a Clipper visit" region, `scroll_to` it.
2. The form is pre-filled (Luna / Miniature Poodle / Full Groom / Itaewon / address). Change the pet name to something unique so the booking is easy to spot.
3. Click a time slot (grouped by KST date), check the Visit summary sidebar, click **Confirm visit →**.
4. Success → redirects to `/appointments/CLP-XXXXXX` (confirmation hero + details card).
5. `/appointments` lists every booking, newest `startsAt` first.

## Useful probes

- Double-book: `POST /api/bookings` with the same `startsAt` (UTC ISO) → expect `409 {"ok":false,"error":"No groomer is available..."}` if only one groomer covers that neighborhood.
- `GET /api/availability?neighborhood=Itaewon&packageId=pkg_full_groom`: the slot you booked, and any slot whose duration overlaps it, should be gone.
- Unknown reference `/appointments/CLP-ZZZZZZ` → "We can't find that visit." page.

## DB check

Column names are snake_case (`booking_reference`, `starts_at` in ms):

```sh
npx wrangler d1 execute DB --local --command "SELECT booking_reference, datetime(starts_at/1000,'unixepoch') AS starts_utc, status, groomer_id FROM appointments ORDER BY created_at DESC LIMIT 5"
```

2:00 PM KST is stored as 05:00 UTC.

## Gotchas

- The home-page hero "Upcoming visit" card is static mock content, not real data.
- Verification bookings stay in local D1. Tell the user the reference so they can delete it.
