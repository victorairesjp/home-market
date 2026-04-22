import { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { router, Stack } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { format } from 'date-fns'
import { useColors, PRIMARY } from '@/constants/colors'
import { useProducts } from '@/hooks/use-products'
import { useImportReceipt, matchProduct, type ReviewItem } from '@/hooks/use-import-receipt'
import { parseReceipt } from '@/services/claude-receipt'
import { formatCurrency, formatDateForInput } from '@/lib/format'
import type { ParsedItem } from '@/services/receipt-parser'

// ── Types ────────────────────────────────────────────────────────────────────

type Step =
  | { id: 'idle' }
  | { id: 'loading'; message: string }
  | { id: 'review' }
  | { id: 'error'; message: string; onRetry?: () => void }

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeLocalId(): string {
  return Math.random().toString(36).slice(2)
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CaptureStep({ onCapture }: { onCapture: (source: 'camera' | 'gallery') => void }) {
  const c = useColors()
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 32, gap: 16 }}>
      <View style={{ alignItems: 'center', marginBottom: 8 }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: c.primary + '20',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <Ionicons name="receipt-outline" size={38} color={c.primary} />
        </View>
        <Text style={{ fontSize: 20, fontWeight: '700', color: c.text, textAlign: 'center' }}>
          Importar Cupom Fiscal
        </Text>
        <Text style={{ fontSize: 14, color: c.subtext, textAlign: 'center', marginTop: 8 }}>
          Tire uma foto ou selecione uma imagem do cupom para importar os itens automaticamente.
        </Text>
      </View>

      <Pressable
        onPress={() => onCapture('camera')}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          backgroundColor: c.card,
          borderRadius: 16,
          padding: 18,
          borderWidth: 1,
          borderColor: c.border,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: c.primary + '18',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="camera" size={22} color={c.primary} />
        </View>
        <View>
          <Text style={{ fontSize: 16, fontWeight: '600', color: c.text }}>Fotografar cupom</Text>
          <Text style={{ fontSize: 13, color: c.subtext }}>Abrir câmera</Text>
        </View>
      </Pressable>

      <Pressable
        onPress={() => onCapture('gallery')}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          backgroundColor: c.card,
          borderRadius: 16,
          padding: 18,
          borderWidth: 1,
          borderColor: c.border,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: c.primary + '18',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="images" size={22} color={c.primary} />
        </View>
        <View>
          <Text style={{ fontSize: 16, fontWeight: '600', color: c.text }}>
            Selecionar da galeria
          </Text>
          <Text style={{ fontSize: 13, color: c.subtext }}>Escolher imagem existente</Text>
        </View>
      </Pressable>
    </View>
  )
}

function LoadingStep({ message }: { message: string }) {
  const c = useColors()
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32 }}>
      <ActivityIndicator size="large" color={c.primary} />
      <Text style={{ fontSize: 16, fontWeight: '600', color: c.text }}>{message}</Text>
      <Text style={{ fontSize: 13, color: c.subtext, textAlign: 'center' }}>
        O cupom está sendo analisado pela IA...
      </Text>
    </View>
  )
}

function ErrorStep({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  const c = useColors()
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32 }}>
      <Ionicons name="alert-circle-outline" size={56} color={c.danger} />
      <Text style={{ fontSize: 17, fontWeight: '600', color: c.text, textAlign: 'center' }}>
        Não foi possível ler o cupom
      </Text>
      <Text style={{ fontSize: 14, color: c.subtext, textAlign: 'center' }}>{message}</Text>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          style={{
            backgroundColor: c.primary,
            paddingHorizontal: 28,
            paddingVertical: 12,
            borderRadius: 20,
            marginTop: 8,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Tentar novamente</Text>
        </Pressable>
      )}
    </View>
  )
}

function ItemRow({
  item,
  matched,
  onChange,
  onRemove,
}: {
  item: ReviewItem
  matched: boolean
  onChange: (updated: Partial<ReviewItem>) => void
  onRemove: () => void
}) {
  const c = useColors()

  return (
    <View
      style={{
        backgroundColor: c.card,
        borderRadius: 14,
        padding: 14,
        gap: 10,
        borderWidth: 1,
        borderColor: c.border,
      }}
    >
      {/* Header row: name + delete */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: matched ? c.success : '#F59E0B',
            marginTop: 2,
          }}
        />
        <TextInput
          value={item.name}
          onChangeText={(t) => onChange({ name: t })}
          style={{
            flex: 1,
            fontSize: 15,
            fontWeight: '600',
            color: c.text,
            padding: 0,
          }}
          placeholder="Nome do produto"
          placeholderTextColor={c.subtext}
        />
        <Pressable onPress={onRemove} hitSlop={8}>
          <Ionicons name="close-circle" size={20} color={c.subtext} />
        </Pressable>
      </View>

      {/* Qty + price row */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontSize: 11, color: c.subtext, fontWeight: '500' }}>Quantidade</Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: c.inputBg,
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 6,
            }}
          >
            <Pressable
              onPress={() => onChange({ quantity: Math.max(1, item.quantity - 1) })}
              hitSlop={6}
            >
              <Ionicons name="remove" size={16} color={c.primary} />
            </Pressable>
            <TextInput
              value={String(item.quantity)}
              onChangeText={(t) => {
                const n = parseInt(t, 10)
                if (!isNaN(n) && n > 0) onChange({ quantity: n })
              }}
              keyboardType="number-pad"
              style={{ flex: 1, textAlign: 'center', fontSize: 15, color: c.text, padding: 0 }}
            />
            <Pressable onPress={() => onChange({ quantity: item.quantity + 1 })} hitSlop={6}>
              <Ionicons name="add" size={16} color={c.primary} />
            </Pressable>
          </View>
        </View>

        <View style={{ flex: 1.5, gap: 4 }}>
          <Text style={{ fontSize: 11, color: c.subtext, fontWeight: '500' }}>Preço unit. (R$)</Text>
          <TextInput
            value={String(item.price)}
            onChangeText={(t) => {
              const n = parseFloat(t.replace(',', '.'))
              if (!isNaN(n)) onChange({ price: n })
            }}
            keyboardType="decimal-pad"
            style={{
              backgroundColor: c.inputBg,
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 8,
              fontSize: 15,
              color: c.text,
              fontVariant: ['tabular-nums'],
            }}
          />
        </View>

        <View style={{ justifyContent: 'flex-end', paddingBottom: 8 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: c.primary,
              fontVariant: ['tabular-nums'],
            }}
          >
            {formatCurrency(item.price * item.quantity)}
          </Text>
        </View>
      </View>

      {!matched && (
        <Text style={{ fontSize: 11, color: '#F59E0B' }}>
          Produto novo — será criado na categoria "Outros"
        </Text>
      )}
    </View>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function ScanReceiptScreen() {
  const c = useColors()
  const { data: products = [] } = useProducts()
  const { mutate: importReceipt, isPending: saving } = useImportReceipt()

  const [step, setStep] = useState<Step>({ id: 'idle' })
  const [items, setItems] = useState<ReviewItem[]>([])
  const [feiraName, setFeiraName] = useState(`Feira de ${format(new Date(), 'dd/MM')}`)
  const [feiraStore, setFeiraStore] = useState('')
  const [feiraDate] = useState(formatDateForInput(new Date()))
  const [lastCaptureFn, setLastCaptureFn] = useState<(() => void) | null>(null)

  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  )

  // Build matched state for each item
  const matchedMap = useMemo(() => {
    const map = new Map<string, boolean>()
    for (const item of items) {
      map.set(item.localId, item.matchedProductId !== null)
    }
    return map
  }, [items])

  // ── Image capture ──────────────────────────────────────────────────────────

  const handleCapture = useCallback(
    async (source: 'camera' | 'gallery') => {
      // Request permissions
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert('Permissão necessária', 'Permita o acesso à câmera nas configurações.')
          return
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert('Permissão necessária', 'Permita o acesso à galeria nas configurações.')
          return
        }
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              quality: 0.9,
              allowsEditing: false,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              quality: 0.9,
              allowsEditing: false,
            })

      if (result.canceled || !result.assets[0]) return

      const asset = result.assets[0]

      // Store retry function
      const retry = () => handleCapture(source)
      setLastCaptureFn(() => retry)

      setStep({ id: 'loading', message: 'Lendo cupom fiscal...' })

      try {
        const { items: parsed, usedClaude } = await parseReceipt(asset.uri, asset.mimeType ?? undefined)

        if (parsed.length === 0) {
          setStep({
            id: 'error',
            message: usedClaude
              ? 'Nenhum item foi identificado. Tente com uma foto mais nítida e bem iluminada.'
              : 'Configure EXPO_PUBLIC_GOOGLE_VISION_KEY no arquivo .env para usar o reconhecimento automático.',
            onRetry: retry,
          })
          return
        }

        // Match each parsed item to an existing product
        const reviewItems: ReviewItem[] = parsed.map((p: ParsedItem) => {
          const matched = matchProduct(p.name, products)
          return {
            localId: makeLocalId(),
            name: p.name,
            price: p.price,
            quantity: p.quantity,
            matchedProductId: matched?.id ?? null,
          }
        })

        setItems(reviewItems)
        setStep({ id: 'review' })
      } catch (err: any) {
        setStep({
          id: 'error',
          message: err?.message ?? 'Erro inesperado ao processar o cupom.',
          onRetry: retry,
        })
      }
    },
    [products]
  )

  // ── Item editing ───────────────────────────────────────────────────────────

  function updateItem(localId: string, patch: Partial<ReviewItem>) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.localId !== localId) return item
        const updated = { ...item, ...patch }
        // Re-run product matching if name changed
        if (patch.name !== undefined) {
          const matched = matchProduct(patch.name, products)
          updated.matchedProductId = matched?.id ?? null
        }
        return updated
      })
    )
  }

  function removeItem(localId: string) {
    setItems((prev) => prev.filter((i) => i.localId !== localId))
  }

  function addEmptyItem() {
    setItems((prev) => [
      ...prev,
      { localId: makeLocalId(), name: '', price: 0, quantity: 1, matchedProductId: null },
    ])
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  function handleSave() {
    if (!feiraStore.trim()) {
      Alert.alert('Loja obrigatória', 'Informe o nome da loja antes de salvar.')
      return
    }
    if (items.length === 0) {
      Alert.alert('Sem itens', 'Adicione pelo menos um item à feira.')
      return
    }

    importReceipt(
      {
        feiraName: feiraName.trim() || `Feira de ${format(new Date(), 'dd/MM')}`,
        feiraStore: feiraStore.trim(),
        feiraDate,
        items,
        existingProducts: products,
      },
      {
        onSuccess: (feiraId) => {
          router.replace(`/(app)/(feiras)/${feiraId}`)
        },
        onError: (e) => Alert.alert('Erro ao salvar', e.message),
      }
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const title =
    step.id === 'review'
      ? 'Confirmar Itens'
      : step.id === 'loading'
        ? 'Analisando...'
        : 'Importar Cupom'

  return (
    <>
      <Stack.Screen
        options={{
          title,
          headerLargeTitle: false,
          headerTransparent: false,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={10}>
              <Text style={{ fontSize: 16, color: c.primary }}>Cancelar</Text>
            </Pressable>
          ),
        }}
      />

      {step.id === 'idle' && <CaptureStep onCapture={handleCapture} />}
      {step.id === 'loading' && <LoadingStep message={step.message} />}
      {step.id === 'error' && (
        <ErrorStep message={step.message} onRetry={step.onRetry} />
      )}

      {step.id === 'review' && (
        <View style={{ flex: 1 }}>
          <FlatList
            data={items}
            keyExtractor={(i) => i.localId}
            contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 120 }}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <View style={{ gap: 14, marginBottom: 8 }}>
                {/* Feira details */}
                <View
                  style={{
                    backgroundColor: c.card,
                    borderRadius: 16,
                    padding: 16,
                    gap: 12,
                    borderWidth: 1,
                    borderColor: c.border,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: c.subtext }}>
                    DETALHES DA FEIRA
                  </Text>

                  <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: 12, color: c.subtext }}>Nome</Text>
                    <TextInput
                      value={feiraName}
                      onChangeText={setFeiraName}
                      style={{
                        backgroundColor: c.inputBg,
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        fontSize: 15,
                        color: c.text,
                        borderWidth: 1,
                        borderColor: c.border,
                      }}
                    />
                  </View>

                  <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: 12, color: c.subtext }}>
                      Loja <Text style={{ color: c.danger }}>*</Text>
                    </Text>
                    <TextInput
                      value={feiraStore}
                      onChangeText={setFeiraStore}
                      placeholder="Ex: Mercado Central"
                      placeholderTextColor={c.subtext}
                      style={{
                        backgroundColor: c.inputBg,
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        fontSize: 15,
                        color: c.text,
                        borderWidth: 1,
                        borderColor: feiraStore.trim() ? c.border : c.danger + '60',
                      }}
                    />
                  </View>
                </View>

                {/* Legend */}
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View
                      style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.success }}
                    />
                    <Text style={{ fontSize: 12, color: c.subtext }}>Produto existente</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View
                      style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B' }}
                    />
                    <Text style={{ fontSize: 12, color: c.subtext }}>Será criado</Text>
                  </View>
                </View>

                <Text style={{ fontSize: 13, fontWeight: '600', color: c.subtext }}>
                  ITENS ({items.length})
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <ItemRow
                item={item}
                matched={matchedMap.get(item.localId) ?? false}
                onChange={(patch) => updateItem(item.localId, patch)}
                onRemove={() => removeItem(item.localId)}
              />
            )}
            ListFooterComponent={
              <Pressable
                onPress={addEmptyItem}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  padding: 12,
                  marginTop: 4,
                }}
              >
                <Ionicons name="add-circle-outline" size={20} color={c.primary} />
                <Text style={{ fontSize: 14, color: c.primary, fontWeight: '500' }}>
                  Adicionar item manualmente
                </Text>
              </Pressable>
            }
          />

          {/* Pinned footer */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: c.background,
              borderTopWidth: 1,
              borderColor: c.border,
              padding: 16,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 15, color: c.subtext }}>Total ({items.length} itens)</Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: c.primary,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {formatCurrency(total)}
              </Text>
            </View>

            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={({ pressed }) => ({
                backgroundColor: saving ? c.border : c.primary,
                borderRadius: 14,
                padding: 16,
                alignItems: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                  Salvar Feira
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      )}
    </>
  )
}
