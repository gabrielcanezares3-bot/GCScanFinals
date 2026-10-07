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
        <Text style={styles.kicker}>GCSCAN</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.actionCircle}>
        <Ionicons name="notifications-outline" size={19} color="#E8EDFF" />
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
    backgroundColor: COLORS.royalPanel,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.champagneBorder,
    shadowColor: COLORS.neonGlowDeep,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 4,
  },
  logo: { width: 34, height: 34 },
  titleBlock: { flex: 1, marginLeft: SPACE.md },
  kicker: {
    ...TYPOGRAPHY.label,
    fontFamily: TYPOGRAPHY.fontFamily,
    color: COLORS.champagne,
    letterSpacing: 1.4,
  },
  title: {
    fontFamily: TYPOGRAPHY.fontFamily,
    fontSize: 19,
    lineHeight: 23,
    fontWeight: '800',
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
