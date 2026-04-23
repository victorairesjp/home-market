import { Platform, Pressable, Text, View } from 'react-native'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { useColors, PRIMARY } from '@/constants/colors'

const TAB_DEFS = [
  { name: '(dashboard)',    label: 'Início',  icon: 'home-outline'        as const, activeIcon: 'home'        as const },
  { name: '(feiras)',       label: 'Feiras',  icon: 'cart-outline'        as const, activeIcon: 'cart'        as const },
  { name: '(lista)',        label: 'Lista',   icon: 'list-outline'        as const, activeIcon: 'list'        as const },
  { name: '(comparativos)', label: 'Preços',  icon: 'trending-up-outline' as const, activeIcon: 'trending-up' as const },
  { name: '(menu)',         label: 'Menu',    icon: 'person-outline'      as const, activeIcon: 'person'      as const },
]

function PersistentTabBar({ state, navigation }: BottomTabBarProps) {
  const c   = useColors()
  const ins = useSafeAreaInsets()

  const activeRouteName = state.routes[state.index]?.name ?? ''

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 64 + ins.bottom,
        paddingBottom: ins.bottom,
        paddingTop: 8,
        paddingHorizontal: 8,
        flexDirection: 'row',
        backgroundColor: c.card,
        ...(Platform.OS === 'ios'
          ? { shadowColor: '#101828', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16 }
          : { elevation: 20 }),
      }}
    >
      {TAB_DEFS.map((tab) => {
        const focused = activeRouteName === tab.name

        function onPress() {
          const event = navigation.emit({ type: 'tabPress', target: state.routes.find(r => r.name === tab.name)?.key ?? '', canPreventDefault: true })
          if (!event.defaultPrevented) navigation.navigate(tab.name)
        }

        const isCenter = tab.name === '(lista)'

        if (isCenter) {
          return (
            <Pressable
              key={tab.name}
              onPress={onPress}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: -14 }}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 18,
                  backgroundColor: PRIMARY,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: PRIMARY,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 10,
                  elevation: 8,
                }}
              >
                <Ionicons name={focused ? tab.activeIcon : tab.icon} size={24} color="#fff" />
              </View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: focused ? PRIMARY : c.subtext, marginTop: 4 }}>
                {tab.label}
              </Text>
            </Pressable>
          )
        }

        return (
          <Pressable
            key={tab.name}
            onPress={onPress}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 }}
          >
            <View
              style={{
                width: 48,
                height: 30,
                borderRadius: 15,
                backgroundColor: focused ? PRIMARY + '18' : 'transparent',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons
                name={focused ? tab.activeIcon : tab.icon}
                size={22}
                color={focused ? PRIMARY : c.subtext}
              />
            </View>
            <Text
              style={{
                fontSize: 11,
                fontWeight: focused ? '700' : '500',
                color: focused ? PRIMARY : c.subtext,
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

export default function AppLayout() {
  return (
    <Tabs
      tabBar={(props) => <PersistentTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="(dashboard)"    />
      <Tabs.Screen name="(feiras)"       />
      <Tabs.Screen name="(lista)"        />
      <Tabs.Screen name="(comparativos)" />
      <Tabs.Screen name="(menu)"         />
      <Tabs.Screen name="(produtos)"     options={{ href: null }} />
      <Tabs.Screen name="(comparar)"     options={{ href: null }} />
    </Tabs>
  )
}
