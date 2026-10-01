-- Link each close (job) to its client by id, not by name.
-- Written 2026-10-01 on branch `overnight`. NOT APPLIED.
--
-- Before this, jobs stored only client_name, and the app matched closes to
-- clients by name: two clients with the same name shared closes, and renaming
-- a client lost them. The app now writes client_id on new jobs and matches on
-- it (src/lib/clientJobs.ts). Jobs without client_id keep matching by name.
--
-- Until this runs, the app's job upsert retries without client_id
-- (src/lib/jobPersistence.ts), so saves keep working.
--
-- No foreign key: clients.id and jobs are written by separate client-side
-- calls, and a job must still save if its client row failed to save. A client
-- deleted later leaves a dangling id; the app then shows the job without a
-- client, as it does today for a renamed one.

alter table public.jobs add column if not exists client_id text;

create index if not exists idx_jobs_firm_client on public.jobs (firm_id, client_id);

-- Optional backfill for existing jobs: link a job to a client of the same firm
-- with the same name, but only where exactly one such client exists. Jobs whose
-- name matches two or more clients stay unlinked (and keep matching by name).
update public.jobs j
set client_id = c.id
from public.clients c
where j.client_id is null
  and c.firm_id = j.firm_id
  and lower(trim(c.business_name)) = lower(trim(j.client_name))
  and (
    select count(*) from public.clients c2
    where c2.firm_id = j.firm_id
      and lower(trim(c2.business_name)) = lower(trim(j.client_name))
  ) = 1;

-- RLS: unchanged. jobs policies already scope rows by firm_id.
