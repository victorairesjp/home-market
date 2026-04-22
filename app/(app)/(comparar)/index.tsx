import { useState } from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { Stack } from 'expo-router'
import { Card } from '@/components/ui/card'
import { Loading } from '@/components/ui/loading'
import { useColors } from '@/constants/colors'
import { useFeiras } from '@/hooks/use-feiras'
import { formatCurrency, formatDateShort, formatPercent } from '@/lib/format'
import type { FeiraWithSummary } from '@/types/database'

type FeiraPicker = {
  visible: boolean
  feiras: FeiraWithSummary[]
  selected: FeiraWithSummary | null
  onSelect: (f: FeiraWithSummary) => void
  onClose: () => void
}

function FeiraPicker({ visible, feiras, selected, onSelect, onClose }: FeiraPicker) {
  const c = useColors()

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
          <Text style={{ fontSize: 17, fontWeight: '600', color: c.text }}>Selecionar Feira</Text>
          <Pressable onPress={onClose}>
            <Text style={{ fontSize: 17, color: c.primary }}>Fechar</Text>
          </Pressable>
        </View>
        <ScrollView contentInsetAdjustmentBehavior="automatic">
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
                  selected?.id === feira.id ? c.primary + '15' : pressed ? c.inputBg : 'transparent',
              })}
            >
              <View>
                <Text style={{ fontSize: 16, fontWeight: '500', color: c.text }}>{feira.name}</Text>
                <Text style={{ fontSize: 13, color: c.subtext }}>
                  {feira.store} · {formatDateShort(feira.date)}
                </Text>
              </View>
              <Text style={{ fontSize: 15, fontWeight: '600', color: c.primary, fontVariant: ['tabular-nums'] }}>
                {formatCurrency(feira.total)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  )
}

export default function CompararScreen() {
  const c = useColors()
  const { data: feiras = [], isLoading } = useFeiras()
  const [feiraA, setFeiraA] = useState<FeiraWithSummary | null>(null)
  const [feiraB, setFeiraB] = useState<FeiraWithSummary | null>(null)
  const [pickerFor, setPickerFor] = useState<'A' | 'B' | null>(null)

  if (isLoading) return <Loading />

  const diff = feiraA && feiraB ? feiraB.total - feiraA.total : null
  const diffPercent = feiraA && feiraB && feiraA.total > 0
    ? ((feiraB.total - feiraA.total) / feiraA.total) * 100
    : null

  return (
    <>
      <Stack.Screen options={{ title: 'Comparar' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
      >
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: c.subtext, marginBottom: 6 }}>
              Feira A
            </Text>
            <Pressable
              onPress={() => setPickerFor('A')}
              style={({ pressed }) => ({
                backgroundColor: pressed ? c.inputBg : c.card,
                borderRadius: 14,
                padding: 14,
                borderWidth: 2,
                borderColor: feiraA ? c.primary : c.border,
                gap: 4,
                minHeight: 80,
                justifyContent: 'center',
              })}
            >
              {feiraA ? (
                <>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }} numberOfLines={1}>
                    {feiraA.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: c.subtext }}>{feiraA.store}</Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: c.primary, fontVariant: ['tabular-nums'] }}>
                    {formatCurrency(feiraA.total)}
                  </Text>
                </>
              ) : (
                <Text style={{ fontSize: 14, color: c.subtext, textAlign: 'center' }}>
                  Selecionar...
                </Text>
              )}
            </Pressable>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: c.subtext, marginBottom: 6 }}>
              Feira B
            </Text>
            <Pressable
              onPress={() => setPickerFor('B')}
              style={({ pressed }) => ({
                backgroundColor: pressed ? c.inputBg : c.card,
                borderRadius: 14,
                padding: 14,
                borderWidth: 2,
                borderColor: feiraB ? c.primary : c.border,
                gap: 4,
                minHeight: 80,
                justifyContent: 'center',
              })}
            >
              {feiraB ? (
                <>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }} numberOfLines={1}>
                    {feiraB.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: c.subtext }}>{feiraB.store}</Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: c.primary, fontVariant: ['tabular-nums'] }}>
                    {formatCurrency(feiraB.total)}
                  </Text>
                </>
              ) : (
                <Text style={{ fontSize: 14, color: c.subtext, textAlign: 'center' }}>
                  Selecionar...
                </Text>
              )}
            </Pressable>
          </View>
        </View>

        {feiraA && feiraB && diff !== null && diffPercent !== null && (
          <Card style={{ alignItems: 'center', gap: 6, padding: 20 }}>
            <Text style={{ fontSize: 13, color: c.subtext }}>Diferença</Text>
            <Text
              selectable
              style={{
                fontSize: 28,
                fontWeight: '800',
                color: diff > 0 ? c.danger : c.success,
                fontVariant: ['tabular-nums'],
              }}
            >
              {diff > 0 ? '+' : ''}{formatCurrency(diff)}
            </Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: diff > 0 ? c.danger : c.success }}>
              {formatPercent(diffPercent)}
            </Text>
            <Text style={{ fontSize: 13, color: c.subtext }}>
              {diff > 0 ? 'Feira B foi mais cara' : diff < 0 ? 'Feira B foi mais barata' : 'Valores iguais'}
            </Text>
          </Card>
        )}

        {(!feiraA || !feiraB) && (
          <Card style={{ alignItems: 'center', padding: 32, gap: 8 }}>
            <Text style={{ fontSize: 32 }}>⚖️</Text>
            <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }}>
              Selecione duas feiras
            </Text>
            <Text style={{ fontSize: 14, color: c.subtext, textAlign: 'center' }}>
              Escolha as feiras acima para comparar seus valores
            </Text>
          </Card>
        )}
      </ScrollView>

      <FeiraPicker
        visible={pickerFor !== null}
        feiras={feiras as FeiraWithSummary[]}
        selected={pickerFor === 'A' ? feiraA : feiraB}
        onSelect={(f) => {
          if (pickerFor === 'A') setFeiraA(f)
          else setFeiraB(f)
        }}
        onClose={() => setPickerFor(null)}
      />
    </>
  )
}
