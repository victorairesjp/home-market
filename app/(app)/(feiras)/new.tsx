import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { router, Stack } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import { Button } from '@/components/ui/button'
import { TextInput } from '@/components/ui/text-input'
import { Card } from '@/components/ui/card'
import { useColors, WARNING } from '@/constants/colors'
import { useCreateFeira } from '@/hooks/use-feiras'
import { useFeiras } from '@/hooks/use-feiras'
import { useProducts } from '@/hooks/use-products'
import { useBulkAddFeiraItems } from '@/hooks/use-feira-items'
import { supabase } from '@/lib/supabase'
import { formatDateShort, formatDateForInput, formatCurrency } from '@/lib/format'
import type { FeiraWithSummary } from '@/types/database'

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  store: z.string().min(1, 'Loja é obrigatória'),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>
type InitMode = 'zero' | 'history' | 'default'

type ModeCardProps = {
  icon: string
  title: string
  description: string
  selected: boolean
  onPress: () => void
  c: ReturnType<typeof useColors>
}

function ModeCard({ icon, title, description, selected, onPress, c }: ModeCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: selected ? c.primary + '15' : pressed ? c.inputBg : c.card,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: selected ? c.primary : c.border,
        padding: 14,
        gap: 6,
        alignItems: 'flex-start',
      })}
    >
      <Text style={{ fontSize: 26 }}>{icon}</Text>
      <Text style={{ fontSize: 14, fontWeight: '700', color: selected ? c.primary : c.text }}>
        {title}
      </Text>
      <Text style={{ fontSize: 12, color: c.subtext, lineHeight: 17 }}>{description}</Text>
      {selected && (
        <View
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: c.primary,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="checkmark" size={13} color="#fff" />
        </View>
      )}
    </Pressable>
  )
}

function HistoryPickerModal({
  visible,
  feiras,
  selected,
  onSelect,
  onClose,
  c,
}: {
  visible: boolean
  feiras: FeiraWithSummary[]
  selected: FeiraWithSummary | null
  onSelect: (f: FeiraWithSummary) => void
  onClose: () => void
  c: ReturnType<typeof useColors>
}) {
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
          <Text style={{ fontSize: 17, fontWeight: '700', color: c.text }}>Selecionar Feira Base</Text>
          <Pressable onPress={onClose}>
            <Text style={{ fontSize: 16, color: c.primary }}>Fechar</Text>
          </Pressable>
        </View>
        <ScrollView>
          {feiras.map((feira) => (
            <Pressable
              key={feira.id}
              onPress={() => { onSelect(feira); onClose() }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
                borderBottomWidth: 1,
                borderColor: c.border,
                backgroundColor:
                  selected?.id === feira.id
                    ? c.primary + '15'
                    : pressed
                    ? c.inputBg
                    : 'transparent',
              })}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }}>{feira.name}</Text>
                <Text style={{ fontSize: 13, color: c.subtext }}>
                  {feira.store} · {formatDateShort(feira.date)} · {feira.item_count}{' '}
                  {feira.item_count === 1 ? 'item' : 'itens'}
                </Text>
              </View>
              <Text
                style={{ fontSize: 15, fontWeight: '600', color: c.primary, fontVariant: ['tabular-nums'] }}
              >
                {formatCurrency(feira.total)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  )
}

export default function NewFeira() {
  const c = useColors()
  const { mutateAsync: createFeira, isPending: creating } = useCreateFeira()
  const { mutateAsync: bulkAdd } = useBulkAddFeiraItems()
  const { data: feiras = [] } = useFeiras()
  const { data: products = [] } = useProducts()

  const [mode, setMode] = useState<InitMode>('zero')
  const [date, setDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showHistoryPicker, setShowHistoryPicker] = useState(false)
  const [baseFeira, setBaseFeira] = useState<FeiraWithSummary | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    if (mode === 'history' && !baseFeira) {
      Alert.alert('Selecione a feira base', 'Escolha uma feira para usar como base.')
      return
    }

    setIsSubmitting(true)
    try {
      const feira = await createFeira({ ...data, date: formatDateForInput(date) })

      if (mode === 'history' && baseFeira) {
        // Clone items from the selected feira
        const { data: sourceItems, error } = await supabase
          .from('feira_items')
          .select('product_id, quantity, unit_price')
          .eq('feira_id', baseFeira.id)

        if (!error && sourceItems && sourceItems.length > 0) {
          await bulkAdd({
            feiraId: feira.id,
            items: sourceItems.map((i) => ({
              product_id: i.product_id,
              quantity: i.quantity,
              unit_price: Number(i.unit_price),
            })),
          })
        }
      } else if (mode === 'default') {
        // Use the user's most purchased items (those with a known price)
        const topItems = products
          .filter((p) => p.usage_count > 0 && (p.last_price ?? 0) > 0)
          .sort((a, b) => b.usage_count - a.usage_count)
          .slice(0, 20)

        if (topItems.length > 0) {
          await bulkAdd({
            feiraId: feira.id,
            items: topItems.map((p) => ({
              product_id: p.id,
              quantity: 1,
              unit_price: p.last_price!,
            })),
          })
        }
      }

      router.replace(`/(app)/(feiras)/${feira.id}`)
    } catch (e: any) {
      Alert.alert('Erro', e.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const loading = creating || isSubmitting

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
        contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Mode selection */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: c.text }}>
            Como deseja iniciar?
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <ModeCard
              icon="🛒"
              title="Histórico"
              description="Clone os itens de uma feira anterior."
              selected={mode === 'history'}
              onPress={() => setMode('history')}
              c={c}
            />
            <ModeCard
              icon="📋"
              title="Lista padrão"
              description="Preenche com seus itens mais comprados."
              selected={mode === 'default'}
              onPress={() => setMode('default')}
              c={c}
            />
            <ModeCard
              icon="✨"
              title="Do zero"
              description="Começa vazio, adicione item por item."
              selected={mode === 'zero'}
              onPress={() => setMode('zero')}
              c={c}
            />
          </View>

          {/* History feira selector */}
          {mode === 'history' && (
            <Pressable
              onPress={() => setShowHistoryPicker(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: baseFeira ? c.primary + '15' : c.inputBg,
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: baseFeira ? c.primary : c.border,
              }}
            >
              {baseFeira ? (
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: c.primary }}>
                    {baseFeira.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: c.subtext }}>
                    {baseFeira.store} · {formatDateShort(baseFeira.date)} · {baseFeira.item_count} itens
                  </Text>
                </View>
              ) : (
                <Text style={{ fontSize: 15, color: c.subtext }}>Selecionar feira base...</Text>
              )}
              <Ionicons name="chevron-down" size={18} color={c.subtext} />
            </Pressable>
          )}

          {mode === 'default' && products.filter((p) => p.usage_count > 0 && (p.last_price ?? 0) > 0).length === 0 && (
            <Card style={{ padding: 14, backgroundColor: WARNING + '15' }}>
              <Text style={{ fontSize: 13, color: c.text }}>
                Ainda não há histórico de compras. Faça sua primeira feira manualmente e depois esta opção ficará disponível.
              </Text>
            </Card>
          )}
        </View>

        {/* Feira details form */}
        <View style={{ gap: 16 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: c.text }}>Detalhes da feira</Text>

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
        </View>

        <Button
          title={
            mode === 'history'
              ? 'Criar e clonar itens'
              : mode === 'default'
              ? 'Criar com lista padrão'
              : 'Criar feira'
          }
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          fullWidth
        />
      </ScrollView>

      <HistoryPickerModal
        visible={showHistoryPicker}
        feiras={feiras as FeiraWithSummary[]}
        selected={baseFeira}
        onSelect={setBaseFeira}
        onClose={() => setShowHistoryPicker(false)}
        c={c}
      />
    </>
  )
}
