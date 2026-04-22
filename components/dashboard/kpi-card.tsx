import { Text, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { Card } from '@/components/ui/card'
import { useColors } from '@/constants/colors'

type Props = {
  title: string
  value: string
  subtitle?: string
  trend?: number | null
  index?: number
}

export function KpiCard({ title, value, subtitle, trend, index = 0 }: Props) {
  const c = useColors()

  const trendColor =
    trend != null ? (trend > 0 ? c.danger : c.success) : c.subtext
  const trendLabel = trend != null ? `${trend > 0 ? '↑' : '↓'} ${Math.abs(trend).toFixed(1)}%` : null

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
      <Card style={{ gap: 4, flex: 1 }}>
        <Text style={{ fontSize: 12, fontWeight: '500', color: c.subtext }}>{title}</Text>
        <Text
          selectable
          style={{
            fontSize: 20,
            fontWeight: '700',
            color: c.text,
            fontVariant: ['tabular-nums'],
          }}
        >
          {value}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {trendLabel && (
            <Text style={{ fontSize: 12, fontWeight: '600', color: trendColor }}>
              {trendLabel}
            </Text>
          )}
          {subtitle && (
            <Text style={{ fontSize: 12, color: c.subtext }} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </Card>
    </Animated.View>
  )
}
