import AmbientBackground from '@/components/AmbientBackground';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import AppButton from '@/components/AppButton';
import EntranceView from '@/components/EntranceView';
import { COLORS, RADIUS, SPACE } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';
import { useAuth } from '@/lib/auth';
import type { TeacherEventAttendance } from '@/lib/attendance';
import { supabase } from '@/lib/supabase';
import { archiveEvent, createEvent, getDeletedEventsByTeacher, getEventsByTeacher, permanentlyDeleteEvent, restoreEvent } from '@/lib/events';
import { getProfile, type Role } from '@/lib/profiles';
import { buildQRPayload } from '@/lib/qr';
import { getRecoveryRequests, reviewAttendanceRecovery, type RecoveryRequest } from '@/lib/smartFeatures';
import {
  detectAttendanceAnomalies,
  getLiveEventAttendance,
  getTeacherAttendanceInsights,
  type AttendanceInsight,
  type LiveEvent,
} from '@/lib/smartAttendance';

function toUtcISO(date: Date) {
  return date.toISOString();
}

function formatDateTime(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short' });
  return `${month} ${pad(date.getDate())}, ${date.getFullYear()} at ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function toInputDateTimeValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

const QUICK_END_OPTIONS = [
  { label: '+30 min', ms: 30 * 60 * 1000 },
  { label: '+1 hour', ms: 60 * 60 * 1000 },
  { label: '+2 hours', ms: 2 * 60 * 60 * 1000 },
];

type EditTarget = 'start' | 'end';

export default function TeacherScreen() {
  const { user } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [eventId, setEventId] = useState('');
  const [startDate, setStartDate] = useState(() => new Date());
  const [endDate, setEndDate] = useState(
    () => new Date(Date.now() + 60 * 60 * 1000)
  );
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [editingPart, setEditingPart] = useState<'date' | 'time'>('date');
  const [payload, setPayload] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [liveEvent, setLiveEvent] = useState<TeacherEventAttendance | null>(null);
  const [insights, setInsights] = useState<AttendanceInsight[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [monitorEvents, setMonitorEvents] = useState<{ id: string; title: string; event_code: string }[]>([]);
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(0);
  const [lateReasonEnabled, setLateReasonEnabled] = useState(false);
  const [zoneEnabled, setZoneEnabled] = useState(false);
  const [zoneLatitude, setZoneLatitude] = useState('');
  const [zoneLongitude, setZoneLongitude] = useState('');
  const [zoneRadius, setZoneRadius] = useState('100');
  const [savingEvent, setSavingEvent] = useState(false);
  const [recoveryRequests, setRecoveryRequests] = useState<RecoveryRequest[]>([]);
  const [recoveryBusyId, setRecoveryBusyId] = useState<string | null>(null);
  const [deletedEvents, setDeletedEvents] = useState<any[]>([]);
  const [eventActionId, setEventActionId] = useState<string | null>(null);

  const isAndroid = Platform.OS === 'android';

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!user) {
        setRoleLoading(false);
        return () => {
          active = false;
        };
      }
      getProfile(user.id).then(async (profile) => {
        if (!active) return;
        setRole(profile?.role ?? 'student');
        if (profile?.role === 'teacher') {
          const events = await getEventsByTeacher(user.id);
          const deleted = await getDeletedEventsByTeacher(user.id);
          const requests = await getRecoveryRequests('teacher', user.id);
          if (active) setRecoveryRequests(requests);
          if (active) {
            setMonitorEvents(events.map((event) => ({ id: event.id, title: event.title, event_code: event.event_code })));
            setDeletedEvents(deleted);
            if (events[0]) setSelectedEventId(events[0].id);
          }
        }
        setRoleLoading(false);
      });
      return () => {
        active = false;
      };
    }, [user])
  );

  useEffect(() => {
    if (role !== 'teacher' || !user) return;

    let active = true;
    getTeacherAttendanceInsights(user.id).then((data) => {
      if (active) setInsights(data);
    });

    return () => {
      active = false;
    };
  }, [role, user, payload]);

  useEffect(() => {
    if (!selectedEventId || !user) {
      setLiveEvent(null);
      return;
    }

    let active = true;
    let refreshVersion = 0;

    const refresh = async () => {
      const version = ++refreshVersion;
      setLiveLoading(true);
      try {
        const data = await getLiveEventAttendance(user.id, selectedEventId);
        if (active && version === refreshVersion) setLiveEvent(data);
      } finally {
        if (active && version === refreshVersion) setLiveLoading(false);
      }
    };

    refresh();

    const channel = supabase
      .channel(`gcscan-live-${selectedEventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance',
          filter: `event_id=eq.${selectedEventId}`,
        },
        () => {
          refresh();
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [selectedEventId, user]);

  if (roleLoading) {
    return (
      <View style={styles.centerContainer}>
        <AmbientBackground graphicSide="left" />
        <View style={styles.centerCard}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.checkingText}>Checking your account...</Text>
        </View>
      </View>
    );
  }

  if (role !== 'teacher') {
    return (
      <View style={styles.centerContainer}>
        <AmbientBackground />
        <View style={styles.centerCard}>
          <View style={styles.lockIcon}>
            <Ionicons name="lock-closed-outline" size={24} color={COLORS.primarySoft} />
          </View>
          <Text style={styles.lockTitle}>Teachers Only</Text>
          <Text style={styles.lockSubtitle}>
            Only teacher accounts can create events.
          </Text>
        </View>
      </View>
    );
  }

  const openPicker = (target: EditTarget) => {
    setMessage(null);
    setEditTarget(target);
    setEditingPart('date');
  };

  const renderDateTimeField = (target: EditTarget) => {
    const value = target === 'start' ? startDate : endDate;
    const icon = target === 'start' ? 'sunny-outline' : 'moon-outline';
    const handleChange = (next: Date) => {
      setMessage(null);
      if (target === 'start') setStartDate(next);
      else setEndDate(next);
    };

    if (Platform.OS === 'web') {
      return <WebDateTimeField value={value} icon={icon} onChange={handleChange} />;
    }

    return (
      <PickerField
        value={formatDateTime(value)}
        icon={icon}
        onPress={() => openPicker(target)}
      />
    );
  };

  const onPickerChange = (
    event: DateTimePickerEvent,
    selected?: Date
  ) => {
    if (!editTarget) return;
    if (event.type === 'dismissed' || !selected) {
      setEditTarget(null);
      setEditingPart('date');
      return;
    }

    const current = editTarget === 'start' ? startDate : endDate;
    const next = new Date(current);
    next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);

    if (editTarget === 'start') setStartDate(next);
    else setEndDate(next);

    if (isAndroid && editingPart === 'date') {
      setEditingPart('time');
    } else {
      setEditTarget(null);
      setEditingPart('date');
    }
  };

  const handleQuickEnd = (ms: number) => {
    setMessage(null);
    setEndDate(new Date(startDate.getTime() + ms));
  };

  const handleCreateEvent = async () => {
    const latitude = Number(zoneLatitude);
    const longitude = Number(zoneLongitude);
    const radius = Number(zoneRadius);

    if (zoneEnabled && (
      !zoneLatitude.trim() ||
      !zoneLongitude.trim() ||
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180 ||
      !Number.isInteger(radius) ||
      radius < 25 ||
      radius > 2000
    )) {
      setMessage('Enter valid coordinates and a radius from 25 to 2000 meters.');
      return;
    }

    const event = {
      eventId: eventId.trim(),
      title: title.trim(),
      start: toUtcISO(startDate),
      end: toUtcISO(endDate),
      gracePeriodMinutes,
      lateReasonEnabled,
      zoneEnabled,
      zoneLat: zoneEnabled ? latitude : null,
      zoneLon: zoneEnabled ? longitude : null,
      zoneRadiusM: radius,
    };

    if (!event.eventId || !event.title) {
      setMessage('Event title and code are required.');
      return;
    }

    if (endDate.getTime() <= startDate.getTime()) {
      setMessage('End time must be after start time.');
      return;
    }

    setSavingEvent(true);
    setMessage(null);
    const result = await createEvent(event);
    setSavingEvent(false);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setMessage('Event saved. Its grace period is enforced by the server.');
    setPayload(buildQRPayload(event));
    if (result.eventId) setSelectedEventId(result.eventId);
    if (user) {
      const events = await getEventsByTeacher(user.id);
      const deleted = await getDeletedEventsByTeacher(user.id);
      setMonitorEvents(events.map((item) => ({ id: item.id, title: item.title, event_code: item.event_code })));
      setDeletedEvents(deleted);
    }
  };

  const refreshTeacherEvents = async () => {
    if (!user) return;
    const [events, deleted] = await Promise.all([getEventsByTeacher(user.id), getDeletedEventsByTeacher(user.id)]);
    setMonitorEvents(events.map((item) => ({ id: item.id, title: item.title, event_code: item.event_code })));
    setDeletedEvents(deleted);
    if (selectedEventId && !events.some((item) => item.id === selectedEventId)) {
      setSelectedEventId(events[0]?.id ?? null);
    }
  };

  const handleArchiveEvent = (eventId: string, eventTitle: string) => {
    const archive = async () => {
      setEventActionId(eventId);
      const result = await archiveEvent(eventId);
      setEventActionId(null);
      setMessage(result.message);
      if (result.success) {
        setMonitorEvents((events) => events.filter((event) => event.id !== eventId));
        if (selectedEventId === eventId) setSelectedEventId(null);
        await refreshTeacherEvents();
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' && window.confirm(
        `Move "${eventTitle}" to Recently Deleted? Its attendance history stays safe for 15 days.`
      );
      if (confirmed) void archive();
      return;
    }

    Alert.alert(
      'Move to Recently Deleted?',
      `“${eventTitle}” will be hidden from active event lists. Its attendance history stays safe for 15 days.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Move to Deleted',
          style: 'destructive',
          onPress: archive,
        },
      ]
    );
  };

  const handleRestoreEvent = async (eventId: string) => {
    setEventActionId(eventId);
    const result = await restoreEvent(eventId);
    setEventActionId(null);
    setMessage(result.message);
    if (result.success) await refreshTeacherEvents();
  };

  const handlePermanentDelete = (eventId: string, eventTitle: string) => {
    const permanentlyDelete = async () => {
      setEventActionId(eventId);
      const result = await permanentlyDeleteEvent(eventId);
      setEventActionId(null);
      setMessage(result.message);
      if (result.success) {
        setDeletedEvents((events) => events.filter((event) => event.id !== eventId));
        await refreshTeacherEvents();
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' && window.confirm(
        `Permanently delete "${eventTitle}" and its attendance/recovery records? This cannot be undone.`
      );
      if (confirmed) void permanentlyDelete();
      return;
    }

    Alert.alert(
      'Delete permanently?',
      `This permanently removes “${eventTitle}” and its attendance/recovery records. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: permanentlyDelete,
        },
      ]
    );
  };

  const handleRecoveryReview = async (request: RecoveryRequest, decision: 'approved' | 'rejected') => {
    setRecoveryBusyId(request.id);
    const result = await reviewAttendanceRecovery(request.id, decision);
    setRecoveryBusyId(null);
    setMessage(result.message);
    if (result.success && user) { setRecoveryRequests(await getRecoveryRequests('teacher', user.id)); }
  };

  return (
    <View style={styles.screen}>
      <AmbientBackground />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <EntranceView>
          <View style={styles.teacherBanner}>
            <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
              <Defs><LinearGradient id="teacherHero" x1="0" y1="0" x2="1" y2="1"><Stop offset="0%" stopColor="#315FE8" /><Stop offset="100%" stopColor="#625BD0" /></LinearGradient></Defs>
              <Rect width="100%" height="100%" rx="27" fill="url(#teacherHero)" />
              <Circle cx="100%" cy="0%" r="90" fill="#FFFFFF" fillOpacity="0.10" />
              <Circle cx="5%" cy="115%" r="78" fill="#8CE0D5" fillOpacity="0.14" />
            </Svg>
            <View style={styles.teacherBannerCopy}>
              <Text style={styles.teacherEyebrow}>TEACHER STUDIO · EVENT TOOLS</Text>
              <Text style={styles.teacherBannerTitle}>Bring your{'\n'}class together.</Text>
              <Text style={styles.teacherBannerText}>Create a QR event and see check-ins as they happen.</Text>
            </View>
            <View style={styles.teacherBannerArt}>
              <Ionicons name="qr-code-outline" size={32} color="#FFFFFF" />
              <View style={styles.teacherBannerArtDot}><Ionicons name="add" size={13} color={COLORS.primary} /></View>
            </View>
          </View>
        </EntranceView>

        <EntranceView delay={100}>
        <View style={styles.formCard}>
          <View style={styles.formHeading}>
            <View style={styles.formHeadingIcon}><Ionicons name="calendar-outline" size={18} color={COLORS.primary} /></View>
            <View style={styles.formHeadingCopy}><Text style={styles.formEyebrow}>SET UP A SESSION</Text><Text style={styles.formTitle}>Create an event</Text></View>
            <View style={styles.formStep}><Text style={styles.formStepText}>01</Text></View>
          </View>
          <Text style={styles.label}>Event Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Founders Day Assembly"
            placeholderTextColor={COLORS.textSecondary}
          />

          <Text style={styles.label}>Event Code</Text>
          <TextInput
            style={styles.input}
            value={eventId}
            onChangeText={setEventId}
            placeholder="e.g. EVT-2026-0002"
            placeholderTextColor={COLORS.textSecondary}
            autoCapitalize="characters"
          />

          <Text style={styles.label}>Starts</Text>
          {renderDateTimeField('start')}

          <Text style={styles.label}>Ends</Text>
          {renderDateTimeField('end')}
          <View style={styles.chipRow}>
            {QUICK_END_OPTIONS.map((option) => (
              <Pressable
                key={option.label}
                accessibilityRole="button"
                style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
                onPress={() => handleQuickEnd(option.ms)}
              >
                <Text style={styles.chipText}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.hint}>Tap a chip to set the end time from start.</Text>
          <Text style={styles.label}>Grace Period</Text>
          <View style={styles.chipRow}>
            {[0, 5, 10, 15].map((minutes) => (
              <Pressable key={minutes} style={({ pressed }) => [styles.chip, gracePeriodMinutes === minutes && styles.chipActive, pressed && styles.chipPressed]} onPress={() => setGracePeriodMinutes(minutes)}>
                <Text style={[styles.chipText, gracePeriodMinutes === minutes && styles.chipTextActive]}>{minutes === 0 ? 'No grace' : `${minutes} min`}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.hint}>Grace time is checked against the server timestamp, not the phone clock.</Text>

          <Pressable style={styles.toggleRow} onPress={() => setLateReasonEnabled((value) => !value)} accessibilityRole="switch" accessibilityState={{ checked: lateReasonEnabled }}>
            <View style={styles.toggleCopy}>
              <Text style={styles.toggleTitle}>Ask for late reason</Text>
              <Text style={styles.toggleText}>Students choose a reason only when they are late.</Text>
            </View>
            <View style={[styles.toggle, lateReasonEnabled && styles.toggleOn]}><View style={[styles.toggleKnob, lateReasonEnabled && styles.toggleKnobOn]} /></View>
          </Pressable>

          <Pressable style={styles.toggleRow} onPress={() => setZoneEnabled((value) => !value)} accessibilityRole="switch" accessibilityState={{ checked: zoneEnabled }}>
            <View style={styles.toggleCopy}>
              <Text style={styles.toggleTitle}>Require attendance zone</Text>
              <Text style={styles.toggleText}>Students must be within the selected radius to check in.</Text>
            </View>
            <View style={[styles.toggle, zoneEnabled && styles.toggleOn]}><View style={[styles.toggleKnob, zoneEnabled && styles.toggleKnobOn]} /></View>
          </Pressable>

          {zoneEnabled && (
            <View>
              <Text style={styles.label}>Zone center coordinates</Text>
              <TextInput
                style={styles.input}
                value={zoneLatitude}
                onChangeText={setZoneLatitude}
                placeholder="Latitude (-90 to 90)"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={styles.input}
                value={zoneLongitude}
                onChangeText={setZoneLongitude}
                placeholder="Longitude (-180 to 180)"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="decimal-pad"
              />
              <Text style={styles.label}>Zone radius (meters)</Text>
              <TextInput
                style={styles.input}
                value={zoneRadius}
                onChangeText={setZoneRadius}
                placeholder="25 to 2000"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="number-pad"
              />
            </View>
          )}

          {message && <Text style={styles.message}>{message}</Text>}

          <AppButton
            theme="primary"
            title="Create Event"
            icon="add-circle-outline"
            centeredContent
            createEventSpacing
            removeOuterGlow
            onPress={handleCreateEvent}
            disabled={savingEvent}
          />
        </View>
        </EntranceView>

        <View style={styles.smartCard}>
          <View style={styles.smartHeader}>
            <View style={styles.smartIcon}>
              <Ionicons name="folder-open-outline" size={19} color={COLORS.primary} />
            </View>
            <View style={styles.smartHeaderCopy}>
              <Text style={styles.smartEyebrow}>EVENT MANAGEMENT</Text>
              <Text style={styles.smartTitle}>Your Events</Text>
            </View>
          </View>

          {monitorEvents.length === 0 ? (
            <Text style={styles.smartEmpty}>No active events yet.</Text>
          ) : monitorEvents.map((event) => (
            <View key={event.id} style={styles.eventManageRow}>
              <View style={styles.eventManageCopy}>
                <Text style={styles.eventManageTitle}>{event.title}</Text>
                <Text style={styles.eventManageMeta}>{event.event_code}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                disabled={eventActionId === event.id}
                onPress={() => handleArchiveEvent(event.id, event.title)}
                style={({ pressed }) => [styles.deleteEventButton, pressed && styles.monitorChipPressed]}
              >
                {eventActionId === event.id ? <ActivityIndicator size="small" color={COLORS.danger} /> : <Ionicons name="trash-outline" size={17} color={COLORS.danger} />}
              </Pressable>
            </View>
          ))}

          <View style={styles.deletedHeader}>
            <Ionicons name="trash-bin-outline" size={16} color={COLORS.warning} />
            <Text style={styles.deletedTitle}>Recently Deleted · 15 days</Text>
          </View>
          {deletedEvents.length === 0 ? (
            <Text style={styles.deletedEmpty}>Deleted events will stay here temporarily before permanent removal.</Text>
          ) : deletedEvents.map((event) => {
            const expiresAt = event.archived_at ? new Date(new Date(event.archived_at).getTime() + 15 * 86400000) : null;
            const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86400000)) : 0;
            return (
              <View key={event.id} style={styles.deletedRow}>
                <View style={styles.eventManageCopy}>
                  <Text style={styles.eventManageTitle}>{event.title}</Text>
                  <Text style={styles.eventManageMeta}>{event.event_code} · {daysLeft} day{daysLeft === 1 ? '' : 's'} left</Text>
                </View>
                <View style={styles.deletedActions}>
                  <Pressable disabled={eventActionId === event.id} onPress={() => handleRestoreEvent(event.id)} style={styles.restoreButton}>
                    <Ionicons name="refresh-outline" size={16} color={COLORS.primary} />
                  </Pressable>
                  <Pressable disabled={eventActionId === event.id} onPress={() => handlePermanentDelete(event.id, event.title)} style={styles.permanentButton}>
                    <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.smartCard}>
          <View style={styles.smartHeader}>
            <View style={styles.smartIcon}>
              <Ionicons name="pulse-outline" size={19} color={COLORS.primary} />
            </View>
            <View style={styles.smartHeaderCopy}>
              <Text style={styles.smartEyebrow}>SMART ATTENDANCE</Text>
              <Text style={styles.smartTitle}>Live Attendance Pulse</Text>
            </View>
            {liveLoading && <ActivityIndicator size="small" color={COLORS.primary} />}
          </View>

          {monitorEvents.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.monitorChipRow}
            >
              {monitorEvents.map((event) => (
                <Pressable
                  key={event.id}
                  accessibilityRole="button"
                  onPress={() => setSelectedEventId(event.id)}
                  style={({ pressed }) => [
                    styles.monitorChip,
                    selectedEventId === event.id && styles.monitorChipActive,
                    pressed && styles.monitorChipPressed,
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.monitorChipText,
                      selectedEventId === event.id && styles.monitorChipTextActive,
                    ]}
                  >
                    {event.title}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {selectedEventId && liveEvent ? (
            <>
              <Text style={styles.liveEventTitle}>{liveEvent.title}</Text>
              <Text style={styles.liveEventMeta}>{liveEvent.eventCode}</Text>
              <View style={styles.pulseStats}>
                <PulseStat value={String(liveEvent.attendeeCount)} label="Scanned" icon="checkmark-circle-outline" />
                <PulseStat value={String(liveEvent.attendees.length)} label="Records" icon="people-outline" />
              </View>
              <View style={styles.liveList}>
                {liveEvent.attendees.slice(0, 8).map((attendee) => (
                  <View key={`${attendee.studentId}-${attendee.scannedAt}`} style={styles.liveRow}>
                    <View style={styles.livePerson}><Ionicons name="person" size={12} color={COLORS.primary} /></View>
                    <View style={styles.livePersonCopy}><Text style={styles.livePersonName}>{attendee.studentName || 'Student'}</Text><Text style={styles.livePersonTime}>{formatDateTime(new Date(attendee.scannedAt))}</Text></View>
                    <View style={[styles.liveStatus, attendee.status === 'late' && styles.liveStatusLate, attendee.status === 'recovered' && styles.liveStatusRecovered]}><Text style={[styles.liveStatusText, attendee.status === 'late' && styles.liveStatusLateText]}>{attendee.status === 'present' ? 'Present' : attendee.status === 'late' ? 'Late' : 'Recovered'}</Text></View>
                  </View>
                ))}
              </View>
              {detectAttendanceAnomalies(liveEvent.attendees).length > 0 && (
                <View style={styles.alertCard}>
                  <Ionicons name="alert-circle-outline" size={18} color={COLORS.warning} />
                  <View style={styles.alertCopy}>
                    <Text style={styles.alertTitle}>Review unusual activity</Text>
                    {detectAttendanceAnomalies(liveEvent.attendees).slice(0, 5).map((anomaly, index) => (
                      <Text key={`${anomaly.studentId}-${anomaly.scannedAt}-${index}`} style={styles.alertText}>
                        {anomaly.studentName || 'Student'} · {formatDateTime(new Date(anomaly.scannedAt))} · {anomaly.reason}
                      </Text>
                    ))}
                  </View>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.smartEmpty}>
              Create an event, then monitor its scans here. The pulse refreshes automatically.
            </Text>
          )}
        </View>

        <View style={styles.smartCard}>
          <View style={styles.smartHeader}>
            <View style={styles.smartIcon}>
              <Ionicons name="analytics-outline" size={19} color={COLORS.primary} />
            </View>
            <View style={styles.smartHeaderCopy}>
              <Text style={styles.smartEyebrow}>DATA INSIGHTS</Text>
              <Text style={styles.smartTitle}>Attendance Insights</Text>
            </View>
          </View>
          {insights.length === 0 ? (
            <Text style={styles.smartEmpty}>Not enough attendance data to identify a pattern yet.</Text>
          ) : (
            insights.map((insight, index) => (
              <View key={`${insight.title}-${index}`} style={styles.insightRow}>
                <View style={[styles.insightDot, insight.tone === 'positive' && styles.insightDotPositive, insight.tone === 'warning' && styles.insightDotWarning]} />
                <View style={styles.insightCopy}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightText}>{insight.detail}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.smartCard}>
          <View style={styles.smartHeader}>
            <View style={styles.smartIcon}><Ionicons name="document-text-outline" size={19} color={COLORS.primary} /></View>
            <View style={styles.smartHeaderCopy}>
              <Text style={styles.smartEyebrow}>ATTENDANCE RECOVERY</Text>
              <Text style={styles.smartTitle}>Student requests</Text>
            </View>

          </View>
          {recoveryRequests.length === 0 ? (
            <Text style={styles.smartEmpty}>No recovery requests for your events.</Text>
          ) : recoveryRequests.map((request) => (
            <View key={request.id} style={styles.recoveryRow}>
              <View style={styles.recoveryCopy}>
                <Text style={styles.recoveryName}>{request.studentName || 'Student'}</Text>
                <Text style={styles.recoveryEvent}>{request.eventTitle || request.eventCode || 'Event'}</Text>
                <Text style={styles.recoveryReason}>{request.reason}</Text>
                <Text style={styles.recoveryStatus}>{request.status.toUpperCase()}</Text>
                <Text style={styles.recoveryReason}>Requested {formatDateTime(new Date(request.requestedAt))}</Text>
                {request.reviewedAt && <Text style={styles.recoveryReason}>Reviewed {formatDateTime(new Date(request.reviewedAt))}{request.reviewNote ? ` · ${request.reviewNote}` : ''}</Text>}
              </View>
              {request.status === 'pending' && (
                <View style={styles.recoveryActions}>
                  <Pressable disabled={recoveryBusyId === request.id} style={styles.rejectButton} onPress={() => handleRecoveryReview(request, 'rejected')}><Ionicons name="close" size={18} color={COLORS.danger} /></Pressable>
                  <Pressable disabled={recoveryBusyId === request.id} style={styles.approveButton} onPress={() => handleRecoveryReview(request, 'approved')}><Ionicons name="checkmark" size={18} color={COLORS.success} /></Pressable>
                </View>
              )}
            </View>
          ))}
        </View>

        {editTarget && Platform.OS !== 'web' && (
          <View style={styles.pickerContainer}>
            <DateTimePicker
              value={editTarget === 'start' ? startDate : endDate}
              mode={isAndroid ? editingPart : 'datetime'}
              display={isAndroid ? 'default' : 'spinner'}
              onChange={onPickerChange}
            />
          </View>
        )}

        {payload && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>
              Scan this QR code with the Scan tab:
            </Text>
            <View style={styles.qrBox}>
              <QRCode value={payload} size={200} />
            </View>
            <Text style={styles.payloadText}>{payload}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function PulseStat({ value, label, icon }: { value: string; label: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.pulseStat}>
      <Ionicons name={icon} size={17} color={COLORS.primary} />
      <Text style={styles.pulseValue}>{value}</Text>
      <Text style={styles.pulseLabel}>{label}</Text>
    </View>
  );
}

type PickerFieldProps = {
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

function PickerField({ value, icon, onPress }: PickerFieldProps) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.pickerField, pressed && styles.pickerFieldPressed]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={20} color={COLORS.primary} />
      <Text style={styles.pickerValue}>{value}</Text>
      <Ionicons name="calendar-outline" size={18} color={COLORS.textSecondary} />
    </Pressable>
  );
}

type WebDateTimeFieldProps = {
  value: Date;
  icon: keyof typeof Ionicons.glyphMap;
  onChange: (date: Date) => void;
};

function WebDateTimeField({ value, icon, onChange }: WebDateTimeFieldProps) {
  return (
    <View style={styles.pickerField}>
      <Ionicons name={icon} size={20} color={COLORS.primary} />
      <input
        type="datetime-local"
        aria-label="Event date and time"
        value={toInputDateTimeValue(value)}
        onChange={(event) => {
          const next = new Date(event.target.value);
          if (!Number.isNaN(next.getTime())) onChange(next);
        }}
        onClick={(event) => {
          try {
            event.currentTarget.showPicker();
          } catch {
            // Fall back to the browser's native datetime-local input behavior.
          }
        }}
        style={webInputStyle}
      />
    </View>
  );
}

const webInputStyle = {
  flex: 1,
  marginLeft: 10,
  marginRight: 10,
  fontFamily: TYPOGRAPHY.mediumFontFamily,
  fontSize: 14,
  fontWeight: 500,
  color: COLORS.textPrimary,
  background: 'transparent',
  border: 'none',
  outline: 'none',
  padding: 0,
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  centerContainer: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACE.xl, overflow: 'hidden' },
  centerCard: { width: '100%', maxWidth: 430, alignItems: 'center', padding: SPACE.xl, borderRadius: RADIUS.xl, backgroundColor: COLORS.glassStrong, borderWidth: 1, borderColor: COLORS.glassBorder, shadowColor: COLORS.shadow, shadowOpacity: 0.14, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 3 },
  checkingText: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 13, color: COLORS.textSecondary, marginTop: SPACE.md },
  lockIcon: { width: 62, height: 62, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(56,225,255,0.12)', borderWidth: 1, borderColor: 'rgba(56,225,255,0.25)', marginBottom: SPACE.md },
  lockTitle: { fontFamily: TYPOGRAPHY.displayFontFamily, fontSize: 24, color: COLORS.textPrimary },
  lockSubtitle: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 21, marginTop: SPACE.sm },
  content: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 132, flexGrow: 1, width: '100%', maxWidth: 580, alignSelf: 'center' },
  teacherBanner: { minHeight: 172, padding: 18, borderRadius: 27, marginBottom: 14, overflow: 'hidden', justifyContent: 'center', backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOpacity: 0.14, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  teacherBannerCopy: { width: '73%', zIndex: 1 },
  teacherEyebrow: { fontFamily: TYPOGRAPHY.semiboldFontFamily, fontSize: 7, color: 'rgba(255,255,255,0.78)', letterSpacing: 0.8, marginBottom: 8 },
  teacherBannerTitle: { fontFamily: TYPOGRAPHY.displayFontFamily, fontSize: 23, lineHeight: 27, color: '#FFFFFF', letterSpacing: -0.35 },
  teacherBannerText: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 9, lineHeight: 13, color: 'rgba(255,255,255,0.80)', marginTop: 7, maxWidth: 205 },
  teacherBannerArt: { position: 'absolute', right: 19, top: 47, width: 71, height: 71, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.32)', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '8deg' }] },
  teacherBannerArtDot: { position: 'absolute', right: -7, top: -7, width: 25, height: 25, borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  title: { ...TYPOGRAPHY.screenTitle, fontFamily: TYPOGRAPHY.displayFontFamily, color: COLORS.textPrimary, marginBottom: 3 },
  subtitle: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, marginBottom: SPACE.lg },
  formCard: { padding: 18, borderRadius: 26, backgroundColor: COLORS.glassStrong, borderWidth: 1, borderColor: COLORS.glassBorder, shadowColor: COLORS.shadow, shadowOpacity: 0.09, shadowRadius: 18, shadowOffset: { width: 0, height: 7 }, elevation: 2 },
  formHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  formHeadingIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: COLORS.primaryTint, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  formHeadingCopy: { flex: 1 },
  formEyebrow: { fontFamily: TYPOGRAPHY.semiboldFontFamily, fontSize: 7, letterSpacing: 0.9, color: COLORS.primary },
  formTitle: { fontFamily: TYPOGRAPHY.headingFontFamily, fontSize: 17, color: COLORS.textPrimary, marginTop: 2 },
  formStep: { width: 30, height: 30, borderRadius: 11, backgroundColor: '#F1F4FC', alignItems: 'center', justifyContent: 'center' },
  formStepText: { fontFamily: TYPOGRAPHY.semiboldFontFamily, fontSize: 8, color: COLORS.textMuted },
  label: { ...TYPOGRAPHY.label, fontFamily: TYPOGRAPHY.semiboldFontFamily, color: COLORS.textMuted, marginBottom: 7, marginTop: 15 },
  input: { minHeight: 58, backgroundColor: COLORS.pearlPanel, borderRadius: 24, borderWidth: 1, borderColor: COLORS.pearlBorder, paddingHorizontal: 16, paddingVertical: 13, fontFamily: TYPOGRAPHY.fontFamily, fontSize: 14, color: COLORS.pearlText },
  pickerField: { minHeight: 58, backgroundColor: COLORS.pearlPanel, borderRadius: 24, borderWidth: 1, borderColor: COLORS.pearlBorder, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },
  pickerFieldPressed: { backgroundColor: COLORS.primaryTint, borderColor: COLORS.primarySoft },
  pickerValue: { flex: 1, fontFamily: TYPOGRAPHY.mediumFontFamily, fontSize: 13, color: COLORS.textPrimary, marginHorizontal: SPACE.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: SPACE.sm },
  chip: { minHeight: 40, backgroundColor: COLORS.primaryTint, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.glassBorder, paddingHorizontal: 13, marginRight: 7, marginBottom: 7, alignItems: 'center', justifyContent: 'center' },
  chipPressed: { backgroundColor: COLORS.violetSoft, transform: [{ scale: 0.98 }] },
  chipText: { fontFamily: TYPOGRAPHY.semiboldFontFamily, fontSize: 11, color: COLORS.textSecondary },
  hint: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 11, color: COLORS.textMuted, marginTop: 1, lineHeight: 17 },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipTextActive: { color: '#FFFFFF' },
  toggleRow: { marginTop: SPACE.md, minHeight: 68, borderRadius: 28, backgroundColor: COLORS.primaryTint, borderWidth: 1, borderColor: COLORS.glassBorder, paddingHorizontal: 16, paddingVertical: 11, flexDirection: 'row', alignItems: 'center' },
  toggleCopy: { flex: 1, paddingRight: 10 },
  toggleTitle: { fontFamily: TYPOGRAPHY.semiboldFontFamily, fontSize: 12, color: COLORS.textPrimary },
  toggleText: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 10, lineHeight: 15, color: COLORS.textSecondary, marginTop: 2 },
  toggle: { width: 48, height: 28, borderRadius: 16, backgroundColor: '#D9DEE0', padding: 3, justifyContent: 'center' },
  toggleOn: { backgroundColor: COLORS.primary, borderWidth: 1, borderColor: COLORS.primary },
  toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF' },
  toggleKnobOn: { alignSelf: 'flex-end' },
  recoveryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  recoveryCopy: { flex: 1, paddingRight: 10 },
  recoveryName: { fontFamily: TYPOGRAPHY.semiboldFontFamily, fontSize: 12, color: COLORS.textPrimary },
  recoveryEvent: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 10, color: COLORS.cyan, marginTop: 2 },
  recoveryReason: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 10, lineHeight: 15, color: COLORS.textSecondary, marginTop: 4 },
  recoveryStatus: { fontFamily: TYPOGRAPHY.semiboldFontFamily, fontSize: 8, color: COLORS.textMuted, marginTop: 5, letterSpacing: 0.7 },
  recoveryActions: { flexDirection: 'row', gap: 7 },
  rejectButton: { width: 38, height: 38, borderRadius: 14, backgroundColor: 'rgba(255,122,155,0.14)', borderWidth: 1, borderColor: 'rgba(255,122,155,0.28)', alignItems: 'center', justifyContent: 'center' },
  approveButton: { width: 38, height: 38, borderRadius: 14, backgroundColor: 'rgba(61,220,151,0.14)', borderWidth: 1, borderColor: 'rgba(61,220,151,0.28)', alignItems: 'center', justifyContent: 'center' },
  pickerContainer: { marginTop: SPACE.md, alignItems: 'center' },
  message: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 12, color: COLORS.cyan, lineHeight: 18, marginTop: SPACE.md, marginBottom: SPACE.xs },
  resultCard: { backgroundColor: COLORS.glassStrong, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.glassBorder, padding: SPACE.lg, marginTop: SPACE.lg, alignItems: 'center', shadowColor: COLORS.shadow, shadowOpacity: 0.11, shadowRadius: 18, shadowOffset: { width: 0, height: 7 }, elevation: 2 },
  resultTitle: { fontFamily: TYPOGRAPHY.headingFontFamily, fontSize: 16, color: COLORS.textPrimary, textAlign: 'center', marginBottom: SPACE.md },
  qrBox: { backgroundColor: '#FFFFFF', padding: SPACE.md, borderRadius: 32, marginBottom: SPACE.md, borderWidth: 1, borderColor: 'rgba(56,225,255,0.35)' },
  payloadText: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 10, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 15 },
  monitorChipRow: { paddingBottom: SPACE.sm, gap: 8 },
  monitorChip: { maxWidth: 190, minHeight: 40, justifyContent: 'center', paddingHorizontal: 16, borderRadius: RADIUS.pill, backgroundColor: COLORS.primaryTint, borderWidth: 1, borderColor: COLORS.glassBorder },
  monitorChipActive: { backgroundColor: COLORS.primaryTint, borderColor: COLORS.primarySoft },
  monitorChipPressed: { transform: [{ scale: 0.98 }] },
  monitorChipText: { fontFamily: TYPOGRAPHY.semiboldFontFamily, fontSize: 10, color: COLORS.textSecondary },
  monitorChipTextActive: { color: COLORS.cyan },
  eventManageRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border },
  eventManageCopy: { flex: 1, paddingRight: 10 },
  eventManageTitle: { fontFamily: TYPOGRAPHY.semiboldFontFamily, fontSize: 11, color: COLORS.textPrimary },
  eventManageMeta: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 9, color: COLORS.textSecondary, marginTop: 3 },
  deleteEventButton: { width: 38, height: 38, borderRadius: 14, backgroundColor: 'rgba(255,122,155,0.14)', borderWidth: 1, borderColor: 'rgba(255,122,155,0.28)', alignItems: 'center', justifyContent: 'center' },
  deletedHeader: { flexDirection: 'row', alignItems: 'center', marginTop: SPACE.lg, paddingTop: SPACE.md, borderTopWidth: 1, borderTopColor: COLORS.border },
  deletedTitle: { fontFamily: TYPOGRAPHY.semiboldFontFamily, fontSize: 11, color: COLORS.textPrimary, marginLeft: 7 },
  deletedEmpty: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 10, lineHeight: 16, color: COLORS.textMuted, marginTop: 7 },
  deletedRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border },
  deletedActions: { flexDirection: 'row', gap: 7 },
  restoreButton: { width: 36, height: 36, borderRadius: 13, backgroundColor: COLORS.primaryTint, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center', justifyContent: 'center' },
  permanentButton: { width: 36, height: 36, borderRadius: 13, backgroundColor: 'rgba(255,122,155,0.14)', borderWidth: 1, borderColor: 'rgba(255,122,155,0.28)', alignItems: 'center', justifyContent: 'center' },
  smartCard: { marginTop: SPACE.lg, padding: SPACE.lg, borderRadius: RADIUS.xl, backgroundColor: COLORS.glassStrong, borderWidth: 1, borderColor: COLORS.glassBorder, shadowColor: COLORS.shadow, shadowOpacity: 0.11, shadowRadius: 18, shadowOffset: { width: 0, height: 7 }, elevation: 2 },
  smartHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACE.md },
  smartIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(56,225,255,0.12)', borderWidth: 1, borderColor: 'rgba(56,225,255,0.25)', alignItems: 'center', justifyContent: 'center', marginRight: SPACE.sm },
  smartHeaderCopy: { flex: 1 },
  smartEyebrow: { ...TYPOGRAPHY.label, fontFamily: TYPOGRAPHY.semiboldFontFamily, color: COLORS.cyan },
  smartTitle: { fontFamily: TYPOGRAPHY.headingFontFamily, fontSize: 18, color: COLORS.textPrimary, marginTop: 2 },
  smartEmpty: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 12, lineHeight: 19, color: COLORS.textSecondary },
  liveEventTitle: { fontFamily: TYPOGRAPHY.headingFontFamily, fontSize: 17, color: COLORS.textPrimary },
  liveEventMeta: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 11, color: COLORS.textSecondary, marginTop: 3 },
  pulseStats: { flexDirection: 'row', gap: 10, marginTop: SPACE.md },
  pulseStat: { flex: 1, minHeight: 88, padding: 13, borderRadius: 28, backgroundColor: COLORS.cyanSoft, borderWidth: 1, borderColor: COLORS.glassBorder },
  pulseValue: { fontFamily: TYPOGRAPHY.numberFontFamily, fontSize: 23, color: COLORS.cyan, marginTop: 6 },
  pulseLabel: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 10, color: COLORS.textSecondary, marginTop: 1 },
  liveList: { marginTop: SPACE.md, borderTopWidth: 1, borderTopColor: COLORS.border },
  liveRow: { minHeight: 49, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  livePerson: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primaryTint, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  livePersonCopy: { flex: 1 },
  livePersonName: { fontFamily: TYPOGRAPHY.semiboldFontFamily, fontSize: 10, color: COLORS.textPrimary },
  livePersonTime: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 8, color: COLORS.textMuted, marginTop: 2 },
  liveStatus: { paddingHorizontal: 8, minHeight: 24, borderRadius: RADIUS.pill, backgroundColor: 'rgba(61,220,151,0.14)', borderWidth: 1, borderColor: 'rgba(61,220,151,0.28)', justifyContent: 'center' },
  liveStatusLate: { backgroundColor: 'rgba(255,194,75,0.14)', borderColor: 'rgba(255,194,75,0.28)' },
  liveStatusRecovered: { backgroundColor: COLORS.primaryTint, borderColor: COLORS.glassBorder },
  liveStatusText: { fontFamily: TYPOGRAPHY.semiboldFontFamily, fontSize: 8, color: COLORS.success },
  liveStatusLateText: { color: COLORS.warning },
  alertCard: { flexDirection: 'row', marginTop: SPACE.md, padding: 12, borderRadius: 20, backgroundColor: 'rgba(255,194,75,0.08)', borderWidth: 1, borderColor: 'rgba(255,194,75,0.28)' },
  alertCopy: { flex: 1, marginLeft: SPACE.sm },
  alertTitle: { fontFamily: TYPOGRAPHY.semiboldFontFamily, fontSize: 12, color: COLORS.textPrimary },
  alertText: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 11, lineHeight: 17, color: COLORS.textSecondary, marginTop: 2 },
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: SPACE.sm, borderTopWidth: 1, borderTopColor: COLORS.border },
  insightDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: COLORS.cyan, marginTop: 5, marginRight: SPACE.sm },
  insightDotPositive: { backgroundColor: COLORS.success },
  insightDotWarning: { backgroundColor: COLORS.warning },
  insightCopy: { flex: 1 },
  insightTitle: { fontFamily: TYPOGRAPHY.semiboldFontFamily, fontSize: 12, color: COLORS.textPrimary },
  insightText: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 11, lineHeight: 17, color: COLORS.textSecondary, marginTop: 2 },
});
