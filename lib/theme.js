export const theme = {
  primary: '#5B5BD6',
  primaryLight: '#E8E8FB',
  accent: '#F5A623',
  accentLight: '#FDF0DC',
  bg: '#F4F4F6',
  card: '#FFFFFF',
  text: '#111827',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  danger: '#DC2626',
  success: '#16A34A',
}

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 }

export const space = (n) => n * 4

export const shadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 6,
  elevation: 2,
}

// keys MUST match the Postgres event_category enum exactly.
// labels are display-only - never send a label to the database.
// 'vineyards' is deliberately not listed yet - the Postgres enum doesn't
// support it until that migration runs (see supabase_edit_delete_functions.sql
// area / CLAUDE.md); adding it here first would let someone pick a category
// value the database rejects. 'academic' is dropped now since it's being
// retired regardless of migration timing (no existing events use it).
export const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'nightlife', label: 'Nightlife' },
  { key: 'food_and_drink', label: 'Food & Drink' },
  { key: 'sport', label: 'Sports' },
  { key: 'music', label: 'Music' },
  { key: 'markets', label: 'Markets' },
  { key: 'arts', label: 'Arts' },
]

// Categories available when creating an event (no "all")
export const EVENT_CATEGORIES = CATEGORIES.filter((c) => c.key !== 'all')

// Placeholder colour + emoji used when an event has no uploaded image
export const CATEGORY_STYLE = {
  nightlife: { bg: '#5B2C87', emoji: '\u{1F303}' },
  food_and_drink: { bg: '#8B5E3C', emoji: '\u{1F377}' },
  sport: { bg: '#1E6F5C', emoji: '\u26BD' },
  music: { bg: '#4A2B6B', emoji: '\u{1F3A7}' },
  markets: { bg: '#2F7A4D', emoji: '\u{1F6D2}' },
  arts: { bg: '#B03A5B', emoji: '\u{1F3A8}' },
  // Not in CATEGORIES yet - pending the event_category enum migration - but
  // kept ready here so it's a one-line addition once that lands.
  vineyards: { bg: '#4C0519', emoji: '\u{1F347}' },
}

export const categoryLabel = (key) =>
  CATEGORIES.find((c) => c.key === key)?.label ?? key

export const categoryStyle = (key) =>
  CATEGORY_STYLE[key] ?? { bg: '#6B7280', emoji: '\u{1F4C5}' }

// Two-stop gradients for the category filter chips (outline when unselected,
// filled when active - see components/CategoryChips.js). 'all' isn't a real
// category so it isn't in CATEGORY_STYLE above; it gets an entry here too
// since the chip row needs a colour for it as well.
export const CATEGORY_GRADIENT = {
  all: ['#6D6DE0', '#4A4AC4'],
  nightlife: ['#5B2C87', '#8B5CF6'],
  food_and_drink: ['#F97316', '#DC2626'],
  // Kept to blue only (was blue->emerald) so it doesn't compete with Music's
  // new green now that Music owns that hue.
  sport: ['#2563EB', '#0EA5E9'],
  // Spotify green - fitting for Music, and nothing else in this set was green.
  music: ['#1ED760', '#168F44'],
  markets: ['#FDE047', '#EAB308'],
  arts: ['#F472B6', '#C026D3'],
  // Not in CATEGORIES yet - see the note above CATEGORY_STYLE.
  vineyards: ['#9F1239', '#4C0519'],
}
