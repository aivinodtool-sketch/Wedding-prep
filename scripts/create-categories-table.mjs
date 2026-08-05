// Run this script once to create the categories table:
// node scripts/create-categories-table.mjs

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rrewrglczowvpofydqyd.supabase.co'
const serviceRoleKey = 'sb_secret_fI5JNrNNaUgxj2kSBBkmXQ_2eMXfkH7'

const supabase = createClient(supabaseUrl, serviceRoleKey)

// ─── CREATE TABLE & RLS POLICIES ──────────────────────────────────────────────

const steps = [
  {
    label: 'Create categories table',
    fn: async () => {
      // We'll try inserting a dummy check row to detect if the table exists
      const { error: checkError } = await supabase.from('categories').select('id').limit(1)
      if (checkError && checkError.code === 'PGRST205') {
        console.log('  → Table not found. Need to create via Supabase Dashboard SQL editor.')
        console.log('  → Please run the following SQL in your Supabase Dashboard SQL Editor:')
        console.log(`
-- ============================================================
-- Run this in Supabase Dashboard > SQL Editor
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

create policy "Members can view categories" on public.categories
  for select using (public.has_wedding_access(wedding_id));

create policy "Members can manage categories" on public.categories
  for all using (public.has_wedding_access(wedding_id));
        `)
        return false
      } else {
        console.log('  ✓ Categories table already exists!')
        return true
      }
    },
  },
]

for (const step of steps) {
  console.log(`\n[${step.label}]`)
  await step.fn()
}
