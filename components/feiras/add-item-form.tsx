import { useMemo, useRef, useState } from 'react'
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Ionicons } from '@expo/vector-icons'
import { Button } from '@/components/ui/button'
import { TextInput as AppTextInput } from '@/components/ui/text-input'
import { useColors } from '@/constants/colors'
import { CATEGORY_COLORS as CAT_COLORS } from '@/constants/app'
import { useProducts, type ProductWithPrice } from '@/hooks/use-products'
import { useAddFeiraItem } from '@/hooks/use-feira-items'

const schema = z.object({
  quantity: z.string().min(1).refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
    message: 'Quantidade deve ser maior que 0',
  }),
  unit_price: z.string().min(1).refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
    message: 'Preço deve ser maior que 0',
  }),
})

type FormData = z.infer<typeof schema>

type Props = {
  feiraId: number
  visible: boolean
  onClose: () => void
}

export function AddItemForm({ feiraId, visible, onClose }: Props) {
  const c = useColors()
  const { data: products = [] } = useProducts()
  const { mutate: addItem, isPending } = useAddFeiraItem(feiraId)
  const [selected, setSelected] = useState<ProductWithPrice | null>(null)
  const [search, setSearch] = useState('')
  const searchRef = useRef<TextInput>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    )
  }, [products, search])

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  function onSubmit(data: FormData) {
    if (!selected) return
    addItem(
      {
        feira_id: feiraId,
        product_id: selected.id,
        quantity: Number(data.quantity),
        unit_price: Number(data.unit_price),
      },
      {
        onSuccess: () => handleClose(),
        onError: (e) => Alert.alert('Erro', e.message),
      }
    )
  }

  function handleClose() {
    reset()
    setSelected(null)
    setSearch('')
    onClose()
  }

  function handleSelect(product: ProductWithPrice) {
    setSelected(product)
    setSearch('')
  }

  function handleClearProduct() {
    setSelected(null)
    setSearch('')
    setTimeout(() => searchRef.current?.focus(), 150)
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: c.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
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
          <Text style={{ fontSize: 17, fontWeight: '600', color: c.text }}>Adicionar Item</Text>
          <Pressable onPress={handleClose}>
            <Text style={{ fontSize: 17, color: c.primary }}>Cancelar</Text>
          </Pressable>
        </View>

        {!selected ? (
          // ── Step 1: search + select product ──────────────────────────────
          <>
            <View style={{ padding: 16, paddingBottom: 8 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: c.inputBg,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  height: 46,
                  borderWidth: 1,
                  borderColor: c.border,
                }}
              >
                <Ionicons name="search" size={18} color={c.subtext} />
                <TextInput
                  ref={searchRef}
                  autoFocus
                  placeholder="Buscar produto ou categoria..."
                  placeholderTextColor={c.subtext}
                  value={search}
                  onChangeText={setSearch}
                  style={{ flex: 1, fontSize: 16, color: c.text }}
                  clearButtonMode="while-editing"
                  autoCapitalize="none"
                  returnKeyType="search"
                />
              </View>
            </View>

            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item.id)}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 40 }}
              ItemSeparatorComponent={() => (
                <View style={{ height: 1, backgroundColor: c.border, marginLeft: 50 }} />
              )}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelect(item)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    backgroundColor: pressed ? c.inputBg : 'transparent',
                  })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: CAT_COLORS[item.category] ?? '#9E9E9E',
                      }}
                    />
                    <View>
                      <Text style={{ fontSize: 16, fontWeight: '500', color: c.text }}>
                        {item.name}
                      </Text>
                      <Text style={{ fontSize: 13, color: c.subtext }}>
                        {item.category}
                        {item.last_price != null
                          ? ` · último: R$${item.last_price.toFixed(2)}/${item.unit}`
                          : ''}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 14, color: c.subtext }}>{item.unit}</Text>
                </Pressable>
              )}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', padding: 48, gap: 10 }}>
                  <Text style={{ fontSize: 30 }}>🔍</Text>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }}>
                    Nenhum produto encontrado
                  </Text>
                  <Text style={{ fontSize: 14, color: c.subtext, textAlign: 'center' }}>
                    Cadastre o produto na aba Produtos antes de adicioná-lo à feira.
                  </Text>
                </View>
              }
            />
          </>
        ) : (
          // ── Step 2: fill quantity and price ──────────────────────────────
          <ScrollView
            contentContainerStyle={{ padding: 20, gap: 20 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Selected product chip */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: c.primary + '18',
                borderRadius: 14,
                padding: 14,
                borderWidth: 1.5,
                borderColor: c.primary,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: CAT_COLORS[selected.category] ?? '#9E9E9E',
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: c.text }}>
                    {selected.name}
                  </Text>
                  <Text style={{ fontSize: 13, color: c.subtext }}>
                    {selected.category} · {selected.unit}
                  </Text>
                </View>
              </View>
              <Pressable onPress={handleClearProduct} hitSlop={10}>
                <Ionicons name="close-circle" size={22} color={c.subtext} />
              </Pressable>
            </View>

            <Controller
              control={control}
              name="quantity"
              render={({ field }) => (
                <AppTextInput
                  label={`Quantidade (${selected.unit})`}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  autoFocus
                  value={field.value}
                  onChangeText={field.onChange}
                  error={errors.quantity?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="unit_price"
              render={({ field }) => (
                <AppTextInput
                  label="Preço Unitário (R$)"
                  placeholder="0,00"
                  keyboardType="decimal-pad"
                  value={field.value}
                  onChangeText={field.onChange}
                  error={errors.unit_price?.message}
                />
              )}
            />

            <Button
              title="Adicionar"
              onPress={handleSubmit(onSubmit)}
              loading={isPending}
              fullWidth
            />
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Modal>
  )
}
