import AmbientBackground from '@/components/AmbientBackground';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { COLORS, RADIUS, SPACE } from '@/constants/colors';
import EntranceView from '@/components/EntranceView';
import { TYPOGRAPHY } from '@/constants/typography';
import { useAuth } from '@/lib/auth';
import { getAttendanceHistory, getTeacherEventAttendance, type AttendanceRecord, type TeacherEventAttendance } from '@/lib/attendance';
import { getProfile, type Role } from '@/lib/profiles';

export default function HistoryScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role | null>(null);
  const [studentRecords, setStudentRecords] = useState<AttendanceRecord[]>([]);
  const [teacherEvents, setTeacherEvents] = useState<TeacherEventAttendance[]>([]);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const profile = await getProfile(user.id);
    const currentRole = profile?.role ?? 'student';
    setRole(currentRole);
    if (currentRole === 'teacher') {
      setTeacherEvents(await getTeacherEventAttendance(user.id));
      setStudentRecords([]);
    } else {
      setStudentRecords(await getAttendanceHistory(user.id));
      setTeacherEvents([]);
    }
    setLoading(false);
  }, [user]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  return (
    <View style={styles.container}>
      <AmbientBackground graphicSide="left" />
      <View style={styles.content}>
        <View style={styles.pageHeader}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>{role === 'teacher' ? 'TEACHER VIEW' : 'MY ACTIVITY'}</Text>
            <Text style={styles.title}>Attendance history</Text>
          </View>
          {role === 'student' ? (
            <Pressable style={styles.headerIcon} onPress={() => router.push('/recovery')} accessibilityRole="button">
              <Ionicons name="document-text-outline" size={20} color={COLORS.champagne} />
            </Pressable>
          ) : (
            <View style={styles.headerIcon}><Ionicons name="time-outline" size={21} color={COLORS.champagne} /></View>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingState}><ActivityIndicator size="small" color={COLORS.primary} /><Text style={styles.loadingText}>Loading your records...</Text></View>
        ) : role === 'teacher' ? (
          teacherEvents.length === 0 ? <EmptyState icon="calendar-outline">No events yet. Create an event from the Teacher tab.</EmptyState> : (
            <FlatList
              data={teacherEvents}
              keyExtractor={(item) => item.eventId}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <EntranceView delay={Math.min(index * 55, 330)}>
                  <View style={styles.card}>
                    <View style={styles.cardTop}>
                      <View style={styles.eventIcon}><Ionicons name="calendar-outline" size={19} color={COLORS.champagne} /></View>
                      <View style={styles.eventCopy}><Text style={styles.eventTitle}>{item.title}</Text><Text style={styles.meta}>{item.eventCode}</Text></View>
                      <View style={styles.countBadge}><Text style={styles.countText}>{item.attendeeCount}</Text><Text style={styles.countLabel}>scans</Text></View>
                    </View>
                    {item.startTime && <Text style={styles.date}>{formatDate(item.startTime)}</Text>}
                    {item.attendees.length === 0 ? <Text style={styles.emptyInline}>No attendees yet.</Text> : (
                      <View style={styles.attendeeList}>
                        {item.attendees.map((attendee) => (
                          <View key={attendee.studentId} style={styles.attendeeRow}>
                            <View style={styles.personDot}><Ionicons name="person" size={12} color={COLORS.champagneDeep} /></View>
                            <Text style={styles.attendeeName}>{attendee.studentName || shortId(attendee.studentId)}</Text>
                            <Text style={styles.attendeeTime}>{formatDate(attendee.scannedAt)}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </EntranceView>
              )}
            />
          )
        ) : (
          studentRecords.length === 0 ? <EmptyState icon="scan-outline">No attendance yet. Your completed QR check-ins will appear here.</EmptyState> : (
            <FlatList
              data={studentRecords}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <EntranceView delay={Math.min(index * 55, 330)}>
                  <View style={styles.card}>
                    <View style={styles.cardTop}>
                      <View style={[styles.eventIcon, item.status === 'late' ? styles.lateIcon : item.status === 'recovered' ? styles.recoveredIcon : styles.successIcon]}><Ionicons name={item.status === 'late' ? 'time' : item.status === 'recovered' ? 'refresh' : 'checkmark'} size={19} color={item.status === 'late' ? COLORS.warning : item.status === 'recovered' ? COLORS.primary : COLORS.success} /></View>
                      <View style={styles.eventCopy}><Text style={styles.eventTitle}>{item.eventTitle}</Text><Text style={styles.meta}>{item.eventId}</Text></View>
                      <View style={[styles.presentBadge, item.status === 'late' && styles.lateBadge, item.status === 'recovered' && styles.recoveredBadge]}><Text style={[styles.presentText, item.status === 'late' && styles.lateText, item.status === 'recovered' && styles.recoveredText]}>{item.status === 'late' ? 'Late' : item.status === 'recovered' ? 'Recovered' : 'Present'}</Text></View>
                    </View>
                    <Text style={styles.date}>{formatDate(item.scannedAt)}</Text>
                    {item.lateReason && <Text style={styles.reason}>Reason: {item.lateReason}</Text>}
                  </View>
                </EntranceView>
              )}
            />
          )
        )}
      </View>
    </View>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString();
}
function shortId(value: string | null | undefined) { if (!value) return 'Unknown student'; return value.length <= 12 ? value : `${value.slice(0, 6)}...${value.slice(-4)}`; }
function EmptyState({ children, icon }: { children: string; icon: keyof typeof Ionicons.glyphMap }) {
  return <View style={styles.emptyState}><View style={styles.emptyIcon}><Ionicons name={icon} size={23} color={COLORS.primary} /></View><Text style={styles.emptyTitle}>Nothing here yet</Text><Text style={styles.emptyText}>{children}</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, paddingHorizontal: SPACE.lg, paddingTop: SPACE.lg },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACE.lg },
  eyebrow: { ...TYPOGRAPHY.label, fontFamily: TYPOGRAPHY.semiboldFontFamily, color: COLORS.champagne },
  headerCopy: { flex: 1 },
  title: { ...TYPOGRAPHY.screenTitle, fontFamily: TYPOGRAPHY.displayFontFamily, color: COLORS.textPrimary, marginTop: 3 },
  headerIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.glassStrong, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.champagneBorder },
  loadingState: { alignItems: 'center', paddingVertical: SPACE.section },
  loadingText: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 13, color: COLORS.textSecondary, marginTop: SPACE.sm },
  list: { paddingBottom: 116, flexGrow: 1 },
  card: { backgroundColor: COLORS.glassStrong, borderRadius: RADIUS.xl, padding: SPACE.lg, marginBottom: SPACE.md, borderWidth: 1, borderColor: COLORS.glassBorder, shadowColor: '#02040F', shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  eventIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(217,185,138,0.12)', borderWidth: 1, borderColor: COLORS.champagneBorder, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  successIcon: { backgroundColor: 'rgba(61,220,151,0.14)' },
  lateIcon: { backgroundColor: 'rgba(255,194,75,0.14)' },
  recoveredIcon: { backgroundColor: COLORS.primaryTint },
  eventCopy: { flex: 1 },
  eventTitle: { fontFamily: TYPOGRAPHY.headingFontFamily, fontSize: 16, color: COLORS.textPrimary },
  meta: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 11, color: COLORS.textSecondary, marginTop: 3 },
  countBadge: { minWidth: 58, height: 48, borderRadius: 24, backgroundColor: COLORS.champagneSoft, borderWidth: 1, borderColor: COLORS.champagneBorder, alignItems: 'center', justifyContent: 'center' },
  countText: { fontFamily: TYPOGRAPHY.numberFontFamily, fontSize: 16, color: COLORS.champagne },
  countLabel: { fontFamily: TYPOGRAPHY.semiboldFontFamily, fontSize: 8, color: COLORS.textSecondary },
  presentBadge: { paddingHorizontal: 9, height: 28, borderRadius: RADIUS.pill, backgroundColor: 'rgba(61,220,151,0.14)', borderWidth: 1, borderColor: 'rgba(61,220,151,0.28)', alignItems: 'center', justifyContent: 'center' },
  presentText: { fontFamily: TYPOGRAPHY.semiboldFontFamily, fontSize: 9, color: COLORS.success },
  lateBadge: { backgroundColor: 'rgba(255,194,75,0.14)', borderColor: 'rgba(255,194,75,0.28)' },
  recoveredBadge: { backgroundColor: COLORS.primaryTint, borderColor: COLORS.glassBorder },
  lateText: { color: COLORS.warning },
  recoveredText: { color: COLORS.primarySoft },
  date: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 11, color: COLORS.textSecondary, marginTop: 12 },
  reason: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 10, color: COLORS.textMuted, marginTop: 5 },
  attendeeList: { marginTop: 13, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 5 },
  attendeeRow: { minHeight: 39, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(127,143,255,0.10)' },
  personDot: { width: 27, height: 27, borderRadius: 10, backgroundColor: COLORS.primaryTint, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  attendeeName: { flex: 1, fontFamily: TYPOGRAPHY.semiboldFontFamily, fontSize: 11, color: COLORS.textPrimary },
  attendeeTime: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 9, color: COLORS.textMuted },
  emptyInline: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 12, color: COLORS.textSecondary, marginTop: 13 },
  emptyState: { backgroundColor: COLORS.glassStrong, borderRadius: RADIUS.xl, padding: SPACE.xl, alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder, marginTop: SPACE.sm },
  emptyIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#1B2148', borderWidth: 1, borderColor: COLORS.champagneBorder, alignItems: 'center', justifyContent: 'center', marginBottom: SPACE.md },
  emptyTitle: { fontFamily: TYPOGRAPHY.headingFontFamily, fontSize: 17, color: COLORS.textPrimary },
  emptyText: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 13, lineHeight: 20, color: COLORS.textSecondary, textAlign: 'center', marginTop: 6 },
});
