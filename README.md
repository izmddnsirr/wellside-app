# Wellside

![Banner](./assets/banner.png)

[![Monorepo](https://img.shields.io/badge/monorepo-Turborepo-blue)](https://turbo.build/repo)
[![Frontend](https://img.shields.io/badge/frontend-Next.js%2016-black)](https://nextjs.org/)
[![Database](https://img.shields.io/badge/database-Supabase-3ECF8E)](https://supabase.com/)
[![UI](https://img.shields.io/badge/ui-Tailwind%20CSS%204-38B2AC)](https://tailwindcss.com/)
[![Status](https://img.shields.io/badge/status-active-brightgreen)](#project-overview)

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Database / Supabase Notes](#database--supabase-notes)
- [Screenshots](#screenshots)
- [Current Implementation Notes](#current-implementation-notes)

## Project Overview

Wellside is a monorepo for a barbershop booking and shop-management system. It combines a customer-facing booking experience with staff portals for admins and barbers, plus supporting Supabase-backed workflows for scheduling, bookings, operations, point-of-sale, and transactional email.

Based on the current codebase, the project is built to solve several operational problems for a barbershop in one system:

- Let customers register, log in, book appointments, review upcoming bookings, cancel bookings, and see booking history.
- Let admins manage services, products, customers, barbers, bookings, operating days, temporary closures, reports, and POS records.
- Let barbers see their daily workload and update appointment statuses.
- Enforce booking rules such as shop closures, barber working hours, overlap prevention, and active-booking checks.
- Send booking confirmation and cancellation emails through Resend.

The repository currently centers on `apps/web`, the Next.js application used by customers, admins, and barbers.

## Features

### Customer application

- Landing page with service listing, barber listing, availability preview, and login/logout entry points.
- Customer registration with a 2-step onboarding flow:
  - Step 1: email + password validation
  - Step 2: first name, last name, and Malaysian phone number capture
- Email/password login for customers.
- Password recovery and password reset flows through Supabase auth callback handling.
- Customer home dashboard showing:
  - next active booking
  - total booking count
- Multi-step booking flow:
  - select service
  - select barber
  - select date/time
  - review booking
  - confirm booking
- Slot generation that respects:
  - barber working hours
  - existing bookings
  - shop weekly schedule
  - temporary closures
  - past-time exclusion
  - a fixed break window from `19:00` to `20:00`
- Booking confirmation page with booking reference details.
- Booking management page for viewing the current booking and cancelling it.
- Profile page with completed/cancelled/no-show booking history.

### Admin application

- Admin dashboard with operational metrics pulled from Supabase, including:
  - today’s bookings
  - today’s ticket count
  - today’s sales
  - monthly sales
  - cancellation and no-show counts
  - barber utilization
  - low-stock products
- Booking management with active/past/calendar views and status updates.
- Manual booking creation for staff-managed appointments.
- Service management:
  - create
  - update
  - activate/deactivate
- Product management:
  - create
  - update
  - activate/deactivate
- Customer management with active/inactive status changes.
- Barber management with staff account creation or conversion into barber accounts, including:
  - working hours
  - barber level
  - phone normalization/validation
- Operations settings for:
  - weekly open/closed schedule
  - temporary closures with date ranges and reason
- Reporting screens for booking/ticket/sales analysis by month.
- POS workflows:
  - active shift detection
  - transaction cart for services and products
  - unpaid ticket creation through Supabase RPC
  - payment handling for cash and e-wallet
  - ticket history
  - refunds
  - shift history summaries

### Barber application

- Barber dashboard with:
  - today’s booking count
  - projected earnings
  - today’s upcoming schedule
- Barber bookings page for reviewing assigned appointments and updating status.

## Usage

### Customer flow

1. Open the public site.
2. Register a customer account or log in.
3. Start a booking from the booking entry screen.
4. Choose a service, barber, and available time slot.
5. Review the booking summary and confirm it.
6. View the confirmed appointment on `/booking` or the home dashboard.
7. Cancel the booking if needed from the booking page.

### Staff flow

- Admin users log in through `/staff` and are redirected to `/admin`.
- Barber users log in through `/staff` and are redirected to `/barber`.
- Admins can manage bookings, services, products, customers, barbers, reports, and POS data.
- Barbers can monitor their assigned schedule and update booking progress/status.

## Project Structure

```text
.
├── apps
│   ├── mobile-ios
│   └── web       # Next.js app for customer, admin, and barber interfaces
├── packages      # Workspace directory (currently empty)
├── package.json  # Root workspace + Turbo scripts
└── turbo.json    # Turborepo task configuration
```

Key web route groups:

- `(customer)` for public/customer journeys
- `(auth)` for login, registration, staff login, password recovery
- `(admin)` for admin operations and POS
- `(barber)` for barber dashboard and bookings

## Tech Stack

### Monorepo and tooling

- npm workspaces
- Turborepo
- TypeScript
- ESLint

### Frontend (`apps/web`)

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- shadcn/ui component setup
- Radix UI primitives
- Lucide React
- Sonner
- Recharts
- TanStack Table
- React Hook Form
- Zod
- `@hookform/resolvers`
- `next-themes`
- `@vercel/speed-insights`
- Embla Carousel
- DnD Kit
- `react-day-picker`
- `three`
- `vaul`
- `class-variance-authority`
- `clsx`
- `tailwind-merge`
- `tw-animate-css`

### Shared platform/services used by both apps

- Supabase
  - `@supabase/ssr`
  - `@supabase/supabase-js`
- Resend
- React Email rendering via `@react-email/render`

### Data and platform assumptions visible in code

- Supabase is the primary database/auth platform.
- Role-based access is implemented through a `profiles` table with at least `customer`, `admin`, and `barber` roles.
- POS, bookings, services, products, shifts, and operating rules are stored in Supabase tables/RPCs.
- Time-sensitive logic is normalized to `Asia/Kuala_Lumpur`.

## Environment Variables

The code references these environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_SITE_URL=
```

Notes:

- `SUPABASE_SERVICE_ROLE_KEY` is required for admin-level operations.
- `RESEND_API_KEY` is required for booking confirmation/cancellation emails and the email test route.

## Development

Install dependencies from the repository root:

```bash
npm install
```

Start the web app from the monorepo root:

```bash
npm run dev
```

That root script runs:

```bash
turbo dev --filter=web
```

Other useful commands:

```bash
npm run build
npm run lint
npm run start
```

## Database / Supabase Notes

- The repository includes `apps/web/utils/sql/shop-operations.sql` to create the weekly-schedule and temporary-closure tables used by the operations/settings features.
- The POS flow depends on existing Supabase tables and RPC functions, including `create_unpaid_ticket_with_items`.
- Booking status updates also rely on Supabase RPCs such as `admin_update_booking_status`, `barber_update_booking_status`, and `cancel_booking`.

## Screenshots

### Customer Booking Flow

![Customer Booking Screenshot](./assets/customer-booking.png)

### Admin Dashboard

![Admin Dashboard Screenshot](./assets/admin-dashboard.png)

### POS Transactions

![POS Transactions Screenshot](./assets/pos-transactions.png)

### Barber Dashboard

![Barber Dashboard Screenshot](./assets/barber-dashboard.png)

## Current Implementation Notes

These routes exist but currently render no UI:

- `/notification`
- `/ai`

Some admin account/settings areas are present as UI scaffolding but explicitly marked in code as not fully wired yet, such as profile saving and some notification/system preferences.
