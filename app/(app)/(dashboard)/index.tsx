import { Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { SpendingChart } from '@/components/dashboard/spending-chart'
import { CategoryChart } from '@/components/dashboard/category-chart'
import { PriceHistory } from '@/components/dashboard/price-history'
import { Loading } from '@/components/ui/loading'
import { useColors, CARD_SHADOW, PRIMARY } from '@/constants/colors'
import { useDashboard } from '@/hooks/use-dashboard'
import { useAuth } from '@/hooks/use-auth'
import { formatCurrency, formatDateShort } from '@/lib/format'

// ─── Mini Avatar ─────────────────────────────────────────────────────────────

function Avatar({ email, size = 44 }: { email: string; size?: number }) {
  const initials = email.slice(0, 2).toUpperCase()
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2.6,
        backgroundColor: 'rgba(255,255,255,0.25)',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ color: '#fff', fontSize: size * 0.38, fontWeight: '800' }}>{initials}</Text>
    </View>
  )
}

// ─── Hero Gradient Card ───────────────────────────────────────────────────────

function HeroCard({
  totalSpent,
  trend,
  lastFeiraDate,
  email,
  greeting,
}: {
  totalSpent: number
  trend: number | null
  lastFeiraDate: string | null
  email: string
  greeting: string
}) {
  const c = useColors()

  const trendColor = trend !== null && trend > 0 ? '#FFCDD2' : '#C8F5D8'
  const trendIcon: keyof typeof Ionicons.glyphMap =
    trend !== null && trend > 0 ? 'trending-up' : trend !== null ? 'trending-down' : 'remove'

  return (
    <LinearGradient
      colors={['#1E9E65', PRIMARY, '#1A7A4F']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 28, padding: 24, gap: 20 }}
    >
      {/* Top row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '500' }}>
            {greeting} 👋
          </Text>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 2 }}>
            Home Market
          </Text>
        </View>
        <Avatar email={email} />
      </View>

      {/* Spending total */}
      <View style={{ gap: 4 }}>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' }}>
          Total investido
        </Text>
        <Text style={{ color: '#fff', fontSize: 38, fontWeight: '900', fontVariant: ['tabular-nums'], lineHeight: 44 }}>
          {formatCurrency(totalSpent)}
        </Text>
        {lastFeiraDate && (
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
            Última feira: {formatDateShort(lastFeiraDate)}
          </Text>
        )}
      </View>

      {/* Trend pill */}
      {trend !== null && (
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              backgroundColor: 'rgba(0,0,0,0.2)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
            }}
          >
            <Ionicons name={trendIcon} size={14} color={trendColor} />
            <Text style={{ color: trendColor, fontSize: 13, fontWeight: '700' }}>
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}% vs feira anterior
            </Text>
          </View>
        </View>
      )}

      {/* Decorative circles */}
      <View
        style={{
          position: 'absolute',
          right: -20,
          top: -20,
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: 'rgba(255,255,255,0.06)',
        }}
        pointerEvents="none"
      />
      <View
        style={{
          position: 'absolute',
          right: 30,
          bottom: -30,
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: 'rgba(255,255,255,0.05)',
        }}
        pointerEvents="none"
      />
    </LinearGradient>
  )
}

// ─── Quick Action Button ──────────────────────────────────────────────────────

function QuickAction({
  icon,
  label,
  sublabel,
  accent,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  sublabel: string
  accent: string
  onPress: () => void
}) {
  const c = useColors()
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: pressed ? c.card : c.card,
        borderRadius: 20,
        padding: 16,
        gap: 10,
        opacity: pressed ? 0.85 : 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
        ...(c.isDark ? {} : CARD_SHADOW),
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 15,
          backgroundColor: accent + '18',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Ionicons name={icon} size={22} color={accent} />
      </View>
      <View>
        <Text style={{ fontSize: 14, fontWeight: '700', color: c.text }}>{label}</Text>
        <Text style={{ fontSize: 11, color: c.subtext, marginTop: 2 }}>{sublabel}</Text>
      </View>
    </Pressable>
  )
}

// ─── Section Title ────────────────────────────────────────────────────────────

function SectionTitle({ label }: { label: string }) {
  const c = useColors()
  return (
    <Text
      style={{
        fontSize: 17,
        fontWeight: '800',
        color: c.text,
        paddingHorizontal: 2,
      }}
    >
      {label}
    </Text>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const { session } = useAuth()
  const { data, isLoading, isError, refetch } = useDashboard()

  if (isLoading) return <Loading />

  const hasData = (data?.totalFeiras ?? 0) > 0
  const email = session?.user.email ?? ''
  const firstName = email.split('@')[0] ?? ''

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 120,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Card ── */}
        <Animated.View entering={FadeInDown.delay(0).springify()}>
          <HeroCard
            totalSpent={data?.totalSpent ?? 0}
            trend={data?.trend ?? null}
            lastFeiraDate={data?.lastFeiraDate ?? null}
            email={email}
            greeting={greeting}
          />
        </Animated.View>

        {/* ── Error banner ── */}
        {isError && (
          <Pressable
            onPress={() => refetch()}
            style={{
              backgroundColor: c.danger + '15',
              borderRadius: 16,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              borderWidth: 1,
              borderColor: c.danger + '30',
            }}
          >
            <Ionicons name="alert-circle" size={20} color={c.danger} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: c.danger }}>
                Erro ao carregar dados
              </Text>
              <Text style={{ fontSize: 12, color: c.danger + 'CC' }}>Toque para tentar novamente</Text>
            </View>
          </Pressable>
        )}

        {/* ── Quick Actions ── */}
        <Animated.View entering={FadeInDown.delay(80).springify()} style={{ gap: 12 }}>
          <SectionTitle label="Acesso rápido" />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <QuickAction
              icon="cart"
              label="Nova Feira"
              sublabel="Registar compras"
              accent={PRIMARY}
              onPress={() => router.push('/(app)/(feiras)/new')}
            />
            <QuickAction
              icon="list"
              label="Ver Feiras"
              sublabel="Histórico completo"
              accent="#6366F1"
              onPress={() => router.push('/(app)/(feiras)')}
            />
            <QuickAction
              icon="trending-up"
              label="Preços"
              sublabel="Comparar itens"
              accent="#F59E0B"
              onPress={() => router.push('/(app)/(comparativos)')}
            />
          </View>
        </Animated.View>

        {/* ── KPI Row ── */}
        <Animated.View entering={FadeInDown.delay(160).springify()} style={{ gap: 12 }}>
          <SectionTitle label="Resumo" />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <KpiCard
              title="Total de feiras"
              value={String(data?.totalFeiras ?? 0)}
              subtitle={data?.lastFeiraDate ? `Última: ${formatDateShort(data.lastFeiraDate)}` : 'nenhuma ainda'}
              index={0}
              accent="#6366F1"
            />
            <KpiCard
              title="Média por feira"
              value={formatCurrency(data?.averagePerFeira ?? 0)}
              index={1}
              accent="#F59E0B"
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <KpiCard
              title="Produtos"
              value={String(data?.productCount ?? 0)}
              subtitle="cadastrados"
              index={2}
              accent="#EC4899"
            />
            <KpiCard
              title="Última feira"
              value={data?.trend != null
                ? `${data.trend > 0 ? '+' : ''}${data.trend.toFixed(1)}%`
                : '—'}
              subtitle="vs feira anterior"
              trend={data?.trend ?? null}
              index={3}
            />
          </View>
        </Animated.View>

        {/* ── Onboarding ── */}
        {!hasData && (
          <Animated.View entering={FadeInDown.delay(240).springify()}>
            <View
              style={{
                backgroundColor: c.card,
                borderRadius: 24,
                padding: 28,
                alignItems: 'center',
                gap: 14,
                ...(c.isDark ? {} : CARD_SHADOW),
              }}
            >
              <Text style={{ fontSize: 52 }}>🛒</Text>
              <Text style={{ fontSize: 18, fontWeight: '800', color: c.text, textAlign: 'center' }}>
                Comece agora!
              </Text>
              <Text style={{ fontSize: 14, color: c.subtext, textAlign: 'center', lineHeight: 22 }}>
                Registe a sua primeira feira para ver os gráficos e a análise de gastos aqui.
              </Text>
              <Pressable
                onPress={() => router.push('/(app)/(feiras)/new')}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? PRIMARY + 'CC' : PRIMARY,
                  paddingHorizontal: 28,
                  paddingVertical: 14,
                  borderRadius: 16,
                  marginTop: 4,
                })}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                  Criar primeira feira
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* ── Charts ── */}
        {hasData && (
          <Animated.View entering={FadeInDown.delay(240).springify()} style={{ gap: 20 }}>
            <SectionTitle label="Gastos ao longo do tempo" />
            <SpendingChart data={data?.spendingOverTime ?? []} />

            <SectionTitle label="Por categoria" />
            <CategoryChart data={data?.categoryBreakdown ?? []} />

            <SectionTitle label="Variação de preços" />
            <PriceHistory data={data?.priceHistory ?? []} />
          </Animated.View>
        )}
      </ScrollView>
    </View>
  )
}
