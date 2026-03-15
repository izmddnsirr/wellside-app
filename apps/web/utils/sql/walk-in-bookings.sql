-- Walk-in booking support
-- Run this in Supabase SQL editor before using walk-in bookings in admin calendar.

create table if not exists public.walk_in_customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_walk_in_customers_phone
  on public.walk_in_customers (phone);

alter table public.bookings
  alter column customer_id drop not null;

alter table public.bookings
  add column if not exists walk_in_customer_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'bookings_walk_in_customer_id_fkey'
  ) then
    alter table public.bookings
      add constraint bookings_walk_in_customer_id_fkey
      foreign key (walk_in_customer_id)
      references public.walk_in_customers(id)
      on delete set null;
  end if;
end $$;

alter table public.bookings
  drop constraint if exists bookings_customer_or_walkin_check;

alter table public.bookings
  add constraint bookings_customer_or_walkin_check
  check (
    customer_id is not null
    or walk_in_customer_id is not null
  );
