import { useState } from 'react'
import { Alert, FlatList, Pressable, Text, View } from 'react-native'
import { Stack } from 'expo-router'
import Animated, { FadeInDown, FadeOutLeft } from 'react-native-reanimated'
import { ProductForm } from '@/components/produtos/product-form'
import { Card } from '@/components/ui/card'
import { Loading } from '@/components/ui/loading'
import { EmptyState } from '@/components/ui/empty-state'
import { useColors, PRIMARY } from '@/constants/colors'
import { useProducts, useDeleteProduct } from '@/hooks/use-products'
import { CATEGORY_COLORS as CAT_COLORS } from '@/constants/app'
import type { Product } from '@/types/database'

function ProductRow({
  product,
  index,
  onEdit,
}: {
  product: Product
  index: number
  onEdit: (p: Product) => void
}) {
  const c = useColors()
  const { mutate: deleteProduct } = useDeleteProduct()

  function handleDelete() {
    Alert.alert('Excluir Produto', `Excluir "${product.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () =>
          deleteProduct(product.id, {
            onError: (e) => Alert.alert('Erro', e.message),
          }),
      },
    ])
  }

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).springify()} exiting={FadeOutLeft}>
      <Card padding={12}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: CAT_COLORS[product.category] ?? '#9E9E9E',
              flexShrink: 0,
            }}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }}>{product.name}</Text>
            <Text style={{ fontSize: 13, color: c.subtext }}>
              {product.category} · {product.unit}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable onPress={() => onEdit(product)}>
              <Text style={{ fontSize: 13, color: c.primary, fontWeight: '500' }}>Editar</Text>
            </Pressable>
            <Pressable onPress={handleDelete}>
              <Text style={{ fontSize: 13, color: c.danger, fontWeight: '500' }}>Excluir</Text>
            </Pressable>
          </View>
        </View>
      </Card>
    </Animated.View>
  )
}

export default function ProdutosScreen() {
  const c = useColors()
  const { data: products, isLoading } = useProducts()
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  function handleEdit(p: Product) {
    setEditingProduct(p)
    setShowForm(true)
  }

  function handleClose() {
    setShowForm(false)
    setEditingProduct(null)
  }

  if (isLoading) return <Loading />

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => setShowForm(true)}>
              <Text style={{ fontSize: 15, color: PRIMARY, fontWeight: '600' }}>+ Novo</Text>
            </Pressable>
          ),
        }}
      />

      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        data={products}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}
        renderItem={({ item, index }) => (
          <ProductRow product={item} index={index} onEdit={handleEdit} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="🥕"
            title="Nenhum produto ainda"
            description="Toque em '+ Novo' para cadastrar seus primeiros produtos."
          />
        }
      />

      <ProductForm
        visible={showForm}
        onClose={handleClose}
        product={editingProduct}
      />
    </>
  )
}
