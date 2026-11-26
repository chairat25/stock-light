-- Stock Light: Room Inventory & Spatial Storage Schema
-- Run this SQL in your Supabase SQL Editor

-- 1. Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 2. Room Zones table (e.g. โต๊ะทำงาน, ตู้เสื้อผ้า, ชั้นวางหนังสือ, ห้องน้ำ)
create table if not exists public.zones (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_zones_user_id on public.zones(user_id);

-- 3. Inventory Items table
create table if not exists public.items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  zone_id uuid references public.zones(id) on delete set null,
  name text not null,
  category text not null default 'ของใช้ทั่วไป',
  quantity integer not null default 1 check (quantity >= 0),
  unit text not null default 'ชิ้น',
  location_detail text not null default '',
  has_expiry boolean not null default false,
  expiry_date date,
  item_photo_url text,
  spot_photo_url text,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_items_user_id on public.items(user_id);
create index if not exists idx_items_zone_id on public.items(zone_id);
create index if not exists idx_items_expiry_date on public.items(expiry_date) where has_expiry = true;

-- 4. Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_items_updated_at on public.items;
create trigger set_items_updated_at
  before update on public.items
  for each row
  execute function public.handle_updated_at();

-- 5. Row Level Security (RLS)
alter table public.zones enable row level security;
alter table public.items enable row level security;

-- Zones policies
create policy "Users can view their own zones"
  on public.zones for select
  using (auth.uid() = user_id);

create policy "Users can insert their own zones"
  on public.zones for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own zones"
  on public.zones for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own zones"
  on public.zones for delete
  using (auth.uid() = user_id);

-- Items policies
create policy "Users can view their own items"
  on public.items for select
  using (auth.uid() = user_id);

create policy "Users can insert their own items"
  on public.items for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own items"
  on public.items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own items"
  on public.items for delete
  using (auth.uid() = user_id);
