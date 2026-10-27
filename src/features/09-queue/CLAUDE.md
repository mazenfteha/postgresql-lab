# Phase 09: Postgres as a message queue (order -> fulfillment)

## The e-commerce story
When an order is placed, another service must react (send confirmation email, notify the warehouse). If the order is saved but the message is lost, or the message is sent but the order rolls back, the system is inconsistent. Writing the order and the message in the SAME database transaction makes both succeed or both fail (the "transactional outbox" pattern).

## Goal
Two separate processes: "service A" (the Express API) enqueues a job inside the order transaction, and "service B" (a standalone worker script) claims and processes jobs safely.

## Build
1. Migration (`--create-only`, edit):
   ```sql
   CREATE TABLE jobs (
     id          bigserial PRIMARY KEY,
     type        text        NOT NULL,
     payload     jsonb       NOT NULL,
     status      text        NOT NULL DEFAULT 'pending',  -- pending | done | failed
     attempts    int         NOT NULL DEFAULT 0,
     run_at      timestamptz NOT NULL DEFAULT now(),
     last_error  text,
     created_at  timestamptz NOT NULL DEFAULT now()
   );
   CREATE INDEX jobs_pending_idx ON jobs (run_at) WHERE status = 'pending';
   ```
   Do not model `jobs` in `schema.prisma`. Use `$queryRaw` / `$executeRaw` only.
2. Endpoint in `routes.ts` (service A):
   - `POST /orders` with `{ customerId, items: [{ productId, quantity }] }`. Inside ONE `prisma.$transaction`: create the Order + OrderItems, then insert a job `{ type: 'order_placed', payload: { orderId } }`. Return the order id.
3. `src/features/09-queue/worker.ts` (service B), run with `npm run worker`:
   - Loop: claim one job with
     ```sql
     UPDATE jobs SET attempts = attempts + 1
     WHERE id = (
       SELECT id FROM jobs
       WHERE status = 'pending' AND run_at <= now()
       ORDER BY run_at
       FOR UPDATE SKIP LOCKED
       LIMIT 1
     )
     RETURNING *;
     ```
   - "Process" it by logging a fake confirmation email (`console.log`), nothing real.
   - On success set `status = 'done'`. On error: if `attempts < 3`, set `run_at = now() + interval '10 seconds'` and store `last_error`; otherwise set `status = 'failed'`.
   - If no job is found, sleep 1 second and poll again.
   - Keep claim + process + mark in one transaction so a crashed worker releases the job automatically.
4. Add an env flag `FAIL_RATE` (0 to 1) so the worker randomly throws, to demo retries.
5. `scripts/queue-demo.md` (a short manual procedure, not code), three checks:
   - **Concurrency:** start 3 workers, POST 50 orders, confirm every job processed exactly once (count log lines per order id).
   - **Atomicity:** make the order insert fail on purpose (e.g. a nonexistent productId) and confirm NO job row was created.
   - **Retries:** run with `FAIL_RATE=0.5` and watch jobs retry and eventually reach `done` or `failed`.

## Optional stretch (only after the above works, keep it to one file)
Replace the hand-written `jobs` table and worker loop with **pgmq** (`pgmq.send`, `pgmq.read` with a visibility timeout, `pgmq.archive`) in a second worker `worker-pgmq.ts`. Check the pgmq README for how to install it in our Postgres image. In the doc note, compare how much code disappeared. If pgmq won't install easily, skip this and say so.

## Do NOT
- Add `LISTEN/NOTIFY`, priorities, delayed scheduling APIs, dead-letter UIs, or a job dashboard.
- Make the worker call real email or payment services.
- Build more than one job type.

## Verify
- `POST /orders` creates one order and one pending job.
- With 3 workers running, each job is processed exactly once.
- A failed order insert leaves no job behind.
- Failing jobs retry up to 3 attempts, then end as `failed`.

## Doc note (`docs/09-queue.md`)
Include: the claim query and why `SKIP LOCKED` matters, results of the three checks, and one honest sentence on when you would move to RabbitMQ or Kafka instead.