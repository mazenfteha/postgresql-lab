# Phase 08: Electric SQL (live stock and price updates)

## The e-commerce story
A shopper has a product page open. When the price drops or stock hits zero, the page should change by itself, without polling and without you hand-writing websocket code.

## Goal
A minimal page that shows a live-updating product list, driven by Electric's sync from Postgres.

## First, check feasibility (before writing code)
Electric SQL has changed architecture significantly across versions. Read the **current** quickstart and record in `docs/08-electric.md`: the Docker service/image to run, the Postgres settings it needs (it requires logical replication, `wal_level=logical`), and the current client package(s) and API for subscribing to a table ("shape").
Follow the current docs, not older tutorials or memory.

## Build
1. `docker-compose.yml`: set Postgres to `wal_level=logical` and add the Electric service per the current docs. Restart the DB cleanly.
2. Keep it to the `Product` table: expose only `id, name, price, stock`. Add a `stock int` column via migration if it doesn't exist.
3. A single static `public/live.html` (plain HTML + a small script, no React, no bundler unless the Electric client truly requires one) that subscribes to the products shape and renders a list.
4. Endpoint in `routes.ts`:
   - `POST /admin/products/:id/price` with `{ "price": number }`: updates the price via Prisma. This is only used to trigger the demo.
5. Demo: open `live.html`, call the endpoint with curl, and the price on the page changes without a refresh.

## Do NOT
- Build auth, write-path sync, offline support, or conflict handling.
- Add a frontend framework or state library.

## Verify
- Changing a price via curl updates the open browser page within a second or two.

## Doc note (`docs/08-electric.md`)
Feasibility findings, the working setup, and a short note on what you'd have to build yourself with plain websockets that Electric handled.
