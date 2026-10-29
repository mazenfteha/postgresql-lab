import { prisma } from "../src/db.js";

// 200 stores at random points within 25 km of central Cairo (Tahrir Square).
const CENTER = { lat: 30.0444, lng: 31.2357 };
const COUNT = 200;
const RADIUS_KM = 25;

// Seeded PRNG (mulberry32) so every run produces the same stores and the docs stay reproducible.
let seed = 42;
const random = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const names: string[] = [];
const lats: number[] = [];
const lngs: number[] = [];
for (let i = 1; i <= COUNT; i++) {
  // sqrt() spreads points evenly over the circle's area instead of bunching them at the center
  const r = RADIUS_KM * Math.sqrt(random());
  const angle = 2 * Math.PI * random();
  names.push(`Store ${String(i).padStart(3, "0")}`);
  lats.push(CENTER.lat + (r * Math.cos(angle)) / 111.32); // ~111.32 km per degree of latitude
  lngs.push(CENTER.lng + (r * Math.sin(angle)) / (111.32 * Math.cos((CENTER.lat * Math.PI) / 180)));
}

await prisma.$executeRaw`TRUNCATE "Store" RESTART IDENTITY`;
// One INSERT for all rows: unnest() turns the three arrays into rows.
await prisma.$executeRaw`
  INSERT INTO "Store" (name, location)
  SELECT name, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
  FROM unnest(${names}::text[], ${lngs}::float8[], ${lats}::float8[]) AS s(name, lng, lat)`;
await prisma.$executeRaw`ANALYZE "Store"`;

console.log(`seeded ${COUNT} stores within ${RADIUS_KM} km of Cairo (${CENTER.lat}, ${CENTER.lng})`);
await prisma.$disconnect();
