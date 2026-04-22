import { Pressable, ScrollView, Text, View } from 'react-native'
import { router, Stack } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { SpendingChart } from '@/components/dashboard/spending-chart'
import { CategoryChart } from '@/components/dashboard/category-chart'
import { PriceHistory } from '@/components/dashboard/price-history'
import { Card } from '@/components/ui/card'
import { Loading } from '@/components/ui/loading'
import { useColors } from '@/constants/colors'
import { useDashboard } from '@/hooks/use-dashboard'
import { useAuth } from '@/hooks/use-auth'
import { formatCurrency, formatDateShort } from '@/lib/format'

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: string
  label: string
  onPress: () => void
}) {
  const c = useColors()
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: 'center' as const,
        gap: 8,
        padding: 16,
        borderRadius: 14,
        backgroundColor: pressed ? c.inputBg : c.card,
        borderWidth: 1,
        borderColor: c.border,
      })}
    >
      <Text style={{ fontSize: 28 }}>{icon}</Text>
      <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, textAlign: 'center' }}>
        {label}
      </Text>
    </Pressable>
  )
}

export default function DashboardScreen() {
  const c = useColors()
  const { session } = useAuth()
  const { data, isLoading, isError, refetch } = useDashboard()

  if (isLoading) return <Loading />

  const hasData = (data?.totalFeiras ?? 0) > 0

  return (
    <>
      <Stack.Screen options={{ title: 'Início' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 48 }}
      >
        {/* Greeting */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={{ gap: 2 }}>
          <Text style={{ fontSize: 13, color: c.subtext }}>{session?.user.email}</Text>
          <Text style={{ fontSize: 22, fontWeight: '700', color: c.text }}>Visão Geral</Text>
        </Animated.View>

        {/* Error banner */}
        {isError && (
          <Animated.View entering={FadeInDown.springify()}>
            <Pressable
              onPress={() => refetch()}
              style={{
                backgroundColor: '#FEF2F2',
                borderRadius: 12,
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Text style={{ fontSize: 16 }}>⚠️</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: c.danger }}>
                  Erro ao carregar dados
                </Text>
                <Text style={{ fontSize: 12, color: c.danger }}>
                  Toque para tentar novamente
                </Text>
              </View>
            </Pressable>
          </Animated.View>
        )}

        {/* KPIs — always visible */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <KpiCard
              title="Total Gasto"
              value={formatCurrency(data?.totalSpent ?? 0)}
              trend={data?.trend ?? null}
              subtitle={data?.trend != null ? 'vs última feira' : undefined}
              index={0}
            />
          </View>
          <View style={{ flex: 1 }}>
            <KpiCard
              title="Média por Feira"
              value={formatCurrency(data?.averagePerFeira ?? 0)}
              index={1}
            />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <KpiCard
              title="Total de Feiras"
              value={String(data?.totalFeiras ?? 0)}
              subtitle={
                data?.lastFeiraDate
                  ? `Última: ${formatDateShort(data.lastFeiraDate)}`
                  : 'nenhuma ainda'
              }
              index={2}
            />
          </View>
          <View style={{ flex: 1 }}>
            <KpiCard
              title="Produtos"
              value={String(data?.productCount ?? 0)}
              subtitle="cadastrados"
              index={3}
            />
          </View>
        </View>

        {/* No data: onboarding cards */}
        {!hasData ? (
          <Animated.View entering={FadeInDown.delay(320).springify()} style={{ gap: 14 }}>
            <Card style={{ gap: 10, alignItems: 'center', paddingVertical: 28 }}>
              <Text style={{ fontSize: 44 }}>🛒</Text>
              <Text style={{ fontSize: 17, fontWeight: '700', color: c.text, textAlign: 'center' }}>
                Bem-vindo ao Home Market!
              </Text>
              <Text style={{ fontSize: 14, color: c.subtext, textAlign: 'center', lineHeight: 20 }}>
                Cadastre produtos e registre suas feiras para ver os gráficos e análises de gastos aqui.
              </Text>
            </Card>

            <Text style={{ fontSize: 14, fontWeight: '600', color: c.subtext }}>
              Por onde começar
            </Text>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <QuickAction
                icon="🥕"
                label="Cadastrar Produtos"
                onPress={() => router.push('/(app)/(produtos)')}
              />
              <QuickAction
                icon="🛒"
                label="Nova Feira"
                onPress={() => router.push('/(app)/(feiras)/new')}
              />
            </View>
          </Animated.View>
        ) : (
          <>
            <SpendingChart data={data?.spendingOverTime ?? []} />
            <CategoryChart data={data?.categoryBreakdown ?? []} />
            <PriceHistory data={data?.priceHistory ?? []} />
          </>
        )}
      </ScrollView>
    </>
  )
}
