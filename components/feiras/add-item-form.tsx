import { useState } from 'react'
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { TextInput } from '@/components/ui/text-input'
import { useColors } from '@/constants/colors'
import { useProducts } from '@/hooks/use-products'
import { useAddFeiraItem } from '@/hooks/use-feira-items'
import type { Product } from '@/types/database'

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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showPicker, setShowPicker] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  function onSubmit(data: FormData) {
    if (!selectedProduct) {
      Alert.alert('Selecione um produto')
      return
    }
    addItem(
      {
        feira_id: feiraId,
        product_id: selectedProduct.id,
        quantity: Number(data.quantity),
        unit_price: Number(data.unit_price),
      },
      {
        onSuccess: () => {
          reset()
          setSelectedProduct(null)
          onClose()
        },
        onError: (e) => Alert.alert('Erro', e.message),
      }
    )
  }

  function handleClose() {
    reset()
    setSelectedProduct(null)
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={handleClose}>
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
          <Text style={{ fontSize: 17, fontWeight: '600', color: c.text }}>Adicionar Item</Text>
          <Pressable onPress={handleClose}>
            <Text style={{ fontSize: 17, color: c.primary }}>Cancelar</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: c.subtext }}>Produto</Text>
            <Pressable
              onPress={() => setShowPicker(true)}
              style={{
                backgroundColor: c.input,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                minHeight: 46,
                borderWidth: 1,
                borderColor: c.border,
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 16, color: selectedProduct ? c.text : c.subtext }}>
                {selectedProduct ? `${selectedProduct.name} (${selectedProduct.unit})` : 'Selecionar produto...'}
              </Text>
            </Pressable>
          </View>

          <Controller
            control={control}
            name="quantity"
            render={({ field }) => (
              <TextInput
                label="Quantidade"
                placeholder={selectedProduct ? `em ${selectedProduct.unit}` : '0'}
                keyboardType="decimal-pad"
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
              <TextInput
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
      </View>

      <Modal
        visible={showPicker}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowPicker(false)}
      >
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
            <Text style={{ fontSize: 17, fontWeight: '600', color: c.text }}>Produtos</Text>
            <Pressable onPress={() => setShowPicker(false)}>
              <Text style={{ fontSize: 17, color: c.primary }}>Fechar</Text>
            </Pressable>
          </View>
          <ScrollView contentInsetAdjustmentBehavior="automatic">
            {products.map((product) => (
              <Pressable
                key={product.id}
                onPress={() => {
                  setSelectedProduct(product)
                  setShowPicker(false)
                }}
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
                <View>
                  <Text style={{ fontSize: 16, color: c.text, fontWeight: '500' }}>
                    {product.name}
                  </Text>
                  <Text style={{ fontSize: 13, color: c.subtext }}>{product.category}</Text>
                </View>
                <Text style={{ fontSize: 14, color: c.subtext }}>{product.unit}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </Modal>
  )
}
