import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import AmbientBackground from '@/components/AmbientBackground';
import EntranceView from '@/components/EntranceView';
import { useAuth } from '@/lib/auth';
import { COLORS } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';

export default function Index() {
  const { user } = useAuth();
  const entrance = useRef(new Animated.Value(0)).current;
  const scanPulse = useRef(new Animated.Value(0)).current;
  const scanLine = useRef(new Animated.Value(0)).current;
  const scanScale = useRef(new Animated.Value(1)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  const metadataName = user?.user_metadata?.full_name;
  const firstName = typeof metadataName === 'string' && metadataName.trim()
    ? metadataName.trim().split(/\s+/)[0]
    : null;
  const avatarInitial = firstName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'G';

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (mounted) setReduceMotion(reduced);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      entrance.setValue(1);
      scanPulse.setValue(1);
      scanLine.setValue(0.5);
      return;
    }
    Animated.spring(entrance, { toValue: 1, tension: 48, friction: 9, useNativeDriver: true }).start();
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(scanPulse, { toValue: 1, duration: 1700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(scanPulse, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    const line = Animated.loop(Animated.sequence([
      Animated.timing(scanLine, { toValue: 1, duration: 1900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(scanLine, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    pulse.start();
    line.start();
    return () => {
      pulse.stop();
      line.stop();
      entrance.stopAnimation();
    };
  }, [entrance, reduceMotion, scanLine, scanPulse]);

  const openScanner = () => {
    Animated.sequence([
      Animated.spring(scanScale, { toValue: 0.94, friction: 5, tension: 220, useNativeDriver: true }),
      Animated.spring(scanScale, { toValue: 1, friction: 5, tension: 180, useNativeDriver: true }),
    ]).start();
    router.push('/scan');
  };

  const entranceY = entrance.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
  const pulseScale = scanPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const pulseOpacity = scanPulse.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.5, 0.22, 0] });
  const lineY = scanLine.interpolate({ inputRange: [0, 1], outputRange: [-28, 28] });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AmbientBackground graphicSide="right" />
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ opacity: entrance, transform: [{ translateY: entranceY }] }}
      >
        <View style={styles.content}>
          <EntranceView>
            <View style={styles.topBar}>
              <View style={styles.greeting}>
                <Text style={styles.eyebrow}>SYNCRA · CCTC ATTENDANCE</Text>
                <Text style={styles.greetingTitle}>{firstName ? `Hi, ${firstName}` : 'Welcome back'}</Text>
                <Text style={styles.greetingDate}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => router.push('/profile')} style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}>
                <Text style={styles.avatarText}>{avatarInitial}</Text>
                <View style={styles.avatarStatus} />
              </Pressable>
            </View>
          </EntranceView>

          <EntranceView delay={70}>
            <View style={styles.hero}>
              <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
                <Defs>
                  <LinearGradient id="homeHeroGradient" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor="#315FE8" />
                    <Stop offset="55%" stopColor="#3965DD" />
                    <Stop offset="100%" stopColor="#675ED5" />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" rx="30" fill="url(#homeHeroGradient)" />
                <Circle cx="100%" cy="8%" r="100" fill="#FFFFFF" fillOpacity="0.08" />
                <Circle cx="97%" cy="100%" r="130" fill="#A6B9FF" fillOpacity="0.15" />
                <Circle cx="-2%" cy="100%" r="70" fill="#67D2C8" fillOpacity="0.20" />
              </Svg>
              <View style={styles.heroCopy}>
                <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>YOUR DAY, IN SYNC</Text></View>
                <Text style={styles.heroTitle}>Show up.{'\n'}We’ll handle the rest.</Text>
                <Text style={styles.heroSubtitle}>Check in to class with a quick scan and keep your attendance together.</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Open QR scanner" onPress={openScanner} style={({ pressed }) => [styles.primaryAction, pressed && styles.actionPressed]}>
                  <Ionicons name="scan-outline" size={19} color={COLORS.primary} />
                  <Text style={styles.primaryActionText}>Scan to check in</Text>
                  <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
                </Pressable>
              </View>
              <Animated.View pointerEvents="none" style={[styles.qrHalo, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]} />
              <Animated.View pointerEvents="none" style={[styles.qrOrbit, { transform: [{ scale: scanScale }, { rotate: '8deg' }] }]}>
                <View style={styles.qrTile}>
                  <View style={[styles.qrCorner, styles.qrTL]} />
                  <View style={[styles.qrCorner, styles.qrTR]} />
                  <View style={[styles.qrCorner, styles.qrBL]} />
                  <View style={[styles.qrCorner, styles.qrBR]} />
                  <Ionicons name="qr-code" size={43} color="#FFFFFF" />
                  <Animated.View style={[styles.scanLine, { transform: [{ translateY: lineY }] }]} />
                </View>
              </Animated.View>
              <View style={styles.qrFloatingBadge}><Ionicons name="checkmark" size={13} color={COLORS.primary} /></View>
              <View style={styles.heroSparkle}><Ionicons name="sparkles" size={14} color="#FFFFFF" /></View>
            </View>
          </EntranceView>

          <EntranceView delay={140}>
            <View style={styles.sectionHeading}>
              <View>
                <Text style={styles.sectionEyebrow}>KEEP THINGS MOVING</Text>
                <Text style={styles.sectionTitle}>Your campus shortcuts</Text>
              </View>
              <Ionicons name="arrow-down" size={17} color={COLORS.primary} />
            </View>
            <View style={styles.shortcutRow}>
              <Pressable accessibilityRole="button" onPress={() => router.push('/history')} style={({ pressed }) => [styles.historyShortcut, pressed && styles.pressed]}>
                <View style={styles.shortcutTop}><View style={styles.shortcutIconBlue}><Ionicons name="time-outline" size={20} color={COLORS.primary} /></View><Ionicons name="arrow-forward" size={17} color={COLORS.primary} /></View>
                <Text style={styles.shortcutTitle}>Attendance</Text>
                <Text style={styles.shortcutSubtitle}>See your check-in history</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => router.push('/profile')} style={({ pressed }) => [styles.profileShortcut, pressed && styles.pressed]}>
                <View style={styles.shortcutTop}><View style={styles.shortcutIconViolet}><Ionicons name="person-outline" size={20} color="#6D62C9" /></View><Ionicons name="arrow-forward" size={17} color="#6D62C9" /></View>
                <Text style={styles.shortcutTitle}>Your account</Text>
                <Text style={styles.shortcutSubtitle}>Keep your details up to date</Text>
              </Pressable>
            </View>
          </EntranceView>

          <EntranceView delay={210}>
            <View style={styles.tipStrip}>
              <View style={styles.tipIcon}><Ionicons name="bulb-outline" size={18} color="#258B84" /></View>
              <View style={styles.tipCopy}><Text style={styles.tipTitle}>A little scan tip</Text><Text style={styles.tipText}>Hold your camera steady and keep the QR inside the frame.</Text></View>
              <View style={styles.tipArrow}><Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} /></View>
            </View>
          </EntranceView>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 6, paddingBottom: 126 },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center' },
  topBar: { minHeight: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  greeting: { flex: 1 },
  eyebrow: { fontFamily: TYPOGRAPHY.semiboldFontFamily, color: COLORS.primary, fontSize: 8, letterSpacing: 1.05 },
  greetingTitle: { fontFamily: TYPOGRAPHY.displayFontFamily, color: COLORS.textPrimary, fontSize: 24, lineHeight: 29, letterSpacing: -0.5, marginTop: 2 },
  greetingDate: { fontFamily: TYPOGRAPHY.fontFamily, color: COLORS.textSecondary, fontSize: 10, marginTop: 1 },
  avatar: { width: 46, height: 46, borderRadius: 17, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.shadow, shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  avatarText: { fontFamily: TYPOGRAPHY.displayFontFamily, color: COLORS.primary, fontSize: 17 },
  avatarStatus: { position: 'absolute', top: 1, right: 1, width: 9, height: 9, borderRadius: 5, backgroundColor: '#55C2A7', borderWidth: 2, borderColor: '#FFFFFF' },
  hero: { minHeight: 310, borderRadius: 30, padding: 20, justifyContent: 'center', overflow: 'hidden', backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 4 },
  heroCopy: { width: '72%', zIndex: 1 },
  livePill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', height: 25, paddingHorizontal: 9, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#78E1C5', marginRight: 6 },
  liveText: { fontFamily: TYPOGRAPHY.semiboldFontFamily, color: '#FFFFFF', fontSize: 7, letterSpacing: 0.7 },
  heroTitle: { fontFamily: TYPOGRAPHY.displayFontFamily, color: '#FFFFFF', fontSize: 26, lineHeight: 30, letterSpacing: -0.65, marginTop: 12 },
  heroSubtitle: { fontFamily: TYPOGRAPHY.fontFamily, color: 'rgba(255,255,255,0.80)', fontSize: 10, lineHeight: 15, maxWidth: 220, marginTop: 8 },
  primaryAction: { alignSelf: 'flex-start', minHeight: 46, paddingHorizontal: 13, marginTop: 14, borderRadius: 16, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: '#173989', shadowOpacity: 0.14, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  primaryActionText: { fontFamily: TYPOGRAPHY.semiboldFontFamily, color: COLORS.primary, fontSize: 11 },
  actionPressed: { transform: [{ scale: 0.97 }] },
  qrOrbit: { position: 'absolute', right: -18, top: 69, width: 144, height: 144, borderRadius: 54, alignItems: 'center', justifyContent: 'center' },
  qrHalo: { position: 'absolute', right: -6, top: 81, width: 122, height: 122, borderRadius: 45, borderWidth: 1, borderColor: 'rgba(255,255,255,0.64)' },
  qrTile: { width: 102, height: 102, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.17)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.36)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  qrCorner: { position: 'absolute', width: 19, height: 19, borderColor: '#FFFFFF' },
  qrTL: { top: 12, left: 12, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderTopLeftRadius: 6 },
  qrTR: { top: 12, right: 12, borderTopWidth: 2.5, borderRightWidth: 2.5, borderTopRightRadius: 6 },
  qrBL: { bottom: 12, left: 12, borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderBottomLeftRadius: 6 },
  qrBR: { bottom: 12, right: 12, borderBottomWidth: 2.5, borderRightWidth: 2.5, borderBottomRightRadius: 6 },
  scanLine: { position: 'absolute', left: 13, right: 13, height: 2, borderRadius: 2, backgroundColor: '#8BFFF1', shadowColor: '#8BFFF1', shadowOpacity: 0.8, shadowRadius: 7, shadowOffset: { width: 0, height: 0 } },
  qrFloatingBadge: { position: 'absolute', right: 16, top: 54, width: 29, height: 29, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '8deg' }] },
  heroSparkle: { position: 'absolute', right: 103, bottom: 37, width: 27, height: 27, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.13)', alignItems: 'center', justifyContent: 'center' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 11 },
  sectionEyebrow: { fontFamily: TYPOGRAPHY.semiboldFontFamily, color: COLORS.primary, fontSize: 8, letterSpacing: 0.9 },
  sectionTitle: { fontFamily: TYPOGRAPHY.headingFontFamily, color: COLORS.textPrimary, fontSize: 16, marginTop: 2 },
  shortcutRow: { flexDirection: 'row', gap: 10 },
  historyShortcut: { flex: 1, minHeight: 120, borderRadius: 22, padding: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: COLORS.glassBorder, shadowColor: COLORS.shadow, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  profileShortcut: { flex: 1, minHeight: 120, borderRadius: 22, padding: 14, backgroundColor: '#E7EAFE', borderWidth: 1, borderColor: '#DCE1FA' },
  shortcutTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 },
  shortcutIconBlue: { width: 35, height: 35, borderRadius: 13, backgroundColor: '#EAF0FF', alignItems: 'center', justifyContent: 'center' },
  shortcutIconViolet: { width: 35, height: 35, borderRadius: 13, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  shortcutTitle: { fontFamily: TYPOGRAPHY.headingFontFamily, color: COLORS.textPrimary, fontSize: 13 },
  shortcutSubtitle: { fontFamily: TYPOGRAPHY.fontFamily, color: COLORS.textSecondary, fontSize: 9, marginTop: 3 },
  tipStrip: { minHeight: 72, marginTop: 13, paddingHorizontal: 13, paddingVertical: 11, borderRadius: 20, backgroundColor: '#E4F3F2', borderWidth: 1, borderColor: '#D5ECEA', flexDirection: 'row', alignItems: 'center' },
  tipIcon: { width: 38, height: 38, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  tipCopy: { flex: 1 },
  tipTitle: { fontFamily: TYPOGRAPHY.semiboldFontFamily, fontSize: 10, color: COLORS.textPrimary },
  tipText: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 9, lineHeight: 13, color: COLORS.textSecondary, marginTop: 2 },
  tipArrow: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  pressed: { transform: [{ scale: 0.98 }] },
});
