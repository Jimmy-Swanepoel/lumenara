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

// Reverse of toISO: an ISO timestamp -> { date: "2026-08-18", time: "18:00" }
// in Africa/Johannesburg, for pre-filling the edit form from stored events.
export function splitISO(iso) {
  if (!iso) return { date: '', time: '' }
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-CA', { timeZone: TZ })
  const time = d.toLocaleTimeString('en-ZA', {
    timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false,
  })
  return { date, time }
}

// Human-readable summary of what changed between the stored event and the
// edited fields, for the "your saved event changed" notification. Only
// venue and start date/time count as meaningful (per product decision) -
// description/category edits don't notify. Returns null if nothing meaningful changed.
export function buildEventChangeMessage(oldEvent, next) {
  const changes = []
  if (oldEvent.venue !== next.venue) {
    changes.push(`venue changed from ${oldEvent.venue} to ${next.venue}`)
  }
  if (new Date(oldEvent.starts_at).getTime() !== new Date(next.starts_at).getTime()) {
    changes.push(`now starts ${formatShortDate(next.starts_at)} at ${formatTime(next.starts_at)}`)
  }
  if (changes.length === 0) return null
  const msg = changes.join(', and ')
  return msg.charAt(0).toUpperCase() + msg.slice(1) + '.'
}
