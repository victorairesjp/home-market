import { useEffect, useRef, useState } from 'react'
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import DateTimePicker from '@react-native-community/datetimepicker'
import Animated, { FadeInDown, FadeOutLeft } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { AddItemForm } from '@/components/feiras/add-item-form'
import { Loading } from '@/components/ui/loading'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { useColors, CARD_SHADOW, SHADOW_SM } from '@/constants/colors'
import { CATEGORY_COLORS } from '@/constants/app'
import { useFeira, useUpdateFeira } from '@/hooks/use-feiras'
import { useDeleteFeiraItem, useUpdateFeiraItem } from '@/hooks/use-feira-items'
import { formatCurrency, formatDateForInput, formatDateShort } from '@/lib/format'
import type { FeiraItemWithProduct } from '@/types/database'

const CATEGORY_ICONS: Record<string, string> = {
  Frutas:     '🍎',
  Verduras:   '🥦',
  Carnes:     '🥩',
  Laticínios: '🥛',
  Cereais:    '🌾',
  Bebidas:    '🧃',
  Padaria:    '🍞',
  Limpeza:    '🧹',
  Higiene:    '🧴',
  Congelados: '🧊',
  Outros:     '📦',
}

function ItemRow({
  item,
  feiraId,
  index,
}: {
  item: FeiraItemWithProduct
  feiraId: number
  index: number
}) {
  const c = useColors()
  const { mutate: deleteItem } = useDeleteFeiraItem(feiraId)
  const { mutate: updateItem } = useUpdateFeiraItem(feiraId)
  const catColor = CATEGORY_COLORS[item.products.category] ?? '#9E9E9E'
  const emoji = CATEGORY_ICONS[item.products.category] ?? '📦'

  function handleDelete() {
    Alert.alert('Remover Item', `Remover "${item.products.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => deleteItem(item.id) },
    ])
  }

  function handleQtyChange(delta: number) {
    const next = item.quantity + delta
    if (next <= 0) {
      handleDelete()
      return
    }
    updateItem({ id: item.id, quantity: next })
  }

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).springify()} exiting={FadeOutLeft}>
      <View
        style={{
          backgroundColor: c.card,
          borderRadius: 20,
          padding: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          ...(c.isDark ? {} : CARD_SHADOW),
        }}
      >
        {/* Category icon */}
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            backgroundColor: catColor + '20',
            justifyContent: 'center',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <Text style={{ fontSize: 26 }}>{emoji}</Text>
        </View>

        {/* Name + category + unit price */}
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: c.text }} numberOfLines={1}>
            {item.products.name}
          </Text>
          <Text style={{ fontSize: 12, color: c.subtext }}>
            {item.products.category} · {formatCurrency(item.unit_price)}/{item.products.unit}
          </Text>
        </View>

        {/* Qty stepper + total */}
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: c.primary, fontVariant: ['tabular-nums'] }}>
            {formatCurrency(item.quantity * item.unit_price)}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Pressable
              onPress={() => handleQtyChange(-1)}
              style={({ pressed }) => ({
                width: 28,
                height: 28,
                borderRadius: 9,
                backgroundColor: pressed ? c.danger + '20' : c.inputBg,
                justifyContent: 'center',
                alignItems: 'center',
              })}
            >
              <Ionicons name="remove" size={16} color={c.danger} />
            </Pressable>

            <Text style={{ fontSize: 14, fontWeight: '700', color: c.text, minWidth: 20, textAlign: 'center', fontVariant: ['tabular-nums'] }}>
              {item.quantity}
            </Text>

            <Pressable
              onPress={() => handleQtyChange(+1)}
              style={({ pressed }) => ({
                width: 28,
                height: 28,
                borderRadius: 9,
                backgroundColor: pressed ? c.primary + '30' : c.primary + '18',
                justifyContent: 'center',
                alignItems: 'center',
              })}
            >
              <Ionicons name="add" size={16} color={c.primary} />
            </Pressable>
          </View>
        </View>
      </View>
    </Animated.View>
  )
}

export default function FeiraDetailScreen() {
  const c = useColors()
  const { id } = useLocalSearchParams<{ id: string }>()
  const feiraId = Number(id)
  const { data: feira, isLoading } = useFeira(feiraId)
  const { mutate: updateFeira, isPending: saving } = useUpdateFeira()

  const [showAddItem, setShowAddItem] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [name, setName] = useState('')
  const [store, setStore] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(new Date())
  const initialized = useRef(false)

  useEffect(() => {
    if (feira && !initialized.current) {
      setName(feira.name)
      setStore(feira.store)
      setNotes(feira.notes ?? '')
      setDate(new Date(feira.date + 'T12:00:00'))
      initialized.current = true
    }
  }, [feira])

  const isDirty =
    feira &&
    (name !== feira.name ||
      store !== feira.store ||
      (notes || '') !== (feira.notes ?? '') ||
      formatDateForInput(date) !== feira.date)

  function handleSave() {
    if (!name.trim()) {
      Alert.alert('Campo obrigatório', 'O nome da feira não pode estar vazio.')
      return
    }
    if (!store.trim()) {
      Alert.alert('Campo obrigatório', 'A loja não pode estar vazia.')
      return
    }
    updateFeira(
      {
        id: feiraId,
        name: name.trim(),
        store: store.trim(),
        notes: notes.trim() || null,
        date: formatDateForInput(date),
      },
      {
        onSuccess: () =>
          Alert.alert('Salvo!', 'Feira atualizada com sucesso.', [
            { text: 'OK', onPress: () => router.replace('/(app)/(feiras)') },
          ]),
        onError: (e) => Alert.alert('Erro', e.message),
      }
    )
  }

  function handleBack() {
    if (isDirty) {
      Alert.alert('Alterações não salvas', 'Deseja sair sem salvar?', [
        { text: 'Continuar editando', style: 'cancel' },
        { text: 'Sair sem salvar', style: 'destructive', onPress: () => router.back() },
      ])
    } else {
      router.back()
    }
  }

  if (isLoading || !feira) return <Loading />

  const items = feira.feira_items as FeiraItemWithProduct[]

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <Stack.Screen
        options={{
          title: '',
          headerTransparent: true,
          headerLeft: () => (
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: pressed ? c.inputBg : c.card,
                justifyContent: 'center',
                alignItems: 'center',
                ...SHADOW_SM,
              })}
            >
              <Ionicons name="chevron-back" size={20} color={c.text} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={() => setShowAddItem(true)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 14,
                height: 36,
                borderRadius: 12,
                backgroundColor: pressed ? c.primary + 'CC' : c.primary,
                ...SHADOW_SM,
              })}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Item</Text>
            </Pressable>
          ),
        }}
      />

      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, gap: 10, paddingBottom: 180 }}
        ListHeaderComponent={
          <View style={{ gap: 14, marginBottom: 4, paddingTop: 4 }}>
            {/* Feira metadata card */}
            <View
              style={{
                backgroundColor: c.card,
                borderRadius: 24,
                padding: 20,
                gap: 16,
                ...(c.isDark ? {} : CARD_SHADOW),
              }}
            >
              <TextInput
                value={name}
                onChangeText={setName}
                style={{
                  fontSize: 20,
                  fontWeight: '800',
                  color: c.text,
                  padding: 0,
                  borderBottomWidth: 1,
                  borderColor: c.border,
                  paddingBottom: 8,
                }}
                placeholder="Nome da feira"
                placeholderTextColor={c.subtext}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: c.subtext, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    Loja
                  </Text>
                  <TextInput
                    value={store}
                    onChangeText={setStore}
                    style={{ fontSize: 14, color: c.text, padding: 0 }}
                    placeholder="Loja ou local"
                    placeholderTextColor={c.subtext}
                  />
                </View>

                <View style={{ gap: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: c.subtext, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    Data
                  </Text>
                  {Platform.OS === 'ios' ? (
                    <DateTimePicker
                      value={date}
                      mode="date"
                      display="compact"
                      onChange={(_, d) => d && setDate(d)}
                      maximumDate={new Date()}
                      locale="pt-BR"
                    />
                  ) : (
                    <Pressable onPress={() => setShowDatePicker(true)}>
                      <Text style={{ fontSize: 14, color: c.primary, fontWeight: '600' }}>
                        {formatDateShort(date.toISOString())}
                      </Text>
                    </Pressable>
                  )}
                  {showDatePicker && Platform.OS !== 'ios' && (
                    <DateTimePicker
                      value={date}
                      mode="date"
                      display="default"
                      onChange={(_, d) => { setShowDatePicker(false); if (d) setDate(d) }}
                      maximumDate={new Date()}
                    />
                  )}
                </View>
              </View>

              {/* Total summary */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: c.primary + '10',
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="cube-outline" size={15} color={c.subtext} />
                  <Text style={{ fontSize: 14, color: c.subtext }}>
                    {items.length} {items.length === 1 ? 'item' : 'itens'}
                  </Text>
                </View>
                <Text style={{ fontSize: 22, fontWeight: '800', color: c.primary, fontVariant: ['tabular-nums'] }}>
                  {formatCurrency(feira.total)}
                </Text>
              </View>
            </View>

            {items.length > 0 && (
              <Text style={{ fontSize: 13, fontWeight: '700', color: c.subtext, paddingHorizontal: 4, letterSpacing: 0.3, textTransform: 'uppercase' }}>
                Itens
              </Text>
            )}
          </View>
        }
        renderItem={({ item, index }) => (
          <ItemRow item={item} feiraId={feiraId} index={index} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="🛒"
            title="Cesta vazia"
            description="Toque em '+ Item' para adicionar produtos a esta feira."
          />
        }
      />

      {/* Floating sticky footer */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 16,
          paddingBottom: Platform.OS === 'ios' ? 36 : 20,
          paddingTop: 12,
          backgroundColor: c.background,
          borderTopWidth: 1,
          borderColor: c.border,
          gap: 10,
          ...(c.isDark
            ? {}
            : {
                shadowColor: '#101828',
                shadowOffset: { width: 0, height: -6 },
                shadowOpacity: 0.08,
                shadowRadius: 16,
                elevation: 12,
              }),
        }}
      >
        {isDirty && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
            <Ionicons name="alert-circle-outline" size={14} color={c.subtext} />
            <Text style={{ fontSize: 12, color: c.subtext }}>Há alterações não salvas</Text>
          </View>
        )}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Button title="← Voltar" onPress={handleBack} variant="secondary" />
          </View>
          <View style={{ flex: 2 }}>
            <Button
              title={isDirty ? 'Salvar alterações' : 'Salvar'}
              onPress={handleSave}
              loading={saving}
            />
          </View>
        </View>
      </View>

      <AddItemForm
        feiraId={feiraId}
        visible={showAddItem}
        onClose={() => setShowAddItem(false)}
      />
    </View>
  )
}
