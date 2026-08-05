-- ============================================================
-- CATEGORIES TABLE MIGRATION
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

create table if not exists public.categories (
  id uuid default uuid_generate_v4() primary key,
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  name text not null,
  parent_id uuid references public.categories(id) on delete cascade,
  type text default 'general' not null,
  sort_order integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.categories enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'categories'
    and policyname = 'Members can view categories'
  ) then
    create policy "Members can view categories" on public.categories
      for select using (public.has_wedding_access(wedding_id));
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'categories'
    and policyname = 'Members can manage categories'
  ) then
    create policy "Members can manage categories" on public.categories
      for all using (public.has_wedding_access(wedding_id));
  end if;
end$$;

-- ✅ Done! The app will now auto-seed categories for each wedding on first load.
