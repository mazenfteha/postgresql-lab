# Crash test: unlogged vs logged

Manual procedure. Run each step in PowerShell from the repo root. The compose service is `db`.

## 1. Write one row to each table
```powershell
docker compose exec db psql -U lab -d lab -c "INSERT INTO cache_unlogged VALUES ('crash-test', jsonb_build_object('survives', false), now() + interval '1 day') ON CONFLICT (key) DO NOTHING;"
docker compose exec db psql -U lab -d lab -c "INSERT INTO cache_logged   VALUES ('crash-test', jsonb_build_object('survives', true),  now() + interval '1 day') ON CONFLICT (key) DO NOTHING;"
docker compose exec db psql -U lab -d lab -c "SELECT 'unlogged' AS t, count(*) FROM cache_unlogged UNION ALL SELECT 'logged', count(*) FROM cache_logged;"
```
Expected: both counts ≥ 1.

(`jsonb_build_object` keeps double quotes out of the command. Windows PowerShell 5.1 mangles `\"` inside arguments passed to native programs like `docker`, which split the first attempt into broken pieces.)

## 2. Crash Postgres (unclean stop)
```powershell
docker compose kill db
```
`kill` sends SIGKILL: Postgres gets no chance to flush or write a shutdown checkpoint. That's the same as pulling the power cord. (`docker compose stop` would shut down cleanly, and then unlogged data **survives**, so it isn't a crash test.)

## 3. Restart and look
```powershell
docker compose start db
docker compose exec db psql -U lab -d lab -c "SELECT 'unlogged' AS t, count(*) FROM cache_unlogged UNION ALL SELECT 'logged', count(*) FROM cache_logged;"
docker compose logs db --tail 20
```
Expected:
- `unlogged`: **0**. During crash recovery, Postgres resets every unlogged table to empty.
- `logged`: **1** (or more). It was replayed from the WAL.
- The logs show `database system was interrupted` … `redo starts` / `redo done`, which is crash recovery.
