-- Booking queue number support
-- Adds queue_number and checked_in_at to bookings so bookings can participate
-- in the shared daily queue alongside walk-in queue_entries.
-- Run this in Supabase SQL editor.

alter table public.bookings
  add column if not exists queue_number integer,
  add column if not exists checked_in_at timestamptz;
