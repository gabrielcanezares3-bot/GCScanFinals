import AmbientBackground from '@/components/AmbientBackground';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import AppButton from '@/components/AppButton';
import { COLORS, RADIUS, SPACE } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';
import { useAuth, signOut } from '@/lib/auth';
import { getProfile, updateProfile, type Profile } from '@/lib/profiles';

export default function ProfileScreen() {
  const { user, session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draftName, setDraftName] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => { if (!session) router.replace('/login'); }, [session]);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    const p = await getProfile(user.id);
    setProfile(p); setDraftName(p?.full_name ?? '');
  }, [user]);

  useFocusEffect(useCallback(() => { loadProfile(); }, [loadProfile]));

  const handleSaveName = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await updateProfile(user.id, { full_name: draftName.trim() });
    setSaving(false);
    if (error) Alert.alert('Error', error);
    else { setProfile((prev) => prev ? { ...prev, full_name: draftName.trim() } : prev); setEditing(false); }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try { await signOut(); } catch (err: any) { Alert.alert('Error', err?.message || 'Failed to sign out.'); } finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <View style={styles.content}>
        <View style={styles.pageHeader}>
          <View><Text style={styles.eyebrow}>ACCOUNT</Text><Text style={styles.title}>My profile</Text></View>
          <View style={styles.headerIcon}><Ionicons name="person-outline" size={21} color={COLORS.champagne} /></View>
        </View>

        {!profile ? (
          <View style={styles.loadingState}><ActivityIndicator size="small" color={COLORS.primary} /><Text style={styles.subtitle}>Loading profile...</Text></View>
        ) : (
          <View style={styles.profileCard}>
            <View style={styles.profileHero}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{(profile.full_name || profile.email || '?').slice(0, 1).toUpperCase()}</Text></View>
              <View style={styles.profileCopy}><Text style={styles.name}>{profile.full_name || 'Your profile'}</Text><Text style={styles.email}>{profile.email}</Text></View>
              <View style={styles.rolePill}><View style={styles.roleDot} /><Text style={styles.roleText}>{profile.role === 'teacher' ? 'TEACHER' : 'STUDENT'}</Text></View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.label}>DISPLAY NAME</Text>
            {editing ? (
              <View style={styles.editRow}>
                <TextInput style={styles.input} value={draftName} onChangeText={setDraftName} placeholder="Your name" placeholderTextColor={COLORS.textSecondary} autoFocus />
                <Pressable accessibilityRole="button" style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]} onPress={handleSaveName} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="checkmark" size={20} color="#FFFFFF" />}
                </Pressable>
              </View>
            ) : (
              <Pressable accessibilityRole="button" onPress={() => setEditing(true)} style={({ pressed }) => [styles.nameRow, pressed && styles.pressed]}>
                <Text style={styles.value}>{profile.full_name || 'Tap to add your name'}</Text>
                <View style={styles.editIcon}><Ionicons name="create-outline" size={17} color={COLORS.champagne} /></View>
              </Pressable>
            )}

            <Text style={styles.label}>EMAIL</Text>
            <View style={styles.readonlyRow}><Ionicons name="mail-outline" size={17} color={COLORS.textMuted} /><Text style={styles.value}>{profile.email}</Text></View>

            <Text style={styles.label}>ACCOUNT ID</Text>
            <View style={styles.readonlyRow}><Ionicons name="finger-print-outline" size={17} color={COLORS.textMuted} /><Text style={styles.valueSmall}>{profile.id}</Text></View>
          </View>
        )}

        <View style={styles.signOutSection}>
          <AppButton title="Sign Out" icon="log-out-outline" onPress={handleSignOut} disabled={loading} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, paddingHorizontal: SPACE.lg, paddingTop: SPACE.lg, paddingBottom: 116 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACE.lg },
  eyebrow: { ...TYPOGRAPHY.label, fontFamily: TYPOGRAPHY.fontFamily, color: COLORS.champagne },
  title: { ...TYPOGRAPHY.screenTitle, fontFamily: TYPOGRAPHY.fontFamily, color: COLORS.textPrimary, marginTop: 3 },
  headerIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.glassStrong, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.champagneBorder },
  loadingState: { alignItems: 'center', paddingVertical: SPACE.section },
  subtitle: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 13, color: COLORS.textSecondary, marginTop: SPACE.sm },
  profileCard: { backgroundColor: COLORS.glassStrong, borderRadius: RADIUS.xl, padding: SPACE.lg, borderWidth: 1, borderColor: COLORS.glassBorder, shadowColor: '#02040F', shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  profileHero: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: COLORS.royalPanel, borderWidth: 1, borderColor: COLORS.champagneBorder, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 25, fontWeight: '800', color: '#FFFFFF' },
  profileCopy: { flex: 1 },
  name: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  email: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },
  rolePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, height: 27, borderRadius: RADIUS.pill, backgroundColor: COLORS.champagneSoft, borderWidth: 1, borderColor: COLORS.champagneBorder },
  roleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.champagne, marginRight: 5 },
  roleText: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 8, fontWeight: '800', letterSpacing: 0.7, color: COLORS.champagneDeep },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACE.lg },
  label: { ...TYPOGRAPHY.label, fontFamily: TYPOGRAPHY.fontFamily, color: COLORS.textMuted, marginBottom: 7, marginTop: SPACE.md },
  nameRow: { minHeight: 58, borderRadius: 24, backgroundColor: COLORS.primaryDeep, borderWidth: 1, borderColor: COLORS.glassBorder, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  value: { flex: 1, fontFamily: TYPOGRAPHY.fontFamily, fontSize: 14, color: COLORS.textPrimary, fontWeight: '700' },
  editIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#1B2148', borderWidth: 1, borderColor: COLORS.champagneBorder, alignItems: 'center', justifyContent: 'center' },
  editRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, minHeight: 54, borderRadius: 19, backgroundColor: 'rgba(6,10,36,0.55)', borderWidth: 1, borderColor: COLORS.glassBorder, paddingHorizontal: 13, fontFamily: TYPOGRAPHY.fontFamily, fontSize: 14, color: COLORS.textPrimary },
  saveButton: { marginLeft: 8, width: 54, height: 54, borderRadius: 19, backgroundColor: COLORS.primary, borderWidth: 1, borderColor: COLORS.champagneBorder, alignItems: 'center', justifyContent: 'center' },
  readonlyRow: { minHeight: 58, borderRadius: 24, backgroundColor: 'rgba(6,10,36,0.55)', borderWidth: 1, borderColor: COLORS.glassBorder, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  valueSmall: { flex: 1, fontFamily: TYPOGRAPHY.fontFamily, fontSize: 9, lineHeight: 14, color: COLORS.textSecondary },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  signOutSection: { marginTop: SPACE.lg },
});
