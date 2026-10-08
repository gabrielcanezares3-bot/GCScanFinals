-- GCScan event Recently Deleted system
-- Archived events remain recoverable for 15 days before permanent deletion.

alter table public.events
  add column if not exists archived_at timestamptz;

create index if not exists events_created_by_archived_at_idx
  on public.events (created_by, archived_at, created_at desc);

create index if not exists events_archived_at_idx
  on public.events (archived_at)
  where archived_at is not null;

create or replace function public.gcscan_purge_expired_events()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  deleted_count integer := 0;
begin
  delete from public.attendance_recovery_requests
  where event_id in (
    select id from public.events
    where archived_at is not null
      and archived_at <= now() - interval '15 days'
  );

  delete from public.events
  where archived_at is not null
    and archived_at <= now() - interval '15 days';

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

create or replace function public.gcscan_archive_event(p_event_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.events
    where id = p_event_id
      and created_by = auth.uid()
      and archived_at is null
  ) then
    return false;
  end if;

  update public.events
  set archived_at = now()
  where id = p_event_id
    and created_by = auth.uid()
    and archived_at is null;

  return true;
end;
$$;

create or replace function public.gcscan_restore_event(p_event_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.events
    where id = p_event_id
      and created_by = auth.uid()
      and archived_at is not null
      and archived_at > now() - interval '15 days'
  ) then
    return false;
  end if;

  update public.events
  set archived_at = null
  where id = p_event_id
    and created_by = auth.uid()
    and archived_at is not null;

  return true;
end;
$$;

create or replace function public.gcscan_delete_event_permanently(p_event_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.events
    where id = p_event_id
      and created_by = auth.uid()
      and archived_at is not null
  ) then
    return false;
  end if;

  delete from public.attendance_recovery_requests
  where event_id = p_event_id;

  delete from public.events
  where id = p_event_id
    and created_by = auth.uid()
    and archived_at is not null;

  return true;
end;
$$;

revoke all on function public.gcscan_purge_expired_events() from public, anon;
grant execute on function public.gcscan_purge_expired_events() to authenticated;

revoke all on function public.gcscan_archive_event(uuid) from public, anon;
grant execute on function public.gcscan_archive_event(uuid) to authenticated;

revoke all on function public.gcscan_restore_event(uuid) from public, anon;
grant execute on function public.gcscan_restore_event(uuid) to authenticated;

revoke all on function public.gcscan_delete_event_permanently(uuid) from public, anon;
grant execute on function public.gcscan_delete_event_permanently(uuid) to authenticated;
