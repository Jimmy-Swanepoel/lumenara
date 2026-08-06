// All timestamps are stored UTC in Postgres (timestamptz).
// Everything here formats for display in South African time.

const TZ = 'Africa/Johannesburg'

export function formatShortDate(iso) {
  // -> "24 Jul"
  return new Date(iso).toLocaleDateString('en-ZA', {
    timeZone: TZ,
    day: 'numeric',
    month: 'short',
  })
}

export function formatLongDate(iso) {
  // -> "Friday, 24 July 2026"
  return new Date(iso).toLocaleDateString('en-ZA', {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatTime(iso) {
  // -> "21:00"
  return new Date(iso).toLocaleTimeString('en-ZA', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatCardDateTime(iso) {
  // -> "24 Jul - 21:00"
  return `${formatShortDate(iso)} \u00B7 ${formatTime(iso)}`
}

export function isPast(iso) {
  return new Date(iso).getTime() < Date.now()
}

// Input helpers for the create-event form (dummy pickers for now)
export function toISO(dateStr, timeStr) {
  // dateStr "2026-08-18", timeStr "18:00" -> ISO with +02:00 offset
  if (!dateStr || !timeStr) return null
  return `${dateStr}T${timeStr}:00+02:00`
}

export function addHours(iso, hours) {
  const d = new Date(iso)
  d.setHours(d.getHours() + hours)
  return d.toISOString()
}
