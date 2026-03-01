-- Shop-level operation rules
-- Run this in Supabase SQL editor before using Operations settings feature.

create table if not exists public.shop_weekly_schedule (
  weekday text primary key,
  is_open boolean not null default true,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.shop_temporary_closures (
  id uuid primary key default gen_random_uuid(),
  start_date date not null,
  end_date date not null,
  reason text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint valid_closure_range check (start_date <= end_date)
);

insert into public.shop_weekly_schedule (weekday, is_open, is_active)
values
  ('monday', true, true),
  ('tuesday', true, true),
  ('wednesday', true, true),
  ('thursday', true, true),
  ('friday', true, true),
  ('saturday', true, true),
  ('sunday', true, true)
on conflict (weekday) do nothing;

create index if not exists idx_shop_temporary_closures_active_dates
  on public.shop_temporary_closures (is_active, start_date, end_date);
