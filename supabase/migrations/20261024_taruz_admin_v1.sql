-- Taruz Admin v1
-- Run in the Supabase SQL Editor (or as a migration) before configuring the app.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_reference text not null,
  project_title text,
  client_name text,
  client_email text,
  status text not null default 'enquiry' check (status in (
    'enquiry', 'quote_sent', 'accepted', 'deposit_due',
    'in_progress', 'balance_due', 'completed', 'cancelled'
  )),
  total numeric(12,2) not null default 0 check (total >= 0),
  balance_due numeric(12,2) not null default 0 check (balance_due >= 0),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, project_reference)
);

alter table public.projects enable row level security;

create policy "Taruz admins can read only their projects"
  on public.projects for select to authenticated
  using (owner_id = auth.uid());

create policy "Taruz admins can create only their projects"
  on public.projects for insert to authenticated
  with check (owner_id = auth.uid());

create policy "Taruz admins can update only their projects"
  on public.projects for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Taruz admins can delete only their projects"
  on public.projects for delete to authenticated
  using (owner_id = auth.uid());

create or replace function public.set_projects_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.set_projects_updated_at();
