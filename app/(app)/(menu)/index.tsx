import { Alert, Pressable, ScrollView, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useColors, CARD_SHADOW, PRIMARY } from '@/constants/colors'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'

// ─── Profile Hero ─────────────────────────────────────────────────────────────

function ProfileHero({ email }: { email: string }) {
  const firstName = email.split('@')[0] ?? ''
  const initials  = email.slice(0, 2).toUpperCase()

  return (
    <LinearGradient
      colors={['#1E9E65', PRIMARY, '#1A7A4F']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 28, padding: 24, gap: 16 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        {/* Avatar */}
        <View
          style={{
            width: 72, height: 72, borderRadius: 24,
            backgroundColor: 'rgba(255,255,255,0.25)',
            borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.5)',
            justifyContent: 'center', alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900' }}>{initials}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '500' }}>
            Bem-vindo de volta
          </Text>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 2 }}>
            {firstName.charAt(0).toUpperCase() + firstName.slice(1)}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 }} numberOfLines={1}>
            {email}
          </Text>
        </View>
      </View>

      {/* Status pill */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: 'rgba(0,0,0,0.2)',
            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
          }}
        >
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80' }} />
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600' }}>
            Conta ativa · Sincronizada
          </Text>
        </View>
      </View>

      {/* Decorative */}
      <View style={{ position: 'absolute', right: -16, top: -16, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.06)' }} pointerEvents="none" />
    </LinearGradient>
  )
}

// ─── Menu Row ─────────────────────────────────────────────────────────────────

type RowProps = {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  sublabel?: string
  accent: string
  onPress?: () => void
  danger?: boolean
  last?: boolean
}

function MenuRow({ icon, label, sublabel, accent, onPress, danger, last }: RowProps) {
  const c = useColors()
  return (
    <>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          paddingVertical: 14,
          paddingHorizontal: 16,
          backgroundColor: pressed ? c.inputBg : 'transparent',
        })}
      >
        <View
          style={{
            width: 40, height: 40, borderRadius: 13,
            backgroundColor: accent + '20',
            justifyContent: 'center', alignItems: 'center',
          }}
        >
          <Ionicons name={icon} size={20} color={accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: danger ? c.danger : c.text }}>{label}</Text>
          {sublabel && <Text style={{ fontSize: 12, color: c.subtext, marginTop: 1 }}>{sublabel}</Text>}
        </View>
        {!danger && <Ionicons name="chevron-forward" size={16} color={c.border} />}
      </Pressable>
      {!last && <View style={{ height: 1, backgroundColor: c.border, marginHorizontal: 16 }} />}
    </>
  )
}

// ─── Section ─────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const c = useColors()
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: c.subtext, letterSpacing: 0.5, textTransform: 'uppercase', paddingHorizontal: 4 }}>
        {title}
      </Text>
      <View style={{ backgroundColor: c.card, borderRadius: 20, overflow: 'hidden', ...(c.isDark ? {} : CARD_SHADOW) }}>
        {children}
      </View>
    </View>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MenuScreen() {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const { session } = useAuth()
  const email = session?.user.email ?? ''

  function handleLogout() {
    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ])
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 120,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Page title */}
        <View>
          <Text style={{ fontSize: 28, fontWeight: '900', color: c.text }}>Menu</Text>
          <Text style={{ fontSize: 13, color: c.subtext, marginTop: 2 }}>Perfil e configurações</Text>
        </View>

        {/* Profile hero */}
        <ProfileHero email={email} />

        {/* Account section */}
        <Section title="Conta">
          <MenuRow icon="person-outline" label="Perfil" sublabel={email} accent="#6366F1" />
          <MenuRow icon="notifications-outline" label="Notificações" sublabel="Em breve" accent="#F59E0B" />
          <MenuRow icon="color-palette-outline" label="Aparência" sublabel="Segue o sistema" accent="#EC4899" last />
        </Section>

        {/* Data section */}
        <Section title="Dados & Privacidade">
          <MenuRow icon="cloud-outline" label="Sincronização" sublabel="Ativa" accent={PRIMARY} />
          <MenuRow icon="shield-checkmark-outline" label="Privacidade" sublabel="Os seus dados são seus" accent="#10B981" last />
        </Section>

        {/* App section */}
        <Section title="Aplicação">
          <MenuRow icon="information-circle-outline" label="Sobre o Home Market" sublabel="Versão 1.0" accent="#6366F1" />
          <MenuRow icon="star-outline" label="Avaliar a app" sublabel="Ajude-nos a melhorar" accent="#F59E0B" last />
        </Section>

        {/* Session section */}
        <Section title="Sessão">
          <MenuRow icon="log-out-outline" label="Sair da conta" accent={c.danger} onPress={handleLogout} danger last />
        </Section>
      </ScrollView>
    </View>
  )
}
