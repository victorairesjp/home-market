import { useMemo, useState } from 'react'
import { Modal, Pressable, ScrollView, SectionList, Text, View } from 'react-native'
import { Stack } from 'expo-router'
import { Card } from '@/components/ui/card'
import { Loading } from '@/components/ui/loading'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { useColors, WARNING } from '@/constants/colors'
import { useFeiras, useFeiraDetail } from '@/hooks/use-feiras'
import { formatCurrency, formatDateShort, formatPercent } from '@/lib/format'
import type { FeiraWithSummary, FeiraItemWithProduct, FeiraWithItems } from '@/types/database'

// ── Types ────────────────────────────────────────────────────────────────────

type ItemStatus = 'only_a' | 'only_b' | 'diff' | 'same'
type ViewMode = 'diff' | 'all'

type CompareRow = {
  productId: number
  productName: string
  category: string
  unit: string
  status: ItemStatus
  qtyA: number | null
  priceA: number | null
  totalA: number | null
  qtyB: number | null
  priceB: number | null
  totalB: number | null
  priceDiff: number | null
  totalDiff: number | null
}

// ── Comparison logic ──────────────────────────────────────────────────────────

function buildComparison(feiraA: FeiraWithItems, feiraB: FeiraWithItems): CompareRow[] {
  const mapA = new Map<number, FeiraItemWithProduct>()
  const mapB = new Map<number, FeiraItemWithProduct>()
  for (const item of feiraA.feira_items) mapA.set(item.product_id, item)
  for (const item of feiraB.feira_items) mapB.set(item.product_id, item)

  const allIds = new Set([...mapA.keys(), ...mapB.keys()])
  const rows: CompareRow[] = []

  for (const pid of allIds) {
    const a = mapA.get(pid)
    const b = mapB.get(pid)
    const product = (a ?? b)!.products

    const qtyA = a?.quantity ?? null
    const priceA = a ? Number(a.unit_price) : null
    const totalA = a ? a.quantity * Number(a.unit_price) : null
    const qtyB = b?.quantity ?? null
    const priceB = b ? Number(b.unit_price) : null
    const totalB = b ? b.quantity * Number(b.unit_price) : null

    let status: ItemStatus
    if (!a) status = 'only_b'
    else if (!b) status = 'only_a'
    else if (priceA === priceB && qtyA === qtyB) status = 'same'
    else status = 'diff'

    rows.push({
      productId: pid,
      productName: product.name,
      category: product.category,
      unit: product.unit,
      status,
      qtyA, priceA, totalA,
      qtyB, priceB, totalB,
      priceDiff: priceA !== null && priceB !== null ? priceB - priceA : null,
      totalDiff: totalA !== null && totalB !== null ? totalB - totalA : null,
    })
  }

  return rows.sort(
    (a, b) =>
      a.category.localeCompare(b.category, 'pt-BR') ||
      a.productName.localeCompare(b.productName, 'pt-BR')
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FeiraPicker({
  visible,
  feiras,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean
  feiras: FeiraWithSummary[]
  selected: FeiraWithSummary | null
  onSelect: (f: FeiraWithSummary) => void
  onClose: () => void
}) {
  const c = useColors()

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: c.background }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 20,
            paddingTop: 28,
            borderBottomWidth: 1,
            borderColor: c.border,
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: '600', color: c.text }}>Selecionar Feira</Text>
          <Pressable onPress={onClose}>
            <Text style={{ fontSize: 17, color: c.primary }}>Fechar</Text>
          </Pressable>
        </View>
        <ScrollView contentInsetAdjustmentBehavior="automatic">
          {feiras.map((feira) => (
            <Pressable
              key={feira.id}
              onPress={() => { onSelect(feira); onClose() }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
                borderBottomWidth: 1,
                borderColor: c.border,
                backgroundColor:
                  selected?.id === feira.id ? c.primary + '15' : pressed ? c.inputBg : 'transparent',
              })}
            >
              <View>
                <Text style={{ fontSize: 16, fontWeight: '500', color: c.text }}>{feira.name}</Text>
                <Text style={{ fontSize: 13, color: c.subtext }}>
                  {feira.store} · {formatDateShort(feira.date)}
                </Text>
              </View>
              <Text style={{ fontSize: 15, fontWeight: '600', color: c.primary, fontVariant: ['tabular-nums'] }}>
                {formatCurrency(feira.total)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  )
}

function FeiraSelector({
  label,
  feira,
  borderColor,
  valueColor,
  onPress,
  c,
}: {
  label: string
  feira: FeiraWithSummary | null
  borderColor: string
  valueColor: string
  onPress: () => void
  c: ReturnType<typeof useColors>
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 13, fontWeight: '500', color: c.subtext, marginBottom: 6 }}>
        {label}
      </Text>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          backgroundColor: pressed ? c.inputBg : c.card,
          borderRadius: 14,
          padding: 14,
          borderWidth: 2,
          borderColor: feira ? borderColor : c.border,
          gap: 4,
          minHeight: 80,
          justifyContent: 'center',
        })}
      >
        {feira ? (
          <>
            <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }} numberOfLines={1}>
              {feira.name}
            </Text>
            <Text style={{ fontSize: 12, color: c.subtext }}>{feira.store}</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: valueColor, fontVariant: ['tabular-nums'] }}>
              {formatCurrency(feira.total)}
            </Text>
          </>
        ) : (
          <Text style={{ fontSize: 14, color: c.subtext, textAlign: 'center' }}>Selecionar...</Text>
        )}
      </Pressable>
    </View>
  )
}

function StatusBadge({ status, totalDiff }: { status: ItemStatus; totalDiff: number | null }) {
  const c = useColors()
  let label: string
  let color: string
  let bg: string

  if (status === 'only_a') {
    label = 'Só na A'
    color = c.danger
    bg = c.danger + '22'
  } else if (status === 'only_b') {
    label = 'Só na B'
    color = c.primary
    bg = c.primary + '22'
  } else if (status === 'same') {
    label = 'Igual'
    color = c.subtext
    bg = c.border
  } else if (totalDiff === null || totalDiff === 0) {
    label = 'Qtd diferente'
    color = WARNING
    bg = WARNING + '22'
  } else if (totalDiff > 0) {
    label = 'Mais caro na B'
    color = c.danger
    bg = c.danger + '22'
  } else {
    label = 'Mais barato na B'
    color = c.success
    bg = c.success + '22'
  }

  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
      <Text style={{ fontSize: 11, fontWeight: '600', color }}>{label}</Text>
    </View>
  )
}

function SideRow({
  label,
  qty,
  price,
  total,
  unit,
  c,
}: {
  label: string
  qty: number | null
  price: number | null
  total: number | null
  unit: string
  c: ReturnType<typeof useColors>
}) {
  const hasData = qty !== null && price !== null && total !== null
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: c.subtext, width: 16 }}>{label}</Text>
      {hasData ? (
        <Text style={{ fontSize: 12, color: c.text, flex: 1, textAlign: 'right' }}>
          {formatCurrency(price!)} × {qty}{unit} = {formatCurrency(total!)}
        </Text>
      ) : (
        <Text style={{ fontSize: 12, color: c.subtext, flex: 1, textAlign: 'right' }}>—</Text>
      )}
    </View>
  )
}

function ProductCompareRow({ row }: { row: CompareRow }) {
  const c = useColors()

  return (
    <Card padding={12}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: c.text, flex: 1, marginRight: 8 }} numberOfLines={1}>
          {row.productName}
        </Text>
        <StatusBadge status={row.status} totalDiff={row.totalDiff} />
      </View>

      {row.status === 'same' ? (
        <SideRow label="=" qty={row.qtyA} price={row.priceA} total={row.totalA} unit={row.unit} c={c} />
      ) : (
        <View style={{ gap: 4 }}>
          <SideRow label="A" qty={row.qtyA} price={row.priceA} total={row.totalA} unit={row.unit} c={c} />
          <SideRow label="B" qty={row.qtyB} price={row.priceB} total={row.totalB} unit={row.unit} c={c} />
          {row.status === 'diff' && row.totalDiff !== null && (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                paddingTop: 6,
                marginTop: 2,
                borderTopWidth: 1,
                borderColor: c.border,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  fontVariant: ['tabular-nums'],
                  color:
                    row.totalDiff > 0 ? c.danger : row.totalDiff < 0 ? c.success : c.subtext,
                }}
              >
                {row.totalDiff > 0 ? '+' : ''}{formatCurrency(row.totalDiff)}
              </Text>
            </View>
          )}
        </View>
      )}
    </Card>
  )
}

function MiniStat({
  label,
  value,
  color,
  c,
}: {
  label: string
  value: number
  color: string
  c: ReturnType<typeof useColors>
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color, fontVariant: ['tabular-nums'] }}>
        {value}
      </Text>
      <Text style={{ fontSize: 10, color: c.subtext, fontWeight: '500', textAlign: 'center' }}>
        {label}
      </Text>
    </View>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function CompararScreen() {
  const c = useColors()
  const { data: feiras = [], isLoading } = useFeiras()
  const [feiraA, setFeiraA] = useState<FeiraWithSummary | null>(null)
  const [feiraB, setFeiraB] = useState<FeiraWithSummary | null>(null)
  const [pickerFor, setPickerFor] = useState<'A' | 'B' | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('diff')

  const { data: detailA, isLoading: loadingA } = useFeiraDetail(feiraA?.id ?? null)
  const { data: detailB, isLoading: loadingB } = useFeiraDetail(feiraB?.id ?? null)

  const comparison = useMemo(() => {
    if (!detailA || !detailB) return null
    return buildComparison(detailA as FeiraWithItems, detailB as FeiraWithItems)
  }, [detailA, detailB])

  const sections = useMemo(() => {
    if (!comparison) return []
    const filtered = viewMode === 'diff' ? comparison.filter((r) => r.status !== 'same') : comparison
    const groups = new Map<string, CompareRow[]>()
    for (const row of filtered) {
      if (!groups.has(row.category)) groups.set(row.category, [])
      groups.get(row.category)!.push(row)
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))
      .map(([title, data]) => ({ title, data }))
  }, [comparison, viewMode])

  const stats = useMemo(() => {
    if (!comparison) return null
    return {
      onlyA: comparison.filter((r) => r.status === 'only_a').length,
      onlyB: comparison.filter((r) => r.status === 'only_b').length,
      diff: comparison.filter((r) => r.status === 'diff').length,
      same: comparison.filter((r) => r.status === 'same').length,
    }
  }, [comparison])

  const totalDiff =
    detailA && detailB ? (detailB as FeiraWithItems).total - (detailA as FeiraWithItems).total : null
  const totalDiffPercent =
    totalDiff !== null && detailA && (detailA as FeiraWithItems).total > 0
      ? (totalDiff / (detailA as FeiraWithItems).total) * 100
      : null

  const isLoadingDetails = (!!feiraA && loadingA) || (!!feiraB && loadingB)

  if (isLoading) return <Loading />

  return (
    <>
      <Stack.Screen options={{ title: 'Comparar' }} />
      <SectionList
        contentInsetAdjustmentBehavior="automatic"
        sections={sections}
        keyExtractor={(item) => String(item.productId)}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 4 }}>
            {/* Seletores */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <FeiraSelector
                label="Feira A"
                feira={feiraA}
                borderColor={c.primary}
                valueColor={c.primary}
                onPress={() => setPickerFor('A')}
                c={c}
              />
              <FeiraSelector
                label="Feira B"
                feira={feiraB}
                borderColor={c.success}
                valueColor={c.success}
                onPress={() => setPickerFor('B')}
                c={c}
              />
            </View>

            {isLoadingDetails && (
              <View style={{ alignItems: 'center', padding: 16 }}>
                <Text style={{ color: c.subtext, fontSize: 14 }}>Carregando itens...</Text>
              </View>
            )}

            {/* Resumo + filtro */}
            {totalDiff !== null && totalDiffPercent !== null && stats && !isLoadingDetails && (
              <>
                <Card style={{ padding: 16, gap: 14 }}>
                  <View style={{ alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 12, color: c.subtext, fontWeight: '500' }}>
                      Diferença total (B − A)
                    </Text>
                    <Text
                      style={{
                        fontSize: 30,
                        fontWeight: '800',
                        fontVariant: ['tabular-nums'],
                        color:
                          totalDiff > 0 ? c.danger : totalDiff < 0 ? c.success : c.text,
                      }}
                    >
                      {totalDiff > 0 ? '+' : ''}{formatCurrency(totalDiff)}
                    </Text>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '600',
                        color: totalDiff > 0 ? c.danger : totalDiff < 0 ? c.success : c.subtext,
                      }}
                    >
                      {formatPercent(totalDiffPercent)}
                    </Text>
                    <Text style={{ fontSize: 13, color: c.subtext }}>
                      {totalDiff > 0
                        ? 'Feira B foi mais cara'
                        : totalDiff < 0
                          ? 'Feira B foi mais barata'
                          : 'Valores idênticos'}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      gap: 8,
                      paddingTop: 12,
                      borderTopWidth: 1,
                      borderColor: c.border,
                    }}
                  >
                    <MiniStat label="Só na A" value={stats.onlyA} color={c.danger} c={c} />
                    <View style={{ width: 1, backgroundColor: c.border }} />
                    <MiniStat label="Só na B" value={stats.onlyB} color={c.primary} c={c} />
                    <View style={{ width: 1, backgroundColor: c.border }} />
                    <MiniStat label="Diferentes" value={stats.diff} color={WARNING} c={c} />
                    <View style={{ width: 1, backgroundColor: c.border }} />
                    <MiniStat label="Iguais" value={stats.same} color={c.subtext} c={c} />
                  </View>
                </Card>

                <SegmentedControl<ViewMode>
                  value={viewMode}
                  onChange={setViewMode}
                  options={[
                    { value: 'diff', label: 'Só diferenças' },
                    { value: 'all', label: 'Todos os itens' },
                  ]}
                />
              </>
            )}

            {/* Placeholder inicial */}
            {(!feiraA || !feiraB) && !isLoadingDetails && (
              <Card style={{ alignItems: 'center', padding: 32, gap: 8 }}>
                <Text style={{ fontSize: 32 }}>⚖️</Text>
                <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }}>
                  Selecione duas feiras
                </Text>
                <Text style={{ fontSize: 14, color: c.subtext, textAlign: 'center' }}>
                  Escolha as feiras acima para comparar produto por produto
                </Text>
              </Card>
            )}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingVertical: 8,
              marginTop: 6,
              backgroundColor: c.background,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: c.text }}>{section.title}</Text>
            <Text style={{ fontSize: 12, color: c.subtext }}>
              {section.data.length} {section.data.length === 1 ? 'item' : 'itens'}
            </Text>
          </View>
        )}
        renderItem={({ item }) => <ProductCompareRow row={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        SectionSeparatorComponent={() => <View style={{ height: 4 }} />}
        ListEmptyComponent={
          feiraA && feiraB && comparison && !isLoadingDetails ? (
            <Card style={{ alignItems: 'center', padding: 24, gap: 8 }}>
              <Text style={{ fontSize: 24 }}>✅</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }}>
                {viewMode === 'diff' ? 'Nenhuma diferença encontrada!' : 'Nenhum produto'}
              </Text>
              {viewMode === 'diff' && (
                <Pressable onPress={() => setViewMode('all')}>
                  <Text style={{ fontSize: 13, color: c.primary }}>Ver todos os itens</Text>
                </Pressable>
              )}
            </Card>
          ) : null
        }
      />

      <FeiraPicker
        visible={pickerFor !== null}
        feiras={feiras as FeiraWithSummary[]}
        selected={pickerFor === 'A' ? feiraA : feiraB}
        onSelect={(f) => {
          if (pickerFor === 'A') setFeiraA(f)
          else setFeiraB(f)
        }}
        onClose={() => setPickerFor(null)}
      />
    </>
  )
}
