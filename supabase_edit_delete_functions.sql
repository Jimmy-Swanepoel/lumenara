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
  if v_event.organizer_id <> auth.uid() then
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
  if v_event.organizer_id <> auth.uid() then
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

grant execute on function cancel_event to authenticated;
