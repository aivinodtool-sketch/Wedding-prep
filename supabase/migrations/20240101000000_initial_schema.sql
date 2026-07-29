-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Users Profile
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Weddings
create table public.weddings (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  date date not null,
  created_by uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Wedding Members
create type member_role as enum ('admin', 'family', 'guest', 'vendor');

create table public.wedding_members (
  id uuid default uuid_generate_v4() primary key,
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role member_role not null default 'family',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(wedding_id, user_id)
);

-- 4. Tasks
create type task_priority as enum ('low', 'medium', 'high');
create type task_status as enum ('pending', 'in_progress', 'completed');

create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  title text not null,
  description text,
  status task_status default 'pending' not null,
  priority task_priority default 'medium' not null,
  due_date timestamp with time zone,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Guests
create type guest_status as enum ('invited', 'attending', 'declined', 'not_invited');

create table public.guests (
  id uuid default uuid_generate_v4() primary key,
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  name text not null,
  family_name text,
  phone text,
  status guest_status default 'not_invited' not null,
  food_preference text,
  table_number integer,
  gift_received text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Vendors
create table public.vendors (
  id uuid default uuid_generate_v4() primary key,
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  name text not null,
  category text not null,
  phone text,
  address text,
  advance_paid numeric(12,2) default 0,
  total_amount numeric(12,2) default 0,
  due_date date,
  rating integer check (rating >= 1 and rating <= 5),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Budgets
create table public.budgets (
  id uuid default uuid_generate_v4() primary key,
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  category text not null,
  allocated_amount numeric(12,2) default 0 not null,
  spent_amount numeric(12,2) default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Shopping Items
create table public.shopping_items (
  id uuid default uuid_generate_v4() primary key,
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  name text not null,
  category text not null,
  quantity integer default 1,
  estimated_cost numeric(12,2) default 0,
  actual_cost numeric(12,2) default 0,
  vendor_id uuid references public.vendors(id) on delete set null,
  purchased_by uuid references public.profiles(id) on delete set null,
  is_purchased boolean default false,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES --
alter table public.profiles enable row level security;
alter table public.weddings enable row level security;
alter table public.wedding_members enable row level security;
alter table public.tasks enable row level security;
alter table public.guests enable row level security;
alter table public.vendors enable row level security;
alter table public.budgets enable row level security;
alter table public.shopping_items enable row level security;

-- Profiles: users can read their own or others in the same wedding, but can only update their own
create policy "Users can view profiles of wedding members" on public.profiles
  for select using (
    id = auth.uid() or
    id in (
      select user_id from public.wedding_members where wedding_id in (
        select wedding_id from public.wedding_members where user_id = auth.uid()
      )
    )
  );
create policy "Users can update own profile" on public.profiles for update using (id = auth.uid());
create policy "Users can insert own profile" on public.profiles for insert with check (id = auth.uid());

-- Weddings: can view if member
create policy "Users can view their weddings" on public.weddings
  for select using (
    id in (select wedding_id from public.wedding_members where user_id = auth.uid())
  );
create policy "Admins can update weddings" on public.weddings
  for update using (
    id in (select wedding_id from public.wedding_members where user_id = auth.uid() and role = 'admin')
  );
create policy "Users can insert weddings" on public.weddings for insert with check (true);

-- Wedding Members
create policy "Users can view members of their weddings" on public.wedding_members
  for select using (
    wedding_id in (select wedding_id from public.wedding_members where user_id = auth.uid())
  );
create policy "Admins can manage members" on public.wedding_members
  for all using (
    wedding_id in (select wedding_id from public.wedding_members where user_id = auth.uid() and role = 'admin')
  );
create policy "Users can join weddings" on public.wedding_members for insert with check (true);

-- Function to check if user has access to wedding
create or replace function public.has_wedding_access(w_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.wedding_members
    where wedding_id = w_id and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- Tasks: members can view and update
create policy "Members can view tasks" on public.tasks
  for select using (public.has_wedding_access(wedding_id));
create policy "Members can manage tasks" on public.tasks
  for all using (public.has_wedding_access(wedding_id));

-- Guests, Vendors, Budgets, Shopping Items (using has_wedding_access)
create policy "Members can view guests" on public.guests for select using (public.has_wedding_access(wedding_id));
create policy "Members can manage guests" on public.guests for all using (public.has_wedding_access(wedding_id));

create policy "Members can view vendors" on public.vendors for select using (public.has_wedding_access(wedding_id));
create policy "Members can manage vendors" on public.vendors for all using (public.has_wedding_access(wedding_id));

create policy "Members can view budgets" on public.budgets for select using (public.has_wedding_access(wedding_id));
create policy "Members can manage budgets" on public.budgets for all using (public.has_wedding_access(wedding_id));

create policy "Members can view shopping items" on public.shopping_items for select using (public.has_wedding_access(wedding_id));
create policy "Members can manage shopping items" on public.shopping_items for all using (public.has_wedding_access(wedding_id));

-- Trigger to create profile on signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
