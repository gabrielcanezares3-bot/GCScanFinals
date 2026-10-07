import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import AmbientBackground from '@/components/AmbientBackground';
import AppButton from '@/components/AppButton';
import Header from '@/components/Header';
import { COLORS, RADIUS, SPACE } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';
import { signIn, useAuth } from '@/lib/auth';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (session) router.replace('/(tabs)'); }, [session]);

  const handleLogin = async () => {
    setError(null); setLoading(true);
    try {
      const { error: authError } = await signIn(email.trim(), password);
      if (authError) setError(authError.message);
    } catch (err: any) { setError(err?.message || 'Unexpected error'); }
    finally { setLoading(false); }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AmbientBackground variant="compact" />
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Header title="Welcome" />
          <View style={styles.brandPanel}>
            <View style={styles.brandIcon}><Ionicons name="scan-outline" size={29} color={COLORS.champagne} /></View>
            <Text style={styles.brandEyebrow}>GCSCAN SMART ATTENDANCE</Text>
            <Text style={styles.heroTitle}>Check in without the wait.</Text>
            <Text style={styles.heroText}>Sign in to scan your class QR and keep your attendance history in one place.</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Sign in</Text>
            <Text style={styles.formSubtitle}>Use your school account to continue.</Text>
            <Text style={styles.label}>EMAIL</Text>
            <View style={styles.inputShell}><Ionicons name="mail-outline" size={18} color={COLORS.textMuted} /><TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="your.email@school.edu" placeholderTextColor={COLORS.textMuted} autoCapitalize="none" keyboardType="email-address" editable={!loading} /></View>
            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.inputShell}><Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} /><TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Enter your password" placeholderTextColor={COLORS.textMuted} secureTextEntry editable={!loading} /></View>
            {error && <View style={styles.errorBox}><Ionicons name="alert-circle-outline" size={17} color={COLORS.danger} /><Text style={styles.error}>{error}</Text></View>}
            {loading ? <View style={styles.loader}><ActivityIndicator size="small" color={COLORS.primary} /></View> : <AppButton theme="primary" title="Sign In" icon="arrow-forward-outline" onPress={handleLogin} />}
          </View>
          <Link href="/register" style={styles.link}>New to GCScan? <Text style={styles.linkStrong}>Create an account</Text></Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: SPACE.lg, paddingBottom: 30 },
  brandPanel: { marginTop: SPACE.lg, borderRadius: RADIUS.xl, backgroundColor: COLORS.primaryDeep, borderWidth: 1, borderColor: COLORS.champagneBorder, padding: SPACE.xl, overflow: 'hidden', shadowColor: '#02040F', shadowOpacity: 0.55, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 5 },
  brandIcon: { width: 56, height: 56, borderRadius: 20, backgroundColor: 'rgba(217,185,138,0.14)', borderWidth: 1, borderColor: COLORS.champagneBorder, alignItems: 'center', justifyContent: 'center', marginBottom: SPACE.lg },
  brandEyebrow: { ...TYPOGRAPHY.label, fontFamily: TYPOGRAPHY.fontFamily, color: COLORS.champagne },
  heroTitle: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 27, lineHeight: 33, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.7, marginTop: 6 },
  heroText: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 13, lineHeight: 20, color: 'rgba(232,237,255,0.72)', marginTop: 9, maxWidth: 330 },
  formCard: { marginTop: 12, marginHorizontal: 4, padding: SPACE.lg, borderRadius: RADIUS.xl, backgroundColor: COLORS.glassStrong, borderWidth: 1, borderColor: COLORS.glassBorder, shadowColor: '#02040F', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 5 },
  formTitle: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 21, fontWeight: '800', color: COLORS.textPrimary },
  formSubtitle: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 12, color: COLORS.textSecondary, marginTop: 3, marginBottom: 5 },
  label: { ...TYPOGRAPHY.label, fontFamily: TYPOGRAPHY.fontFamily, color: COLORS.textMuted, marginTop: 15, marginBottom: 7 },
  inputShell: { minHeight: 55, borderRadius: 19, backgroundColor: COLORS.pearlPanel, borderWidth: 1, borderColor: COLORS.pearlBorder, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, marginLeft: 9, paddingVertical: 0, fontFamily: TYPOGRAPHY.fontFamily, fontSize: 14, color: COLORS.pearlText },
  errorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 14, padding: 12, borderRadius: 17, backgroundColor: 'rgba(255,122,155,0.12)', borderWidth: 1, borderColor: 'rgba(255,122,155,0.28)' },
  error: { flex: 1, fontFamily: TYPOGRAPHY.fontFamily, fontSize: 12, lineHeight: 18, color: COLORS.danger },
  loader: { minHeight: 60, alignItems: 'center', justifyContent: 'center' },
  link: { alignSelf: 'center', fontFamily: TYPOGRAPHY.fontFamily, fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACE.lg, paddingVertical: 8 },
  linkStrong: { color: COLORS.champagne, fontWeight: '800' },
});
