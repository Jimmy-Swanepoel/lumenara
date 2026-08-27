import { supabase } from './supabase'
import { isPast } from './format'

// ============================================================
// IMAGE URLS
// ============================================================

export function publicUrl(bucket, path) {
  if (!path) return null
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data?.publicUrl ?? null
}

export const avatarUrl = (path) => publicUrl('avatars', path)
export const eventImageUrl = (path) => publicUrl('event-images', path)
export const placeholderUrl = (path) => publicUrl('placeholders', path)

// ============================================================
// EVENTS (reads)
// ============================================================

export async function fetchUpcomingEvents() {
  const { data, error } = await supabase
    .from('upcoming_events')
    .select('*')
    .eq('published', true)
    .order('starts_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function fetchFeaturedEvents() {
  const { data, error } = await supabase
    .from('featured_events')
    .select('*')
    .order('featured_order', { ascending: true, nullsFirst: false })
  if (error) throw error
  return data ?? []
}

export async function fetchEventById(id) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function searchEvents(q) {
  const { data, error } = await supabase.rpc('search_events', { q })
  if (error) throw error
  return data ?? []
}

// ============================================================
// EVENTS (writes)
// ============================================================

export async function createEvent(fields) {
  const { data: userData } = await supabase.auth.getUser()
  const uid = userData?.user?.id
  if (!uid) throw new Error('Not signed in')

  const { data, error } = await supabase
    .from('events')
    .insert({
      organizer_id: uid,
      title: fields.title,
      description: fields.description ?? null,
      category: fields.category,
      venue: fields.venue,
      starts_at: fields.starts_at,
      ends_at: fields.ends_at,
      image_path: fields.image_path ?? null,
      published: true,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// ============================================================
// ORGANIZERS
// ============================================================

export async function fetchOrganizer(id) {
  const { data, error } = await supabase
    .from('organizers')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function fetchOrganizerStats(id) {
  const { data, error } = await supabase
    .from('organizer_stats')
    .select('*')
    .eq('organizer_id', id)
    .maybeSingle()
  if (error) throw error
  return data ?? { follower_count: 0, upcoming_count: 0 }
}

export async function fetchEventsByOrganizer(organizerId) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('organizer_id', organizerId)
    .order('starts_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function updateMyOrganizer(fields) {
  const { data: userData } = await supabase.auth.getUser()
  const uid = userData?.user?.id
  if (!uid) throw new Error('Not signed in')

  const { data, error } = await supabase
    .from('organizers')
    .update(fields)
    .eq('id', uid)
    .select()
    .single()
  if (error) throw error
  return data
}

// ============================================================
// SAVES
// ============================================================

export async function fetchSavedEvents() {
  const { data: userData } = await supabase.auth.getUser()
  const uid = userData?.user?.id
  if (!uid) return []

  const { data, error } = await supabase
    .from('saved_events')
    .select('event_id, events(*)')
    .order('saved_at', { ascending: false })
  if (error) throw error

  const rows = data ?? []
  // Auto-unsave events that have ended (or been deleted, leaving no events row).
  const stale = rows.filter((r) => !r.events || isPast(r.events.ends_at)).map((r) => r.event_id)
  if (stale.length > 0) {
    await supabase.from('saved_events').delete().eq('user_id', uid).in('event_id', stale)
  }
  return rows.filter((r) => r.events && !isPast(r.events.ends_at)).map((r) => r.events)
}

export async function fetchSavedIds() {
  const { data: userData } = await supabase.auth.getUser()
  const uid = userData?.user?.id
  if (!uid) return []
  const { data, error } = await supabase.from('saved_events').select('event_id')
  if (error) throw error
  return (data ?? []).map((r) => r.event_id)
}

export async function saveEvent(eventId) {
  const { data: userData } = await supabase.auth.getUser()
  const uid = userData?.user?.id
  if (!uid) throw new Error('Not signed in')
  const { error } = await supabase
    .from('saved_events')
    .insert({ user_id: uid, event_id: eventId })
  if (error) throw error
}

export async function unsaveEvent(eventId) {
  const { data: userData } = await supabase.auth.getUser()
  const uid = userData?.user?.id
  if (!uid) throw new Error('Not signed in')
  const { error } = await supabase
    .from('saved_events')
    .delete()
    .eq('user_id', uid)
    .eq('event_id', eventId)
  if (error) throw error
}

// ============================================================
// FOLLOWS
// ============================================================

export async function fetchMyFollowing() {
  const { data: userData } = await supabase.auth.getUser()
  const uid = userData?.user?.id
  if (!uid) return []
  const { data, error } = await supabase
    .from('follows')
    .select('organizers(id, name, avatar_path)')
  if (error) throw error
  return (data ?? []).map((r) => r.organizers).filter(Boolean)
}

export async function fetchFollowingIds() {
  const { data: userData } = await supabase.auth.getUser()
  const uid = userData?.user?.id
  if (!uid) return []
  const { data, error } = await supabase.from('follows').select('organizer_id')
  if (error) throw error
  return (data ?? []).map((r) => r.organizer_id)
}

export async function followOrganizer(organizerId) {
  const { data: userData } = await supabase.auth.getUser()
  const uid = userData?.user?.id
  if (!uid) throw new Error('Not signed in')
  const { error } = await supabase
    .from('follows')
    .insert({ user_id: uid, organizer_id: organizerId })
  if (error) throw error
}

export async function unfollowOrganizer(organizerId) {
  const { data: userData } = await supabase.auth.getUser()
  const uid = userData?.user?.id
  if (!uid) throw new Error('Not signed in')
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('user_id', uid)
    .eq('organizer_id', organizerId)
  if (error) throw error
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export async function updateEventAndNotify(eventId, fields, message) {
  const { data, error } = await supabase.rpc('update_event_and_notify', {
    p_event_id: eventId,
    p_fields: fields,
    p_message: message,
  })
  if (error) throw error
  return data
}

export async function cancelEvent(eventId, message) {
  const { error } = await supabase.rpc('cancel_event', {
    p_event_id: eventId,
    p_message: message,
  })
  if (error) throw error
}

export async function fetchMyNotifications() {
  const { data: userData } = await supabase.auth.getUser()
  const uid = userData?.user?.id
  if (!uid) return []
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('read', false)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function markNotificationsRead(ids) {
  if (!ids || ids.length === 0) return
  const { error } = await supabase.from('notifications').update({ read: true }).in('id', ids)
  if (error) throw error
}

// ============================================================
// ADMIN
// ============================================================

export async function fetchPendingOrganizers() {
  const { data, error } = await supabase
    .from('organizers')
    .select('*')
    .eq('status', 'pending')
    .order('applied_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function setOrganizerStatus(id, status, rejectReason = null) {
  const { error } = await supabase
    .from('organizers')
    .update({ status, reject_reason: rejectReason })
    .eq('id', id)
  if (error) throw error
}
