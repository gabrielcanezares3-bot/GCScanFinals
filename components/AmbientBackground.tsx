import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { COLORS } from '@/constants/colors';

interface AmbientBackgroundProps {
  style?: object;
  variant?: 'default' | 'compact';
}

export default function AmbientBackground({ style, variant = 'default' }: AmbientBackgroundProps) {
  const compact = variant === 'compact';

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, style]}>
      <View style={styles.base} />
      <View style={StyleSheet.absoluteFillObject}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <RadialGradient id="royal" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={COLORS.royalPanel} stopOpacity="0.55" />
              <Stop offset="62%" stopColor={COLORS.gradientMid} stopOpacity="0.35" />
              <Stop offset="100%" stopColor={COLORS.gradientMid} stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="cyanGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#38E1FF" stopOpacity="0.18" />
              <Stop offset="62%" stopColor="#38E1FF" stopOpacity="0.08" />
              <Stop offset="100%" stopColor="#38E1FF" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="violetGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={COLORS.violet} stopOpacity="0.22" />
              <Stop offset="62%" stopColor={COLORS.violet} stopOpacity="0.10" />
              <Stop offset="100%" stopColor={COLORS.violet} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={compact ? '92%' : '88%'} cy={compact ? '8%' : '9%'} r={compact ? '44%' : '48%'} fill="url(#royal)" />
          <Circle cx={compact ? '8%' : '5%'} cy={compact ? '88%' : '93%'} r={compact ? '40%' : '46%'} fill="url(#violetGlow)" />
          <Circle cx="50%" cy="0%" r="36%" fill="url(#cyanGlow)" />
        </Svg>
      </View>
      <View style={styles.vignette} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6,10,36,0.22)',
  },
});
