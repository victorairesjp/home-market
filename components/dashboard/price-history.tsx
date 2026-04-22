import { Text, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { Card } from '@/components/ui/card'
import { useColors } from '@/constants/colors'
import { formatCurrency, formatPercent } from '@/lib/format'

type PriceEntry = {
  id: number
  name: string
  unit: string
  latestPrice: number
  previousPrice: number
  change: number
}

type Props = { data: PriceEntry[] }

export function PriceHistory({ data }: Props) {
  const c = useColors()

  return (
    <Card style={{ gap: 0 }}>
      <Text style={{ fontSize: 15, fontWeight: '600', color: c.text, marginBottom: 14 }}>
        Variação de Preços
      </Text>

      {data.length === 0 ? (
        <Text style={{ fontSize: 14, color: c.subtext, textAlign: 'center', paddingVertical: 16 }}>
          Adicione itens em pelo menos 2 feiras para ver variações
        </Text>
      ) : (
        <View style={{ gap: 0 }}>
          {data.map((item, index) => {
            const up = item.change > 0
            const trendColor = up ? c.danger : c.success
            const trendBg = up ? '#FEF2F2' : '#F0FDF4'

            return (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(index * 60).springify()}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 10,
                    borderTopWidth: index === 0 ? 0 : 1,
                    borderColor: c.border,
                    gap: 10,
                  }}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: c.subtext }}>
                      {formatCurrency(item.previousPrice)} → {formatCurrency(item.latestPrice)}{' '}
                      <Text style={{ color: c.subtext }}>/ {item.unit}</Text>
                    </Text>
                  </View>

                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 20,
                      backgroundColor: trendBg,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: trendColor }}>
                      {up ? '↑' : '↓'} {formatPercent(item.change)}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            )
          })}
        </View>
      )}
    </Card>
  )
}
