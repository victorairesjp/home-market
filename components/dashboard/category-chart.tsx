import { Text, View } from 'react-native'
import { PieChart } from 'react-native-gifted-charts'
import { Card } from '@/components/ui/card'
import { useColors } from '@/constants/colors'
import { CATEGORY_COLORS } from '@/constants/app'
import { formatCurrency } from '@/lib/format'

type CategoryData = { category: string; total: number }

type Props = { data: CategoryData[] }

export function CategoryChart({ data }: Props) {
  const c = useColors()

  if (data.length === 0) return null

  const total = data.reduce((sum, d) => sum + d.total, 0)

  const pieData = data.slice(0, 7).map((d) => ({
    value: d.total,
    color: CATEGORY_COLORS[d.category] ?? '#9E9E9E',
  }))

  return (
    <Card>
      <Text style={{ fontSize: 15, fontWeight: '600', color: c.text, marginBottom: 16 }}>
        Distribuição por Categoria
      </Text>
      <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
        <PieChart
          data={pieData}
          radius={64}
          innerRadius={38}
          centerLabelComponent={() => (
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 9, color: c.subtext }}>Total</Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: c.text }}>
                {formatCurrency(total)}
              </Text>
            </View>
          )}
          isAnimated
        />
        <View style={{ flex: 1, gap: 7 }}>
          {data.slice(0, 7).map((d) => (
            <View key={d.category} style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: CATEGORY_COLORS[d.category] ?? '#9E9E9E',
                }}
              />
              <Text style={{ flex: 1, fontSize: 12, color: c.text }} numberOfLines={1}>
                {d.category}
              </Text>
              <Text style={{ fontSize: 11, color: c.subtext, fontVariant: ['tabular-nums'] }}>
                {((d.total / total) * 100).toFixed(0)}%
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Card>
  )
}
