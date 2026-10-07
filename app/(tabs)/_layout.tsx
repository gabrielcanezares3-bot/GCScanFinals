import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';

function TabIcon({ focused, color, name }: { focused: boolean; color: string; name: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Ionicons name={name} color={focused ? '#FFFFFF' : color} size={20} />
      {focused && <View style={styles.activeDot} />}
    </View>
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
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Scan" onPress={onPress} style={styles.scanWrap}>
      <View style={styles.scanGlow} pointerEvents="none" />
      <View style={[styles.scanFab, focused && styles.scanFabActive]}>
        <Ionicons name={focused ? 'scan' : 'scan-outline'} size={30} color={COLORS.cyan} />
      </View>
      <Text style={[styles.scanLabel, focused && styles.scanLabelActive]}>SCAN</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    width: 48,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(61,91,255,0.10)',
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconActive: {
    backgroundColor: COLORS.royalPanel,
    borderColor: COLORS.champagneBorder,
    shadowColor: COLORS.neonGlowDeep,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  activeDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.champagne,
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
    backgroundColor: 'rgba(56,225,255,0.14)',
  },
  scanFab: {
    marginTop: -30,
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: COLORS.royalPanel,
    borderWidth: 1.5,
    borderColor: 'rgba(56,225,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.cyan,
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  scanFabActive: {
    backgroundColor: '#3149F5',
    borderColor: COLORS.cyan,
    shadowOpacity: 0.65,
  },
  scanLabel: {
    fontFamily: TYPOGRAPHY.fontFamily,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  scanLabelActive: { color: COLORS.champagne },
});

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="index"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#7A86B8',
        tabBarStyle: {
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: 16,
          height: 78,
          borderRadius: 26,
          backgroundColor: '#0B1138',
          borderWidth: 1,
          borderColor: 'rgba(127,143,255,0.22)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(127,143,255,0.22)',
          paddingTop: 10,
          paddingBottom: 12,
          paddingHorizontal: 10,
          elevation: 12,
          shadowColor: '#02040F',
          shadowOpacity: 0.55,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 12 },
        },
        tabBarLabelStyle: {
          fontFamily: TYPOGRAPHY.fontFamily,
          fontSize: 10,
          fontWeight: '800',
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
