import { useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { TextInput as AppTextInput } from '@/components/ui/text-input'
import { useColors } from '@/constants/colors'
import { CATEGORIES, UNITS, CATEGORY_COLORS as CAT_COLORS } from '@/constants/app'
import { useAddFeiraItem } from '@/hooks/use-feira-items'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  quantity: z
    .string()
    .min(1, 'Campo obrigatório')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, { message: 'Deve ser maior que 0' }),
  unit_price: z
    .string()
    .min(1, 'Campo obrigatório')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, { message: 'Deve ser maior que 0' }),
})

type FormData = z.infer<typeof schema>

type Props = {
  feiraId: number
  visible: boolean
  onClose: () => void
}

function ChipPicker<T extends string>({
  options,
  value,
  onChange,
  colorMap,
  c,
}: {
  options: readonly T[]
  value: T
  onChange: (v: T) => void
  colorMap?: Record<string, string>
  c: ReturnType<typeof useColors>
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 4, paddingVertical: 4 }}>
        {options.map((opt) => {
          const active = opt === value
          const accent = colorMap?.[opt] ?? c.primary
          return (
            <Pressable
              key={opt}
              onPress={() => onChange(opt)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: active ? accent : c.border,
                backgroundColor: active ? accent + '20' : c.inputBg,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: active ? '700' : '400',
                  color: active ? accent : c.subtext,
                }}
              >
                {opt}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </ScrollView>
  )
}

export function AddItemForm({ feiraId, visible, onClose }: Props) {
  const c = useColors()
  const { session } = useAuth()
  const { mutate: addItem, isPending } = useAddFeiraItem(feiraId)

  const [category, setCategory] = useState<string>(CATEGORIES[0])
  const [unit, setUnit] = useState<string>('un')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    if (!session) return
    setIsSubmitting(true)
    try {
      const trimmedName = data.name.trim()

      // Find existing product by name (case-insensitive) or create one
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('user_id', session.user.id)
        .ilike('name', trimmedName)
        .maybeSingle()

      let productId: number

      if (existing) {
        productId = existing.id
      } else {
        const { data: created, error: createError } = await supabase
          .from('products')
          .insert({ name: trimmedName, category, unit, user_id: session.user.id })
          .select('id')
          .single()

        if (createError) throw createError
        productId = created.id
      }

      addItem(
        {
          feira_id: feiraId,
          product_id: productId,
          quantity: Number(data.quantity),
          unit_price: Number(data.unit_price),
        },
        {
          onSuccess: () => handleClose(),
          onError: (e) => Alert.alert('Erro', e.message),
        }
      )
    } catch (e: any) {
      Alert.alert('Erro', e.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleClose() {
    reset()
    setCategory(CATEGORIES[0])
    setUnit('un')
    onClose()
  }

  const loading = isPending || isSubmitting

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

        <ScrollView
          contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <AppTextInput
                label="Nome do produto"
                placeholder="Ex: Arroz, Leite, Banana..."
                autoCapitalize="words"
                autoFocus
                value={field.value}
                onChangeText={field.onChange}
                error={errors.name?.message}
              />
            )}
          />

          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: c.subtext }}>Categoria</Text>
            <ChipPicker
              options={CATEGORIES}
              value={category}
              onChange={setCategory}
              colorMap={CAT_COLORS}
              c={c}
            />
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: c.subtext }}>Unidade</Text>
            <ChipPicker options={UNITS} value={unit} onChange={setUnit} c={c} />
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="quantity"
                render={({ field }) => (
                  <AppTextInput
                    label={`Qtd (${unit})`}
                    placeholder="1"
                    keyboardType="decimal-pad"
                    value={field.value}
                    onChangeText={field.onChange}
                    error={errors.quantity?.message}
                  />
                )}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="unit_price"
                render={({ field }) => (
                  <AppTextInput
                    label="Preço (R$)"
                    placeholder="0,00"
                    keyboardType="decimal-pad"
                    value={field.value}
                    onChangeText={field.onChange}
                    error={errors.unit_price?.message}
                  />
                )}
              />
            </View>
          </View>

          <Button
            title="Adicionar item"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            fullWidth
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}
