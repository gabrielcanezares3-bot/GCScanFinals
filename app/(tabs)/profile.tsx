import AmbientBackground from '@/components/AmbientBackground';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import AppButton from '@/components/AppButton';
import EntranceView from '@/components/EntranceView';
import { COLORS, RADIUS, SPACE } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';
import { useAuth, signOut } from '@/lib/auth';
import { getProfile, updateProfile, type Profile } from '@/lib/profiles';
import { getStudentAttendanceInsights, getTeacherProfileOverview, type StudentAttendanceInsights, type TeacherProfileOverview } from '@/lib/attendance';

export default function ProfileScreen() {
  const { user, session } = useAuth();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draftName, setDraftName] = useState('');
  const [studentInsights, setStudentInsights] = useState<StudentAttendanceInsights | null>(null);
  const [teacherOverview, setTeacherOverview] = useState<TeacherProfileOverview | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const router = useRouter();
  const avatarGlow = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  const avatarGlowStyle = useAnimatedStyle(() => ({
    opacity: 0.24 + avatarGlow.value * 0.34,
    transform: [{ scale: 0.96 + avatarGlow.value * 0.08 }],
  }));

  useEffect(() => { if (!session) router.replace('/login'); }, [session]);

  useEffect(() => {
    if (reduceMotion) {
      avatarGlow.value = 0;
      return;
    }
    avatarGlow.value = withRepeat(withTiming(1, { duration: 2400 }), -1, true);
    return () => { avatarGlow.value = withTiming(0, { duration: 0 }); };
  }, [avatarGlow, reduceMotion]);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setLoadError(null);
    try {
      const currentProfile = await getProfile(user.id);
      if (!currentProfile) throw new Error('Your profile could not be loaded. Please try again.');
      setProfile(currentProfile);
      setDraftName(currentProfile.full_name ?? '');
      if (currentProfile.role === 'student') {
        setStudentInsights(await getStudentAttendanceInsights(user.id));
        setTeacherOverview(null);
      } else {
        setTeacherOverview(await getTeacherProfileOverview(user.id));
        setStudentInsights(null);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Your profile could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { loadProfile(); }, [loadProfile]));

  const handleSaveName = async () => {
    if (!user) return;
    const name = draftName.trim();
    if (!name) {
      setActionMessage({ text: 'Your name cannot be empty.', isError: true });
      return;
    }
    if (name.length > 80) {
      setActionMessage({ text: 'Your name must be 80 characters or fewer.', isError: true });
      return;
    }
    setSaving(true);
    setActionMessage(null);
    try {
      const { error } = await updateProfile(user.id, { full_name: name });
      if (error) throw new Error(error);
      setProfile((prev) => prev ? { ...prev, full_name: name } : prev);
      setDraftName(name);
      setEditing(false);
      setActionMessage({ text: 'Your profile name has been updated.', isError: false });
    } catch (error) {
      setActionMessage({ text: error instanceof Error ? error.message : 'Your profile could not be saved.', isError: true });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      setActionMessage({ text: error instanceof Error ? error.message : 'Failed to sign out.', isError: true });
      setSigningOut(false);
    }
  };

  const handleCopyId = async () => {
    if (!profile?.id) return;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(profile.id);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 1800);
      } else {
        await Share.share({ message: profile.id, title: 'SYNCRA account ID' });
      }
    } catch (error) {
      setActionMessage({ text: error instanceof Error ? error.message : 'The account ID could not be copied.', isError: true });
    }
  };

  return (
    <View style={styles.container}>
      <AmbientBackground graphicSide="right" />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, SPACE.lg), paddingBottom: Math.max(insets.bottom, 16) + 112 }]} showsVerticalScrollIndicator={false}>
        <EntranceView>
        <View style={styles.pageHeader}>
          <View><Text style={styles.eyebrow}>{profile?.role === 'teacher' ? 'TEACHER ACCOUNT' : 'STUDENT ACCOUNT'}</Text><Text style={styles.title}>My profile</Text></View>
          <View style={styles.headerIcon}><Ionicons name={profile?.role === 'teacher' ? 'school-outline' : 'person-outline'} size={21} color={COLORS.primary} /></View>
        </View>
        </EntranceView>

        {loading && !profile ? (
          <View style={styles.loadingState}><ActivityIndicator size="small" color={COLORS.primary} /><Text style={styles.subtitle}>Loading your account...</Text></View>
        ) : loadError && !profile ? (
          <View style={styles.messageCard}>
            <Ionicons name="alert-circle-outline" size={22} color={COLORS.danger} />
            <Text style={styles.messageText}>{loadError}</Text>
            <Pressable accessibilityRole="button" onPress={loadProfile} style={styles.retryButton}><Text style={styles.retryText}>Try again</Text></Pressable>
          </View>
        ) : (
          <EntranceView delay={100}>
          <View style={styles.identityCard}>
            <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
              <Defs><LinearGradient id="profileCover" x1="0" y1="0" x2="1" y2="1"><Stop offset="0%" stopColor="#315FE8" /><Stop offset="100%" stopColor="#7268D6" /></LinearGradient></Defs>
              <Rect width="100%" height="100%" rx="28" fill="url(#profileCover)" />
              <Circle cx="100%" cy="0%" r="100" fill="#FFFFFF" fillOpacity="0.10" />
              <Circle cx="5%" cy="120%" r="87" fill="#A7DFF0" fillOpacity="0.14" />
            </Svg>
            <View style={styles.identityTop}>
              <Text style={styles.identityEyebrow}>SYNCRA IDENTITY</Text>
              <View style={styles.identityMark}><Ionicons name="scan-outline" size={16} color="#FFFFFF" /></View>
            </View>
            <View style={styles.profileHero}>
              <View style={styles.avatar}>
                <Animated.View pointerEvents="none" style={[styles.avatarGlow, avatarGlowStyle]} />
                <Text style={styles.avatarText}>{initials(profile?.full_name, profile?.email)}</Text>
              </View>
              <View style={styles.profileCopy}><Text style={styles.name}>{profile?.full_name || 'Your profile'}</Text><Text style={styles.email}>{profile?.email || user?.email || 'Email unavailable'}</Text></View>
            </View>
            <View style={styles.identityBottom}>
              <View style={styles.rolePill}><View style={styles.roleDot} /><Text style={styles.roleText}>{profile?.role === 'teacher' ? 'TEACHER' : 'STUDENT'}</Text></View>
              <Text style={styles.identityFooter}>{profile?.role === 'teacher' ? 'TEACHER ACCOUNT' : 'STUDENT ACCESS PASS'}</Text>
            </View>
            {profile?.role === 'student' && (
              <View style={styles.studentIdRow}>
                <View><Text style={styles.identityFooter}>STUDENT ID</Text><Text selectable style={styles.studentId}>{profile.id}</Text></View>
                <Pressable accessibilityRole="button" accessibilityLabel={copiedId ? 'ID copied' : Platform.OS === 'web' ? 'Copy student ID' : 'Share student ID'} onPress={handleCopyId} style={({ pressed }) => [styles.copyButton, pressed && styles.pressed]}>
                  <Ionicons name={copiedId ? 'checkmark' : Platform.OS === 'web' ? 'copy-outline' : 'share-outline'} size={15} color="#FFFFFF" />
                  <Text style={styles.copyButtonText}>{copiedId ? 'Copied' : Platform.OS === 'web' ? 'Copy ID' : 'Share ID'}</Text>
                </Pressable>
              </View>
            )}
          </View>

          {loadError && <View style={styles.messageCard}><Ionicons name="alert-circle-outline" size={18} color={COLORS.danger} /><Text style={styles.messageText}>{loadError}</Text><Pressable accessibilityRole="button" onPress={loadProfile} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable></View>}
          {profile?.role === 'student' && studentInsights && <StudentInsightsCard insights={studentInsights} />}
          {profile?.role === 'teacher' && teacherOverview && <TeacherOverviewCard overview={teacherOverview} />}

          <View style={styles.accountCard}>
            <View style={styles.accountHeading}><View><Text style={styles.accountEyebrow}>ACCOUNT CENTER</Text><Text style={styles.accountTitle}>Your information</Text></View><Ionicons name="options-outline" size={18} color={COLORS.primary} /></View>
            <View style={styles.divider} />

            <Text style={styles.label}>DISPLAY NAME</Text>
            {editing ? (
              <View style={styles.editRow}>
                <TextInput style={styles.input} value={draftName} onChangeText={setDraftName} placeholder="Your name" placeholderTextColor={COLORS.textSecondary} maxLength={80} editable={!saving} autoFocus />
                <Pressable accessibilityRole="button" style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]} onPress={handleSaveName} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="checkmark" size={20} color="#FFFFFF" />}
                </Pressable>
              </View>
            ) : (
              <Pressable accessibilityRole="button" onPress={() => { setActionMessage(null); setEditing(true); }} style={({ pressed }) => [styles.nameRow, pressed && styles.pressed]}>
                <Text style={styles.value}>{profile?.full_name || 'Tap to add your name'}</Text>
                <View style={styles.editIcon}><Ionicons name="create-outline" size={17} color={COLORS.champagne} /></View>
              </Pressable>
            )}

            <Text style={styles.label}>EMAIL</Text>
            <View style={styles.readonlyRow}><Ionicons name="mail-outline" size={17} color={COLORS.textMuted} /><Text style={styles.value}>{profile?.email || user?.email || 'Email unavailable'}</Text></View>

            <Text style={styles.label}>ROLE</Text>
            <View style={styles.readonlyRow}><Ionicons name={profile?.role === 'teacher' ? 'school-outline' : 'person-outline'} size={17} color={COLORS.textMuted} /><Text style={styles.value}>{profile?.role === 'teacher' ? 'Teacher' : 'Student'}</Text></View>
            {profile?.role === 'teacher' && <><Text style={styles.label}>ACCOUNT ID</Text><View style={styles.readonlyRow}><Ionicons name="finger-print-outline" size={17} color={COLORS.textMuted} /><Text selectable style={styles.valueSmall}>{profile.id}</Text></View></>}
            {actionMessage && <View style={[styles.actionMessage, actionMessage.isError && styles.actionMessageError]}><Ionicons name={actionMessage.isError ? 'alert-circle-outline' : 'checkmark-circle-outline'} size={17} color={actionMessage.isError ? COLORS.danger : COLORS.success} /><Text style={[styles.actionMessageText, actionMessage.isError && styles.actionMessageErrorText]}>{actionMessage.text}</Text></View>}
          </View>
          </EntranceView>
        )}

        {profile && <EntranceView delay={180}>
        <View style={styles.signOutSection}>
          <View style={styles.securityNote}><Ionicons name="shield-checkmark-outline" size={17} color={COLORS.primary} /><Text style={styles.securityText}>Your account is protected by your SYNCRA sign-in.</Text></View>
          <AppButton title={signingOut ? 'Signing Out...' : 'Sign Out'} icon="log-out-outline" onPress={handleSignOut} disabled={signingOut} />
        </View>
        </EntranceView>}
      </ScrollView>
    </View>
  );
}

function initials(name: string | null | undefined, email: string | null | undefined) {
  const words = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (words.length > 1) return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  return (words[0]?.[0] ?? email?.[0] ?? '?').toUpperCase();
}

function StudentInsightsCard({ insights }: { insights: StudentAttendanceInsights }) {
  const maxMonthly = Math.max(...insights.monthlyActivity.map((month) => month.count), 1);
  const milestones = [
    { count: 1, title: 'First check-in', icon: 'sparkles-outline' as const },
    { count: 5, title: 'Five check-ins', icon: 'ribbon-outline' as const },
    { count: 10, title: 'Ten check-ins', icon: 'trophy-outline' as const },
  ];

  return (
    <>
      <View style={styles.insightCard}>
        <View style={styles.sectionHeading}>
          <View><Text style={styles.sectionEyebrow}>ATTENDANCE INSIGHTS</Text><Text style={styles.sectionTitle}>Your activity</Text></View>
          <Ionicons name="analytics-outline" size={20} color={COLORS.primary} />
        </View>
        <View style={styles.statsRow}>
          <StatTile label="Total" count={insights.total} icon="scan-outline" />
          <StatTile label="Present" count={insights.present} icon="checkmark-circle-outline" />
          <StatTile label="Late" count={insights.late} icon="time-outline" />
        </View>
        {insights.recovered > 0 && <View style={styles.recoveredSummary}><Ionicons name="refresh-outline" size={15} color={COLORS.primary} /><Text style={styles.recoveredSummaryText}>{insights.recovered} recovered check-in{insights.recovered === 1 ? '' : 's'}</Text></View>}
        <View style={styles.chartHeading}><Text style={styles.chartTitle}>Monthly activity</Text><Text style={styles.chartRange}>LAST 6 MONTHS</Text></View>
        <View style={styles.chart}>
          {insights.monthlyActivity.map((month) => (
            <View key={month.key} style={styles.chartColumn}>
              <Text style={styles.chartCount}>{month.count || ''}</Text>
              <View style={styles.chartTrack}><View style={[styles.chartBar, { height: month.count === 0 ? 4 : Math.max(9, (month.count / maxMonthly) * 57) }]} /></View>
              <Text style={styles.chartLabel}>{month.label}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.milestoneCard}>
        <View style={styles.sectionHeading}>
          <View><Text style={styles.sectionEyebrow}>MILESTONES</Text><Text style={styles.sectionTitle}>Showing up adds up</Text></View>
          <Ionicons name="ribbon-outline" size={20} color={COLORS.primary} />
        </View>
        {milestones.map((milestone) => {
          const unlocked = insights.total >= milestone.count;
          return (
            <View key={milestone.count} style={styles.milestoneRow}>
              <View style={[styles.milestoneIcon, unlocked && styles.milestoneIconActive]}><Ionicons name={milestone.icon} size={17} color={unlocked ? COLORS.primary : COLORS.textMuted} /></View>
              <Text style={[styles.milestoneTitle, !unlocked && styles.milestoneTitleLocked]}>{milestone.title}</Text>
              <Ionicons name={unlocked ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={unlocked ? COLORS.success : COLORS.textMuted} />
            </View>
          );
        })}
      </View>
    </>
  );
}

function StatTile({ label, count, icon }: { label: string; count: number; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.statTile}>
      <Ionicons name={icon} size={16} color={COLORS.primary} />
      <Text style={styles.statCount}>{count}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function TeacherOverviewCard({ overview }: { overview: TeacherProfileOverview }) {
  return (
    <View style={styles.insightCard}>
      <View style={styles.sectionHeading}>
        <View><Text style={styles.sectionEyebrow}>TEACHING OVERVIEW</Text><Text style={styles.sectionTitle}>Your active events</Text></View>
        <Ionicons name="school-outline" size={20} color={COLORS.primary} />
      </View>
      <View style={styles.teacherStats}>
        <View style={styles.teacherStat}><Text style={styles.teacherStatCount}>{overview.eventCount}</Text><Text style={styles.teacherStatLabel}>active events</Text></View>
        <View style={styles.teacherStatDivider} />
        <View style={styles.teacherStat}><Text style={styles.teacherStatCount}>{overview.scanCount}</Text><Text style={styles.teacherStatLabel}>total check-ins</Text></View>
      </View>
      {overview.events.length === 0 ? (
        <View style={styles.teacherEmpty}><Ionicons name="calendar-outline" size={18} color={COLORS.textMuted} /><Text style={styles.teacherEmptyText}>No active events yet. Events you create will appear here.</Text></View>
      ) : (
        <View style={styles.teacherEventList}>
          {overview.events.slice(0, 3).map((event) => (
            <View key={event.eventId} style={styles.teacherEventRow}>
              <View style={styles.teacherEventIcon}><Ionicons name="calendar-outline" size={15} color={COLORS.primary} /></View>
              <View style={styles.teacherEventCopy}><Text numberOfLines={1} style={styles.teacherEventTitle}>{event.title}</Text><Text style={styles.teacherEventCode}>{event.eventCode}</Text></View>
              <View style={styles.teacherEventCount}><Text style={styles.teacherEventCountText}>{event.attendeeCount}</Text><Text style={styles.teacherEventCountLabel}>scans</Text></View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flexGrow: 1, paddingHorizontal: SPACE.lg, paddingTop: SPACE.lg, paddingBottom: 136, width: '100%', maxWidth: 580, alignSelf: 'center' },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACE.lg },
  eyebrow: { ...TYPOGRAPHY.label, fontFamily: TYPOGRAPHY.semiboldFontFamily, color: COLORS.champagne },
  title: { ...TYPOGRAPHY.screenTitle, fontFamily: TYPOGRAPHY.displayFontFamily, color: COLORS.textPrimary, marginTop: 3 },
  headerIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.glassStrong, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.champagneBorder },
  loadingState: { alignItems: 'center', paddingVertical: SPACE.section },
  subtitle: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 13, color: COLORS.textSecondary, marginTop: SPACE.sm },
  identityCard: { backgroundColor: COLORS.primary, borderRadius: 28, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.72)', overflow: 'hidden', shadowColor: COLORS.primary, shadowOpacity: 0.15, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  identityTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 17 },
  identityEyebrow: { fontFamily: TYPOGRAPHY.semiboldFontFamily, fontSize: 8, letterSpacing: 1, color: 'rgba(255,255,255,0.78)' },
  identityMark: { width: 31, height: 31, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)', alignItems: 'center', justifyContent: 'center' },
  identityBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15, paddingTop: 13, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.20)' },
  identityFooter: { fontFamily: TYPOGRAPHY.semiboldFontFamily, fontSize: 7, color: 'rgba(255,255,255,0.72)', letterSpacing: 0.9 },
  accountCard: { marginTop: 13, backgroundColor: COLORS.glassStrong, borderRadius: 26, padding: SPACE.lg, borderWidth: 1, borderColor: COLORS.glassBorder, shadowColor: COLORS.shadow, shadowOpacity: 0.10, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  accountHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  accountEyebrow: { fontFamily: TYPOGRAPHY.semiboldFontFamily, fontSize: 8, letterSpacing: 0.9, color: COLORS.primary },
  accountTitle: { fontFamily: TYPOGRAPHY.headingFontFamily, fontSize: 16, color: COLORS.textPrimary, marginTop: 2 },
  profileHero: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 64, height: 64, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.17)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.75)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarGlow: { ...StyleSheet.absoluteFillObject, borderRadius: 23, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.56)', backgroundColor: 'transparent' },
  avatarText: { fontFamily: TYPOGRAPHY.numberFontFamily, fontSize: 25, color: '#FFFFFF' },
  profileCopy: { flex: 1 },
  name: { fontFamily: TYPOGRAPHY.headingFontFamily, fontSize: 17, color: '#FFFFFF' },
  email: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 10, color: 'rgba(255,255,255,0.80)', marginTop: 4 },
  rolePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, height: 24, borderRadius: RADIUS.pill, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.26)' },
  roleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#7AE0C6', marginRight: 5 },
  roleText: { fontFamily: TYPOGRAPHY.semiboldFontFamily, fontSize: 8, letterSpacing: 0.7, color: '#FFFFFF' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACE.lg },
  label: { ...TYPOGRAPHY.label, fontFamily: TYPOGRAPHY.semiboldFontFamily, color: COLORS.textMuted, marginBottom: 7, marginTop: SPACE.md },
  nameRow: { minHeight: 58, borderRadius: 24, backgroundColor: COLORS.pearl, borderWidth: 1, borderColor: COLORS.pearlBorder, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  value: { flex: 1, fontFamily: TYPOGRAPHY.mediumFontFamily, fontSize: 14, color: COLORS.textPrimary },
  editIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.champagneSoft, borderWidth: 1, borderColor: COLORS.champagneBorder, alignItems: 'center', justifyContent: 'center' },
  editRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, minHeight: 54, borderRadius: 19, backgroundColor: COLORS.pearlPanel, borderWidth: 1, borderColor: COLORS.pearlBorder, paddingHorizontal: 13, fontFamily: TYPOGRAPHY.fontFamily, fontSize: 14, color: COLORS.pearlText },
  saveButton: { marginLeft: 8, width: 54, height: 54, borderRadius: 19, backgroundColor: COLORS.primary, borderWidth: 1, borderColor: COLORS.champagneBorder, alignItems: 'center', justifyContent: 'center' },
  readonlyRow: { minHeight: 58, borderRadius: 24, backgroundColor: COLORS.pearl, borderWidth: 1, borderColor: COLORS.pearlBorder, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  valueSmall: { flex: 1, fontFamily: TYPOGRAPHY.fontFamily, fontSize: 9, lineHeight: 14, color: COLORS.textSecondary },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  studentIdRow: { marginTop: 15, paddingTop: 13, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.20)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  studentId: { fontFamily: TYPOGRAPHY.mediumFontFamily, fontSize: 10, color: '#FFFFFF', marginTop: 4 },
  copyButton: { minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 10, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.30)' },
  copyButtonText: { fontFamily: TYPOGRAPHY.semiboldFontFamily, fontSize: 9, color: '#FFFFFF' },
  insightCard: { marginTop: 15, padding: SPACE.lg, borderRadius: 26, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: COLORS.glassBorder, shadowColor: COLORS.shadow, shadowOpacity: 0.09, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  milestoneCard: { marginTop: 13, padding: SPACE.lg, borderRadius: 26, backgroundColor: COLORS.glassStrong, borderWidth: 1, borderColor: COLORS.glassBorder },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionEyebrow: { fontFamily: TYPOGRAPHY.semiboldFontFamily, fontSize: 8, letterSpacing: 0.9, color: COLORS.primary },
  sectionTitle: { fontFamily: TYPOGRAPHY.headingFontFamily, fontSize: 16, color: COLORS.textPrimary, marginTop: 3 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  statTile: { flex: 1, minHeight: 86, paddingVertical: 11, borderRadius: 18, backgroundColor: COLORS.primaryTint, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.glassBorder },
  statCount: { fontFamily: TYPOGRAPHY.numberFontFamily, fontSize: 20, color: COLORS.textPrimary, marginTop: 4 },
  statLabel: { fontFamily: TYPOGRAPHY.mediumFontFamily, fontSize: 9, color: COLORS.textSecondary, marginTop: 1 },
  recoveredSummary: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 11, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 13, backgroundColor: COLORS.primaryTint },
  recoveredSummaryText: { fontFamily: TYPOGRAPHY.mediumFontFamily, fontSize: 10, color: COLORS.primary },
  chartHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 6 },
  chartTitle: { fontFamily: TYPOGRAPHY.semiboldFontFamily, fontSize: 11, color: COLORS.textPrimary },
  chartRange: { fontFamily: TYPOGRAPHY.semiboldFontFamily, fontSize: 7, letterSpacing: 0.7, color: COLORS.textMuted },
  chart: { height: 94, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingTop: 8 },
  chartColumn: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  chartCount: { height: 13, fontFamily: TYPOGRAPHY.mediumFontFamily, fontSize: 8, color: COLORS.textSecondary },
  chartTrack: { height: 59, width: 19, borderRadius: 10, backgroundColor: '#EDF1FA', justifyContent: 'flex-end', overflow: 'hidden' },
  chartBar: { width: '100%', borderRadius: 10, backgroundColor: COLORS.primary },
  chartLabel: { fontFamily: TYPOGRAPHY.mediumFontFamily, fontSize: 8, color: COLORS.textMuted, marginTop: 5 },
  milestoneRow: { minHeight: 47, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 5, paddingTop: 5 },
  milestoneIcon: { width: 32, height: 32, borderRadius: 12, backgroundColor: '#F0F2F8', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  milestoneIconActive: { backgroundColor: COLORS.primaryTint },
  milestoneTitle: { flex: 1, fontFamily: TYPOGRAPHY.semiboldFontFamily, fontSize: 11, color: COLORS.textPrimary },
  milestoneTitleLocked: { color: COLORS.textMuted },
  teacherStats: { flexDirection: 'row', alignItems: 'center', marginTop: 15, minHeight: 72, borderRadius: 19, backgroundColor: COLORS.primaryTint, borderWidth: 1, borderColor: COLORS.glassBorder },
  teacherStat: { flex: 1, alignItems: 'center' },
  teacherStatCount: { fontFamily: TYPOGRAPHY.numberFontFamily, fontSize: 22, color: COLORS.textPrimary },
  teacherStatLabel: { fontFamily: TYPOGRAPHY.mediumFontFamily, fontSize: 9, color: COLORS.textSecondary, marginTop: 2 },
  teacherStatDivider: { height: 38, width: 1, backgroundColor: COLORS.glassBorder },
  teacherEventList: { marginTop: 12 },
  teacherEventRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border },
  teacherEventIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: COLORS.primaryTint, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  teacherEventCopy: { flex: 1, paddingRight: 8 },
  teacherEventTitle: { fontFamily: TYPOGRAPHY.semiboldFontFamily, fontSize: 11, color: COLORS.textPrimary },
  teacherEventCode: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 9, color: COLORS.textMuted, marginTop: 3 },
  teacherEventCount: { minWidth: 47, alignItems: 'center' },
  teacherEventCountText: { fontFamily: TYPOGRAPHY.numberFontFamily, fontSize: 14, color: COLORS.primary },
  teacherEventCountLabel: { fontFamily: TYPOGRAPHY.mediumFontFamily, fontSize: 7, color: COLORS.textMuted },
  teacherEmpty: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 12, padding: 12, borderRadius: 15, backgroundColor: '#F6F8FD' },
  teacherEmptyText: { flex: 1, fontFamily: TYPOGRAPHY.fontFamily, fontSize: 10, lineHeight: 15, color: COLORS.textSecondary },
  messageCard: { marginTop: 12, padding: 15, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center', gap: 8 },
  messageText: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 12, lineHeight: 18, textAlign: 'center', color: COLORS.textSecondary },
  retryButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, backgroundColor: COLORS.primaryTint },
  retryText: { fontFamily: TYPOGRAPHY.semiboldFontFamily, fontSize: 11, color: COLORS.primary },
  actionMessage: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 13, padding: 11, borderRadius: 14, backgroundColor: 'rgba(61,180,138,0.10)' },
  actionMessageError: { backgroundColor: 'rgba(201,79,101,0.10)' },
  actionMessageText: { flex: 1, fontFamily: TYPOGRAPHY.fontFamily, fontSize: 11, lineHeight: 16, color: COLORS.success },
  actionMessageErrorText: { color: COLORS.danger },
  securityNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 13, paddingHorizontal: 10 },
  securityText: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 10, color: COLORS.textSecondary },
  signOutSection: { marginTop: SPACE.lg },
});
