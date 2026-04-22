import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { TextInput } from '@/components/ui/text-input'
import { useColors } from '@/constants/colors'
import { useCreateProduct, useUpdateProduct } from '@/hooks/use-products'
import { CATEGORIES, UNITS } from '@/constants/app'
import type { Product } from '@/types/database'

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  unit: z.string().min(1, 'Unidade é obrigatória'),
  category: z.string().min(1, 'Categoria é obrigatória'),
})

type FormData = z.infer<typeof schema>

type Props = {
  visible: boolean
  onClose: () => void
  product?: Product | null
}

export function ProductForm({ visible, onClose, product }: Props) {
  const c = useColors()
  const { mutate: createProduct, isPending: creating } = useCreateProduct()
  const { mutate: updateProduct, isPending: updating } = useUpdateProduct()
  const isPending = creating || updating

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? '',
      unit: product?.unit ?? 'un',
      category: product?.category ?? 'Outros',
    },
  })

  const selectedUnit = watch('unit')
  const selectedCategory = watch('category')

  function onSubmit(data: FormData) {
    if (product) {
      updateProduct(
        { id: product.id, ...data },
        {
          onSuccess: () => { reset(); onClose() },
          onError: (e) => Alert.alert('Erro', e.message),
        }
      )
    } else {
      createProduct(data, {
        onSuccess: () => { reset(); onClose() },
        onError: (e) => Alert.alert('Erro', e.message),
      })
    }
  }

  function handleClose() {
    reset()
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
          <Text style={{ fontSize: 17, fontWeight: '600', color: c.text }}>
            {product ? 'Editar Produto' : 'Novo Produto'}
          </Text>
          <Pressable onPress={handleClose}>
            <Text style={{ fontSize: 17, color: c.primary }}>Cancelar</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <TextInput
                label="Nome do Produto"
                placeholder="Ex: Tomate, Arroz..."
                autoCapitalize="words"
                value={field.value}
                onChangeText={field.onChange}
                error={errors.name?.message}
              />
            )}
          />

          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: c.subtext }}>Unidade</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {UNITS.map((unit) => (
                <Pressable
                  key={unit}
                  onPress={() => setValue('unit', unit)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: selectedUnit === unit ? c.primary : c.inputBg,
                    borderWidth: 1,
                    borderColor: selectedUnit === unit ? c.primary : c.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: selectedUnit === unit ? '#FFFFFF' : c.text,
                    }}
                  >
                    {unit}
                  </Text>
                </Pressable>
              ))}
            </View>
            {errors.unit && (
              <Text style={{ fontSize: 12, color: c.danger }}>{errors.unit.message}</Text>
            )}
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: c.subtext }}>Categoria</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setValue('category', cat)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: selectedCategory === cat ? c.primary : c.inputBg,
                    borderWidth: 1,
                    borderColor: selectedCategory === cat ? c.primary : c.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '500',
                      color: selectedCategory === cat ? '#FFFFFF' : c.text,
                    }}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>
            {errors.category && (
              <Text style={{ fontSize: 12, color: c.danger }}>{errors.category.message}</Text>
            )}
          </View>

          <Button
            title={product ? 'Salvar' : 'Criar Produto'}
            onPress={handleSubmit(onSubmit)}
            loading={isPending}
            fullWidth
          />
        </ScrollView>
      </View>
    </Modal>
  )
}
