# Lumenara — frontend (mock data)

Expo app for the Stellenbosch events platform. **No Supabase yet** — every
screen runs on dummy data from `lib/mockData.js`. The point is to get the
UI right first, then swap the fake data for real queries.

## Running it

```bash
cd lumenara
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone.

If `npm install` complains about version mismatches:

```bash
npx expo install --fix
```

## Previewing different account types

There's no real login yet, so tap **More → Dev → Switch role**. That cycles
between:

| Mode | What you see |
|---|---|
| Guest | 3 tabs, sign-up prompts on save/follow |
| User | 3 tabs, saved events, following count |
| Org (pending) | 4 tabs, "under review" banner, create blocked |
| Org (approved) | 4 tabs, event management, create works |
| Admin | 3 tabs + approvals screen under More |

Delete that Dev block from `app/(tabs)/more.js` once real auth is in.

## Structure

```
app/
  _layout.js              root, wraps AuthProvider
  (tabs)/
    _layout.js            bottom tabs (Create hidden for non-organisers)
    index.js              Home — carousel, categories, search, list
    account.js            branches by role: guest/user/organiser/admin
    create.js             Create Event form
    more.js               More, settings, admin link, dev role switcher
  auth/
    welcome.js
    role-select.js
    signup-user.js
    signup-organizer.js
    login.js
  event/[id].js           Event detail
  organizer/[id].js       Organiser public profile
  admin/approvals.js      Pending organiser applications

components/
  Button.js
  Field.js
  BlurSheet.js            bottom sheet with blurred backdrop
  EventCard.js
  FeaturedCarousel.js     5s auto-advance, 10s pause after arrow press
  CategoryChips.js
  SignUpPrompt.js
  EmptyState.js

lib/
  theme.js                colours, spacing, categories
  format.js               date/time formatting (Africa/Johannesburg)
  mockAuth.js             fake auth context — replace with Supabase
  mockData.js             fake events, organisers, applications
```

## Notes on decisions baked in

**Categories** in `lib/theme.js` use `key` values that match the Postgres
`event_category` enum exactly (`food_and_drink`, not `Food & Drink`). The
`label` is display-only. Never send a label to the database.

**Event images** are emoji-on-colour placeholders per category. Real
uploads will replace these; the placeholder stays as the fallback.

**Dates** are stored as ISO strings with a `+02:00` offset and formatted
via `Intl` pinned to `Africa/Johannesburg`.

**Create Event** has separate start and end date/time. End defaults to
start + 3 hours. The date/time fields are plain text for now — swap in
`@react-native-community/datetimepicker` when wiring up.

## What's stubbed and needs Supabase

- All auth (`lib/mockAuth.js`)
- Event/organiser reads (`lib/mockData.js`)
- Save + follow buttons — they toggle local state only
- Image upload on create/edit — the tap target does nothing
- Admin approve/reject — removes from the local list only
- Search — filters the mock array client-side; the real version calls
  the `search_events` RPC
