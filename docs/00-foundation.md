# 00 Foundation

## What it is
The skeleton every later phase builds on: Postgres 17 (PostGIS + pgvector available) in Docker, Express + Prisma, and a seeded catalog of 5,000 products and 50 customers. No Postgres features are used yet.

Versions used:
- Node v20.16.0, npm 10.8.1, Docker 27.2.0, Compose v2.29.2
- Prisma / @prisma/client 6.19.3 (`prisma-client-js` generator, URL in `schema.prisma`)
- Base image `postgis/postgis:17-3.6-alpine`, pgvector `v0.8.7` built from source

## The SQL that matters
```sql
SELECT 1;                          -- GET /health via prisma.$queryRaw
SELECT count(*) FROM "Product";    -- Prisma keeps model names, so the table needs quotes
```

## What I measured
```
$ curl.exe localhost:3000/health
{"ok":true}

$ docker compose exec db psql -U lab -d lab -c 'SELECT count(*) FROM "Product";'
 count
-------
  5000
(1 row)
```

## Gotchas
- **Prisma 7 needs Node >= 20.19.** This machine has 20.16, so the project stays on Prisma 6.19 with the classic setup: no `prisma.config.ts` and no driver adapter. Upgrading Node would let us move to Prisma 7.
- **Alpine has no `postgresql-17-pgvector` package.** pgvector is built from source in the Dockerfile with `with_llvm=no`, so clang/llvm aren't needed for JIT bitcode. The first image build takes a few minutes.
- **Port 5433 on the host.** A local Postgres already uses 5432.
- Prisma table names are PascalCase (`"Product"`, `"OrderItem"`), so raw SQL must double-quote them.
