import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, G, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { COLORS } from '@/constants/colors';

interface AmbientBackgroundProps {
  style?: object;
  variant?: 'default' | 'compact';
  graphicSide?: 'left' | 'right';
}

export default function AmbientBackground({
  style,
  variant = 'default',
  graphicSide = 'right',
}: AmbientBackgroundProps) {
  const compact = variant === 'compact';
  const isFocused = useIsFocused();
  const { width, height } = useWindowDimensions();
  const drift = useSharedValue(0);
  const breathing = useSharedValue(0);

  useEffect(() => {
    let mounted = true;
    const start = (reduced: boolean) => {
      if (reduced || !isFocused) {
        drift.value = 0;
        breathing.value = 0;
        return;
      }
      drift.value = withRepeat(withTiming(1, { duration: 14000 }), -1, true);
      breathing.value = withRepeat(withTiming(1, { duration: 7200 }), -1, true);
    };
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', start);
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (mounted) start(reduced);
    });
    return () => {
      mounted = false;
      subscription.remove();
      drift.value = withTiming(0, { duration: 0 });
      breathing.value = withTiming(0, { duration: 0 });
    };
  }, [breathing, drift, isFocused]);

  const orbOne = useAnimatedStyle(() => ({
    transform: [{ translateX: -18 + drift.value * 36 }, { translateY: 12 - drift.value * 24 }, { scale: 0.94 + drift.value * 0.12 }],
    opacity: 0.15 + breathing.value * 0.08,
  }));
  const orbTwo = useAnimatedStyle(() => ({
    transform: [{ translateX: 20 - drift.value * 40 }, { translateY: -12 + drift.value * 30 }, { scale: 1.04 - drift.value * 0.10 }],
    opacity: 0.15 + breathing.value * 0.07,
  }));
  const orbThree = useAnimatedStyle(() => ({
    transform: [{ translateX: -12 + drift.value * 24 }, { translateY: 10 - drift.value * 20 }, { scale: 0.96 + drift.value * 0.08 }],
    opacity: 0.07 + breathing.value * 0.05,
  }));
  const wordmarkMotion = useAnimatedStyle(() => ({
    opacity: 0.9 + breathing.value * 0.1,
    transform: [
      { translateX: -2 + drift.value * 4 },
      { translateY: -5 + drift.value * 10 },
    ],
  }));
  const wordmarkX = width * (graphicSide === 'left' ? 0.10 : 0.90);
  const wordmarkY = height * (compact ? 0.52 : 0.50);
  const wordmarkSize = Math.min(height * 0.30, 290);

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, style]}>
      <View style={styles.base} />
      <Animated.View style={[styles.orb, styles.orbOne, orbOne]} />
      <Animated.View style={[styles.orb, styles.orbTwo, orbTwo]} />
      <Animated.View style={[styles.orb, styles.orbThree, orbThree]} />
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
        <Defs>
          <RadialGradient id="violet" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={COLORS.violet} stopOpacity="0.30" />
            <Stop offset="60%" stopColor={COLORS.primary} stopOpacity="0.10" />
            <Stop offset="100%" stopColor={COLORS.primary} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="cyan" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={COLORS.cyan} stopOpacity="0.18" />
            <Stop offset="65%" stopColor={COLORS.cyan} stopOpacity="0.05" />
            <Stop offset="100%" stopColor={COLORS.cyan} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="magenta" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={COLORS.champagne} stopOpacity="0.18" />
            <Stop offset="65%" stopColor={COLORS.champagne} stopOpacity="0.04" />
            <Stop offset="100%" stopColor={COLORS.champagne} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="blue" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#315BFF" stopOpacity="0.13" />
            <Stop offset="100%" stopColor="#315BFF" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={compact ? '90%' : '86%'} cy="8%" r={compact ? '46%' : '52%'} fill="url(#violet)" />
        <Circle cx="7%" cy={compact ? '88%' : '94%'} r={compact ? '42%' : '48%'} fill="url(#cyan)" />
        <Circle cx={compact ? '18%' : '16%'} cy={compact ? '18%' : '20%'} r={compact ? '38%' : '42%'} fill="url(#magenta)" />
        <Circle cx={compact ? '84%' : '78%'} cy={compact ? '72%' : '70%'} r={compact ? '35%' : '38%'} fill="url(#blue)" />
      </Svg>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, wordmarkMotion]}>
        <Svg width={width} height={height}>
          <Defs>
            <RadialGradient id="wordmarkStroke" cx="50%" cy="50%" r="72%">
              <Stop offset="0%" stopColor={COLORS.cyan} stopOpacity="0.95" />
              <Stop offset="48%" stopColor={COLORS.violet} stopOpacity="0.88" />
              <Stop offset="100%" stopColor={COLORS.champagne} stopOpacity="0.92" />
            </RadialGradient>
          </Defs>
          <G transform={`rotate(-90 ${wordmarkX} ${wordmarkY})`}>
            <SvgText
              x={wordmarkX}
              y={wordmarkY + wordmarkSize * 0.35}
              textAnchor="middle"
              fontFamily="SpaceGrotesk_700Bold"
              fontSize={wordmarkSize}
              letterSpacing={wordmarkSize * 0.025}
              fill="none"
              stroke="url(#wordmarkStroke)"
              strokeWidth={5}
              opacity={0.16}
            >
              GCSCAN
            </SvgText>
            <SvgText
              x={wordmarkX}
              y={wordmarkY + wordmarkSize * 0.35}
              textAnchor="middle"
              fontFamily="SpaceGrotesk_700Bold"
              fontSize={wordmarkSize}
              letterSpacing={wordmarkSize * 0.025}
              fill="none"
              stroke="url(#wordmarkStroke)"
              strokeWidth={1.15}
              opacity={0.38}
            >
              GCSCAN
            </SvgText>
          </G>
        </Svg>
      </Animated.View>
      <View style={styles.vignette} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.background },
  orb: { position: 'absolute', borderRadius: 999 },
  orbOne: { width: 230, height: 230, top: -60, right: -70, backgroundColor: COLORS.champagne },
  orbTwo: { width: 200, height: 200, bottom: 80, left: -80, backgroundColor: COLORS.primary },
  orbThree: { width: 150, height: 150, top: '38%', right: -55, backgroundColor: COLORS.cyan },
  vignette: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,3,18,0.18)' },
});
