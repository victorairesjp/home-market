import { useEffect, useState } from 'react'
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Button } from '@/components/ui/button'
import { TextInput } from '@/components/ui/text-input'
import { useColors } from '@/constants/colors'
import { useUpdateFeira } from '@/hooks/use-feiras'
import { formatDateShort, formatDateForInput } from '@/lib/format'
import type { Feira } from '@/types/database'

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  store: z.string().min(1, 'Loja é obrigatória'),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

type Props = {
  visible: boolean
  onClose: () => void
  feira: Feira
}

export function FeiraEditForm({ visible, onClose, feira }: Props) {
  const c = useColors()
  const { mutate: updateFeira, isPending } = useUpdateFeira()

  const [date, setDate] = useState(new Date(feira.date + 'T12:00:00'))
  const [showDatePicker, setShowDatePicker] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: feira.name,
      store: feira.store,
      notes: feira.notes ?? '',
    },
  })

  useEffect(() => {
    if (visible) {
      reset({ name: feira.name, store: feira.store, notes: feira.notes ?? '' })
      setDate(new Date(feira.date + 'T12:00:00'))
    }
  }, [visible, feira.id])

  function onSubmit(data: FormData) {
    updateFeira(
      { id: feira.id, ...data, date: formatDateForInput(date) },
      {
        onSuccess: () => onClose(),
        onError: (e) => Alert.alert('Erro', e.message),
      }
    )
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
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
          <Text style={{ fontSize: 17, fontWeight: '600', color: c.text }}>Editar Feira</Text>
          <Pressable onPress={onClose}>
            <Text style={{ fontSize: 17, color: c.primary }}>Cancelar</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, gap: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <TextInput
                label="Nome da Feira"
                placeholder="Ex: Feira do Sábado"
                autoCapitalize="words"
                value={field.value}
                onChangeText={field.onChange}
                error={errors.name?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="store"
            render={({ field }) => (
              <TextInput
                label="Loja / Local"
                placeholder="Ex: Mercado Central"
                autoCapitalize="words"
                value={field.value}
                onChangeText={field.onChange}
                error={errors.store?.message}
              />
            )}
          />

          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: c.subtext }}>Data</Text>
            {process.env.EXPO_OS === 'ios' ? (
              <DateTimePicker
                value={date}
                mode="date"
                display="inline"
                onChange={(_, d) => d && setDate(d)}
                maximumDate={new Date()}
                locale="pt-BR"
              />
            ) : (
              <>
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  style={{
                    backgroundColor: c.input,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderWidth: 1,
                    borderColor: c.border,
                  }}
                >
                  <Text style={{ fontSize: 16, color: c.text }}>{formatDateShort(date.toISOString())}</Text>
                </Pressable>
                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={(_, d) => {
                      setShowDatePicker(false)
                      if (d) setDate(d)
                    }}
                    maximumDate={new Date()}
                  />
                )}
              </>
            )}
          </View>

          <Controller
            control={control}
            name="notes"
            render={({ field }) => (
              <TextInput
                label="Observações (opcional)"
                placeholder="Notas sobre essa feira..."
                multiline
                numberOfLines={3}
                style={{ minHeight: 80, textAlignVertical: 'top' }}
                value={field.value ?? ''}
                onChangeText={field.onChange}
              />
            )}
          />

          <Button
            title="Salvar"
            onPress={handleSubmit(onSubmit)}
            loading={isPending}
            fullWidth
          />
        </ScrollView>
      </View>
    </Modal>
  )
}
