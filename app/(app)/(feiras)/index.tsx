import { useMemo, useState } from 'react'
import { FlatList, Pressable, TextInput as RNTextInput, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { FeiraCard } from '@/components/feiras/feira-card'
import { FeiraEditForm } from '@/components/feiras/feira-form'
import { EmptyState } from '@/components/ui/empty-state'
import { Loading } from '@/components/ui/loading'
import { useColors, CARD_SHADOW, PRIMARY } from '@/constants/colors'
import { useFeiras } from '@/hooks/use-feiras'
import { formatCurrency, formatDateShort } from '@/lib/format'
import type { Feira } from '@/types/database'

export default function FeirasScreen() {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const { data: feiras, isLoading } = useFeiras()
  const [search, setSearch] = useState('')
  const [editingFeira, setEditingFeira] = useState<Feira | null>(null)

  const filtered = useMemo(() => {
    if (!feiras) return []
    const q = search.trim().toLowerCase()
    if (!q) return feiras
    return feiras.filter(
      (f) => f.name.toLowerCase().includes(q) || f.store.toLowerCase().includes(q)
    )
  }, [feiras, search])

  const stats = useMemo(() => {
    if (!feiras || feiras.length === 0) return { total: 0, sum: 0, avg: 0 }
    const sum = feiras.reduce((acc, f) => acc + f.total, 0)
    return { total: feiras.length, sum, avg: sum / feiras.length }
  }, [feiras])

  const lastFeira = feiras && feiras.length > 0 ? feiras[0] : null

  if (isLoading) return <Loading />

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 120,
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ gap: 16, marginBottom: 4 }}>
            {/* ── Top bar ── */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 28, fontWeight: '900', color: c.text }}>Feiras</Text>
                <Text style={{ fontSize: 13, color: c.subtext, marginTop: 2 }}>
                  {stats.total > 0 ? `${stats.total} registadas` : 'Sem feiras ainda'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  onPress={() => router.push('/(app)/(feiras)/scan')}
                  style={({ pressed }) => ({
                    width: 42,
                    height: 42,
                    borderRadius: 13,
                    backgroundColor: pressed ? c.inputBg : c.card,
                    justifyContent: 'center',
                    alignItems: 'center',
                    ...(c.isDark ? {} : CARD_SHADOW),
                  })}
                >
                  <Ionicons name="scan-outline" size={20} color={c.text} />
                </Pressable>
                <Pressable
                  onPress={() => router.push('/(app)/(feiras)/new')}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 16,
                    height: 42,
                    borderRadius: 13,
                    backgroundColor: pressed ? PRIMARY + 'CC' : PRIMARY,
                    ...(c.isDark
                      ? {}
                      : {
                          shadowColor: PRIMARY,
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 8,
                          elevation: 6,
                        }),
                  })}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Feira</Text>
                </Pressable>
              </View>
            </View>

            {/* ── Stats row ── */}
            {stats.total > 0 && (
              <Animated.View entering={FadeInDown.delay(60).springify()}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <StatBox icon="receipt-outline" label="Feiras" value={String(stats.total)} accent="#6366F1" c={c} />
                  <StatBox icon="wallet-outline" label="Total" value={formatCurrency(stats.sum)} accent={PRIMARY} c={c} />
                  <StatBox icon="bar-chart-outline" label="Média" value={formatCurrency(stats.avg)} accent="#F59E0B" c={c} />
                </View>
              </Animated.View>
            )}

            {/* ── Last feira highlight ── */}
            {lastFeira && !search.trim() && (
              <Animated.View entering={FadeInDown.delay(120).springify()}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: c.subtext, letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 8 }}>
                  Última feira
                </Text>
                <Pressable
                  onPress={() => router.push(`/(app)/(feiras)/${lastFeira.id}`)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] })}
                >
                  <LinearGradient
                    colors={['#1E9E65', PRIMARY]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 24, padding: 20, gap: 14 }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 16,
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Ionicons name="cart" size={24} color="#fff" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }} numberOfLines={1}>
                          {lastFeira.name}
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 }}>
                          {lastFeira.store}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', gap: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.7)" />
                          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                            {formatDateShort(lastFeira.date)}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <Ionicons name="cube-outline" size={13} color="rgba(255,255,255,0.7)" />
                          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                            {lastFeira.item_count} {lastFeira.item_count === 1 ? 'item' : 'itens'}
                          </Text>
                        </View>
                      </View>
                      <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
                        {formatCurrency(lastFeira.total)}
                      </Text>
                    </View>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            )}

            {/* ── Search ── */}
            {stats.total > 0 && (
              <Animated.View entering={FadeInDown.delay(180).springify()}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    backgroundColor: c.card,
                    borderRadius: 16,
                    paddingHorizontal: 14,
                    height: 50,
                    ...(c.isDark ? {} : CARD_SHADOW),
                  }}
                >
                  <Ionicons name="search" size={18} color={c.subtext} />
                  <RNTextInput
                    placeholder="Buscar feira ou loja..."
                    placeholderTextColor={c.subtext}
                    value={search}
                    onChangeText={setSearch}
                    style={{ flex: 1, fontSize: 15, color: c.text }}
                    autoCapitalize="none"
                    clearButtonMode="while-editing"
                  />
                </View>
              </Animated.View>
            )}

            {/* ── List section label ── */}
            {stats.total > 0 && (
              <Text style={{ fontSize: 13, fontWeight: '700', color: c.subtext, letterSpacing: 0.3, textTransform: 'uppercase' }}>
                {search.trim() ? `Resultados (${filtered.length})` : 'Todas as feiras'}
              </Text>
            )}
          </View>
        }
        renderItem={({ item, index }) => (
          <FeiraCard
            id={item.id}
            name={item.name}
            store={item.store}
            date={item.date}
            itemCount={item.item_count}
            total={item.total}
            index={index}
            onEdit={() => setEditingFeira(item)}
          />
        )}
        ListEmptyComponent={
          search.trim() ? (
            <EmptyState
              icon="🔍"
              title="Nenhuma feira encontrada"
              description={`Não há feiras que correspondam a "${search}".`}
            />
          ) : (
            <View style={{ alignItems: 'center', paddingTop: 20, gap: 20 }}>
              <EmptyState
                icon="🛒"
                title="Nenhuma feira ainda"
                description="Registe a sua primeira compra para começar a acompanhar os seus gastos."
              />
              <Pressable
                onPress={() => router.push('/(app)/(feiras)/new')}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? PRIMARY + 'CC' : PRIMARY,
                  paddingHorizontal: 28,
                  paddingVertical: 14,
                  borderRadius: 16,
                })}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Nova Feira</Text>
              </Pressable>
            </View>
          )
        }
      />

      {editingFeira && (
        <FeiraEditForm
          visible={!!editingFeira}
          onClose={() => setEditingFeira(null)}
          feira={editingFeira}
        />
      )}
    </View>
  )
}

function StatBox({
  icon,
  label,
  value,
  accent,
  c,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  value: string
  accent: string
  c: ReturnType<typeof useColors>
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.card,
        borderRadius: 16,
        padding: 14,
        gap: 8,
        ...(c.isDark ? {} : CARD_SHADOW),
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: accent + '18',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Ionicons name={icon} size={16} color={accent} />
      </View>
      <View>
        <Text style={{ fontSize: 10, color: c.subtext, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 }}>
          {label}
        </Text>
        <Text
          style={{ fontSize: 13, fontWeight: '800', color: c.text, fontVariant: ['tabular-nums'], marginTop: 2 }}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {value}
        </Text>
      </View>
    </View>
  )
}
