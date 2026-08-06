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
export const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'music', label: 'Music' },
  { key: 'food_and_drink', label: 'Food & Drink' },
  { key: 'sport', label: 'Sports' },
  { key: 'arts', label: 'Arts' },
  { key: 'academic', label: 'Academic' },
  { key: 'nightlife', label: 'Nightlife' },
  { key: 'markets', label: 'Markets' },
]

// Categories available when creating an event (no "all")
export const EVENT_CATEGORIES = CATEGORIES.filter((c) => c.key !== 'all')

// Placeholder colour + emoji used when an event has no uploaded image
export const CATEGORY_STYLE = {
  music: { bg: '#4A2B6B', emoji: '\u{1F3A7}' },
  food_and_drink: { bg: '#8B5E3C', emoji: '\u{1F377}' },
  sport: { bg: '#1E6F5C', emoji: '\u26BD' },
  arts: { bg: '#B03A5B', emoji: '\u{1F3A8}' },
  academic: { bg: '#2C5282', emoji: '\u{1F393}' },
  nightlife: { bg: '#5B2C87', emoji: '\u{1F303}' },
  markets: { bg: '#2F7A4D', emoji: '\u{1F6D2}' },
}

export const categoryLabel = (key) =>
  CATEGORIES.find((c) => c.key === key)?.label ?? key

export const categoryStyle = (key) =>
  CATEGORY_STYLE[key] ?? { bg: '#6B7280', emoji: '\u{1F4C5}' }
