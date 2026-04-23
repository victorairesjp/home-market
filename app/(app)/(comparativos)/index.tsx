import { useMemo, useState } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Loading } from '@/components/ui/loading'
import { EmptyState } from '@/components/ui/empty-state'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { useColors, CARD_SHADOW } from '@/constants/colors'
import { CATEGORY_COLORS } from '@/constants/app'
import { usePriceHistory, type ProductPriceHistory } from '@/hooks/use-price-history'
import { formatCurrency, formatDateShort } from '@/lib/format'

type FilterMode = 'all' | 'rising' | 'falling'

// ─── Price Badge ──────────────────────────────────────────────────────────────

function PriceBadge({ change, percent }: { change: number; percent: number | null }) {
  const c = useColors()
  const up = change > 0
  const neutral = change === 0
  const color = neutral ? c.subtext : up ? c.danger : c.success
  const icon: keyof typeof Ionicons.glyphMap = neutral ? 'remove' : up ? 'trending-up' : 'trending-down'

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: color + '18',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
      }}
    >
      <Ionicons name={icon} size={13} color={color} />
      <Text style={{ fontSize: 12, fontWeight: '700', color }}>
        {up ? '+' : ''}
        {formatCurrency(change)}
        {percent !== null ? ` (${percent > 0 ? '+' : ''}${percent.toFixed(1)}%)` : ''}
      </Text>
    </View>
  )
}

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────

function MiniBarChart({ history, c }: { history: ProductPriceHistory['history']; c: ReturnType<typeof useColors> }) {
  const pts = history.slice(0, 6).reverse()
  if (pts.length < 2) return null
  const max = Math.max(...pts.map((p) => p.unitPrice))
  const min = Math.min(...pts.map((p) => p.unitPrice))
  const range = max - min || 1

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 32 }}>
      {pts.map((p, i) => {
        const h = Math.max(4, ((p.unitPrice - min) / range) * 28 + 4)
        const isLast = i === pts.length - 1
        return (
          <View
            key={i}
            style={{ width: 7, height: h, borderRadius: 4, backgroundColor: isLast ? c.primary : c.primary + '40' }}
          />
        )
      })}
    </View>
  )
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ item }: { item: ProductPriceHistory }) {
  const c = useColors()
  const [expanded, setExpanded] = useState(false)
  const catColor = CATEGORY_COLORS[item.category] ?? '#9E9E9E'

  return (
    <Pressable onPress={() => setExpanded((v) => !v)}>
      <View style={{ backgroundColor: c.card, borderRadius: 20, padding: 16, gap: 12, ...(c.isDark ? {} : CARD_SHADOW) }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 46, height: 46, borderRadius: 15,
              backgroundColor: catColor + '20',
              justifyContent: 'center', alignItems: 'center', flexShrink: 0,
            }}
          >
            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: catColor }} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: c.text }} numberOfLines={1}>{item.name}</Text>
            <Text style={{ fontSize: 12, color: c.subtext }}>
              {item.category} · {item.purchaseCount} {item.purchaseCount === 1 ? 'compra' : 'compras'}
            </Text>
          </View>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={c.subtext} />
        </View>

        {/* Price + chart */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ gap: 2 }}>
            <Text style={{ fontSize: 11, color: c.subtext, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              Preço atual
            </Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: c.text, fontVariant: ['tabular-nums'] }}>
              {formatCurrency(item.latestPrice)}
              <Text style={{ fontSize: 12, fontWeight: '500', color: c.subtext }}>/{item.unit}</Text>
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            {item.priceChange !== null && (
              <PriceBadge change={item.priceChange} percent={item.priceChangePercent} />
            )}
            <MiniBarChart history={item.history} c={c} />
          </View>
        </View>

        {/* Expanded history timeline */}
        {expanded && item.history.length > 0 && (
          <View style={{ borderTopWidth: 1, borderColor: c.border, paddingTop: 12, gap: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: c.subtext, textTransform: 'uppercase', letterSpacing: 0.3 }}>
              Histórico de preços
            </Text>
            {item.history.map((pt, i) => {
              const prevPrice = item.history[i + 1]?.unitPrice ?? null
              const diff = prevPrice !== null ? pt.unitPrice - prevPrice : null
              return (
                <View key={`${pt.feiraId}-${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i === 0 ? c.primary : c.border, flexShrink: 0 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, color: c.text, fontWeight: i === 0 ? '600' : '400' }} numberOfLines={1}>
                      {pt.feiraName}
                    </Text>
                    <Text style={{ fontSize: 11, color: c.subtext }}>{formatDateShort(pt.date)}</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: i === 0 ? '700' : '400', color: i === 0 ? c.primary : c.subtext, fontVariant: ['tabular-nums'] }}>
                    {formatCurrency(pt.unitPrice)}/{item.unit}
                  </Text>
                  {diff !== null && (
                    <Ionicons
                      name={diff > 0 ? 'trending-up' : diff < 0 ? 'trending-down' : 'remove'}
                      size={14}
                      color={diff > 0 ? c.danger : diff < 0 ? c.success : c.subtext}
                    />
                  )}
                </View>
              )
            })}
          </View>
        )}
      </View>
    </Pressable>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ComparativosScreen() {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const { data = [], isLoading } = usePriceHistory()
  const [filter, setFilter] = useState<FilterMode>('all')

  const rising  = useMemo(() => data.filter((p) => (p.priceChange ?? 0) > 0), [data])
  const falling = useMemo(() => data.filter((p) => (p.priceChange ?? 0) < 0), [data])
  const stable  = useMemo(() => data.filter((p) => p.priceChange === 0 || p.priceChange === null), [data])

  const filtered = useMemo(() => {
    if (filter === 'rising')  return rising
    if (filter === 'falling') return falling
    return data
  }, [data, filter, rising, falling])

  if (isLoading) return <Loading />

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.productId)}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 120,
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ gap: 16, marginBottom: 4 }}>
            {/* ── Header ── */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 28, fontWeight: '900', color: c.text }}>Comparativos</Text>
                <Text style={{ fontSize: 13, color: c.subtext, marginTop: 2 }}>
                  Evolução de preços dos seus produtos
                </Text>
              </View>
              <View
                style={{
                  width: 44, height: 44, borderRadius: 15,
                  backgroundColor: c.primary + '18',
                  justifyContent: 'center', alignItems: 'center',
                }}
              >
                <Ionicons name="trending-up" size={22} color={c.primary} />
              </View>
            </View>

            {/* ── Stats gradient cards ── */}
            {data.length > 0 && (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {/* Rising */}
                <Pressable
                  onPress={() => setFilter(filter === 'rising' ? 'all' : 'rising')}
                  style={{ flex: 1 }}
                >
                  <LinearGradient
                    colors={[c.danger + 'CC', c.danger]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 20, padding: 16, alignItems: 'center', gap: 6,
                      opacity: filter === 'falling' ? 0.5 : 1,
                    }}
                  >
                    <Ionicons name="trending-up" size={22} color="#fff" />
                    <Text style={{ fontSize: 28, fontWeight: '900', color: '#fff' }}>{rising.length}</Text>
                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '600' }}>Subiram</Text>
                  </LinearGradient>
                </Pressable>

                {/* Falling */}
                <Pressable
                  onPress={() => setFilter(filter === 'falling' ? 'all' : 'falling')}
                  style={{ flex: 1 }}
                >
                  <LinearGradient
                    colors={[c.success + 'CC', c.success]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 20, padding: 16, alignItems: 'center', gap: 6,
                      opacity: filter === 'rising' ? 0.5 : 1,
                    }}
                  >
                    <Ionicons name="trending-down" size={22} color="#fff" />
                    <Text style={{ fontSize: 28, fontWeight: '900', color: '#fff' }}>{falling.length}</Text>
                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '600' }}>Baixaram</Text>
                  </LinearGradient>
                </Pressable>

                {/* Stable */}
                <View
                  style={{
                    flex: 1,
                    backgroundColor: c.card,
                    borderRadius: 20,
                    padding: 16,
                    alignItems: 'center',
                    gap: 6,
                    ...(c.isDark ? {} : CARD_SHADOW),
                  }}
                >
                  <Ionicons name="remove-circle-outline" size={22} color={c.subtext} />
                  <Text style={{ fontSize: 28, fontWeight: '900', color: c.text }}>{stable.length}</Text>
                  <Text style={{ fontSize: 12, color: c.subtext, fontWeight: '600' }}>Estáveis</Text>
                </View>
              </View>
            )}

            {/* ── Filter ── */}
            {data.length > 0 && (
              <SegmentedControl<FilterMode>
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'all',     label: 'Todos' },
                  { value: 'rising',  label: '↑ Subiram' },
                  { value: 'falling', label: '↓ Baixaram' },
                ]}
              />
            )}

            {/* ── Section label ── */}
            {data.length > 0 && (
              <Text style={{ fontSize: 13, fontWeight: '700', color: c.subtext, letterSpacing: 0.3, textTransform: 'uppercase' }}>
                {filtered.length} {filtered.length === 1 ? 'produto' : 'produtos'}
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => <ProductCard item={item} />}
        ListEmptyComponent={
          data.length === 0 ? (
            <EmptyState
              icon="📊"
              title="Sem histórico ainda"
              description="Crie feiras e adicione itens para ver a evolução de preços aqui."
            />
          ) : (
            <EmptyState icon="🔍" title="Nenhum resultado" description="Nenhum produto neste filtro." />
          )
        }
      />
    </View>
  )
}
