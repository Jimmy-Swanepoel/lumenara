# Lumenara

An events app for Stellenbosch, South Africa. Users browse and save events and
follow organisers; organisers create and manage their own event listings;
admins review and approve organiser accounts.

Built with **Expo (React Native)** and **Supabase** (Postgres, Auth, Storage,
Row Level Security).

## Features

- Email/password auth with email confirmation, forgot/reset password, and a
  deep-link confirmation flow that signs you straight in — no manual re-login
  after signup
- Role-based accounts: guest, user, organiser (pending/approved by an admin),
  admin
- Browse, search, and filter events by category; save events; follow
  organisers
- Organisers create/edit/cancel events with image upload (camera or library),
  a themed calendar date picker, and a scroll-wheel time picker
- Editing or cancelling an event notifies everyone who saved it
- Full dark mode (system/light/dark), themed end-to-end including the Android
  navigation bar
- Native swipeable bottom tabs (a real `react-native-pager-view`, not a fake
  slide animation) — the create tab only exists at all for organisers
- Admin approvals screen for reviewing pending organiser accounts

## Stack

- Expo SDK 54, React Native 0.81, React 19
- Expo Router (file-based routing)
- Supabase — Postgres + Auth + Storage + RLS
- Plain JavaScript (one TypeScript file: `lib/supabase.ts`)

## Project structure

```
app/
  _layout.js              root layout — SafeAreaProvider > ThemeProvider > AuthProvider
  (tabs)/                  bottom tab group (Home, Account, Create*, More)
  auth/                    welcome, role select, signup, login, confirm, reset password
  event/[id].js            event detail
  event/edit/[id].js       edit event (organiser, owner-only)
  organizer/[id].js        public organiser profile
  admin/approvals.js       organiser approval queue

components/                Button, Field, EventCard, EventForm, CalendarPicker,
                            TimePicker, PopModal, BlurSheet, NotificationsGate, ...

lib/
  supabase.ts              Supabase client
  auth.js                  auth context (session/profile/role) + auth actions
  api.js                   all Supabase queries
  themeProvider.js          light/dark palettes + useTheme()
  theme.js                  categories, category styling
  format.js                 date/time formatting (Africa/Johannesburg)
```

*Create is a real tab route, but only rendered in the navigator for
organiser accounts — it doesn't exist in the tab bar or the swipe pager for
users.

## Running it

Requires a Supabase project (see `lib/supabase.ts` for the expected env vars)
and a `.env` file with:

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

```bash
npm install
npx expo start --go
```

Scan the QR code with **Expo Go**, or run on an emulator/simulator.

## Data model

- `profiles` — role: `user` | `organizer` | `admin`
- `organizers` — status: `pending` | `approved` | `rejected` | `suspended`
- `events` — category is a fixed Postgres enum (`event_category`)
- `saved_events`, `follows`, `notifications`
- Storage buckets: `avatars`, `event-images`, `placeholders`
