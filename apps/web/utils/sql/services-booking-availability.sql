-- Service booking availability support
-- Run this in Supabase SQL editor before using Booking toggle in Services page.

alter table public.services
  add column if not exists allow_booking boolean not null default true;

create index if not exists idx_services_allow_booking
  on public.services (allow_booking);
    