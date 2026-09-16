drop function if exists notify_event_savers(uuid, text, text);

create or replace function update_event_and_notify(p_event_id uuid, p_fields jsonb, p_message text)
returns events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event events%rowtype;
begin
  select * into v_event from events where id = p_event_id;
  if v_event.id is null then
    raise exception 'event not found';
  end if;
  if auth.uid() is null or v_event.organizer_id <> auth.uid() then
    raise exception 'not your event';
  end if;

  update events set
    title = coalesce(p_fields->>'title', title),
    description = coalesce(p_fields->>'description', description),
    category = coalesce((p_fields->>'category')::event_category, category),
    venue = coalesce(p_fields->>'venue', venue),
    starts_at = coalesce((p_fields->>'starts_at')::timestamptz, starts_at),
    ends_at = coalesce((p_fields->>'ends_at')::timestamptz, ends_at),
    image_path = coalesce(p_fields->>'image_path', image_path)
  where id = p_event_id
  returning * into v_event;

  if p_message is not null then
    -- collapse: a still-unread notification for this event is superseded by
    -- the latest change, not stacked alongside it
    delete from notifications where event_id = p_event_id and read = false;

    insert into notifications (user_id, event_id, event_title, message, type)
    select user_id, p_event_id, v_event.title, p_message, 'edited'
    from saved_events
    where event_id = p_event_id;
  end if;

  return v_event;
end;
$$;

-- Postgres grants EXECUTE to PUBLIC by default on function creation, which
-- silently includes the anon role - revoke both explicitly (anon carries its
-- own ACL entry from Supabase's default privileges, separate from PUBLIC) so
-- only signed-in users can call this.
revoke execute on function update_event_and_notify(uuid, jsonb, text) from public;
revoke execute on function update_event_and_notify(uuid, jsonb, text) from anon;
grant execute on function update_event_and_notify to authenticated;

create or replace function cancel_event(p_event_id uuid, p_message text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event events%rowtype;
begin
  select * into v_event from events where id = p_event_id;
  if v_event.id is null then
    raise exception 'event not found';
  end if;
  if auth.uid() is null or v_event.organizer_id <> auth.uid() then
    raise exception 'not your event';
  end if;

  -- cancellation supersedes any pending "it changed" notifications for this event
  delete from notifications where event_id = p_event_id and read = false;

  insert into notifications (user_id, event_id, event_title, message, type)
  select user_id, p_event_id, v_event.title, p_message, 'deleted'
  from saved_events
  where event_id = p_event_id;

  delete from events where id = p_event_id;
end;
$$;

revoke execute on function cancel_event(uuid, text) from public;
revoke execute on function cancel_event(uuid, text) from anon;
grant execute on function cancel_event to authenticated;

-- Self-service cleanup for a rejected organiser application. Deliberately a
-- security definer RPC rather than a client-side update to profiles.role:
-- letting users update arbitrary columns on their own profile row (even just
-- via a permissive RLS policy) would let anyone self-promote role to
-- 'organizer' or worse - this function only ever sets role back to 'user'
-- for the caller's own rejected application, nothing else.
-- Note: this does NOT delete the underlying auth.users row (that needs the
-- service-role key / Admin API, which this project doesn't hold client-side)
-- - it just clears the app-level organiser state so the caller reverts to a
-- normal user account. Deleting the login itself is a manual "Delete user"
-- in the Supabase dashboard's Authentication > Users page, if wanted.
create or replace function leave_rejected_organizer()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  select status into v_status from organizers where id = auth.uid();
  if v_status is distinct from 'rejected' then
    raise exception 'not a rejected organizer';
  end if;

  delete from organizers where id = auth.uid();
  update profiles set role = 'user' where id = auth.uid();
end;
$$;

revoke execute on function leave_rejected_organizer() from public;
revoke execute on function leave_rejected_organizer() from anon;
grant execute on function leave_rejected_organizer to authenticated;
