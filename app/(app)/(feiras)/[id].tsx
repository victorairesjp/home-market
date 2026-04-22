import { useState } from 'react'
import { Alert, FlatList, Pressable, Text, View } from 'react-native'
import { Stack, useLocalSearchParams } from 'expo-router'
import Animated, { FadeInDown, FadeOutLeft } from 'react-native-reanimated'
import { AddItemForm } from '@/components/feiras/add-item-form'
import { FeiraEditForm } from '@/components/feiras/feira-form'
import { Card } from '@/components/ui/card'
import { Loading } from '@/components/ui/loading'
import { EmptyState } from '@/components/ui/empty-state'
import { HeaderAddButton } from '@/components/ui/header-add-button'
import { useColors } from '@/constants/colors'
import { useFeira } from '@/hooks/use-feiras'
import { useDeleteFeiraItem } from '@/hooks/use-feira-items'
import { formatCurrency, formatDate } from '@/lib/format'
import type { FeiraItemWithProduct } from '@/types/database'

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

  function handleDelete() {
    Alert.alert('Remover Item', `Remover "${item.products.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => deleteItem(item.id) },
    ])
  }

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).springify()} exiting={FadeOutLeft}>
      <Card padding={12}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }}>
              {item.products.name}
            </Text>
            <Text style={{ fontSize: 13, color: c.subtext }}>
              {item.quantity} {item.products.unit} × {formatCurrency(item.unit_price)}
            </Text>
            <Text style={{ fontSize: 12, color: c.subtext }}>{item.products.category}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 8 }}>
            <Text
              selectable
              style={{ fontSize: 16, fontWeight: '700', color: c.primary, fontVariant: ['tabular-nums'] }}
            >
              {formatCurrency(item.quantity * item.unit_price)}
            </Text>
            <Pressable onPress={handleDelete}>
              <Text style={{ fontSize: 12, color: c.danger, fontWeight: '500' }}>Remover</Text>
            </Pressable>
          </View>
        </View>
      </Card>
    </Animated.View>
  )
}

export default function FeiraDetailScreen() {
  const c = useColors()
  const { id } = useLocalSearchParams<{ id: string }>()
  const feiraId = Number(id)
  const { data: feira, isLoading } = useFeira(feiraId)
  const [showAddItem, setShowAddItem] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  if (isLoading) return <Loading />
  if (!feira) return null

  return (
    <>
      <Stack.Screen
        options={{
          title: feira.name,
          headerLargeTitle: false,
          headerLeft: () => (
            <Pressable onPress={() => setShowEdit(true)} hitSlop={10}>
              <Text style={{ fontSize: 15, color: c.primary, fontWeight: '500' }}>Editar</Text>
            </Pressable>
          ),
          headerRight: () => (
            <HeaderAddButton label="Item" onPress={() => setShowAddItem(true)} />
          ),
        }}
      />

      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        data={feira.feira_items as FeiraItemWithProduct[]}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}
        ListHeaderComponent={
          <Card style={{ marginBottom: 4, gap: 6 }}>
            <Text style={{ fontSize: 13, color: c.subtext }}>{feira.store}</Text>
            <Text style={{ fontSize: 13, color: c.subtext }}>{formatDate(feira.date)}</Text>
            {feira.notes && (
              <Text style={{ fontSize: 13, color: c.subtext, fontStyle: 'italic' }}>
                {feira.notes}
              </Text>
            )}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 8,
                paddingTop: 12,
                borderTopWidth: 1,
                borderColor: c.border,
              }}
            >
              <Text style={{ fontSize: 14, color: c.subtext }}>
                {feira.feira_items.length} {feira.feira_items.length === 1 ? 'item' : 'itens'}
              </Text>
              <Text
                selectable
                style={{ fontSize: 20, fontWeight: '700', color: c.primary, fontVariant: ['tabular-nums'] }}
              >
                {formatCurrency(feira.total)}
              </Text>
            </View>
          </Card>
        }
        renderItem={({ item, index }) => (
          <ItemRow item={item as FeiraItemWithProduct} feiraId={feiraId} index={index} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="📦"
            title="Nenhum item"
            description="Toque em '+ Item' para adicionar produtos a esta feira."
          />
        }
      />

      <AddItemForm
        feiraId={feiraId}
        visible={showAddItem}
        onClose={() => setShowAddItem(false)}
      />

      <FeiraEditForm
        visible={showEdit}
        onClose={() => setShowEdit(false)}
        feira={feira}
      />
    </>
  )
}
