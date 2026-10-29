# Ideas parking lot

One line per out-of-scope idea. Do not build these during a phase.

- Try ParadeDB / `pg_search` (BM25 ranking) and compare it with built-in `ts_rank` (from phase 02).
- Hybrid search: combine FTS rank and vector distance (e.g. reciprocal rank fusion), plus richer non-templated descriptions so embeddings capture intent ("keeps drinks hot") (from phase 03).
- Auto re-embedding on change without pgai: a trigger enqueues changed product ids, and a worker using the phase 09 queue embeds them (from phase 04, skipped).
