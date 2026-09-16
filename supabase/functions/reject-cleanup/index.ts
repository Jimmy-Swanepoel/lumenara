// Full account wipe for a rejected organiser application. Called by the
// rejected person's own client (see components/RejectionGate.js) after they
// acknowledge the "application not approved" popup.
//
// This exists as an Edge Function - not a Postgres RPC - specifically because
// deleting the auth.users row requires the service-role key / Admin API,
// neither of which the client app holds. The service role key is available
// here automatically (Supabase injects it into every Edge Function's
// environment; it is never shipped to the app or checked into the repo).
//
// The caller is verified by their own JWT before anything is deleted, and the
// target of every delete is always `user.id` from that verified token -
// never a client-supplied id - so this can only ever wipe the caller's own
// account, and only if it's actually in the 'rejected' state.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Scoped to the caller's own token - only used to find out who's calling.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userErr } = await callerClient.auth.getUser()
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    // Service-role client - bypasses RLS entirely, so this must never act on
    // anything other than the verified caller's own id.
    const admin = createClient(supabaseUrl, serviceRoleKey)

    const { data: organizer, error: orgErr } = await admin
      .from('organizers')
      .select('status')
      .eq('id', user.id)
      .maybeSingle()
    if (orgErr) throw orgErr
    if (organizer?.status !== 'rejected') {
      return new Response(JSON.stringify({ error: 'Not a rejected organiser' }), { status: 403 })
    }

    // Explicit deletes first (harmless even if FK cascades already handle
    // this on auth user deletion below - belt and suspenders, and it means
    // this still cleans up correctly if cascades aren't configured).
    await admin.from('organizers').delete().eq('id', user.id)
    await admin.from('profiles').delete().eq('id', user.id)

    const { error: delErr } = await admin.auth.admin.deleteUser(user.id)
    if (delErr) throw delErr

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error(e)
    const message = e instanceof Error ? e.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
