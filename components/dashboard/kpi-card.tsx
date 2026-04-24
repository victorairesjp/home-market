import { Text, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useColors, CARD_SHADOW } from '@/constants/colors'

type Props = {
  title: string
  value: string
  subtitle?: string
  trend?: number | null
  index?: number
  accent?: string
}

export function KpiCard({ title, value, subtitle, trend, index = 0, accent }: Props) {
  const c = useColors()
  const color = accent ?? c.primary

  const trendColor = trend != null ? (trend > 0 ? c.danger : c.success) : c.subtext
  const trendLabel = trend != null ? `${trend > 0 ? '↑' : '↓'} ${Math.abs(trend).toFixed(1)}%` : null

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()} style={{ flex: 1 }}>
      <View
        style={{
          backgroundColor: c.card,
          borderRadius: 20,
          padding: 18,
          gap: 8,
          ...(c.isDark ? {} : CARD_SHADOW),
        }}
      >
        {/* Accent dot */}
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: color + '18',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 2,
          }}
        >
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
        </View>

        <Text style={{ fontSize: 12, fontWeight: '600', color: c.subtext, letterSpacing: 0.3 }}>
          {title.toUpperCase()}
        </Text>
        <Text
          selectable
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          style={{
            fontSize: 22,
            fontWeight: '800',
            color: c.text,
            fontVariant: ['tabular-nums'],
            lineHeight: 26,
          }}
        >
          {value}
        </Text>

        {(trendLabel || subtitle) && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {trendLabel && (
              <View
                style={{
                  backgroundColor: trendColor + '18',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: trendColor }}>
                  {trendLabel}
                </Text>
              </View>
            )}
            {subtitle && (
              <Text style={{ fontSize: 11, color: c.subtext }} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  )
}
