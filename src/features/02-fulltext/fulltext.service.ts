import { Prisma } from "@prisma/client";
import { prisma } from "../../db.js";

// Ranked keyword search. websearch_to_tsquery accepts Google-style input: "exact phrase", or, -exclude.
export function search(q: string) {
  return prisma.$queryRaw<{ id: number; name: string; category: string; price: Prisma.Decimal; rank: number; snippet: string }[]>`
    SELECT id, name, category, price,
           ts_rank(search_vector, query) AS rank,
           ts_headline('english', description, query, 'StartSel=<b>, StopSel=</b>') AS snippet
    FROM "Product", websearch_to_tsquery('english', ${q}) AS query
    WHERE search_vector @@ query
    ORDER BY rank DESC, id
    LIMIT 20`;
}

// <% only returns rows with word_similarity >= this (Postgres default 0.6, too strict for short words with typos).
const FUZZY_THRESHOLD = "0.5";

// Typo-tolerant name search with pg_trgm.
// <% / word_similarity match q against the best-matching part of the name;
// similarity() compares against the whole name and is returned only for comparison.
export async function fuzzy(q: string) {
  // set_config(..., true) = SET LOCAL: lasts only for this transaction, so it can't leak to other pooled connections.
  const [, rows] = await prisma.$transaction([
    prisma.$queryRaw`SELECT set_config('pg_trgm.word_similarity_threshold', ${FUZZY_THRESHOLD}, true)`,
    prisma.$queryRaw<{ id: number; name: string; category: string; word_sim: number; sim: number }[]>`
      SELECT id, name, category,
             word_similarity(${q}, name) AS word_sim,
             similarity(${q}, name) AS sim
      FROM "Product"
      WHERE ${q} <% name
      ORDER BY word_sim DESC, id
      LIMIT 20`,
  ]);
  return rows;
}
