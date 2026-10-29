import { prisma } from "../../db.js";

type NearbyStore = { id: number; name: string; distance_km: number };
type StoreDistance = { id: number; name: string; lat: number; lng: number; distance_km: number };

// geography = meters on the real globe. ST_MakePoint takes (lng, lat): longitude FIRST.
// ST_DWithin can use the GiST index; "ST_Distance(...) < x" in WHERE cannot.
export const nearby = (lat: number, lng: number, km: number) =>
  prisma.$queryRaw<NearbyStore[]>`
    SELECT s.id, s.name, round((ST_Distance(s.location, q.p) / 1000)::numeric, 2)::float8 AS distance_km
    FROM "Store" s, (SELECT ST_SetSRID(ST_MakePoint(${lng}::float8, ${lat}::float8), 4326)::geography AS p) q
    WHERE ST_DWithin(s.location, q.p, ${km * 1000}::float8)
    ORDER BY ST_Distance(s.location, q.p)`;

export async function distance(id: number, lat: number, lng: number) {
  const rows = await prisma.$queryRaw<StoreDistance[]>`
    SELECT id, name, ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng,
           round((ST_Distance(location, ST_SetSRID(ST_MakePoint(${lng}::float8, ${lat}::float8), 4326)::geography) / 1000)::numeric, 2)::float8 AS distance_km
    FROM "Store" WHERE id = ${id}`;
  return rows[0] ?? null;
}
