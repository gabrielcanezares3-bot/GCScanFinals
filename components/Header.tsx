import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS, SPACE } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';

export default function Header({ title }: { title: string }) {
  return (
    <View style={styles.container}>
      <View style={styles.brandMark}>
        <Image source={require('@/assets/images/icon.png')} style={styles.logo} contentFit="contain" />
      </View>
      <View style={styles.titleBlock}>
        <Text style={styles.kicker}>SYNCRA</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.actionCircle}>
        <Ionicons name="notifications-outline" size={19} color={COLORS.textPrimary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACE.sm,
  },
  brandMark: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryDeep,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  logo: { width: 34, height: 34 },
  titleBlock: { flex: 1, marginLeft: SPACE.md },
  kicker: {
    ...TYPOGRAPHY.label,
    fontFamily: TYPOGRAPHY.displayFontFamily,
    color: COLORS.champagne,
    letterSpacing: 1.4,
  },
  title: {
    fontFamily: TYPOGRAPHY.displayFontFamily,
    fontSize: 19,
    lineHeight: 23,
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  actionCircle: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.glassStrong,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
});
