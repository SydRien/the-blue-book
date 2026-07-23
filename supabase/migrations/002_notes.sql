-- The Blue Book — Phase 7.4 Scratchpad notes
-- Personal single-user access via RLS (auth.uid()).

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  title text not null,
  content text not null default '',
  type text not null default 'idea',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notes_type_check check (
    type in ('idea', 'reference', 'research', 'random')
  )
);

create index if not exists notes_user_id_idx on public.notes (user_id);
create index if not exists notes_project_id_idx on public.notes (project_id);

alter table public.notes enable row level security;

create policy "notes_select_own"
  on public.notes for select
  using (auth.uid() = user_id);

create policy "notes_insert_own"
  on public.notes for insert
  with check (auth.uid() = user_id);

create policy "notes_update_own"
  on public.notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "notes_delete_own"
  on public.notes for delete
  using (auth.uid() = user_id);
