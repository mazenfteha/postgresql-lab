# Phase 05: PostGIS ("stores near me")

## The e-commerce story
"Pick up in store" needs to answer: which of our stores are within 10 km of this customer, nearest first?

## Goal
A `Store` table with coordinates, a spatial index, and a nearby-stores endpoint.

## Build
1. Migration (`--create-only`, edit):
   - `CREATE EXTENSION IF NOT EXISTS postgis;`
   - `CREATE TABLE "Store" (id serial PRIMARY KEY, name text NOT NULL, location geography(Point, 4326) NOT NULL);`
   - `CREATE INDEX store_location_gist ON "Store" USING GIST (location);`
   In `schema.prisma`, declare `Store` with `location Unsupported("geography(Point, 4326)")`. Only use raw SQL to read and write it.
2. `scripts/seed-stores.ts`: ~200 stores at random points around one chosen city (pick any city; hardcode a center lat/lng and jitter).
3. Endpoints in `routes.ts`:
   - `GET /stores/nearby?lat=&lng=&km=10`: `ST_DWithin` filter + `ST_Distance` ordering, return name and distance in km.
   - `GET /stores/:id/distance?lat=&lng=`: distance from one store to a point.
4. `scripts/postgis-explain.ts`: `EXPLAIN ANALYZE` of the nearby query showing the GiST index is used.

## Do NOT
- Add maps, routing, polygons, geofencing, or geocoding.
- Link stores to inventory or orders.

## Verify
- Querying from the city center returns stores sorted by increasing distance, all within the radius.
- Explain output shows an index scan on `store_location_gist`.

## Doc note (`docs/05-postgis.md`)
One sentence on `geography` vs `geometry`, and the explain result.
