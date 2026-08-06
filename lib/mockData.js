// Dummy data shaped exactly like the Supabase tables, so swapping
// in real queries later is a straight substitution.

export const ORGANIZERS = [
  {
    id: 'org-1',
    name: 'Bohemia Stellenbosch',
    bio: "Stellenbosch's go-to rooftop bar and live music venue.",
    avatar_path: null,
    status: 'approved',
    instagram_url: 'https://instagram.com/bohemia',
    facebook_url: null,
    x_url: null,
    tiktok_url: 'https://tiktok.com/@bohemia',
  },
  {
    id: 'org-2',
    name: 'Stellenbosch Wine Route',
    bio: 'Celebrating the finest wines of the Cape Winelands since 1971.',
    avatar_path: null,
    status: 'approved',
    instagram_url: 'https://instagram.com/wineroute',
    facebook_url: 'https://facebook.com/wineroute',
    x_url: null,
    tiktok_url: null,
  },
  {
    id: 'org-3',
    name: 'Maties Sport',
    bio: 'Official sporting events at Stellenbosch University.',
    avatar_path: null,
    status: 'approved',
    instagram_url: null,
    facebook_url: 'https://facebook.com/matiessport',
    x_url: 'https://x.com/matiessport',
    tiktok_url: null,
  },
  {
    id: 'org-4',
    name: 'Root44 Market',
    bio: 'Weekend market with food, crafts and live music.',
    avatar_path: null,
    status: 'approved',
    instagram_url: 'https://instagram.com/root44',
    facebook_url: null,
    x_url: null,
    tiktok_url: null,
  },
]

export const EVENTS = [
  {
    id: 'ev-1',
    organizer_id: 'org-2',
    title: 'Stellenbosch Wine Festival',
    description:
      'Annual celebration of the finest wines from the Stellenbosch region with tastings, pairings, and live music throughout the day.',
    category: 'food_and_drink',
    venue: 'Coetzenburg Centre',
    starts_at: '2026-08-18T10:00:00+02:00',
    ends_at: '2026-08-18T18:00:00+02:00',
    image_path: null,
    is_featured: true,
    featured_order: 1,
  },
  {
    id: 'ev-2',
    organizer_id: 'org-1',
    title: 'DJ Set: Rooftop Sessions',
    description:
      'Deep house and amapiano rooftop session with guest DJs from Cape Town.',
    category: 'nightlife',
    venue: 'Bohemia',
    starts_at: '2026-08-24T21:00:00+02:00',
    ends_at: '2026-08-25T02:00:00+02:00',
    image_path: null,
    is_featured: true,
    featured_order: 2,
  },
  {
    id: 'ev-3',
    organizer_id: 'org-4',
    title: 'Root44 Weekend Market',
    description:
      'Artisanal food stalls, local crafts and live acoustic sets every Saturday.',
    category: 'markets',
    venue: 'Root44, Audacia Wine Farm',
    starts_at: '2026-08-29T09:00:00+02:00',
    ends_at: '2026-08-29T16:00:00+02:00',
    image_path: null,
    is_featured: true,
    featured_order: 3,
  },
  {
    id: 'ev-4',
    organizer_id: 'org-3',
    title: 'Varsity Cup: Maties vs Ikeys',
    description:
      'The Cape derby returns to Danie Craven Stadium. Student tickets at the gate.',
    category: 'sport',
    venue: 'Danie Craven Stadium',
    starts_at: '2026-09-05T19:00:00+02:00',
    ends_at: '2026-09-05T21:00:00+02:00',
    image_path: null,
    is_featured: false,
    featured_order: null,
  },
  {
    id: 'ev-5',
    organizer_id: 'org-1',
    title: 'Live Jazz Thursdays',
    description:
      'Weekly jazz night featuring rotating local ensembles. No cover charge.',
    category: 'music',
    venue: 'Bohemia',
    starts_at: '2026-09-10T20:00:00+02:00',
    ends_at: '2026-09-10T23:30:00+02:00',
    image_path: null,
    is_featured: false,
    featured_order: null,
  },
  {
    id: 'ev-6',
    organizer_id: 'org-2',
    title: 'Winelands Photography Exhibition',
    description:
      'A month-long showcase of landscape photography from across the Cape Winelands.',
    category: 'arts',
    venue: 'Stellenbosch Art Gallery',
    starts_at: '2026-09-14T09:00:00+02:00',
    ends_at: '2026-09-14T17:00:00+02:00',
    image_path: null,
    is_featured: false,
    featured_order: null,
  },
  {
    id: 'ev-7',
    organizer_id: 'org-3',
    title: 'Open Lecture: Climate & Agriculture',
    description:
      'Guest lecture on climate adaptation in Western Cape agriculture. Open to the public.',
    category: 'academic',
    venue: 'JS Marais Building',
    starts_at: '2026-09-18T14:00:00+02:00',
    ends_at: '2026-09-18T16:00:00+02:00',
    image_path: null,
    is_featured: false,
    featured_order: null,
  },
  {
    id: 'ev-8',
    organizer_id: 'org-4',
    title: 'Night Market: Winter Edition',
    description:
      'Evening market with fire pits, mulled wine and live folk music.',
    category: 'markets',
    venue: 'Root44, Audacia Wine Farm',
    starts_at: '2026-09-26T17:00:00+02:00',
    ends_at: '2026-09-26T22:00:00+02:00',
    image_path: null,
    is_featured: false,
    featured_order: null,
  },
  // --- past events (for the organiser "Past" tab) ---
  {
    id: 'ev-past-1',
    organizer_id: 'org-1',
    title: 'Summer Launch Party',
    description: 'Season opener with resident DJs and a rooftop braai.',
    category: 'nightlife',
    venue: 'Bohemia',
    starts_at: '2025-11-15T20:00:00+02:00',
    ends_at: '2025-11-16T01:00:00+02:00',
    image_path: null,
    is_featured: false,
    featured_order: null,
  },
  {
    id: 'ev-past-2',
    organizer_id: 'org-2',
    title: 'Harvest Festival 2025',
    description: 'Grape stomping, cellar tours and long-table lunches.',
    category: 'food_and_drink',
    venue: 'Coetzenburg Centre',
    starts_at: '2026-02-08T11:00:00+02:00',
    ends_at: '2026-02-08T17:00:00+02:00',
    image_path: null,
    is_featured: false,
    featured_order: null,
  },
]

// Pending organiser applications, for the admin approvals screen
export const PENDING_APPLICATIONS = [
  {
    id: 'org-5',
    name: 'Die Boord社 Coffee',
    contact_email: 'hello@dieboordcoffee.co.za',
    bio: 'Independent coffee roastery hosting cupping sessions and workshops.',
    applied_at: '2026-07-21T09:14:00+02:00',
    status: 'pending',
  },
  {
    id: 'org-6',
    name: 'Stellenbosch Film Society',
    contact_email: 'info@stellenboschfilm.org',
    bio: 'Monthly screenings of independent and classic cinema.',
    applied_at: '2026-07-22T16:40:00+02:00',
    status: 'pending',
  },
]

// --- lookup helpers ---

export const getOrganizer = (id) => ORGANIZERS.find((o) => o.id === id) ?? null

export const getEvent = (id) => EVENTS.find((e) => e.id === id) ?? null

export const eventsByOrganizer = (organizerId) =>
  EVENTS.filter((e) => e.organizer_id === organizerId)

export const upcomingEvents = () =>
  EVENTS.filter((e) => new Date(e.ends_at) >= new Date()).sort(
    (a, b) => new Date(a.starts_at) - new Date(b.starts_at)
  )

export const featuredEvents = () =>
  EVENTS.filter((e) => e.is_featured).sort(
    (a, b) => (a.featured_order ?? 99) - (b.featured_order ?? 99)
  )

// Mock "saved" and "following" state - a real build reads these from
// saved_events / follows. Kept mutable so buttons feel responsive.
export const INITIAL_SAVED_IDS = []
export const INITIAL_FOLLOWING_IDS = ['org-1', 'org-2', 'org-4']
