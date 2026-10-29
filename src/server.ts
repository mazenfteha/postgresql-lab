import express from "express";
import { prisma } from "./db.js";
import { jsonbRouter } from "./features/01-jsonb/jsonb.routes.js";
import { fulltextRouter } from "./features/02-fulltext/fulltext.routes.js";
import { pgvectorRouter } from "./features/03-pgvector/pgvector.routes.js";

const app = express();
app.use(express.json());

// Tiny colored request logger: METHOD path status duration.
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const color = res.statusCode >= 500 ? 31 : res.statusCode >= 400 ? 33 : 32; // red / yellow / green
    console.log(`\x1b[36m${req.method}\x1b[0m ${req.originalUrl} \x1b[${color}m${res.statusCode}\x1b[0m ${Date.now() - start}ms`);
  });
  next();
});

app.get("/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ ok: true });
});

// Feature routers
app.use(jsonbRouter);
app.use(fulltextRouter);
app.use(pgvectorRouter);

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`listening on http://localhost:${port}`));
