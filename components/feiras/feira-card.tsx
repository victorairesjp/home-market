import { Alert, Pressable, Text, View } from 'react-native'
import Animated, { FadeInDown, FadeOutLeft } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { Card } from '@/components/ui/card'
import { useColors } from '@/constants/colors'
import { useDeleteFeira } from '@/hooks/use-feiras'
import { formatCurrency, formatDateShort } from '@/lib/format'

type Props = {
  id: number
  name: string
  store: string
  date: string
  itemCount: number
  total: number
  index: number
  onEdit: () => void
}

export function FeiraCard({ id, name, store, date, itemCount, total, index, onEdit }: Props) {
  const c = useColors()
  const { mutate: deleteFeira } = useDeleteFeira()

  function handleLongPress() {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    }
    Alert.alert(name, 'O que deseja fazer?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Editar', onPress: onEdit },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => deleteFeira(id),
      },
    ])
  }

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()} exiting={FadeOutLeft}>
      <Pressable
        onPress={() => router.push(`/(app)/(feiras)/${id}`)}
        onLongPress={handleLongPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        <Card>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}
          >
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: c.text }}>{name}</Text>
              <Text style={{ fontSize: 14, color: c.subtext }}>{store}</Text>
              <View style={{ flexDirection: 'row', gap: 14, marginTop: 4 }}>
                <Text style={{ fontSize: 13, color: c.subtext }}>{formatDateShort(date)}</Text>
                <Text style={{ fontSize: 13, color: c.subtext }}>
                  {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                </Text>
              </View>
            </View>
            <Text
              selectable
              style={{ fontSize: 18, fontWeight: '700', color: c.primary, fontVariant: ['tabular-nums'] }}
            >
              {formatCurrency(total)}
            </Text>
          </View>
        </Card>
      </Pressable>
    </Animated.View>
  )
}
