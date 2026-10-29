# 04 pgai (skipped)

**Outcome: skipped.** The phase file allows this when pgai can't run reasonably with our setup. Checked on 2026-10-29.

## Feasibility findings
1. **Is it maintained?** No. The `timescale/pgai` GitHub repo is archived (read-only) and its README says the project is no longer maintained or supported as of 2026. The last tagged release is 0.12.0 (2025-09-04). Tiger Cloud's hosted vectorizer was removed on 2026-06-30.
2. **What does it require?** Since v0.10 the vectorizer is no longer a Postgres extension. It's a Python package: `python -m pgai install` creates an `ai` schema in the database, and a separate **vectorizer worker** container polls for changed rows (about every 5 s) and writes the embeddings.
3. **Local model?** Yes, with **Ollama** as a third container. The quickstart uses `nomic-embed-text` (768 dims, about 270 MB), so no API key is needed.
4. **Compatible with our image?** Probably, because since v0.10 it installs into any Postgres with pgvector. But the docs only test `timescaledb-ha:pg17`, and nobody fixes bugs anymore.

Building it would mean 2 extra containers, a second model with a different dimension, and a Python tool, all on an abandoned project. Not worth it for a learning lab.

## Manual (phase 03) vs automatic (pgai)
- **Phase 03, manual:** a Node script embeds rows `WHERE embedding IS NULL`. It's simple and fully under our control, but someone has to remember to run it, and edited rows aren't re-embedded.
- **pgai, automatic:** the database tracks changes and a worker keeps embeddings fresh, at the cost of extra services, and now an unmaintained dependency.

## Sources
- https://github.com/timescale/pgai (archived)
- https://github.com/timescale/pgai/releases
- https://github.com/timescale/pgai/blob/main/docs/vectorizer-quick-start.md
- https://github.com/timescale/pgai/blob/main/docs/vectorizer/migrating-from-extension.md
- https://www.tigerdata.com/docs/deploy/tiger-cloud/vectorizer-deprecation
