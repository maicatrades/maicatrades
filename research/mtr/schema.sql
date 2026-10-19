-- Apply once in the project's Supabase SQL editor. Server credentials publish;
-- clients cannot access the journal directly. Pro API checks authentication.
create table if not exists public.mtr_research_log (
 id text primary key,
 payload jsonb not null,
 updated_at timestamptz not null default now()
);
alter table public.mtr_research_log enable row level security;
revoke all on public.mtr_research_log from anon, authenticated;
grant select, insert, update on public.mtr_research_log to service_role;
