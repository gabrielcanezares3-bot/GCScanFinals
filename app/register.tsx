import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AmbientBackground from '@/components/AmbientBackground';
import AppButton from '@/components/AppButton';
import Header from '@/components/Header';
import { COLORS, RADIUS, SPACE } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';
import { signUp } from '@/lib/auth';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState('');
  const [role, setRole] =
    useState<'student' | 'teacher'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError(null);

    if (
      !fullName.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError('All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError(
        'Password must be at least 6 characters.'
      );
      return;
    }

    setLoading(true);

    try {
      const { data, error: authError } = await signUp(
        email.trim(),
        password,
        {
          full_name: fullName.trim(),
          role,
        }
      );

      if (authError) {
        setError(authError.message);
      } else if (data.session) {
        // Email confirmation disabled or already confirmed - session exists
      } else {
        // Email confirmation enabled - no session yet
        setSuccess(true);
      }
    } catch (err) {
      setError(
        'An unexpected error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AmbientBackground variant="compact" />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <Header title="QR Attendance" />
          </View>

          <View style={styles.formCard}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Register to start recording attendance
            </Text>

            {success ? (
              <View style={styles.successContainer}>
                <Text style={styles.successTitle}>
                  Check your email!
                </Text>

                <Text style={styles.successText}>
                  We sent a confirmation link to {email}.
                  Click the link to verify your account,
                  then come back and sign in.
                </Text>

                <Link href="/login" style={styles.link}>
                  Back to Sign In
                </Link>
              </View>
            ) : (
              <View style={styles.form}>
                <Text style={styles.label}>
                  Full Name
                </Text>

                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor={
                    COLORS.textSecondary
                  }
                  editable={!loading}
                />

                <Text style={styles.label}>
                  I am a...
                </Text>

                <View style={styles.roleRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: role === 'student' }}
                    style={[
                      styles.roleChip,
                      role === 'student' &&
                        styles.roleChipActive,
                    ]}
                    onPress={() => setRole('student')}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.roleChipText,
                        role === 'student' &&
                          styles.roleChipTextActive,
                      ]}
                    >
                      Student
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: role === 'teacher' }}
                    style={[
                      styles.roleChip,
                      styles.roleChipLast,
                      role === 'teacher' &&
                        styles.roleChipActive,
                    ]}
                    onPress={() => setRole('teacher')}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.roleChipText,
                        role === 'teacher' &&
                          styles.roleChipTextActive,
                      ]}
                    >
                      Teacher
                    </Text>
                  </Pressable>
                </View>

                <Text style={styles.label}>
                  Email
                </Text>

                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your.email@school.edu"
                  placeholderTextColor={
                    COLORS.textSecondary
                  }
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                />

                <Text style={styles.label}>
                  Password
                </Text>

                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 6 characters"
                  placeholderTextColor={
                    COLORS.textSecondary
                  }
                  secureTextEntry
                  editable={!loading}
                />

                <Text style={styles.label}>
                  Confirm Password
                </Text>

                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter your password"
                  placeholderTextColor={
                    COLORS.textSecondary
                  }
                  secureTextEntry
                  editable={!loading}
                />

                {error && (
                  <View style={styles.errorBox}>
                    <Text style={styles.error}>
                      {error}
                    </Text>
                  </View>
                )}

                {loading ? (
                  <View style={styles.loader}>
                    <ActivityIndicator
                      size="small"
                      color={COLORS.primary}
                    />
                  </View>
                ) : (
                  <AppButton
                    theme="primary"
                    title="Sign Up"
                    icon="person-add-outline"
                    onPress={handleRegister}
                  />
                )}
              </View>
            )}
          </View>

          {!success && (
            <Link href="/login" style={styles.link}>
              Already have an account? Sign In
            </Link>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: SPACE.lg, paddingBottom: 30 },
  headerContainer: { marginBottom: SPACE.sm },
  formCard: { width: '100%', maxWidth: 540, alignSelf: 'center', padding: SPACE.lg, borderRadius: RADIUS.xl, backgroundColor: COLORS.glassStrong, borderWidth: 1, borderColor: COLORS.glassBorder, shadowColor: '#02040F', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 9 }, elevation: 4 },
  title: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 27, lineHeight: 33, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.7, marginBottom: 3 },
  subtitle: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 8 },
  form: { width: '100%' },
  label: { ...TYPOGRAPHY.label, fontFamily: TYPOGRAPHY.fontFamily, color: COLORS.textMuted, marginTop: 15, marginBottom: 7 },
  input: { minHeight: 55, backgroundColor: COLORS.pearlPanel, borderRadius: 19, borderWidth: 1, borderColor: COLORS.pearlBorder, paddingHorizontal: 14, paddingVertical: 13, fontFamily: TYPOGRAPHY.fontFamily, fontSize: 14, color: COLORS.pearlText },
  roleRow: { flexDirection: 'row', gap: 9 },
  roleChip: { flex: 1, minHeight: 52, backgroundColor: COLORS.glassStrong, borderRadius: 19, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center', justifyContent: 'center' },
  roleChipLast: { marginRight: 0 },
  roleChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.champagneBorder },
  roleChipText: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  roleChipTextActive: { color: COLORS.textOnPrimary },
  errorBox: { marginTop: 14, padding: 12, borderRadius: 17, backgroundColor: 'rgba(255,122,155,0.12)', borderWidth: 1, borderColor: 'rgba(255,122,155,0.28)' },
  error: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 12, lineHeight: 18, color: COLORS.danger },
  loader: { minHeight: 60, alignItems: 'center', justifyContent: 'center' },
  link: { width: '100%', maxWidth: 540, alignSelf: 'center', fontFamily: TYPOGRAPHY.fontFamily, fontSize: 12, color: COLORS.champagne, textAlign: 'center', fontWeight: '800', marginTop: SPACE.md, paddingVertical: 9 },
  successContainer: { padding: SPACE.lg, backgroundColor: COLORS.primaryTint, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: RADIUS.lg },
  successTitle: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 21, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACE.sm, textAlign: 'center' },
  successText: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: SPACE.sm },
});
