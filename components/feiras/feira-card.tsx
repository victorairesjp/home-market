import { Alert, Pressable, Text, View } from 'react-native'
import Animated, { FadeInDown, FadeOutLeft } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useColors, CARD_SHADOW } from '@/constants/colors'
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
            borderRadius: 20,
            padding: 18,
            ...( c.isDark ? {} : CARD_SHADOW),
          }}
        >
          {/* Top row: store icon + name + arrow */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: c.primary + '18',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="cart" size={22} color={c.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: c.text }} numberOfLines={1}>
                {name}
              </Text>
              <Text style={{ fontSize: 13, color: c.subtext, marginTop: 1 }} numberOfLines={1}>
                {store}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.subtext} />
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: c.border, marginBottom: 14 }} />

          {/* Bottom row: date + items + total */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
              <Ionicons name="calendar-outline" size={13} color={c.subtext} />
              <Text style={{ fontSize: 13, color: c.subtext }}>{formatDateShort(date)}</Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: c.inputBg,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 20,
              }}
            >
              <Ionicons name="cube-outline" size={13} color={c.subtext} />
              <Text style={{ fontSize: 13, color: c.subtext }}>
                {itemCount} {itemCount === 1 ? 'item' : 'itens'}
              </Text>
            </View>

            <Text
              selectable
              style={{
                fontSize: 18,
                fontWeight: '800',
                color: c.primary,
                fontVariant: ['tabular-nums'],
                marginLeft: 14,
              }}
            >
              {formatCurrency(total)}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  )
}
