import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import Header from '@/components/Header';
import AmbientBackground from '@/components/AmbientBackground';
import EntranceView from '@/components/EntranceView';
import { useIsFocused } from '@react-navigation/native';
import { COLORS, RADIUS, SPACE } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';

export default function Index() {
  const entrance = useRef(new Animated.Value(0)).current;
  const scanPulse = useRef(new Animated.Value(0)).current;
  const scanPulseSecondary = useRef(new Animated.Value(0)).current;
  const scanScale = useRef(new Animated.Value(1)).current;
  const scanLine = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);
  const isFocused = useIsFocused();

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
    if (!isFocused) return;
    if (reduceMotion) entrance.setValue(1);
    else Animated.spring(entrance, { toValue: 1, tension: 48, friction: 9, useNativeDriver: true }).start();

    if (reduceMotion) {
      scanPulse.setValue(1);
      scanPulseSecondary.setValue(1);
      return () => entrance.stopAnimation();
    }
    scanPulse.setValue(0);
    scanPulseSecondary.setValue(1);
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scanPulse, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(scanPulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    const secondaryPulse = Animated.loop(
      Animated.sequence([
        Animated.delay(650),
        Animated.timing(scanPulseSecondary, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.timing(scanPulseSecondary, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ])
    );
    const line = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLine, { toValue: 1, duration: 2100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(scanLine, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    pulse.start();
    secondaryPulse.start();
    line.start();
    return () => {
      pulse.stop();
      secondaryPulse.stop();
      line.stop();
      scanPulse.setValue(1);
      scanPulseSecondary.setValue(1);
      entrance.stopAnimation();
    };
  }, [entrance, scanPulse, scanPulseSecondary, scanLine, reduceMotion, isFocused]);

  const translateY = entrance.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });
  const pulseScale = scanPulse.interpolate({ inputRange: [0, 1], outputRange: [1.02, 1.38] });
  const pulseOpacity = scanPulse.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.38, 0.16, 0] });
  const secondaryPulseScale = scanPulseSecondary.interpolate({ inputRange: [0, 1], outputRange: [1.02, 1.38] });
  const secondaryPulseOpacity = scanPulseSecondary.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.3, 0.12, 0] });
  const lineY = scanLine.interpolate({ inputRange: [0, 1], outputRange: [-58, 58] });

  const openScanner = () => {
    Animated.sequence([
      Animated.spring(scanScale, { toValue: 0.93, friction: 5, tension: 220, useNativeDriver: true }),
      Animated.spring(scanScale, { toValue: 1, friction: 5, tension: 180, useNativeDriver: true }),
    ]).start();
    router.push('/scan');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AmbientBackground />
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ opacity: entrance, transform: [{ translateY }] }}
      >
        <View style={styles.content}>
          <Header title="Home" />

          <EntranceView delay={50}>
          <View style={styles.hero}>
            <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
              <Defs>
                <LinearGradient id="heroGradient" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0%" stopColor="#25306E" />
                  <Stop offset="52%" stopColor={COLORS.royalPanel} />
                  <Stop offset="100%" stopColor="#101743" />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" rx="28" fill="url(#heroGradient)" />
            </Svg>
            <View style={styles.heroGlow} />
            <View style={styles.heroCircleOne} />
            <View style={styles.heroTopRow}>
              <View style={styles.heroEyebrowRow}>
                <View style={styles.heroEyebrowDot} />
                <Text style={styles.heroEyebrow}>GCSCAN • SMART ATTENDANCE</Text>
              </View>
              <View style={styles.readyBadge}>
                <View style={styles.readyDot} />
                <Text style={styles.readyText}>READY</Text>
              </View>
            </View>
            <Text style={styles.heroTitle}>Ready to check in?</Text>
            <View style={styles.heroBottomRow}>
              <Text style={styles.heroSubtitle}>Your next attendance is one scan away.</Text>
              <View style={styles.heroStatus}>
                <Ionicons name="scan-outline" size={15} color={COLORS.cyan} />
                <Text style={styles.heroStatusText}>1 TAP SCAN</Text>
              </View>
            </View>
          </View>
          </EntranceView>

          <EntranceView delay={130}>
          <View style={styles.scanCard}>
            <View style={styles.scanHeader}>
              <View>
                <Text style={styles.scanEyebrow}>PRIMARY ACTION</Text>
                <Text style={styles.scanHeading}>Scan to attend</Text>
              </View>
              <View style={styles.liveBadge}>
                <Ionicons name="radio-outline" size={13} color={COLORS.cyan} />
                <Text style={styles.liveBadgeText}>LIVE</Text>
              </View>
            </View>

            <Pressable accessibilityRole="button" accessibilityLabel="Scan QR Code" onPress={openScanner} style={({ pressed }) => [styles.scanPressable, pressed && styles.scanPressablePressed]}>
              <Animated.View style={[styles.scanOrb, { transform: [{ scale: scanScale }] }]}>
                <View style={styles.orbRingOuter} />
                <View style={styles.orbRingInner} />
                <View style={styles.qrFrame}>
                  <Animated.View pointerEvents="none" style={[styles.qrPulse, styles.qrPulseCyan, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]} />
                  <Animated.View pointerEvents="none" style={[styles.qrPulse, styles.qrPulseViolet, { opacity: secondaryPulseOpacity, transform: [{ scale: secondaryPulseScale }] }]} />
                  <View style={styles.qrSurface}>
                    <View style={[styles.qrCorner, styles.qrTL]} />
                    <View style={[styles.qrCorner, styles.qrTR]} />
                    <View style={[styles.qrCorner, styles.qrBL]} />
                    <View style={[styles.qrCorner, styles.qrBR]} />
                    <Ionicons name="qr-code" size={56} color="#FFFFFF" />
                    <Animated.View style={[styles.scanLine, { transform: [{ translateY: lineY }] }]} />
                  </View>
                </View>
              </Animated.View>
              <View style={styles.scanCtaRow}>
                <View style={styles.scanCtaCopy}>
                  <Text style={styles.scanCtaTitle}>Scan QR Code</Text>
                  <Text style={styles.scanCtaText}>Open camera and check in</Text>
                </View>
                <View style={styles.scanCtaArrow}>
                  <Ionicons name="arrow-up-right-box" size={20} color="#FFFFFF" />
                </View>
              </View>
            </Pressable>
          </View>
          </EntranceView>

          <EntranceView delay={220}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionLabel}>YOUR SHORTCUTS</Text>
              <Text style={styles.sectionHint}>Everything else stays one tap away.</Text>
            </View>
            <Ionicons name="sparkles-outline" size={20} color={COLORS.champagne} />
          </View>

          <View style={styles.shortcutRow}>
            <Shortcut icon="time-outline" title="History" subtitle="Past scans" onPress={() => router.push('/history')} />
            <Shortcut icon="person-outline" title="Profile" subtitle="Account" onPress={() => router.push('/profile')} />
          </View>
          </EntranceView>

          <EntranceView delay={300}>
          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Ionicons name="bulb-outline" size={19} color={COLORS.champagne} />
            </View>
            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Quick scan tip</Text>
              <Text style={styles.tipText}>Keep the QR code centered inside the frame until attendance is confirmed.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.champagneDeep} />
          </View>
          </EntranceView>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function Shortcut({ icon, title, subtitle, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.shortcut, pressed && styles.shortcutPressed]} onPress={onPress} accessibilityRole="button">
      <View style={styles.shortcutIcon}><Ionicons name={icon} size={21} color={COLORS.champagne} /></View>
      <View style={styles.shortcutCopy}>
              <Text style={styles.shortcutTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.shortcutSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="arrow-up-right-box" size={17} color={COLORS.champagne} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1, paddingHorizontal: SPACE.lg, paddingTop: 2, paddingBottom: 112 },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingBottom: 6 },
  hero: {
    borderRadius: 28,
    marginTop: SPACE.sm,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.champagneBorder,
    shadowColor: '#02040F',
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  heroGlow: { position: 'absolute', top: -70, right: -40, width: 190, height: 190, borderRadius: 95, backgroundColor: 'rgba(217,185,138,0.14)' },
  heroCircleOne: { position: 'absolute', width: 150, height: 150, borderRadius: 75, right: -52, top: -72, backgroundColor: 'rgba(217,185,138,0.10)' },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroEyebrowRow: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 },
  heroEyebrowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.champagne, marginRight: 6 },
  heroEyebrow: { ...TYPOGRAPHY.label, fontFamily: TYPOGRAPHY.semiboldFontFamily, fontSize: 9, color: 'rgba(232,237,255,0.72)' },
  heroTitle: { fontFamily: TYPOGRAPHY.displayFontFamily, fontSize: 26, lineHeight: 31, letterSpacing: -0.65, color: '#FFFFFF', marginTop: 6 },
  heroBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, gap: 10 },
  heroSubtitle: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 12, lineHeight: 17, color: 'rgba(232,237,255,0.72)', flex: 1 },
  heroStatus: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, height: 30, borderRadius: RADIUS.pill, backgroundColor: 'rgba(56,225,255,0.12)', borderWidth: 1, borderColor: 'rgba(56,225,255,0.30)' },
  heroStatusText: { fontFamily: TYPOGRAPHY.semiboldFontFamily, fontSize: 8, letterSpacing: 0.9, color: COLORS.cyan },
  readyBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(6,10,36,0.38)', borderWidth: 1, borderColor: COLORS.champagneBorder, borderRadius: RADIUS.pill, paddingHorizontal: 9, height: 26 },
  readyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.champagne, marginRight: 5 },
  readyText: { fontFamily: TYPOGRAPHY.semiboldFontFamily, fontSize: 8, letterSpacing: 0.9, color: '#FFFFFF' },
  scanCard: {
    marginTop: SPACE.sm,
    marginHorizontal: 0,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.glassStrong,
    padding: SPACE.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    shadowColor: '#02040F',
    shadowOpacity: 0.55,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 7,
  },
  scanHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scanEyebrow: { ...TYPOGRAPHY.label, fontFamily: TYPOGRAPHY.semiboldFontFamily, color: COLORS.textSecondary },
  scanHeading: { ...TYPOGRAPHY.sectionTitle, fontFamily: TYPOGRAPHY.headingFontFamily, color: COLORS.textPrimary, marginTop: 2 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, height: 28, borderRadius: RADIUS.pill, backgroundColor: COLORS.cyanSoft, borderWidth: 1, borderColor: 'rgba(56,225,255,0.28)' },
  liveBadgeText: { fontFamily: TYPOGRAPHY.semiboldFontFamily, fontSize: 9, letterSpacing: 0.9, color: COLORS.cyan },
  scanPressable: { alignItems: 'center', marginTop: SPACE.md, paddingTop: 4 },
  scanPressablePressed: { transform: [{ scale: 0.985 }] },
  scanOrb: { width: 192, height: 192, borderRadius: 70, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.34, shadowRadius: 25, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
  orbRingOuter: { position: 'absolute', width: 192, height: 192, borderRadius: 70, borderWidth: 1, borderColor: 'rgba(56,225,255,0.28)', backgroundColor: 'rgba(22,32,90,0.72)' },
  orbRingInner: { position: 'absolute', width: 166, height: 166, borderRadius: 60, backgroundColor: COLORS.primaryDeep, opacity: 0.96 },
  qrFrame: { width: 126, height: 126, borderRadius: 42 },
  qrPulse: { ...StyleSheet.absoluteFillObject, borderRadius: 42, borderWidth: 1.25 },
  qrPulseCyan: { borderColor: 'rgba(56,225,255,0.92)' },
  qrPulseViolet: { borderColor: 'rgba(177,111,255,0.92)' },
  qrSurface: { width: 126, height: 126, borderRadius: 42, backgroundColor: COLORS.royalPanel, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(56,225,255,0.42)' },
  qrCorner: { position: 'absolute', width: 27, height: 27, borderColor: '#FFFFFF' },
  qrTL: { top: 15, left: 15, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 10 },
  qrTR: { top: 15, right: 15, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 10 },
  qrBL: { bottom: 15, left: 15, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 10 },
  qrBR: { bottom: 15, right: 15, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 10 },
  scanLine: { position: 'absolute', left: 12, right: 12, height: 2, backgroundColor: COLORS.cyan, shadowColor: COLORS.cyan, shadowOpacity: 0.9, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  scanCtaRow: { width: '100%', marginTop: SPACE.md, minHeight: 68, borderRadius: RADIUS.pill, paddingHorizontal: 12, paddingVertical: 8, paddingLeft: 18, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, borderWidth: 1, borderColor: COLORS.champagneBorder },
  scanCtaCopy: { flex: 1 },
  scanCtaTitle: { fontFamily: TYPOGRAPHY.headingFontFamily, fontSize: 17, color: '#FFFFFF' },
  scanCtaText: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 11, color: 'rgba(232,237,255,0.68)', marginTop: 3 },
  scanCtaArrow: { width: 52, height: 52, borderRadius: RADIUS.pill, backgroundColor: COLORS.royalPanel, borderWidth: 1, borderColor: 'rgba(56,225,255,0.30)', alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACE.lg, marginBottom: SPACE.sm },
  sectionLabel: { ...TYPOGRAPHY.label, fontFamily: TYPOGRAPHY.semiboldFontFamily, color: COLORS.champagne },
  sectionHint: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 12, color: COLORS.textSecondary, marginTop: 3 },
  shortcutRow: { flexDirection: 'row', gap: 10 },
  shortcut: { flex: 1, minHeight: 92, borderRadius: RADIUS.lg, backgroundColor: COLORS.glassStrong, borderWidth: 1, borderColor: COLORS.glassBorder, padding: 11, flexDirection: 'row', alignItems: 'center', shadowColor: '#02040F', shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  shortcutPressed: { transform: [{ scale: 0.98 }] },
  shortcutIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primaryDeep, borderWidth: 1, borderColor: COLORS.champagneBorder, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  shortcutCopy: { flex: 1 },
  shortcutTitle: { fontFamily: TYPOGRAPHY.semiboldFontFamily, fontSize: 13, color: COLORS.pearl },
  shortcutSubtitle: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 10, color: COLORS.textSecondary, marginTop: 3 },
  tipCard: { marginTop: SPACE.md, borderRadius: RADIUS.lg, backgroundColor: COLORS.glassStrong, borderWidth: 1, borderColor: COLORS.glassBorder, padding: 16, flexDirection: 'row', alignItems: 'center' },
  tipIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#1B2148', borderWidth: 1, borderColor: COLORS.champagneBorder, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  tipCopy: { flex: 1 },
  tipTitle: { fontFamily: TYPOGRAPHY.semiboldFontFamily, fontSize: 12, color: COLORS.pearl },
  tipText: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 11, lineHeight: 17, color: COLORS.textSecondary, marginTop: 2 },
});
