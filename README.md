# Wellside+

![Banner](./assets/banner.png)

[![Monorepo](https://img.shields.io/badge/monorepo-Turborepo-blue)](https://turbo.build/repo)
[![Frontend](https://img.shields.io/badge/frontend-Next.js%2016-black)](https://nextjs.org/)
[![Mobile](https://img.shields.io/badge/mobile-Expo%2054-white)](https://expo.dev/)
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

## Project Overview

Wellside+ is a full-stack barbershop booking and management system built as a monorepo. It combines a customer-facing booking experience (web + mobile) with staff portals for admins and barbers, backed by Supabase for scheduling, bookings, POS, and transactional email.

The system covers:

- Customers booking appointments via web or mobile app, with AI-powered hairstyle recommendations.
- Admins managing services, products, customers, barbers, bookings, POS, queue, and reports.
- Barbers viewing their daily schedule and updating appointment statuses.
- A TV queue display for the shop floor, accessible via a PIN.
- Booking rule enforcement: shop closures, barber working hours, overlap prevention, and break windows.
- Transactional emails for booking confirmations and cancellations via Resend.

## Features

### Customer (Web & Mobile)

- Registration with 2-step onboarding (email/password → personal details)
- Email/password login, password recovery and reset
- Home dashboard showing next active booking and booking count
- Multi-step booking flow: service → barber → date/time slot → review → confirm
- Slot generation respecting barber hours, existing bookings, shop schedule, temporary closures, and break windows
- Booking management: view current booking, cancel booking
- Booking history (completed, cancelled, no-show)
- Notifications
- AI-powered hairstyle analysis — upload a photo to get face shape detection and personalised hairstyle suggestions
- Hairstyle dictionary modal
- Profile management

### Admin Dashboard

- Operational metrics: today's bookings, ticket count, sales, monthly sales, cancellations, no-shows, barber utilization, low-stock products
- Booking management: active/past/calendar views, status updates, manual booking creation
- Service management: create, update, activate/deactivate
- Product management: create, update, activate/deactivate
- Customer management: view, active/inactive status
- Barber/staff management: account creation, working hours, barber level, phone validation
- POS: shift management, transaction cart (services + products), unpaid ticket creation, cash/e-wallet payment, ticket history, refunds, shift summaries
- Queue management: live queue dashboard, queue entry actions
- TV display: generate PIN for shop floor queue screen
- Monthly reports with PDF and Excel export
- Shop settings: weekly schedule, temporary closures, booking availability, rest windows
- Notifications

### Barber Portal

- Daily schedule overview: booking count, projected earnings, upcoming appointments
- Appointment management: view assigned bookings, update status

### TV Queue Display

- Public queue screen at `/tv`
- PIN-based access (6-digit PIN generated from Admin dashboard)
- Real-time queue updates via Supabase subscriptions

## Usage

### Customer flow

1. Open `https://wellside.my` and register or log in.
2. Start a booking and choose a service, barber, and available time slot.
3. Review and confirm the booking.
4. View or cancel the booking from `/booking`.
5. Use the AI tab to upload a photo for hairstyle recommendations.

### Staff flow

- Admin and barber users log in via the staff login page and are redirected to their respective portals.
- Admins access `/admin` for full shop management.
- Barbers access `/barber` for their daily schedule and status updates.

## Project Structure

```text
wellside-app/
├── apps/
│   ├── web/                    # Next.js web app (customer, admin, barber)
│   │   └── app/
│   │       ├── (customer)/     # Customer booking portal
│   │       │   ├── home/
│   │       │   ├── booking/
│   │       │   ├── notification/
│   │       │   ├── ai/
│   │       │   └── profile/
│   │       ├── (admin)/        # Admin management dashboard
│   │       │   └── admin/
│   │       │       ├── dashboard/
│   │       │       ├── bookings/
│   │       │       ├── services/
│   │       │       ├── products/
│   │       │       ├── customers/
│   │       │       ├── barbers/
│   │       │       ├── pos/
│   │       │       ├── queue/
│   │       │       ├── report/
│   │       │       ├── notifications/
│   │       │       └── settings/
│   │       ├── (barber)/       # Barber staff portal
│   │       │   └── barber/
│   │       │       └── bookings/
│   │       ├── (auth)/         # Auth flows (login, register, reset)
│   │       ├── tv/             # TV queue display (PIN-based)
│   │       └── queue/          # Queue management
│   └── mobile/                 # React Native / Expo mobile app
│       └── app/
│           ├── (tabs)/         # Home, Booking, AI, Notifications, Profile
│           ├── (auth)/         # Mobile auth screens
│           └── (onboarding)/   # Onboarding screens
└── packages/
    └── lib/                    # Shared business logic (@wellside/lib)
        ├── slots.ts            # Booking slot generation algorithm
        ├── shop-operations.ts  # Shop schedule and closure parsing
        ├── booking-status.ts   # Booking state constants
        └── booking-email-payloads.ts
```

## Tech Stack

### Monorepo and tooling

- npm workspaces + Turborepo
- TypeScript
- ESLint

### Web (`apps/web`)

- Next.js 16 App Router, React 19
- Tailwind CSS 4 (PostCSS, no config file)
- shadcn/ui (new-york style) + Radix UI primitives
- Framer Motion
- Recharts
- TanStack Table
- React Hook Form + Zod
- DnD Kit (drag-and-drop schedule management)
- react-day-picker
- Embla Carousel
- Sonner (toast notifications)
- Lucide React + HugeIcons
- xlsx (Excel export)
- QRCode
- next-themes
- `@vercel/speed-insights`
- vaul

### Mobile (`apps/mobile`)

- Expo ~54, Expo Router
- React Native 0.81, React 19
- NativeWind (Tailwind for React Native)
- React Native Reanimated + Gesture Handler
- expo-notifications (push notifications)
- expo-image-picker + expo-image-manipulator (AI photo upload)
- expo-linear-gradient
- HugeIcons React Native
- Lucide React Native

### Shared (`packages/lib`)

- Pure TypeScript business logic shared between web and mobile
- Imported as `@wellside/lib`

### Backend and services

- Supabase (PostgreSQL, Auth, Realtime, Storage, Edge Functions)
  - `@supabase/ssr`, `@supabase/supabase-js`
- Resend + React Email (transactional emails)
- Vercel (hosting)

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Email
RESEND_API_KEY=

# App
NEXT_PUBLIC_SITE_URL=
```

`SUPABASE_SERVICE_ROLE_KEY` is required for admin-level operations (user creation, role assignment).  
`RESEND_API_KEY` is required for booking confirmation and cancellation emails.

## Development

Install dependencies from the repository root:

```bash
npm install
```

### Web app

```bash
npm run dev          # Start web dev server (turbo dev --filter=web)
npm run build        # Build all packages
npm run lint         # Lint all packages
```

### Mobile app

```bash
npm start -w mobile        # expo start
npm run ios -w mobile      # Run on iOS simulator
npm run android -w mobile  # Run on Android emulator
```

## Database / Supabase Notes

- SQL DDL for scheduling tables lives in `apps/web/utils/sql/`.
- Complex operations use Supabase RPC functions:
  - `create_unpaid_ticket_with_items` — POS ticket creation
  - `admin_update_booking_status` — Admin booking status updates
  - `barber_update_booking_status` — Barber booking status updates
  - `cancel_booking` — Customer-initiated cancellation
- Core tables: `profiles`, `bookings`, `services`, `products`, `barbers`, `customers`, `tickets`, `shifts`, `shop_weekly_schedule`, `shop_temporary_closures`, `shop_rest_windows`, `shop_booking_settings`
- Real-time UI updates via Supabase subscriptions (queue display, notifications)
- Server-side caching via `unstable_cache()` for relatively static data (active services)
- All time operations are normalised to `Asia/Kuala_Lumpur`
