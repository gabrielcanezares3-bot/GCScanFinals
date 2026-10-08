import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, TextInput, View, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import AmbientBackground from '@/components/AmbientBackground';
import AppButton from '@/components/AppButton';
import Header from '@/components/Header';
import EntranceView from '@/components/EntranceView';
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
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const logoGlow = useRef(new Animated.Value(0)).current;
  const emailFocusProgress = useRef(new Animated.Value(0)).current;
  const passwordFocusProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => { if (session) router.replace('/(tabs)'); }, [session]);

  useEffect(() => {
    let mounted = true;
    let animation: Animated.CompositeAnimation | undefined;
    const setMotion = (reduced: boolean) => {
      animation?.stop();
      if (reduced) {
        logoGlow.setValue(0);
        return;
      }
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(logoGlow, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(logoGlow, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      );
      animation.start();
    };
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (mounted) setMotion(reduced);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setMotion);
    return () => {
      mounted = false;
      animation?.stop();
      subscription.remove();
    };
  }, [logoGlow]);

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
      <AmbientBackground variant="compact" graphicSide="right" />
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <EntranceView>
          <Header title="Welcome" />
          </EntranceView>
          <EntranceView delay={70}>
          <View style={styles.brandPanel}>
            <Animated.View style={[styles.brandIcon, { opacity: logoGlow.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }), transform: [{ scale: logoGlow.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.02] }) }] }]}><Ionicons name="scan-outline" size={29} color={COLORS.champagne} /></Animated.View>
            <Text style={styles.brandEyebrow}>GCSCAN SMART ATTENDANCE</Text>
            <Text style={styles.heroTitle}>Check in without the wait.</Text>
            <Text style={styles.heroText}>Sign in to scan your class QR and keep your attendance history in one place.</Text>
          </View>
          </EntranceView>

          <EntranceView delay={150}>
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Sign in</Text>
            <Text style={styles.formSubtitle}>Use your school account to continue.</Text>
            <Text style={styles.label}>EMAIL</Text>
            <View style={styles.inputShell}><Ionicons name="mail-outline" size={18} color={emailFocused ? COLORS.cyan : COLORS.textMuted} /><TextInput onFocus={() => { setEmailFocused(true); Animated.timing(emailFocusProgress, { toValue: 1, duration: 180, useNativeDriver: true }).start(); }} onBlur={() => { setEmailFocused(false); Animated.timing(emailFocusProgress, { toValue: 0, duration: 180, useNativeDriver: true }).start(); }} style={styles.input} value={email} onChangeText={setEmail} placeholder="your.email@school.edu" placeholderTextColor={COLORS.textMuted} autoCapitalize="none" keyboardType="email-address" editable={!loading} /><Animated.View pointerEvents="none" style={[styles.focusOutline, { opacity: emailFocusProgress }]} /></View>
            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.inputShell}><Ionicons name="lock-closed-outline" size={18} color={passwordFocused ? COLORS.cyan : COLORS.textMuted} /><TextInput onFocus={() => { setPasswordFocused(true); Animated.timing(passwordFocusProgress, { toValue: 1, duration: 180, useNativeDriver: true }).start(); }} onBlur={() => { setPasswordFocused(false); Animated.timing(passwordFocusProgress, { toValue: 0, duration: 180, useNativeDriver: true }).start(); }} style={styles.input} value={password} onChangeText={setPassword} placeholder="Enter your password" placeholderTextColor={COLORS.textMuted} secureTextEntry editable={!loading} /><Animated.View pointerEvents="none" style={[styles.focusOutline, { opacity: passwordFocusProgress }]} /></View>
            {error && <View style={styles.errorBox}><Ionicons name="alert-circle-outline" size={17} color={COLORS.danger} /><Text style={styles.error}>{error}</Text></View>}
            {loading ? <View style={styles.loader}><ActivityIndicator size="small" color={COLORS.primary} /></View> : <AppButton theme="primary" title="Sign In" icon="arrow-forward-outline" onPress={handleLogin} />}
          </View>
          </EntranceView>
          <EntranceView delay={220}>
          <Link href="/register" style={styles.link}>New to <Text style={styles.brandLink}>GCScan</Text>? <Text style={styles.linkStrong}>Create an account</Text></Link>
          </EntranceView>
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
  brandIcon: { width: 56, height: 56, borderRadius: 20, backgroundColor: 'rgba(217,185,138,0.14)', borderWidth: 1, borderColor: COLORS.champagneBorder, alignItems: 'center', justifyContent: 'center', marginBottom: SPACE.lg, shadowColor: COLORS.champagne, shadowOpacity: 0.5, shadowRadius: 15, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  brandEyebrow: { ...TYPOGRAPHY.label, fontFamily: TYPOGRAPHY.displayFontFamily, color: COLORS.champagne, textShadowColor: 'rgba(255,79,216,0.38)', textShadowRadius: 7 },
  heroTitle: { fontFamily: TYPOGRAPHY.displayFontFamily, fontSize: 27, lineHeight: 34, color: '#FFFFFF', letterSpacing: -0.65, marginTop: 6 },
  heroText: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 13, lineHeight: 20, color: 'rgba(232,237,255,0.72)', marginTop: 9, maxWidth: 330 },
  formCard: { marginTop: 12, marginHorizontal: 4, padding: SPACE.lg, borderRadius: RADIUS.xl, backgroundColor: COLORS.glassStrong, borderWidth: 1, borderColor: COLORS.glassBorder, shadowColor: '#02040F', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 5 },
  formTitle: { fontFamily: TYPOGRAPHY.headingFontFamily, fontSize: 21, color: COLORS.textPrimary },
  formSubtitle: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 12, color: COLORS.textSecondary, marginTop: 3, marginBottom: 5 },
  label: { ...TYPOGRAPHY.label, fontFamily: TYPOGRAPHY.semiboldFontFamily, color: COLORS.textMuted, marginTop: 15, marginBottom: 7 },
  inputShell: { minHeight: 55, borderRadius: 19, backgroundColor: COLORS.pearlPanel, borderWidth: 1, borderColor: COLORS.pearlBorder, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', position: 'relative' },
  focusOutline: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: 19, borderWidth: 1.5, borderColor: COLORS.cyan, shadowColor: COLORS.cyan, shadowOpacity: 0.55, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 3 },
  input: { flex: 1, marginLeft: 9, paddingVertical: 0, fontFamily: TYPOGRAPHY.fontFamily, fontSize: 14, color: COLORS.pearlText },
  errorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 14, padding: 12, borderRadius: 17, backgroundColor: 'rgba(255,122,155,0.12)', borderWidth: 1, borderColor: 'rgba(255,122,155,0.28)' },
  error: { flex: 1, fontFamily: TYPOGRAPHY.fontFamily, fontSize: 12, lineHeight: 18, color: COLORS.danger },
  loader: { minHeight: 60, alignItems: 'center', justifyContent: 'center' },
  link: { alignSelf: 'center', fontFamily: TYPOGRAPHY.fontFamily, fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACE.lg, paddingVertical: 8 },
  brandLink: { fontFamily: TYPOGRAPHY.displayFontFamily, color: COLORS.textPrimary, letterSpacing: -0.2, textShadowColor: 'rgba(255,79,216,0.38)', textShadowRadius: 5 },
  linkStrong: { fontFamily: TYPOGRAPHY.semiboldFontFamily, color: COLORS.champagne },
});
