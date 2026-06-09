# Wellside+ Mobile App

React Native (Expo) mobile app for the Wellside+ barbershop booking system. Serves the customer-facing booking experience on iOS and Android.

## Getting Started

Install dependencies from the monorepo root:

```bash
npm install
```

Start the Expo development server:

```bash
npm start -w mobile
```

## Running on a device or simulator

```bash
npm run ios -w mobile       # iOS simulator
npm run android -w mobile   # Android emulator
```

Or scan the QR code from `expo start` using the Expo Go app.

## Screens

| Tab / Screen       | Description                                      |
|--------------------|--------------------------------------------------|
| Home               | Dashboard with next booking and quick actions    |
| Booking            | Multi-step booking flow and booking history      |
| AI                 | AI hairstyle analysis via photo upload           |
| Notifications      | Push notification inbox                          |
| Profile            | Account details and settings                     |
| Onboarding         | First-time setup after registration              |

## Key dependencies

- Expo ~54, Expo Router
- React Native 0.81, React 19
- NativeWind (Tailwind CSS for React Native)
- Supabase (`@supabase/supabase-js`)
- expo-notifications (push notifications)
- expo-image-picker + expo-image-manipulator (AI photo upload)
- React Native Reanimated + Gesture Handler
- `@wellside/lib` (shared booking logic)

## Environment

The app connects to the same Supabase backend as the web app. Configure the Supabase URL and anon key in `utils/supabase.ts`.

See the root [README](../../README.md) for full project documentation.
