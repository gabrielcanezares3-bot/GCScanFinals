import { useAuth } from '@/lib/auth';
import { registerAttendance } from '@/lib/attendance';
import { getEventByCode } from '@/lib/events';
import { LATE_REASONS, type LateReason } from '@/lib/smartFeatures';
import { parseQRPayload } from '@/lib/qr';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import AppButton from '@/components/AppButton';
import AmbientBackground from '@/components/AmbientBackground';
import { COLORS, RADIUS, SPACE } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [lastData, setLastData] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [lateReasonEnabled, setLateReasonEnabled] = useState(false);
  const [zoneEnabled, setZoneEnabled] = useState(false);
  const [lateReason, setLateReason] = useState<LateReason | null>(null);
  const [pendingScan, setPendingScan] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const line = useRef(new Animated.Value(0)).current;
  const scanBusy = useRef(false);

  useEffect(() => {
    if (!permission?.granted || scanned) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(line, { toValue: 1, duration: 1900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(line, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [permission?.granted, scanned, line]);

  if (!permission) {
    return <PermissionState title="Preparing your scanner" subtitle="Getting the camera ready..." />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <AmbientBackground variant="compact" />
        <View style={styles.permissionCard}>
          <View style={styles.permissionIcon}><Ionicons name="scan-outline" size={30} color={COLORS.cyan} /></View>
          <Text style={styles.permissionTitle}>Camera access</Text>
          <Text style={styles.permissionText}>Allow camera access so GCScan can read attendance QR codes.</Text>
          <AppButton theme="primary" title="Grant Permission" icon="camera-outline" onPress={requestPermission} />
        </View>
      </View>
    );
  }

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanBusy.current) return;
    scanBusy.current = true;
    if (!user) {
      setScanned(true); setLastData(data); setMessage('Please sign in to record attendance.'); setSuccess(false); scanBusy.current = false; return;
    }
    setScanned(true); setLastData(data);
    const parsed = parseQRPayload(data);
    if (!parsed.ok) { setMessage(parsed.message); setSuccess(false); scanBusy.current = false; return; }
    const event = await getEventByCode(parsed.payload.event);
    if (!event) { setMessage('This event could not be verified.'); setSuccess(false); scanBusy.current = false; return; }
    setLateReasonEnabled(event.late_reason_enabled);
    setZoneEnabled(event.zone_enabled);
    setPendingScan(data);
    if (!event.late_reason_enabled) await submitScan(data, null, event.zone_enabled);
    scanBusy.current = false;
  };

  const submitScan = async (
    data: string,
    reason: LateReason | null,
    requiresZone = zoneEnabled
  ) => {
    if (!user) return;
    setSubmitting(true);
    try {
      let location: { latitude: number; longitude: number } | undefined;
      if (requiresZone) {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
          throw new Error('Location is unavailable in this app build, so this event cannot be checked in here.');
        }
        location = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
            (error) => reject(new Error(
              error.code === error.PERMISSION_DENIED
                ? 'Location permission is required to check in to this event.'
                : 'Your current location could not be determined. Please try again.'
            )),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
          );
        });
      }
      const result = await registerAttendance(data, user.id, location, reason);
      setMessage(result.message); setSuccess(result.success);
      if (result.success) setPendingScan(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to record attendance.'); setSuccess(false);
    } finally {
      setSubmitting(false);
    }
  };

  const lineY = line.interpolate({ inputRange: [0, 1], outputRange: [-112, 112] });

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={scanned ? undefined : handleBarcodeScanned} />
      <View style={styles.cameraShade} pointerEvents="none" />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]} pointerEvents="none">
        <View><Text style={styles.topEyebrow}>GCSCAN</Text><Text style={styles.topTitle}>Scan attendance</Text></View>
        <View style={styles.topBadge}><View style={styles.topDot} /><Text style={styles.topBadgeText}>LIVE</Text></View>
      </View>

      <View style={styles.scanFrame} pointerEvents="none">
        <View style={[styles.frameCorner, styles.frameTL]} /><View style={[styles.frameCorner, styles.frameTR]} />
        <View style={[styles.frameCorner, styles.frameBL]} /><View style={[styles.frameCorner, styles.frameBR]} />
        {!scanned && <Animated.View style={[styles.scanningLine, { transform: [{ translateY: lineY }] }]} />}
        <View style={styles.frameCenter}><Ionicons name="qr-code-outline" size={28} color="rgba(255,255,255,0.72)" /></View>
      </View>

      <View style={[styles.overlay, { bottom: Math.max(insets.bottom + 82, 100) }]}>
        <View style={styles.handle} />
        <View style={styles.overlayHeader}>
          <View style={styles.overlayIcon}><Ionicons name={scanned ? (success ? 'checkmark' : 'alert') : 'scan-outline'} size={19} color={success ? COLORS.success : COLORS.cyan} /></View>
          <View style={styles.overlayCopy}>
            <Text style={styles.overlayEyebrow}>{scanned ? (success ? 'ATTENDANCE RECORDED' : 'SCAN RESULT') : 'READY TO SCAN'}</Text>
            <Text style={styles.overlayTitle}>{scanned ? (success ? 'You are checked in.' : 'We found a QR code.') : 'Center the QR code'}</Text>
          </View>
        </View>

        {!scanned && <Text style={styles.overlayText}>Keep the QR inside the frame. GCScan will detect it automatically.</Text>}
        {scanned && message && <Text style={[styles.scanResult, success ? styles.success : styles.error]}>{message}</Text>}
        {scanned && pendingScan && lateReasonEnabled && !success && (
          <View style={styles.reasonPanel}>
            <Text style={styles.reasonTitle}>If you are late, choose a reason</Text>
            <View style={styles.reasonRow}>
              {LATE_REASONS.map((reason) => (
                <Pressable key={reason} style={[styles.reasonChip, lateReason === reason && styles.reasonChipActive]} onPress={() => setLateReason(reason)}>
                  <Text style={[styles.reasonChipText, lateReason === reason && styles.reasonChipTextActive]}>{reason}</Text>
                </Pressable>
              ))}
            </View>
            <AppButton disabled={submitting} theme="primary" title={submitting ? 'Recording...' : 'Confirm attendance'} icon="checkmark-circle-outline" onPress={() => submitScan(pendingScan, lateReason, zoneEnabled)} />
          </View>
        )}
        {scanned && lastData && <Text numberOfLines={2} style={styles.scanData}>{lastData}</Text>}
        {scanned && <AppButton theme="primary" title="Scan Again" icon="refresh-outline" onPress={() => { setScanned(false); setLastData(null); setMessage(null); setPendingScan(null); setLateReason(null); setLateReasonEnabled(false); setZoneEnabled(false); scanBusy.current = false; }} />}
      </View>
    </View>
  );
}

function PermissionState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.permissionContainer}>
      <AmbientBackground variant="compact" />
      <View style={styles.permissionCard}>
        <View style={styles.permissionIcon}><Ionicons name="camera-outline" size={30} color="#FFFFFF" /></View>
        <Text style={styles.permissionTitle}>{title}</Text>
        <Text style={styles.permissionText}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, overflow: 'hidden' },
  camera: { ...StyleSheet.absoluteFillObject },
  cameraShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(9,12,52,0.30)' },
  topBar: { position: 'absolute', top: 0, left: SPACE.lg, right: SPACE.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topEyebrow: { ...TYPOGRAPHY.label, fontFamily: TYPOGRAPHY.fontFamily, color: COLORS.textSecondary },
  topTitle: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginTop: 2 },
  topBadge: { flexDirection: 'row', alignItems: 'center', height: 31, paddingHorizontal: 11, borderRadius: RADIUS.pill, backgroundColor: 'rgba(10,13,48,0.52)', borderWidth: 1, borderColor: COLORS.glassBorder },
  topDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#5DE4B3', marginRight: 6 },
  topBadgeText: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 9, fontWeight: '800', letterSpacing: 1, color: COLORS.textPrimary },
  scanFrame: { position: 'absolute', width: 278, height: 278, top: '22%', alignSelf: 'center', borderRadius: 44, borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)', backgroundColor: 'rgba(255,255,255,0.025)', overflow: 'hidden', shadowColor: COLORS.cyan, shadowOpacity: 0.24, shadowRadius: 30, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  frameCorner: { position: 'absolute', width: 52, height: 52, borderColor: '#FFFFFF' },
  frameTL: { top: -1, left: -1, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 19 },
  frameTR: { top: -1, right: -1, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 19 },
  frameBL: { bottom: -1, left: -1, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 19 },
  frameBR: { bottom: -1, right: -1, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 19 },
  scanningLine: { position: 'absolute', left: 18, right: 18, height: 3, borderRadius: 3, backgroundColor: COLORS.cyan, shadowColor: COLORS.cyan, shadowOpacity: 0.9, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } },
  frameCenter: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  overlay: { position: 'absolute', left: 12, right: 12, maxWidth: 540, alignSelf: 'center', backgroundColor: COLORS.glassStrong, borderRadius: 32, padding: 18, borderWidth: 1, borderColor: COLORS.glassBorder, shadowColor: '#02040F', shadowOpacity: 0.6, shadowRadius: 26, shadowOffset: { width: 0, height: 12 }, elevation: 9 },
  handle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 4, backgroundColor: 'rgba(127,143,255,0.30)', marginBottom: 13 },
  overlayHeader: { flexDirection: 'row', alignItems: 'center' },
  overlayIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(56,225,255,0.12)', borderWidth: 1, borderColor: 'rgba(56,225,255,0.25)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  overlayCopy: { flex: 1 },
  overlayEyebrow: { ...TYPOGRAPHY.label, fontFamily: TYPOGRAPHY.fontFamily, color: COLORS.cyan },
  overlayTitle: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginTop: 2 },
  overlayText: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 12, lineHeight: 18, color: COLORS.textSecondary, marginTop: 11, marginBottom: 7 },
  scanResult: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 13, lineHeight: 19, marginTop: 10, marginBottom: 5, fontWeight: '700', textAlign: 'center' },
  success: { color: COLORS.success },
  error: { color: COLORS.danger },
  scanData: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 10, lineHeight: 15, color: COLORS.textMuted, textAlign: 'center', marginBottom: 8 },
  reasonPanel: { marginTop: 12, padding: 14, borderRadius: 28, backgroundColor: 'rgba(61,91,255,0.12)', borderWidth: 1, borderColor: COLORS.glassBorder },
  reasonTitle: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 11, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
  reasonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  reasonChip: { paddingHorizontal: 12, minHeight: 34, borderRadius: RADIUS.pill, backgroundColor: 'rgba(61,91,255,0.12)', borderWidth: 1, borderColor: COLORS.glassBorder, justifyContent: 'center' },
  reasonChipActive: { backgroundColor: COLORS.primary, borderColor: 'rgba(56,225,255,0.45)' },
  reasonChipText: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 9, fontWeight: '700', color: COLORS.textSecondary },
  reasonChipTextActive: { color: '#FFFFFF' },
  permissionContainer: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACE.lg },
  permissionCard: { width: '100%', maxWidth: 430, backgroundColor: COLORS.glassStrong, borderRadius: RADIUS.xl, padding: SPACE.xl, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center', shadowColor: '#02040F', shadowOpacity: 0.55, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 6 },
  permissionIcon: { width: 76, height: 76, borderRadius: 38, backgroundColor: COLORS.royalPanel, borderWidth: 1, borderColor: 'rgba(56,225,255,0.35)', alignItems: 'center', justifyContent: 'center', marginBottom: SPACE.lg },
  permissionTitle: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center' },
  permissionText: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 14, lineHeight: 21, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACE.sm, marginBottom: SPACE.lg },
});
