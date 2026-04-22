import { useState } from 'react'
import { Alert, Pressable, ScrollView, Text, View } from 'react-native'
import { router, Stack } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Button } from '@/components/ui/button'
import { TextInput } from '@/components/ui/text-input'
import { useColors } from '@/constants/colors'
import { useCreateFeira } from '@/hooks/use-feiras'
import { formatDateShort, formatDateForInput } from '@/lib/format'

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  store: z.string().min(1, 'Loja é obrigatória'),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewFeira() {
  const c = useColors()
  const { mutate: createFeira, isPending } = useCreateFeira()
  const [date, setDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  function onSubmit(data: FormData) {
    createFeira(
      { ...data, date: formatDateForInput(date) },
      {
        onSuccess: (feira) => {
          router.replace(`/(app)/(feiras)/${feira.id}`)
        },
        onError: (e) => Alert.alert('Erro', e.message),
      }
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <Text style={{ fontSize: 15, color: c.primary }}>Cancelar</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}
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
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />

        <Button
          title="Criar Feira"
          onPress={handleSubmit(onSubmit)}
          loading={isPending}
          fullWidth
        />
      </ScrollView>
    </>
  )
}
