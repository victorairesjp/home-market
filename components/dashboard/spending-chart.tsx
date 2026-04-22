import { Text, useWindowDimensions, View } from 'react-native'
import { LineChart } from 'react-native-gifted-charts'
import { Card } from '@/components/ui/card'
import { useColors } from '@/constants/colors'
import { formatCurrency } from '@/lib/format'

type DataPoint = { date: string; name: string; total: number }

type Props = { data: DataPoint[] }

export function SpendingChart({ data }: Props) {
  const c = useColors()
  const { width } = useWindowDimensions()

  if (data.length < 2) return null

  const chartData = data.map((p) => ({
    value: p.total,
    label: p.name.length > 7 ? p.name.slice(0, 7) : p.name,
  }))

  const chartWidth = width - 64

  return (
    <Card>
      <Text style={{ fontSize: 15, fontWeight: '600', color: c.text, marginBottom: 12 }}>
        Gastos ao Longo do Tempo
      </Text>
      <LineChart
        data={chartData}
        width={chartWidth}
        height={160}
        color={c.primary}
        thickness={2}
        startFillColor={c.primary}
        endFillColor="transparent"
        areaChart
        curved
        dataPointsColor={c.primary}
        dataPointsRadius={4}
        noOfSections={4}
        yAxisColor="transparent"
        xAxisColor={c.border}
        rulesColor={c.border}
        yAxisTextStyle={{ color: c.subtext, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: c.subtext, fontSize: 9 }}
        backgroundColor={c.card}
        formatYLabel={(v) => `R$${(Number(v) / 100).toFixed(0)}`}
        isAnimated
        hideDataPoints={data.length > 6}
      />
    </Card>
  )
}
