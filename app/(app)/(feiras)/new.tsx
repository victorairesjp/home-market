import { useEffect, useState } from 'react'
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { router, Stack } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import {
  FilePlus2,
  History,
  ListChecks,
  CheckCircle2,
  Trash2,
  Pencil,
  Plus,
  ChevronDown,
  Search,
} from 'lucide-react-native'
import { Button } from '@/components/ui/button'
import { TextInput } from '@/components/ui/text-input'
import { Card } from '@/components/ui/card'
import { useColors, WARNING } from '@/constants/colors'
import { useCreateFeira } from '@/hooks/use-feiras'
import { useFeiras } from '@/hooks/use-feiras'
import { useProducts } from '@/hooks/use-products'
import { useBulkAddFeiraItems } from '@/hooks/use-feira-items'
import { useShoppingList } from '@/hooks/use-shopping-list'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { consumeFeiraDraft } from '@/lib/feira-draft'
import { formatDateShort, formatDateForInput, formatCurrency } from '@/lib/format'
import type { FeiraWithSummary } from '@/types/database'

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  store: z.string().min(1, 'Loja é obrigatória'),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>
type InitMode = 'zero' | 'history' | 'default'
type PreviewSource = 'history' | 'default' | 'list'

type PreviewItem = {
  product_id: number | null
  name: string
  unit: string
  category: string
  quantity: number
  unit_price: number
}

type ModeCardProps = {
  Icon: React.ComponentType<any>
  title: string
  description: string
  selected: boolean
  onPress: () => void
  c: ReturnType<typeof useColors>
}

function ModeCard({ Icon, title, description, selected, onPress, c }: ModeCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        alignSelf: 'stretch',
        backgroundColor: selected ? c.primary + '15' : pressed ? c.inputBg : c.card,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: selected ? c.primary : c.border,
        padding: 14,
        gap: 8,
        alignItems: 'flex-start',
      })}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: selected ? c.primary + '20' : c.inputBg,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Icon size={18} color={selected ? c.primary : c.text} strokeWidth={1.5} />
      </View>
      <Text style={{ fontSize: 14, fontWeight: '700', color: selected ? c.primary : c.text }}>
        {title}
      </Text>
      <Text style={{ fontSize: 12, color: c.subtext, lineHeight: 17 }}>{description}</Text>
      {selected && (
        <View
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: c.primary,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="checkmark" size={13} color="#fff" />
        </View>
      )}
    </Pressable>
  )
}

function HistoryPickerModal({
  visible,
  feiras,
  selected,
  onSelect,
  onClose,
  c,
}: {
  visible: boolean
  feiras: FeiraWithSummary[]
  selected: FeiraWithSummary | null
  onSelect: (f: FeiraWithSummary) => void
  onClose: () => void
  c: ReturnType<typeof useColors>
}) {
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
          <Text style={{ fontSize: 17, fontWeight: '700', color: c.text }}>Selecionar Feira Base</Text>
          <Pressable onPress={onClose}>
            <Text style={{ fontSize: 16, color: c.primary }}>Fechar</Text>
          </Pressable>
        </View>
        <ScrollView>
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
                  selected?.id === feira.id
                    ? c.primary + '15'
                    : pressed
                    ? c.inputBg
                    : 'transparent',
              })}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }}>{feira.name}</Text>
                <Text style={{ fontSize: 13, color: c.subtext }}>
                  {feira.store} · {formatDateShort(feira.date)} · {feira.item_count}{' '}
                  {feira.item_count === 1 ? 'item' : 'itens'}
                </Text>
              </View>
              <Text
                style={{ fontSize: 15, fontWeight: '600', color: c.primary, fontVariant: ['tabular-nums'] }}
              >
                {formatCurrency(feira.total)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  )
}

function ProductPickerModal({
  visible,
  products,
  onPick,
  onClose,
  c,
}: {
  visible: boolean
  products: ReturnType<typeof useProducts>['data']
  onPick: (p: NonNullable<ReturnType<typeof useProducts>['data']>[number]) => void
  onClose: () => void
  c: ReturnType<typeof useColors>
}) {
  const [query, setQuery] = useState('')
  const filtered = (products ?? []).filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  )
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
          <Text style={{ fontSize: 17, fontWeight: '700', color: c.text }}>Adicionar item</Text>
          <Pressable onPress={() => { setQuery(''); onClose() }}>
            <Text style={{ fontSize: 16, color: c.primary }}>Fechar</Text>
          </Pressable>
        </View>
        <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: c.border, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Search size={16} color={c.subtext} strokeWidth={1.5} />
          <TextInput
            placeholder="Buscar produto..."
            value={query}
            onChangeText={setQuery}
            style={{ flex: 1, borderWidth: 0, backgroundColor: 'transparent', paddingVertical: 4 }}
          />
        </View>
        <ScrollView>
          {filtered.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => { onPick(p); setQuery('') }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
                borderBottomWidth: 1,
                borderColor: c.border,
                backgroundColor: pressed ? c.inputBg : 'transparent',
              })}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }}>{p.name}</Text>
                <Text style={{ fontSize: 12, color: c.subtext }}>
                  {p.category} · {p.unit}
                  {p.last_price ? ` · ${formatCurrency(p.last_price)}` : ''}
                </Text>
              </View>
              <Plus size={18} color={c.primary} strokeWidth={1.5} />
            </Pressable>
          ))}
          {filtered.length === 0 && (
            <View style={{ padding: 32, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, color: c.subtext }}>Nenhum produto encontrado</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  )
}

export default function NewFeira() {
  const c = useColors()
  const { session } = useAuth()
  const { mutateAsync: createFeira, isPending: creating } = useCreateFeira()
  const { mutateAsync: bulkAdd } = useBulkAddFeiraItems()
  const { data: feiras = [] } = useFeiras()
  const { data: products = [] } = useProducts()
  const { clearList: clearShoppingList } = useShoppingList()

  const [mode, setMode] = useState<InitMode>('zero')
  const [date, setDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showHistoryPicker, setShowHistoryPicker] = useState(false)
  const [baseFeira, setBaseFeira] = useState<FeiraWithSummary | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Preview / review step
  const [step, setStep] = useState<'setup' | 'preview'>('setup')
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([])
  const [editMode, setEditMode] = useState(false)
  const [showProductPicker, setShowProductPicker] = useState(false)
  const [pendingForm, setPendingForm] = useState<FormData | null>(null)
  const [loadingItems, setLoadingItems] = useState(false)
  const [previewSource, setPreviewSource] = useState<PreviewSource>('history')
  const [fromList, setFromList] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  // Load draft from a finalized shopping list (one-shot).
  // Stays on the setup form so the user fills Nome / Loja / Data / Observações
  // and only goes to the preview step when pressing "Revisar itens".
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const draft = await consumeFeiraDraft()
      if (cancelled || !draft) return
      reset({ name: draft.suggestedName, store: draft.store ?? '', notes: '' })
      setPreviewItems(
        draft.items.map((i) => ({
          product_id: null,
          name: i.name,
          category: i.category,
          unit: i.unit,
          quantity: i.quantity,
          unit_price: i.unit_price,
        }))
      )
      setPreviewSource('list')
      setFromList(true)
      setMode('zero')
      setStep('setup')
    })()
    return () => { cancelled = true }
  }, [reset])

  async function loadPreviewItems(data: FormData): Promise<PreviewItem[] | null> {
    if (mode === 'history' && baseFeira) {
      const { data: sourceItems, error } = await supabase
        .from('feira_items')
        .select('product_id, quantity, unit_price, products(name, unit, category)')
        .eq('feira_id', baseFeira.id)
      if (error) {
        Alert.alert('Erro', 'Falha ao carregar itens da feira base.')
        return null
      }
      return (sourceItems ?? []).map((i: any) => ({
        product_id: i.product_id,
        name: i.products?.name ?? 'Produto',
        unit: i.products?.unit ?? 'un',
        category: i.products?.category ?? 'Outros',
        quantity: i.quantity,
        unit_price: Number(i.unit_price),
      }))
    }
    if (mode === 'default') {
      const topItems = products
        .filter((p) => p.usage_count > 0 && (p.last_price ?? 0) > 0)
        .sort((a, b) => b.usage_count - a.usage_count)
        .slice(0, 20)
      return topItems.map((p) => ({
        product_id: p.id,
        name: p.name,
        unit: p.unit,
        category: p.category,
        quantity: 1,
        unit_price: p.last_price!,
      }))
    }
    return []
  }

  async function onContinue(data: FormData) {
    // Coming from a finalized shopping list — items are already loaded in state
    if (fromList) {
      setPendingForm(data)
      setEditMode(false)
      setStep('preview')
      return
    }

    if (mode === 'history' && !baseFeira) {
      Alert.alert('Selecione a feira base', 'Escolha uma feira para usar como base.')
      return
    }

    // 'zero' — no preview, create immediately
    if (mode === 'zero') {
      return persistFeira(data, [])
    }

    setLoadingItems(true)
    try {
      const items = await loadPreviewItems(data)
      if (items == null) return
      setPreviewItems(items)
      setPendingForm(data)
      setPreviewSource(mode === 'history' ? 'history' : 'default')
      setFromList(false)
      setEditMode(false)
      setStep('preview')
    } finally {
      setLoadingItems(false)
    }
  }

  async function resolveProductId(item: PreviewItem): Promise<number | null> {
    if (item.product_id) return item.product_id
    if (!session?.user) return null
    const name = item.name.trim()
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('user_id', session.user.id)
      .ilike('name', name)
      .maybeSingle()
    if (existing) return existing.id
    const { data: created, error } = await supabase
      .from('products')
      .insert({ name, category: item.category, unit: item.unit, user_id: session.user.id })
      .select('id')
      .single()
    if (error) return null
    return created.id
  }

  async function persistFeira(form: FormData, items: PreviewItem[]) {
    setIsSubmitting(true)
    try {
      const feira = await createFeira({ ...form, date: formatDateForInput(date) })

      if (items.length > 0) {
        const resolved: { product_id: number; quantity: number; unit_price: number }[] = []
        for (const i of items) {
          const pid = await resolveProductId(i)
          if (pid != null) resolved.push({ product_id: pid, quantity: i.quantity, unit_price: i.unit_price })
        }
        if (resolved.length > 0) {
          await bulkAdd({ feiraId: feira.id, items: resolved })
        }
      }

      if (fromList) clearShoppingList()

      router.replace(`/(app)/(feiras)/${feira.id}`)
    } catch (e: any) {
      Alert.alert('Erro', 'Não foi possível salvar a feira.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleRemovePreviewItem(index: number) {
    setPreviewItems((prev) => prev.filter((_, i) => i !== index))
  }

  function handleAddPreviewItem(p: (typeof products)[number]) {
    if (previewItems.some((i) => i.product_id === p.id)) {
      setShowProductPicker(false)
      return
    }
    setPreviewItems((prev) => [
      ...prev,
      {
        product_id: p.id,
        name: p.name,
        unit: p.unit,
        category: p.category,
        quantity: 1,
        unit_price: p.last_price ?? 0,
      },
    ])
    setShowProductPicker(false)
  }

  function previewBackLabel() {
    return fromList ? 'Cancelar' : 'Voltar'
  }
  function previewBackAction() {
    if (fromList) {
      router.back()
    } else {
      setStep('setup')
    }
  }

  const loading = creating || isSubmitting || loadingItems
  const previewTotal = previewItems.reduce((s, i) => s + i.quantity * i.unit_price, 0)

  // ── Preview / Review step ──
  if (step === 'preview' && pendingForm) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Revisar itens',
            headerLeft: () => (
              <Pressable onPress={previewBackAction}>
                <Text style={{ fontSize: 15, color: c.primary }}>{previewBackLabel()}</Text>
              </Pressable>
            ),
          }}
        />
        <View style={{ flex: 1, backgroundColor: c.background }}>
          <ScrollView
            contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 140 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Source summary */}
            {previewSource === 'history' && baseFeira && (
              <Card style={{ padding: 14, backgroundColor: c.primary + '10', borderColor: c.primary, borderWidth: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: c.primary, letterSpacing: 0.3 }}>
                  BASE: {baseFeira.name.toUpperCase()}
                </Text>
                <Text style={{ fontSize: 12, color: c.subtext, marginTop: 2 }}>
                  {baseFeira.store} · {formatDateShort(baseFeira.date)}
                </Text>
              </Card>
            )}
            {previewSource === 'default' && (
              <Card style={{ padding: 14, backgroundColor: c.primary + '10', borderColor: c.primary, borderWidth: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: c.primary, letterSpacing: 0.3 }}>
                  LISTA PADRÃO
                </Text>
                <Text style={{ fontSize: 12, color: c.subtext, marginTop: 2 }}>
                  Itens mais comprados com preços conhecidos
                </Text>
              </Card>
            )}
            {previewSource === 'list' && (
              <Card style={{ padding: 14, backgroundColor: c.primary + '10', borderColor: c.primary, borderWidth: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: c.primary, letterSpacing: 0.3 }}>
                  LISTA CONCLUÍDA
                </Text>
                <Text style={{ fontSize: 12, color: c.subtext, marginTop: 2 }}>
                  Itens e preços importados da sua lista de compras
                </Text>
              </Card>
            )}


            {/* Totals header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: c.text }}>
                {previewItems.length} {previewItems.length === 1 ? 'item' : 'itens'}
              </Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: c.primary, fontVariant: ['tabular-nums'] }}>
                {formatCurrency(previewTotal)}
              </Text>
            </View>

            {/* Edit toggle */}
            <Pressable
              onPress={() => setEditMode((v) => !v)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: editMode ? c.primary : c.border,
                backgroundColor: editMode ? c.primary + '15' : pressed ? c.inputBg : 'transparent',
                alignSelf: 'flex-start',
              })}
            >
              <Pencil size={16} color={editMode ? c.primary : c.text} strokeWidth={1.5} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: editMode ? c.primary : c.text }}>
                {editMode ? 'Concluir edição' : 'Editar itens'}
              </Text>
            </Pressable>

            {/* Add item (only in edit mode) */}
            {editMode && (
              <Pressable
                onPress={() => setShowProductPicker(true)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  padding: 14,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderStyle: 'dashed',
                  borderColor: c.border,
                  backgroundColor: pressed ? c.inputBg : 'transparent',
                })}
              >
                <Plus size={18} color={c.primary} strokeWidth={1.5} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: c.primary }}>Adicionar item</Text>
              </Pressable>
            )}

            {/* Items list */}
            <View style={{ gap: 8 }}>
              {previewItems.map((item, idx) => (
                <View
                  key={`${item.product_id ?? 'new'}-${idx}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    padding: 14,
                    borderRadius: 12,
                    backgroundColor: c.card,
                    borderWidth: 1,
                    borderColor: c.border,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: c.subtext, marginTop: 2 }}>
                      {item.quantity} {item.unit} · {formatCurrency(item.unit_price)}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: c.text, fontVariant: ['tabular-nums'] }}>
                    {formatCurrency(item.quantity * item.unit_price)}
                  </Text>
                  {editMode && (
                    <Pressable onPress={() => handleRemovePreviewItem(idx)} hitSlop={8}>
                      <Trash2 size={18} color={c.danger} strokeWidth={1.5} />
                    </Pressable>
                  )}
                </View>
              ))}
              {previewItems.length === 0 && (
                <View style={{ padding: 28, alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }}>Nenhum item</Text>
                  <Text style={{ fontSize: 12, color: c.subtext, textAlign: 'center' }}>
                    Adicione itens antes de iniciar a feira.
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Sticky footer */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 20,
              flexDirection: 'row',
              gap: 10,
              backgroundColor: c.card,
              borderTopWidth: 1,
              borderTopColor: c.border,
            }}
          >
            <Pressable
              onPress={() => {
                Alert.alert('Cancelar', 'Descartar esta feira?', [
                  { text: 'Continuar editando', style: 'cancel' },
                  { text: 'Descartar', style: 'destructive', onPress: () => router.back() },
                ])
              }}
              style={{ flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={() => persistFeira(pendingForm, previewItems)}
              disabled={loading}
              style={{ flex: 1.6, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary, opacity: loading ? 0.6 : 1, flexDirection: 'row', gap: 8 }}
            >
              <CheckCircle2 size={18} color="#fff" strokeWidth={1.5} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>
                {loading ? 'Salvando…' : 'Salvar e Iniciar'}
              </Text>
            </Pressable>
          </View>

          <ProductPickerModal
            visible={showProductPicker}
            products={products}
            onPick={handleAddPreviewItem}
            onClose={() => setShowProductPicker(false)}
            c={c}
          />
        </View>
      </>
    )
  }

  // ── Setup step ──
  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <Text style={{ fontSize: 15, color: c.primary }}>Cancelar</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* From-list banner (replaces mode selection when coming from a finalized list) */}
        {fromList && (
          <Card style={{ padding: 14, backgroundColor: c.primary + '10', borderColor: c.primary, borderWidth: 1, gap: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: c.primary, letterSpacing: 0.3 }}>
              LISTA CONCLUÍDA
            </Text>
            <Text style={{ fontSize: 13, color: c.text }}>
              {previewItems.length} {previewItems.length === 1 ? 'item pronto' : 'itens prontos'} para registrar. Preencha os detalhes da feira abaixo.
            </Text>
          </Card>
        )}

        {/* Mode selection (hidden when coming from a finalized list) */}
        {!fromList && (
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: c.text }}>
            Como deseja iniciar?
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'stretch' }}>
            <ModeCard
              Icon={FilePlus2}
              title="Do zero"
              description="Começa vazio, adicione item por item."
              selected={mode === 'zero'}
              onPress={() => setMode('zero')}
              c={c}
            />
            <ModeCard
              Icon={History}
              title="Histórico"
              description="Clone os itens de uma feira anterior."
              selected={mode === 'history'}
              onPress={() => setMode('history')}
              c={c}
            />
            <ModeCard
              Icon={ListChecks}
              title="Lista padrão"
              description="Preenche com seus itens mais comprados."
              selected={mode === 'default'}
              onPress={() => setMode('default')}
              c={c}
            />
          </View>

          {/* Base feira highlight */}
          {mode === 'history' && (
            <>
              <Pressable
                onPress={() => setShowHistoryPicker(true)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: baseFeira ? c.primary + '15' : pressed ? c.inputBg : c.card,
                  borderRadius: 14,
                  padding: 16,
                  borderWidth: baseFeira ? 2 : 1,
                  borderColor: baseFeira ? c.primary : c.border,
                  gap: 12,
                })}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: baseFeira ? c.primary + '20' : c.inputBg,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <History size={18} color={baseFeira ? c.primary : c.subtext} strokeWidth={1.5} />
                </View>
                {baseFeira ? (
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: c.primary, letterSpacing: 0.4 }}>
                      FEIRA BASE SELECIONADA
                    </Text>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: c.text }} numberOfLines={1}>
                      {baseFeira.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: c.subtext }}>
                      {formatDateShort(baseFeira.date)} · {baseFeira.item_count}{' '}
                      {baseFeira.item_count === 1 ? 'item' : 'itens'} · {formatCurrency(baseFeira.total)}
                    </Text>
                  </View>
                ) : (
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }}>Selecionar feira base</Text>
                    <Text style={{ fontSize: 12, color: c.subtext }}>Escolha uma feira anterior para clonar</Text>
                  </View>
                )}
                <ChevronDown size={18} color={c.subtext} strokeWidth={1.5} />
              </Pressable>
            </>
          )}

          {mode === 'default' && products.filter((p) => p.usage_count > 0 && (p.last_price ?? 0) > 0).length === 0 && (
            <Card style={{ padding: 14, backgroundColor: WARNING + '15' }}>
              <Text style={{ fontSize: 13, color: c.text }}>
                Ainda não há histórico de compras. Faça sua primeira feira manualmente e depois esta opção ficará disponível.
              </Text>
            </Card>
          )}
        </View>
        )}

        {/* Feira details form */}
        <View style={{ gap: 16 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: c.text }}>Detalhes da feira</Text>

          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <TextInput
                label="Nome da Feira"
                placeholder="Ex: Feira do Sábado"
                autoCapitalize="words"
                value={field.value}
                onChangeText={field.onChange}
                error={errors.name?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="store"
            render={({ field }) => (
              <TextInput
                label="Loja / Local"
                placeholder="Ex: Mercado Central"
                autoCapitalize="words"
                value={field.value}
                onChangeText={field.onChange}
                error={errors.store?.message}
              />
            )}
          />

          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: c.subtext }}>Data</Text>
            {process.env.EXPO_OS === 'ios' ? (
              <DateTimePicker
                value={date}
                mode="date"
                display="inline"
                onChange={(_, d) => d && setDate(d)}
                maximumDate={new Date()}
                locale="pt-BR"
              />
            ) : (
              <>
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  style={{
                    backgroundColor: c.input,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderWidth: 1,
                    borderColor: c.border,
                  }}
                >
                  <Text style={{ fontSize: 16, color: c.text }}>{formatDateShort(date.toISOString())}</Text>
                </Pressable>
                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={(_, d) => {
                      setShowDatePicker(false)
                      if (d) setDate(d)
                    }}
                    maximumDate={new Date()}
                  />
                )}
              </>
            )}
          </View>

          <Controller
            control={control}
            name="notes"
            render={({ field }) => (
              <TextInput
                label="Observações (opcional)"
                placeholder="Notas sobre essa feira..."
                multiline
                numberOfLines={3}
                style={{ minHeight: 80, textAlignVertical: 'top' }}
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />
        </View>

        <Button
          title={
            fromList
              ? 'Revisar itens'
              : mode === 'zero'
              ? 'Criar feira'
              : 'Revisar itens'
          }
          onPress={handleSubmit(onContinue)}
          loading={loading}
          fullWidth
        />
      </ScrollView>

      <HistoryPickerModal
        visible={showHistoryPicker}
        feiras={feiras as FeiraWithSummary[]}
        selected={baseFeira}
        onSelect={setBaseFeira}
        onClose={() => setShowHistoryPicker(false)}
        c={c}
      />
    </>
  )
}
