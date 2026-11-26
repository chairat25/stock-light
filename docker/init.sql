-- Stock Light: Local Docker PostgreSQL Initialization Schema
-- Automatically executed by Postgres on first `docker compose up -d`

create extension if not exists "pgcrypto";

create table if not exists public.zones (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default 'local-user',
  name text not null,
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_zones_user_id on public.zones(user_id);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default 'local-user',
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
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_items_user_id on public.items(user_id);
create index if not exists idx_items_zone_id on public.items(zone_id);
create index if not exists idx_items_expiry_date on public.items(expiry_date) where has_expiry = true;

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

-- Seed default room zones if table is empty
insert into public.zones (name, description, sort_order)
select v.name, v.description, v.sort_order
from (
  values
    ('โต๊ะทำงาน', 'ลิ้นชักและชั้นวางเหนือโต๊ะทำงาน', 1),
    ('ตู้เสื้อผ้า', 'ชั้นบนสุด กล่องผ้าลินิน และราวแขวน', 2),
    ('ห้องน้ำ / อ่างล้างหน้า', 'ชั้นไม้ติดผนังและตู้กระจก', 3),
    ('มุมชงกาแฟ / ของกิน', 'เคาน์เตอร์ไม้ริมหน้าต่างและชั้นวางของแห้ง', 4)
) as v(name, description, sort_order)
where not exists (select 1 from public.zones);
