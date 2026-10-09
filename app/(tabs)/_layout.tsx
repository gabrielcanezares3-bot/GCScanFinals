import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { COLORS } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';

const AnimatedPressable = Reanimated.createAnimatedComponent(Pressable);

function TabIcon({ focused, color, name }: { focused: boolean; color: string; name: keyof typeof Ionicons.glyphMap }) {
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(progress, {
      toValue: focused ? 1 : 0,
      tension: 190,
      friction: 14,
      useNativeDriver: true,
    }).start();
  }, [focused, progress]);

  return (
    <Animated.View style={[styles.tabIcon, { transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }] }]}>
      <Animated.View pointerEvents="none" style={[styles.activeTrack, { opacity: progress, transform: [{ scaleX: progress }] }]} />
      <Ionicons name={name} color={focused ? '#FFFFFF' : color} size={20} />
      <Animated.View style={[styles.activeDot, { opacity: progress, transform: [{ scale: progress }] }]} />
    </Animated.View>
  );
}

function ScanTabButton({
  onPress,
  accessibilityState,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPress?: (e: any) => void;
  accessibilityState?: { selected?: boolean };
}) {
  const focused = accessibilityState?.selected === true;
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel="Scan"
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.95, { damping: 14, stiffness: 280 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 13, stiffness: 220 }); }}
      style={[styles.scanWrap, pressStyle]}
    >
      <View style={[styles.scanGlow, focused && styles.scanGlowActive]} pointerEvents="none" />
      <View style={[styles.scanFab, focused && styles.scanFabActive]}>
        <Ionicons name={focused ? 'scan' : 'scan-outline'} size={28} color="#FFFFFF" />
      </View>
      <Text style={[styles.scanLabel, focused && styles.scanLabelActive]}>SCAN</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    width: 48,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTrack: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.46)',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  activeDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  scanWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  scanGlow: {
    position: 'absolute',
    top: -6,
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: COLORS.primaryTint,
  },
  scanGlowActive: {
    backgroundColor: COLORS.primaryTint,
  },
  scanFab: {
    marginTop: -30,
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  scanFabActive: {
    backgroundColor: COLORS.primaryDeep,
    borderColor: '#FFFFFF',
    shadowOpacity: 0.24,
  },
  scanLabel: {
    fontFamily: TYPOGRAPHY.mediumFontFamily,
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 1.1,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  scanLabelActive: { color: COLORS.primary },
});

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="index"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.textPrimary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: 16,
          height: 78,
          borderRadius: 26,
          backgroundColor: 'rgba(255,255,255,0.97)',
          borderWidth: 1,
          borderColor: COLORS.glassBorder,
          borderTopWidth: 1,
          borderTopColor: COLORS.glassBorder,
          paddingTop: 10,
          paddingBottom: 12,
          paddingHorizontal: 10,
          elevation: 12,
          shadowColor: COLORS.shadow,
          shadowOpacity: 0.12,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 8 },
        },
        tabBarLabelStyle: {
          fontFamily: TYPOGRAPHY.mediumFontFamily,
          fontSize: 10,
          letterSpacing: 0.2,
          marginTop: 3,
        },
        tabBarItemStyle: { borderRadius: 24, marginHorizontal: 2, paddingVertical: 2 },
        tabBarIcon: ({ color, focused }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            index: focused ? 'home' : 'home-outline',
            history: focused ? 'time' : 'time-outline',
            profile: focused ? 'person' : 'person-outline',
            teacher: focused ? 'school' : 'school-outline',
          };
          if (route.name === 'scan') return null;
          return (
            <TabIcon focused={focused} color={color} name={icons[route.name] ?? 'ellipse-outline'} />
          );
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarButton: (props) => <ScanTabButton onPress={props.onPress} accessibilityState={props.accessibilityState} />,
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="teacher" options={{ title: 'Teacher' }} />
    </Tabs>
  );
}
