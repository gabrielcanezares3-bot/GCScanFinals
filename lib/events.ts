import { supabase } from './supabase';
import { normalizeAttendanceSettings } from './smartFeatures';

export type Event = {
  eventId: string;
  title: string;
  start: string;
  end: string;
  gracePeriodMinutes?: number;
  lateReasonEnabled?: boolean;
  zoneEnabled?: boolean;
  zoneLat?: number | null;
  zoneLon?: number | null;
  zoneRadiusM?: number;
};

export type CloudEvent = {
  id: string;
  event_code: string;
  title: string;
  start_time: string | null;
  end_time: string | null;
  created_by: string | null;
  created_at: string;
  grace_period_minutes: number;
  zone_enabled: boolean;
  zone_lat: number | null;
  zone_lon: number | null;
  zone_radius_m: number;
  late_reason_enabled: boolean;
  archived_at: string | null;
};

export async function createEvent(
  event: Event
): Promise<{ error: string | null; eventId?: string }> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { error: 'You must be signed in to create an event.' };
  }

  const eventCode = event.eventId.trim();
  const title = event.title.trim();
  const settings = normalizeAttendanceSettings({
    gracePeriodMinutes: event.gracePeriodMinutes,
    lateReasonEnabled: event.lateReasonEnabled,
    zoneEnabled: event.zoneEnabled,
    zoneLat: event.zoneLat,
    zoneLon: event.zoneLon,
    zoneRadiusM: event.zoneRadiusM,
  });
  if (!eventCode || !title) {
    return { error: 'Event title and code are required.' };
  }

  const { data, error } = await supabase
    .from('events')
    .insert({
      event_code: eventCode,
      title,
      start_time: event.start || null,
      end_time: event.end || null,
      created_by: user.id,
      grace_period_minutes: settings.gracePeriodMinutes,
      late_reason_enabled: settings.lateReasonEnabled,
      zone_enabled: settings.zoneEnabled,
      zone_lat: settings.zoneLat,
      zone_lon: settings.zoneLon,
      zone_radius_m: settings.zoneRadiusM,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { error: 'This event code is already in use. Choose a unique code.' };
    }
    return { error: error.message };
  }

  return { error: null, eventId: data.id };
}

export async function getEventsByTeacher(
  teacherId: string
): Promise<CloudEvent[]> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user || user.id !== teacherId) {
    return [];
  }

  await supabase.rpc('gcscan_purge_expired_events');

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('created_by', user.id)
    .is('archived_at', null)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as CloudEvent[];
}

export async function getEventByCode(
  code: string
): Promise<CloudEvent | null> {
  await supabase.rpc('gcscan_purge_expired_events');

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('event_code', code)
    .is('archived_at', null)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as CloudEvent;
}


export async function getDeletedEventsByTeacher(teacherId: string): Promise<CloudEvent[]> {
  await supabase.rpc('gcscan_purge_expired_events');
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('created_by', teacherId)
    .not('archived_at', 'is', null)
    .order('archived_at', { ascending: false });
  if (error || !data) return [];
  return data as CloudEvent[];
}

export async function archiveEvent(eventId: string): Promise<{ success: boolean; message: string }> {
  const { data, error } = await supabase.rpc('gcscan_archive_event', { p_event_id: eventId });
  if (error) return { success: false, message: error.message || 'Event could not be moved to Recently Deleted.' };
  if (data === true) {
    return { success: true, message: 'Event moved to Recently Deleted for 15 days.' };
  }
  return {
    success: false,
    message: `Event was not archived (gcscan_archive_event returned ${String(data)}). The RPC did not provide a more specific reason.`,
  };
}

export async function restoreEvent(eventId: string): Promise<{ success: boolean; message: string }> {
  const { data, error } = await supabase.rpc('gcscan_restore_event', { p_event_id: eventId });
  if (error) return { success: false, message: error.message || 'Event could not be restored.' };
  return data ? { success: true, message: 'Event restored.' } : { success: false, message: 'This event is no longer recoverable.' };
}

export async function permanentlyDeleteEvent(eventId: string): Promise<{ success: boolean; message: string }> {
  const { data, error } = await supabase.rpc('gcscan_delete_event_permanently', { p_event_id: eventId });
  if (error) return { success: false, message: error.message || 'Event could not be permanently deleted.' };
  return data ? { success: true, message: 'Event permanently deleted.' } : { success: false, message: 'Event could not be permanently deleted.' };
}
