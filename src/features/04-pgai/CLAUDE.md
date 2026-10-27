# Phase 04: pgai (embeddings generated from SQL) — OPTIONAL

## The e-commerce story
Instead of a Node script that you must remember to run, the database keeps embeddings up to date by itself when product rows change.

## Goal
Replace the manual `embed-products.ts` step with pgai's automatic vectorization, as a side-by-side demo.

## First, check feasibility (do this before writing any code)
pgai has changed shape over time (its vectorizer has run as a separate worker process rather than purely inside the database). Search the current pgai docs and answer in `docs/04-pgai.md`:
1. What does pgai currently require (extension, worker container, API key for an embedding provider)?
2. Can it run locally with a local model (e.g. Ollama), or does it need a hosted provider key?
3. Is it compatible with the Postgres image from phase 00?

**If it requires a paid key the user has not provided, or can't run with our setup: stop. Write the findings in the doc note, mark phase 04 as skipped in the root `CLAUDE.md`, and move on.** Skipping is a valid outcome of this phase.

## Build (only if feasible)
1. Add the minimum extra service to `docker-compose.yml`.
2. Create a vectorizer for a **separate** table `product_embeddings_pgai` (do not touch the phase 03 column), sourced from `Product.name || description`.
3. One endpoint: `GET /search/pgai?q=` returning nearest products using the pgai-managed table.
4. Demonstrate: insert a new product via a script and show its embedding appears without running any embed script.

## Do NOT
- Remove or change phase 03's code.
- Build anything beyond the one endpoint and the insert demo.

## Verify
- The new product gets an embedding automatically within the documented delay.

## Doc note (`docs/04-pgai.md`)
Feasibility findings, setup steps that actually worked, and a two-line comparison with the manual approach from phase 03.
