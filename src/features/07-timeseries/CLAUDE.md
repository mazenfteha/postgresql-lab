# Phase 07: Time-series with pg_mooncake (price history and sales analytics)

## The e-commerce story
Every price change and every sale is an event with a timestamp. Questions like "average daily revenue by category for the last 90 days" scan millions of rows. Column-store tables are built for exactly that.

## Goal
Load ~1-2 million synthetic sales events, run one analytics query on a normal row table and on a pg_mooncake column-store table, and compare.

## First, check feasibility (before writing code)
pg_mooncake has evolved quickly. Search its current docs and record in `docs/07-timeseries.md`: how it is installed (extension in a custom image? separate image?), supported Postgres versions, and the exact syntax to create a column-store table.
**Fallback if it can't be made to run with our setup within reasonable effort:** use TimescaleDB (hypertable + one continuous aggregate) instead, and say so in the doc note. Do not attempt both.

## Build
1. Table `sales_events_row`: `(ts timestamptz, product_id int, category text, quantity int, unit_price numeric)` as a normal table with a btree index on `ts`.
2. The same schema as a column-store table using the syntax found above (`sales_events_col`).
3. `scripts/seed-sales.ts`: generate 1-2 million events over the last 12 months and load them into BOTH tables with `COPY` or large batched inserts (not row-by-row Prisma calls).
4. Endpoint in `routes.ts`:
   - `GET /analytics/revenue-by-category?days=90&engine=row|col`: daily revenue per category, runs against the chosen table.
5. `scripts/timeseries-bench.ts`: run the same query 5 times per engine, print the median time for each.

## Do NOT
- Build dashboards, rollups, retention policies, or compression tuning.
- Hook this into the real `Order` tables.

## Verify
- Both engines return identical results for the same query.
- The benchmark prints median times for both.

## Doc note (`docs/07-timeseries.md`)
Feasibility findings, the two medians, and one honest sentence on whether the gap justified the extra moving part.
