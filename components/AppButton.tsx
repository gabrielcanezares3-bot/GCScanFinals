import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS, SPACE } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';

type Props = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  theme?: 'primary';
  disabled?: boolean;
  onPress: () => void;
};

export default function AppButton({ title, icon, theme, disabled, onPress }: Props) {
  const primary = theme === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onPress}
      android_ripple={{ color: primary ? 'rgba(255,255,255,0.15)' : 'rgba(83,104,255,0.08)' }}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.primary : styles.secondary,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={[styles.icon, primary ? styles.iconPrimary : styles.iconSecondary]}>
        <Ionicons name={icon} size={19} color={primary ? '#FFFFFF' : COLORS.champagne} />
      </View>
      <Text style={[styles.label, primary ? styles.primaryLabel : styles.secondaryLabel]}>{title}</Text>
      <View style={[styles.arrow, primary ? styles.arrowPrimary : styles.arrowSecondary]}>
        <Ionicons name="arrow-forward" size={16} color={primary ? '#FFFFFF' : COLORS.champagne} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 64,
    width: '100%',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0,
    marginBottom: SPACE.sm,
  },
  primary: {
    backgroundColor: COLORS.primary,
    borderColor: 'rgba(127,143,255,0.35)',
    borderWidth: 1,
    shadowColor: COLORS.neonGlowDeep,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  secondary: {
    backgroundColor: COLORS.glassStrong,
    borderColor: COLORS.glassBorder,
    borderWidth: 1,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconPrimary: { backgroundColor: 'rgba(255,255,255,0.18)' },
  iconSecondary: { backgroundColor: '#1B2148' },
  label: {
    flex: 1,
    fontFamily: TYPOGRAPHY.fontFamily,
    ...TYPOGRAPHY.button,
  },
  primaryLabel: { color: '#FFFFFF' },
  secondaryLabel: { color: COLORS.textPrimary },
  arrow: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowPrimary: { backgroundColor: COLORS.primary },
  arrowSecondary: { backgroundColor: '#1B2148', borderWidth: 1, borderColor: COLORS.champagneBorder },
  pressed: { transform: [{ scale: 0.975 }], opacity: 0.92 },
  disabled: { opacity: 0.45 },
});
