import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput as RNTextInput,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useColors, PRIMARY, CARD_BORDER } from '@/constants/colors'
import { CATEGORIES, UNITS, CATEGORY_COLORS } from '@/constants/app'
import { useShoppingList, type ShoppingItem } from '@/hooks/use-shopping-list'
import { useFeiras } from '@/hooks/use-feiras'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/format'

// ─── Add Item Modal ────────────────────────────────────────────────────────────

type AddItemModalProps = {
  visible: boolean
  onClose: () => void
  onAdd: (item: Omit<ShoppingItem, 'id' | 'checked'>) => void
  initialBarcode?: string
  initialName?: string
  initialPrice?: number
}

function AddItemModal({ visible, onClose, onAdd, initialBarcode, initialName, initialPrice }: AddItemModalProps) {
  const c = useColors()
  const [name, setName]         = useState(initialName ?? '')
  const [category, setCategory] = useState('Outros')
  const [unit, setUnit]         = useState('un')
  const [qty, setQty]           = useState('1')
  const [price, setPrice]       = useState(initialPrice ? String(initialPrice) : '')
  const [barcode]               = useState(initialBarcode ?? '')

  useEffect(() => {
    if (visible) {
      setName(initialName ?? '')
      setPrice(initialPrice ? String(initialPrice) : '')
      setCategory('Outros')
      setUnit('un')
      setQty('1')
    }
  }, [visible, initialName, initialPrice])

  function handleAdd() {
    const trimmed = name.trim()
    if (!trimmed) return Alert.alert('Nome obrigatório')
    const parsedQty   = parseFloat(qty)   || 1
    const parsedPrice = parseFloat(price.replace(',', '.')) || 0
    onAdd({ name: trimmed, category, unit, qty: parsedQty, price: parsedPrice, barcode: barcode || undefined })
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: c.background }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 }}>
            <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: c.text }}>Novo item</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close-outline" size={24} color={c.subtext} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 20 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Name */}
            <RNTextInput
              value={name}
              onChangeText={setName}
              placeholder="Nome do produto"
              placeholderTextColor={c.subtext}
              style={{ fontSize: 18, fontWeight: '500', color: c.text, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.border }}
              autoFocus
            />

            {/* Category chips */}
            <View style={{ gap: 10 }}>
              <Text style={{ fontSize: 11, color: c.subtext, letterSpacing: 0.4 }}>Categoria</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {CATEGORIES.map((cat) => {
                    const active = category === cat
                    return (
                      <Pressable key={cat} onPress={() => setCategory(cat)}
                        style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: active ? PRIMARY : c.inputBg }}>
                        <Text style={{ fontSize: 13, color: active ? '#fff' : c.subtext }}>{cat}</Text>
                      </Pressable>
                    )
                  })}
                </View>
              </ScrollView>
            </View>

            {/* Unit chips */}
            <View style={{ gap: 10 }}>
              <Text style={{ fontSize: 11, color: c.subtext, letterSpacing: 0.4 }}>Unidade</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {UNITS.map((u) => {
                    const active = unit === u
                    return (
                      <Pressable key={u} onPress={() => setUnit(u)}
                        style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: active ? PRIMARY : c.inputBg }}>
                        <Text style={{ fontSize: 13, color: active ? '#fff' : c.subtext }}>{u}</Text>
                      </Pressable>
                    )
                  })}
                </View>
              </ScrollView>
            </View>

            {/* Qty + Price — inline, underline style */}
            <View style={{ flexDirection: 'row', gap: 24 }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ fontSize: 11, color: c.subtext, letterSpacing: 0.4 }}>Quantidade</Text>
                <RNTextInput
                  value={qty}
                  onChangeText={setQty}
                  keyboardType="decimal-pad"
                  style={{ fontSize: 17, fontWeight: '500', color: c.text, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: c.border }}
                />
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ fontSize: 11, color: c.subtext, letterSpacing: 0.4 }}>Preço (R$)</Text>
                <RNTextInput
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                  placeholder="0,00"
                  placeholderTextColor={c.subtext}
                  style={{ fontSize: 17, fontWeight: '500', color: c.text, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: c.border }}
                />
              </View>
            </View>

            <Pressable onPress={handleAdd}
              style={{ backgroundColor: PRIMARY, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 }}>
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Adicionar</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ─── Barcode Scanner Modal ────────────────────────────────────────────────────

type BarcodeScannerProps = {
  visible: boolean
  onClose: () => void
  onScanned: (barcode: string) => void
}

function BarcodeScannerModal({ visible, onClose, onScanned }: BarcodeScannerProps) {
  const c = useColors()
  const [permission, requestPermission] = useCameraPermissions()
  const scanned = useRef(false)

  useEffect(() => {
    if (visible) {
      scanned.current = false
      if (!permission?.granted) requestPermission()
    }
  }, [visible, permission, requestPermission])

  function handleBarcodeScanned({ data }: { data: string }) {
    if (scanned.current) return
    scanned.current = true
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    onScanned(data)
  }

  if (!visible) return null

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {permission?.granted ? (
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            onBarcodeScanned={handleBarcodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'qr', 'code128', 'code39', 'upc_a', 'upc_e'] }}
          >
            {/* Overlay */}
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ width: 260, height: 160, borderRadius: 16, borderWidth: 3, borderColor: PRIMARY, backgroundColor: 'transparent' }} />
              <Text style={{ color: '#fff', marginTop: 20, fontSize: 15, fontWeight: '600', textAlign: 'center' }}>
                Aponte para o código de barras
              </Text>
            </View>
          </CameraView>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 }}>
            <Ionicons name="camera-outline" size={60} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center' }}>Permissão de câmara necessária</Text>
            <Pressable onPress={requestPermission} style={{ backgroundColor: PRIMARY, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Conceder permissão</Text>
            </Pressable>
          </View>
        )}
        {/* Close button */}
        <Pressable onPress={onClose}
          style={{ position: 'absolute', top: Platform.OS === 'ios' ? 56 : 20, right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="close" size={24} color="#fff" />
        </Pressable>
      </View>
    </Modal>
  )
}

// ─── Shopping Item Row ─────────────────────────────────────────────────────────

function ShoppingRow({ item, onToggle, onRemove, onEdit }: {
  item: ShoppingItem
  onToggle: () => void
  onRemove: () => void
  onEdit: () => void
}) {
  const c        = useColors()
  const catColor = CATEGORY_COLORS[item.category] ?? '#9E9E9E'

  return (
    <Pressable
      onPress={onToggle}
      onLongPress={onRemove}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: pressed ? c.inputBg : c.card,
        borderRadius: 14,
        opacity: item.checked ? 0.45 : 1,
        ...(c.isDark ? {} : CARD_BORDER),
      })}
    >
      {/* Category accent strip */}
      <View style={{ width: 3, height: 36, borderRadius: 2, backgroundColor: catColor, flexShrink: 0 }} />

      {/* Checkbox */}
      <View style={{
        width: 22, height: 22, borderRadius: 6,
        backgroundColor: item.checked ? PRIMARY : 'transparent',
        borderWidth: 1.5, borderColor: item.checked ? PRIMARY : c.border,
        justifyContent: 'center', alignItems: 'center',
      }}>
        {item.checked && <Ionicons name="checkmark-outline" size={13} color="#fff" />}
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '500', color: c.text, textDecorationLine: item.checked ? 'line-through' : 'none' }} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={{ fontSize: 12, color: c.subtext, marginTop: 1 }}>
          {item.qty} {item.unit}{item.price > 0 ? ` · ${formatCurrency(item.price)}/${item.unit}` : ''}
        </Text>
      </View>

      {/* Subtotal */}
      {item.price > 0 && (
        <Text style={{ fontSize: 15, fontWeight: '600', color: item.checked ? c.subtext : c.text, fontVariant: ['tabular-nums'] }}>
          {formatCurrency(item.qty * item.price)}
        </Text>
      )}

      <Pressable onPress={onEdit} hitSlop={10}>
        <Ionicons name="ellipsis-horizontal-outline" size={16} color={c.subtext} />
      </Pressable>
    </Pressable>
  )
}

// ─── Init Screen ──────────────────────────────────────────────────────────────

type InitMode = 'from_last' | 'empty' | 'barcode'

function InitScreen({ onSelect }: { onSelect: (mode: InitMode) => void }) {
  const c      = useColors()
  const insets = useSafeAreaInsets()

  const OPTIONS: { mode: InitMode; icon: keyof typeof Ionicons.glyphMap; label: string; desc: string; accent: string }[] = [
    { mode: 'from_last', icon: 'copy-outline',  label: 'Última feira',    desc: 'Começa com os itens da feira anterior', accent: PRIMARY },
    { mode: 'empty',     icon: 'list-outline',  label: 'Lista em branco', desc: 'Adicionar itens manualmente',           accent: '#6366F1' },
    { mode: 'barcode',   icon: 'scan-outline',  label: 'Scan de código',  desc: 'Digitalizar produtos pelo código',      accent: '#F59E0B' },
  ]

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 24, paddingHorizontal: 16, paddingBottom: insets.bottom + 120, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: c.text }}>Próxima Feira</Text>
          <Text style={{ fontSize: 13, color: c.subtext, marginTop: 4 }}>Como quer começar?</Text>
        </View>

        {OPTIONS.map((opt) => (
          <Pressable key={opt.mode} onPress={() => onSelect(opt.mode)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              backgroundColor: pressed ? c.inputBg : c.card,
              borderRadius: 16,
              padding: 20,
              overflow: 'hidden',
              ...(c.isDark ? {} : CARD_BORDER),
            })}
          >
            {/* Left accent strip */}
            <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: opt.accent }} />

            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: opt.accent + '15', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name={opt.icon} size={20} color={opt.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }}>{opt.label}</Text>
              <Text style={{ fontSize: 12, color: c.subtext, marginTop: 2 }}>{opt.desc}</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={16} color={c.subtext} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ListaScreen() {
  const c      = useColors()
  const insets = useSafeAreaInsets()
  const { session }    = useAuth()
  const { data: feiras = [] } = useFeiras()

  const sl = useShoppingList()

  const [showAddModal,     setShowAddModal]     = useState(false)
  const [showScanner,      setShowScanner]      = useState(false)
  const [editItem,         setEditItem]         = useState<ShoppingItem | null>(null)
  const [pendingBarcode,   setPendingBarcode]   = useState<string | undefined>()
  const [pendingName,      setPendingName]      = useState<string | undefined>()
  const [pendingPrice,     setPendingPrice]     = useState<number | undefined>()
  const [finalizing,       setFinalizing]       = useState(false)

  async function handleInitSelect(mode: InitMode) {
    if (mode === 'empty') {
      sl.startEmpty()
    } else if (mode === 'barcode') {
      sl.startEmpty()
      setShowScanner(true)
    } else if (mode === 'from_last') {
      const lastFeira = feiras[0]
      if (!lastFeira) {
        sl.startEmpty()
        return
      }
      const { data } = await supabase
        .from('feira_items')
        .select('*, products(*)')
        .eq('feira_id', lastFeira.id)
      if (data && data.length > 0) {
        sl.startFromItems(
          data.map((fi) => ({
            name:     fi.products?.name     ?? 'Desconhecido',
            category: fi.products?.category ?? 'Outros',
            unit:     fi.products?.unit     ?? 'un',
            qty:      fi.quantity,
            price:    fi.unit_price,
          }))
        )
      } else {
        sl.startEmpty()
      }
    }
  }

  async function handleBarcodeScanned(barcode: string) {
    setShowScanner(false)
    const known = await sl.lookupBarcode(barcode)
    if (known) {
      sl.addItem({ name: known.name, category: 'Outros', unit: known.unit, qty: 1, price: known.price, barcode })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } else {
      setPendingBarcode(barcode)
      setPendingName(undefined)
      setPendingPrice(undefined)
      setShowAddModal(true)
    }
  }

  async function handleAddItem(item: Omit<ShoppingItem, 'id' | 'checked'>) {
    sl.addItem(item)
    if (item.barcode) {
      await sl.saveBarcode(item.barcode, { name: item.name, price: item.price, unit: item.unit, category: item.category })
    }
    setPendingBarcode(undefined)
    setPendingName(undefined)
    setPendingPrice(undefined)
  }

  function handleToggle(id: string) {
    sl.toggleItem(id)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  async function handleFinalize() {
    if (!sl.list || sl.list.items.length === 0) return
    if (!session?.user) return

    Alert.alert(
      'Finalizar feira',
      `Guardar ${sl.list.items.length} itens como nova feira no Supabase?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Guardar',
          style: 'default',
          onPress: async () => {
            try {
              setFinalizing(true)
              const today = new Date().toISOString().split('T')[0]!
              const { data: feira, error: feiraErr } = await supabase
                .from('feiras')
                .insert({ name: `Feira ${new Date().toLocaleDateString('pt-BR')}`, store: '', date: today, user_id: session.user.id })
                .select()
                .single()
              if (feiraErr) throw feiraErr

              for (const item of sl.list!.items) {
                let productId: number | null = null

                const { data: existing } = await supabase
                  .from('products')
                  .select('id')
                  .eq('user_id', session.user.id)
                  .ilike('name', item.name.trim())
                  .maybeSingle()

                if (existing) {
                  productId = existing.id
                } else {
                  const { data: newProd } = await supabase
                    .from('products')
                    .insert({ name: item.name, category: item.category, unit: item.unit, user_id: session.user.id })
                    .select('id')
                    .single()
                  if (newProd) productId = newProd.id
                }

                if (productId) {
                  await supabase.from('feira_items').insert({
                    feira_id: feira.id,
                    product_id: productId,
                    quantity: item.qty,
                    unit_price: item.price,
                  })
                }
              }

              sl.clearList()
              Alert.alert('Guardada!', 'A sua feira foi guardada com sucesso.')
            } catch {
              Alert.alert('Erro', 'Não foi possível guardar a feira.')
            } finally {
              setFinalizing(false)
            }
          },
        },
      ]
    )
  }

  // ── Init screen ──
  if (sl.loading) return null
  if (!sl.list) return <InitScreen onSelect={handleInitSelect} />

  const progress = sl.totalCount > 0 ? sl.checkedCount / sl.totalCount : 0

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: 16,
          backgroundColor: c.card,
          gap: 14,
          borderBottomWidth: 1,
          borderBottomColor: c.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: c.text }}>Lista de compras</Text>
            <Text style={{ fontSize: 12, color: c.subtext, marginTop: 2 }}>
              {sl.checkedCount} de {sl.totalCount} itens
            </Text>
          </View>
          <Pressable onPress={() => setShowScanner(true)} hitSlop={8} style={{ marginRight: 16 }}>
            <Ionicons name="scan-outline" size={22} color={c.subtext} />
          </Pressable>
          <Pressable
            hitSlop={8}
            onPress={() => Alert.alert('Limpar lista', 'Deseja apagar a lista atual?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Limpar', style: 'destructive', onPress: sl.clearList },
            ])}
          >
            <Ionicons name="trash-outline" size={20} color={c.subtext} />
          </Pressable>
        </View>

        {/* Progress bar — thin */}
        <View style={{ height: 3, backgroundColor: c.border, borderRadius: 2, overflow: 'hidden' }}>
          <View style={{ height: '100%', width: `${progress * 100}%`, backgroundColor: PRIMARY, borderRadius: 2 }} />
        </View>

        {/* Total */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={{ fontSize: 13, color: c.subtext }}>Total</Text>
          <Text style={{ fontSize: 26, fontWeight: '700', color: PRIMARY, fontVariant: ['tabular-nums'] }}>
            {formatCurrency(sl.grandTotal)}
          </Text>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={sl.list.items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 140, gap: 10 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ShoppingRow
            item={item}
            onToggle={() => handleToggle(item.id)}
            onRemove={() => Alert.alert('Remover', `Remover "${item.name}"?`, [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Remover', style: 'destructive', onPress: () => sl.removeItem(item.id) },
            ])}
            onEdit={() => setEditItem(item)}
          />
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', gap: 10, paddingTop: 60 }}>
            <Text style={{ fontSize: 40 }}>🛒</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: c.text }}>Lista vazia</Text>
            <Text style={{ fontSize: 13, color: c.subtext, textAlign: 'center' }}>Adicione itens tocando no + abaixo</Text>
          </View>
        }
      />

      {/* Sticky footer */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: insets.bottom + 72,
          paddingTop: 12,
          paddingHorizontal: 16,
          flexDirection: 'row',
          gap: 10,
          backgroundColor: c.card,
          borderTopWidth: 1,
          borderTopColor: c.border,
        }}
      >
        <Pressable
          onPress={() => { setPendingBarcode(undefined); setPendingName(undefined); setPendingPrice(undefined); setShowAddModal(true) }}
          style={{ flex: 1, borderRadius: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border }}
        >
          <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }}>+ Adicionar</Text>
        </Pressable>

        <Pressable
          onPress={handleFinalize}
          disabled={finalizing || sl.totalCount === 0}
          style={{
            flex: 1.6,
            borderRadius: 14,
            paddingVertical: 15,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: PRIMARY,
            opacity: sl.totalCount === 0 ? 0.4 : 1,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>
            {finalizing ? 'A guardar…' : 'Finalizar'}
          </Text>
        </Pressable>
      </View>

      {/* Add Item Modal */}
      <AddItemModal
        visible={showAddModal || editItem !== null}
        onClose={() => { setShowAddModal(false); setEditItem(null) }}
        onAdd={(item) => {
          if (editItem) {
            sl.updateItem(editItem.id, item)
            setEditItem(null)
          } else {
            handleAddItem(item)
          }
        }}
        initialBarcode={editItem?.barcode ?? pendingBarcode}
        initialName={editItem?.name ?? pendingName}
        initialPrice={editItem?.price ?? pendingPrice}
      />

      {/* Barcode Scanner */}
      <BarcodeScannerModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScanned={handleBarcodeScanned}
      />
    </View>
  )
}
