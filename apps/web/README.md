# Wellside+ Web App

Next.js 16 App Router application serving the customer booking portal, admin dashboard, and barber portal for the Wellside+ barbershop management system.

## Getting Started

Install dependencies from the monorepo root:

```bash
npm install
```

Start the development server:

```bash
npm run dev -w web
# or from the root
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Routes

| Route group   | Path             | Description                        |
|---------------|------------------|------------------------------------|
| `(customer)`  | `/`              | Customer booking portal            |
| `(admin)`     | `/admin`         | Admin management dashboard         |
| `(barber)`    | `/barber`        | Barber daily schedule portal       |
| `(auth)`      | `/login`, `/register`, etc. | Auth flows              |
| `tv/`         | `/tv`            | TV queue display (PIN-based)       |
| `queue/`      | `/queue`         | Queue management                   |

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_SITE_URL=
```

See the root [README](../../README.md) for full project documentation.
