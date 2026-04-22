import { Alert, Pressable, Text, View } from 'react-native'
import { DrawerContentScrollView, type DrawerContentComponentProps } from '@react-navigation/drawer'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useColors, PRIMARY } from '@/constants/colors'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'

type NavItem = {
  label: string
  route: string
  icon: keyof typeof Ionicons.glyphMap
  activeIcon: keyof typeof Ionicons.glyphMap
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Início',    route: '/(app)/(dashboard)', icon: 'home-outline',         activeIcon: 'home' },
  { label: 'Feiras',   route: '/(app)/(feiras)',    icon: 'cart-outline',          activeIcon: 'cart' },
  { label: 'Produtos', route: '/(app)/(produtos)',  icon: 'list-outline',          activeIcon: 'list' },
  { label: 'Comparar', route: '/(app)/(comparar)',  icon: 'git-compare-outline',   activeIcon: 'git-compare' },
]

function UserAvatar({ email }: { email: string }) {
  const c = useColors()
  const initials = email.slice(0, 2).toUpperCase()

  return (
    <View
      style={{
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: c.primary,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>{initials}</Text>
    </View>
  )
}

export function DrawerContent(props: DrawerContentComponentProps) {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const { session } = useAuth()
  const email = session?.user.email ?? ''

  // Determine active route from drawer state
  const activeIndex = props.state.index
  const activeRoute = props.state.routes[activeIndex]?.name ?? ''

  function handleLogout() {
    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          props.navigation.closeDrawer()
          await supabase.auth.signOut()
        },
      },
    ])
  }

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flex: 1 }}
      scrollEnabled={false}
    >
      <View style={{ flex: 1, paddingBottom: insets.bottom + 16 }}>

        {/* Profile */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 24,
            borderBottomWidth: 1,
            borderColor: c.border,
            gap: 12,
          }}
        >
          <UserAvatar email={email} />
          <View style={{ gap: 2 }}>
            <Text style={{ fontSize: 13, color: c.subtext }}>Logado como</Text>
            <Text
              selectable
              numberOfLines={1}
              style={{ fontSize: 14, fontWeight: '600', color: c.text }}
            >
              {email}
            </Text>
          </View>
        </View>

        {/* Nav items */}
        <View style={{ paddingTop: 12, flex: 1, gap: 2, paddingHorizontal: 12 }}>
          {NAV_ITEMS.map((item) => {
            const isActive = activeRoute.includes(item.route.split('/').pop() ?? '')
            return (
              <Pressable
                key={item.route}
                onPress={() => {
                  props.navigation.closeDrawer()
                  router.push(item.route as any)
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row' as const,
                  alignItems: 'center' as const,
                  gap: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 13,
                  borderRadius: 14,
                  backgroundColor: isActive
                    ? PRIMARY + '18'
                    : pressed
                    ? c.inputBg
                    : 'transparent',
                })}
              >
                <Ionicons
                  name={isActive ? item.activeIcon : item.icon}
                  size={22}
                  color={isActive ? c.primary : c.subtext}
                />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: isActive ? '600' : '400',
                    color: isActive ? c.primary : c.text,
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            )
          })}
        </View>

        {/* Footer */}
        <View
          style={{
            paddingHorizontal: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderColor: c.border,
          }}
        >
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => ({
              flexDirection: 'row' as const,
              alignItems: 'center' as const,
              gap: 14,
              paddingHorizontal: 14,
              paddingVertical: 13,
              borderRadius: 14,
              backgroundColor: pressed ? '#FEF2F2' : 'transparent',
            })}
          >
            <Ionicons name="log-out-outline" size={22} color={c.danger} />
            <Text style={{ fontSize: 16, fontWeight: '500', color: c.danger }}>Sair</Text>
          </Pressable>
        </View>
      </View>
    </DrawerContentScrollView>
  )
}
