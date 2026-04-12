# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Root (Turborepo)
npm run dev       # Run web app in dev mode (turbo dev --filter=web)
npm run build     # Build all packages
npm run lint      # Lint all packages

# Web app (apps/web)
npm run dev -w web
npm run build -w web
npm run lint -w web

# Mobile app (apps/mobile)
npm start -w mobile       # expo start
npm run ios -w mobile
npm run android -w mobile
```

## Architecture

**Monorepo**: npm workspaces + Turborepo with two apps (`apps/web`, `apps/mobile`) and one shared package (`packages/lib`).

### Web App (Next.js App Router)

The app serves three distinct user roles via route groups:

- `(customer)` — Customer booking flow, home, profile
- `(admin)` — Full barbershop management: bookings, services, products, customers, barbers, POS, reports
- `(barber)` — Barber daily schedule and appointment management
- `(auth)` — Login/register/password flows
- `tv/` — Public queue display (PIN-based access)

### Supabase

All data access goes directly through the Supabase client — no ORM, no tRPC, no REST abstraction layer. There is a single API route (`app/api/send/`) for email only.

**Four Supabase client variants** in `apps/web/utils/supabase/`:
- `client.ts` — Browser client (public/customer flows)
- `server.ts` — Server Component client (reads cookies)
- `admin.ts` — Browser client with admin-scoped permissions; also used as server client with `SUPABASE_SERVICE_ROLE_KEY` for privileged operations (user creation, role assignment)

**Core tables**: `profiles` (roles: `customer`, `admin`, `barber`), `bookings`, `services`, `products`, `barbers`, `customers`, `tickets`, `shifts`, `shop_weekly_schedule`, `shop_temporary_closures`, `shop_rest_windows`, `shop_booking_settings`

Complex operations use Supabase RPC functions: `create_unpaid_ticket_with_items`, `admin_update_booking_status`, `barber_update_booking_status`, `cancel_booking`.

SQL DDL for scheduling tables lives in `apps/web/utils/sql/`.

### Shared Library (`packages/lib`)

Imported as `@wellside/lib`. Contains pure business logic shared between web and mobile:
- `shop-operations` — Parses weekly schedule and closures
- `slots` — Slot generation algorithm (respects barber availability, bookings, shop hours, break windows)
- `booking-email-payloads` — Constructs data for email templates
- `booking-status` — Booking state constants

### UI

- **Tailwind CSS v4** (no `tailwind.config.js` — configured via PostCSS `@tailwindcss/postcss`)
- **shadcn/ui** with "new-york" style, neutral base, CSS variables enabled (`components.json`)
- Real-time UI updates via Supabase subscriptions
- `unstable_cache()` used for server-side caching of relatively static data (e.g., active services)

### Mobile App

React Native + Expo with Expo Router, NativeWind (Tailwind for RN), and the same Supabase backend.

### Key Domain Details

- **Timezone**: All time operations are hardcoded to `Asia/Kuala_Lumpur`
- **Booking flow**: Multi-step (service → barber → date/time slot) with slot generation logic in `@wellside/lib`
- **Booking statuses**: `scheduled`, `in_progress`, `completed`, `cancelled`, `no_show`
- **POS**: Full shift/transaction system with tickets, refunds, and inventory
- **Email**: Transactional emails via Resend with React Email templates
