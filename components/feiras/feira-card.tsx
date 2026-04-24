import { Alert, Pressable, Text, View } from 'react-native'
import Animated, { FadeInDown, FadeOutLeft } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useColors, CARD_SHADOW, CARD_BORDER } from '@/constants/colors'
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
      { text: 'Excluir', style: 'destructive', onPress: () => deleteFeira(id) },
    ])
  }

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()} exiting={FadeOutLeft}>
      <Pressable
        onPress={() => router.push(`/(app)/(feiras)/${id}`)}
        onLongPress={handleLongPress}
        style={({ pressed }) => ({
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        })}
      >
        <View
          style={{
            backgroundColor: c.card,
            borderRadius: 16,
            padding: 18,
            ...(c.isDark ? {} : { ...CARD_SHADOW, ...CARD_BORDER }),
          }}
        >
          {/* Top row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '500', color: c.text }} numberOfLines={1}>
                {name}
              </Text>
              {!!store && (
                <Text style={{ fontSize: 12, color: c.subtext, marginTop: 2 }} numberOfLines={1}>
                  {store}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward-outline" size={16} color={c.subtext} />
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: '#F0F0F0', marginBottom: 14 }} />

          {/* Bottom row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="calendar-outline" size={12} color={c.subtext} />
              <Text style={{ fontSize: 12, color: c.subtext }}>{formatDateShort(date)}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="bag-outline" size={12} color={c.subtext} />
              <Text style={{ fontSize: 12, color: c.subtext }}>{itemCount} {itemCount === 1 ? 'item' : 'itens'}</Text>
            </View>
            <View style={{ flex: 1 }} />
            <Text
              selectable
              style={{ fontSize: 17, fontWeight: '700', color: c.primary, fontVariant: ['tabular-nums'] }}
            >
              {formatCurrency(total)}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  )
}
