# Lumenara — Project Context

Events app for **Stellenbosch, South Africa**. Users browse/save events and follow
organisers; organisers create/manage events; admins approve organisers. Timezone is
**Africa/Johannesburg (UTC+2)** — important for any date math.

## Stack
- **Expo (React Native)** with **Expo Router** (file-based routing; a file under `app/` = a route)
- SDK 54, React 19, RN 0.81
- **Supabase** backend (Postgres + Auth + Storage + RLS) on the business account
- JavaScript (not TypeScript) for screens/components; `lib/supabase.ts` is the one TS file
- Runs on an **Android emulator (Pixel 7)**. Metro is started from **Windows** (`npx expo start --go`),
  files are edited from **WSL** — same folder on disk (`/mnt/c/Users/swane/lumenara` == `C:\Users\swane\lumenara`).
  Emulator connects via `exp://10.0.2.2:8081`.

## Project structure
- `app/_layout.js` — root; wraps app in `SafeAreaProvider > ThemeProvider > AuthProvider`
- `app/(tabs)/` — `index.js` (Home), `account.js`, `create.js`, `more.js`, `_layout.js` (tab bar)
- `app/auth/` — `welcome.js`, `role-select.js`, `signup-user.js`, `signup-organizer.js`, `login.js`
- `app/event/[id].js` — event detail
- `app/organizer/[id].js` — organiser profile
- `app/admin/approvals.js` — admin organiser approvals
- `components/` — Button, Field, EventCard, EmptyState, CategoryChips, FeaturedCarousel,
  BlurSheet (bottom sheet), PopModal (centre "pop" modal w/ blur), SignUpPrompt,
  CalendarPicker, TimePicker
- `lib/` — `supabase.ts`, `auth.js` (auth context), `api.js` (all Supabase queries),
  `themeProvider.js` (light/dark palettes + `useTheme()`), `theme.js` (CATEGORIES/categoryLabel/
  categoryStyle only — colours live in themeProvider), `format.js` (toISO, isPast, date formatters)

## Key conventions
- **Colours come from `useTheme()`**, not fixed values. Pattern: `const { colors, radius, space, shadow } = useTheme()`
  then `const styles = makeStyles(colors, radius, space, shadow)`. `radius`/`space`/`shadow` are theme tokens;
  `space(n)` = n*4. Never hardcode hex colours in screens — use `colors.x`.
- **Dark mode** is complete across every screen + tab bar + Android nav bar. Three-way toggle
  (System/Light/Dark) in More → Settings, persisted via AsyncStorage.
- **Quick pickers** (calendar, category, time) use `PopModal` (centre pop). **Long forms**
  (edit profile) also use `PopModal` now. `BlurSheet` (bottom sheet) still exists but is being phased out.
- **Date math must be timezone-safe.** Do NOT use `new Date(iso + 'T00:00:00')` then `.setDate()` —
  in UTC+2 that can roll wrong. Use UTC arithmetic: `new Date(Date.UTC(y, m-1, d))` + `setUTCDate`.
  See `nextDay` in `app/(tabs)/create.js`.
- Files are created/edited in place. Validate JSX before relying on it.

## Data model (Supabase)
- `profiles` (id→auth.users, role: user|organizer|admin, display_name)
- `organizers` (id→profiles, name, bio, avatar_path, contact_email, status: pending|approved|rejected|suspended,
  instagram_url/facebook_url/x_url/tiktok_url)
- `events` (organizer_id, title[3-120], description[≤5000], category, venue, starts_at, ends_at,
  image_path, published, is_featured, featured_order)
- `saved_events` (user_id + event_id)
- `follows` (user_id + organizer_id)
- `category_placeholders`
- **Enum `event_category`** (exact keys): sport, arts, music, food_and_drink, academic, nightlife, markets
- Views: `upcoming_events`, `past_events`, `featured_events`, `organizer_stats` (has `follower_count`, `upcoming_count`)
- Storage buckets (public): `avatars`, `event-images`, `placeholders` — write policies keyed on `{uid}/` folder prefix
- Full schema in `setup.sql` (project root or outputs) — extensions, tables, RLS, triggers, functions, grants, buckets
- **Grants matter**: RLS policies alone are insufficient; anon/authenticated need explicit GRANTs. Views need their own grants.

## Auth / decisions
- Email + password only (no Google/Apple)
- Email confirmation ON (built-in Supabase email is capped at **2/hour** on free tier — needs custom SMTP/Resend to lift; parked pending a domain)
- Organisers are reviewed (pending→approved by admin). Events go live immediately (no event review).
- Duplicate-email signup now errors ("account already exists") via empty-`identities` check in `auth.js`
- Admin account: swanepoeljimmy7@gmail.com
- Approve organiser via SQL (trigger blocks SQL editor as non-app-admin):
  `alter table organizers disable trigger organizers_status_guard; update organizers set status='approved' where contact_email='X'; alter table organizers enable trigger organizers_status_guard;`

## Image upload pattern (reused for event images + avatars)
```js
const res = await fetch(uri)
const arrayBuffer = await res.arrayBuffer()
const path = `${uid}/${Date.now()}.jpg`
await supabase.storage.from(BUCKET).upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: true })
```
Do NOT use `expo-file-system` readAsStringAsync (the base64 API broke). fetch→arrayBuffer is the working method.

## Done recently
- Full dark mode; date picker (reuses themed calendar, greys invalid dates); scroll-wheel time picker
  (24h, 5-min steps); pop modals; create-form resets on focus; social brand icons (Ionicons logo-*);
  organiser avatar upload (users have no avatar — that option was removed); admin approvals wired to real API;
  duplicate-email error; end-time-before-start rolls end date to next day (timezone-safe).
- Forgot-password flow via Supabase Auth + Resend (`app/auth/forgot-password.js`, `reset-password.js`).
- **Follows block**: follower count on public organiser profile and on the organiser's own account screen
  (`organizer_stats.follower_count`); Following list via PopModal (`fetchMyFollowing`); organisers are blocked
  from following **anyone** (not just self) — the Follow button is hidden whenever the viewer is an organiser,
  a deliberate broadening of the original "block self-follow only" plan. DB-level guard status unverified
  (no `setup.sql` in the repo to check against).
- Swipeable bottom tabs reworked from a fake per-screen slide animation (`components/SwipeTabWrapper.js`,
  now deleted) to a real native pager: `@react-navigation/material-top-tabs` (repositioned to the bottom via
  `tabBarPosition="bottom"`, wrapped through expo-router's `withLayoutContext`) backed by
  `react-native-pager-view`. `screenOptions={{ animationEnabled: false }}` makes tab-bar taps / programmatic
  nav jump straight to the target tab; only a real finger-drag swipe animates.
- **Notifications block**: `notifications` table + RLS; edit-event screen (`app/event/edit/[id].js`, reuses
  `EventForm`) and a cancel/delete flow with confirm dialog on the event detail screen (owner-only); editing
  or cancelling calls `updateEventAndNotify`/`cancelEvent` RPCs which insert a notification row for every
  user who saved that event; surfaced via `components/NotificationsGate.js` — an undismissable `PopModal`
  checked on launch and on foreground-return, wired into `app/_layout.js`. Note: this is a one-shot popup,
  not a persistent bell icon/notification history screen — once dismissed, notifications aren't reviewable.
- Fixed jittery/flickering `BlurView` backdrop on Android popups (`PopModal`, `BlurSheet`) by adding
  `experimentalBlurMethod="dimezisBlurView"` — expo-blur's default Android blur is a jumpy approximation.
- Deleted unused `lib/mockData.js` and `lib/mockAuth.js` (no remaining references).
- **Signup no longer requires a manual re-login.** After sign up, both `signUpUser`/`signUpOrganizer`
  (`lib/auth.js`) pass `emailRedirectTo: Linking.createURL('auth/confirm')`, and the signup screens route to
  a new `app/auth/confirm.js` ("check your email") screen instead of an Alert. Tapping the confirmation link
  deep-links back into that screen carrying session tokens (same implicit/PKCE parsing as the reset-password
  flow — extracted into a shared `parseAuthTokensFromUrl` in `lib/auth.js`), which establishes the session;
  `AuthProvider` picks it up and the confirm screen auto-redirects to `/(tabs)`. **Needs verifying**: the
  Supabase dashboard's Auth → URL Configuration → Redirect URLs allow-list must include this new
  `.../--/auth/confirm` redirect (same allow-list the reset-password flow already needed an entry in) or the
  confirmation link will bounce to the Site URL instead of back into the app.

## Pending work
### Parked
- Bucket 5MB size limits / MIME restrictions (pre-launch polish)
- DB linter warnings (e.g. organizer_stats SECURITY DEFINER — intentional; pre-launch hardening pass)
- Sweep test data ("Hhg" events, test accounts) before launch — needs to be done via SQL in the Supabase
  dashboard (no service-role key in this repo, only the public anon key, and RLS blocks broad deletes anyway)
- App icon + splash for store builds

### Optional / not yet requested
- A real persistent notifications history screen (bell icon + list), if the pop-up-only approach above
  turns out to be insufficient once there's real usage.

## Infra notes
- Version control: git initialised (via EAS). `.env` and `node_modules` are gitignored. `.env` holds
  `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (anon key is public/safe).
- EAS dev build exists (`com.lumenara.app`) but Expo Go is the day-to-day workflow.
- Free-tier Supabase **pauses after ~7 days idle** — if the app shows no data / can't log in, check the
  dashboard for a paused banner and Resume it (takes a few min).
- Emulator sometimes loses internet after laptop sleep — cold-boot it (Device Manager → Cold Boot Now) if
  Chrome-in-emulator can't reach google.
