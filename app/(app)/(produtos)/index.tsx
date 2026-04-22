import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Pressable, SectionList, Text, TextInput as RNTextInput, View } from 'react-native'
import { Stack } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Animated, { FadeInDown, FadeOutLeft } from 'react-native-reanimated'
import { ProductForm } from '@/components/produtos/product-form'
import { Card } from '@/components/ui/card'
import { Loading } from '@/components/ui/loading'
import { EmptyState } from '@/components/ui/empty-state'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { HeaderAddButton } from '@/components/ui/header-add-button'
import { useColors } from '@/constants/colors'
import {
  useProducts,
  useDeleteProduct,
  useSeedDefaultProducts,
  useResetToDefaultProducts,
  type ProductWithPrice,
} from '@/hooks/use-products'
import { useAuth } from '@/hooks/use-auth'
import { CATEGORY_COLORS as CAT_COLORS } from '@/constants/app'
import { formatCurrency } from '@/lib/format'
import type { Product } from '@/types/database'

type SortMode = 'category' | 'alpha' | 'price'

function ProductRow({
  product,
  index,
  onEdit,
}: {
  product: ProductWithPrice
  index: number
  onEdit: (p: Product) => void
}) {
  const c = useColors()
  const { mutate: deleteProduct } = useDeleteProduct()

  function handleDelete() {
    const inFeiras = product.usage_count
    const msg =
      inFeiras > 0
        ? `"${product.name}" foi usado em ${inFeiras} ${inFeiras === 1 ? 'feira' : 'feiras'}. Os registros dessas feiras serão afetados.`
        : `Excluir "${product.name}"?`
    Alert.alert('Excluir Produto', msg, [
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
    <Animated.View entering={FadeInDown.delay(index * 30).springify()} exiting={FadeOutLeft}>
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
              {product.avg_price != null && (
                <>
                  {' · '}
                  <Text style={{ color: c.text, fontWeight: '500' }}>
                    {formatCurrency(product.avg_price)}/{product.unit}
                  </Text>
                </>
              )}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable onPress={() => onEdit(product)} hitSlop={6}>
              <Text style={{ fontSize: 13, color: c.primary, fontWeight: '500' }}>Editar</Text>
            </Pressable>
            <Pressable onPress={handleDelete} hitSlop={6}>
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
  const { session } = useAuth()
  const { data: products, isLoading } = useProducts()
  const { mutate: seedDefaults, isPending: seeding } = useSeedDefaultProducts()
  const { mutate: resetDefaults, isPending: resetting } = useResetToDefaultProducts()
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [sort, setSort] = useState<SortMode>('category')
  const [search, setSearch] = useState('')
  const autoSeededRef = useRef(false)

  // Auto-seed default products for new users (once per account, tracked in AsyncStorage)
  useEffect(() => {
    if (isLoading || autoSeededRef.current || !session?.user.id || !products) return
    if (products.length > 0) return
    const key = `hm_seeded_${session.user.id}`
    AsyncStorage.getItem(key).then((done) => {
      if (!done) {
        autoSeededRef.current = true
        seedDefaults(undefined, {
          onSuccess: () => AsyncStorage.setItem(key, '1'),
        })
      }
    })
  }, [isLoading, products, session?.user.id])

  const filtered = useMemo(() => {
    if (!products) return []
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    )
  }, [products, search])

  const sections = useMemo(() => {
    if (filtered.length === 0) return []

    if (sort === 'category') {
      const groups = new Map<string, ProductWithPrice[]>()
      for (const p of filtered) {
        const key = p.category
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key)!.push(p)
      }
      return Array.from(groups.entries())
        .sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))
        .map(([category, items]) => ({
          title: category,
          color: CAT_COLORS[category] ?? '#9E9E9E',
          data: [...items].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
        }))
    }

    if (sort === 'alpha') {
      return [
        {
          title: 'Todos',
          color: '#9E9E9E',
          data: [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
        },
      ]
    }

    return [
      {
        title: 'Por preço (maior → menor)',
        color: '#9E9E9E',
        data: [...filtered].sort((a, b) => {
          const ap = a.avg_price ?? -Infinity
          const bp = b.avg_price ?? -Infinity
          return bp - ap
        }),
      },
    ]
  }, [filtered, sort])

  function handleEdit(p: Product) {
    setEditingProduct(p)
    setShowForm(true)
  }

  function handleClose() {
    setShowForm(false)
    setEditingProduct(null)
  }

  function handleReset() {
    Alert.alert(
      'Restaurar lista padrão',
      'Isso vai apagar todos os seus produtos e o histórico de compras vinculado. Essa ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar',
          style: 'destructive',
          onPress: () =>
            resetDefaults(undefined, {
              onError: (e) => Alert.alert('Erro', e.message),
            }),
        },
      ]
    )
  }

  if (isLoading || seeding || resetting) return <Loading />

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderAddButton label="Produto" onPress={() => setShowForm(true)} />
          ),
        }}
      />

      <SectionList
        contentInsetAdjustmentBehavior="automatic"
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        stickySectionHeadersEnabled={sort === 'category'}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 40 }}
        ListHeaderComponent={
          products && products.length > 0 ? (
            <View style={{ gap: 12, marginBottom: 12 }}>
              <SearchInput value={search} onChange={setSearch} c={c} />
              <SegmentedControl<SortMode>
                value={sort}
                onChange={setSort}
                options={[
                  { value: 'category', label: 'Categoria' },
                  { value: 'alpha', label: 'A–Z' },
                  { value: 'price', label: 'Preço' },
                ]}
              />
            </View>
          ) : null
        }
        renderSectionHeader={({ section }) =>
          sort === 'category' ? (
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
              <View
                style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: section.color }}
              />
              <Text style={{ fontSize: 13, fontWeight: '700', color: c.text }}>
                {section.title}
              </Text>
              <Text style={{ fontSize: 12, color: c.subtext }}>
                {section.data.length} {section.data.length === 1 ? 'item' : 'itens'}
              </Text>
            </View>
          ) : (
            <View style={{ paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, color: c.subtext, fontWeight: '500' }}>
                {section.title} · {section.data.length}{' '}
                {section.data.length === 1 ? 'item' : 'itens'}
              </Text>
            </View>
          )
        }
        renderItem={({ item, index }) => (
          <ProductRow product={item} index={index} onEdit={handleEdit} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        SectionSeparatorComponent={() => <View style={{ height: 4 }} />}
        ListFooterComponent={
          products && products.length > 0 && !search.trim() ? (
            <Pressable
              onPress={handleReset}
              style={{ alignItems: 'center', paddingVertical: 24, paddingTop: 32 }}
            >
              <Text style={{ fontSize: 13, color: c.subtext }}>Restaurar lista padrão</Text>
            </Pressable>
          ) : null
        }
        ListEmptyComponent={
          search.trim() ? (
            <EmptyState
              icon="🔍"
              title="Nenhum produto encontrado"
              description={`Não há produtos que correspondam a "${search}".`}
            />
          ) : (
            <View style={{ alignItems: 'center', gap: 16, paddingTop: 40 }}>
              <EmptyState
                icon="🥕"
                title="Nenhum produto ainda"
                description="Adicione produtos manualmente ou carregue a lista padrão."
              />
              <Pressable
                onPress={() =>
                  seedDefaults(undefined, {
                    onSuccess: () =>
                      session?.user.id &&
                      AsyncStorage.setItem(`hm_seeded_${session.user.id}`, '1'),
                    onError: (e) => Alert.alert('Erro', e.message),
                  })
                }
                style={{
                  backgroundColor: c.primary,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 20,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>
                  Carregar lista padrão
                </Text>
              </Pressable>
            </View>
          )
        }
      />

      <ProductForm visible={showForm} onClose={handleClose} product={editingProduct} />
    </>
  )
}

function SearchInput({
  value,
  onChange,
  c,
}: {
  value: string
  onChange: (v: string) => void
  c: ReturnType<typeof useColors>
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: c.inputBg,
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 40,
      }}
    >
      <Ionicons name="search" size={16} color={c.subtext} />
      <RNTextInput
        placeholder="Buscar produto ou categoria"
        placeholderTextColor={c.subtext}
        value={value}
        onChangeText={onChange}
        style={{ flex: 1, fontSize: 15, color: c.text }}
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />
    </View>
  )
}
