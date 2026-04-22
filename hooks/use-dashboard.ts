import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './use-auth'

export function useDashboard() {
  const { session } = useAuth()

  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const [{ data: feiras, error: feirasError }, { count: productCount, error: productError }] =
        await Promise.all([
          supabase
            .from('feiras')
            .select('*, feira_items(*, products(*))')
            .order('date', { ascending: true }),
          supabase.from('products').select('*', { count: 'exact', head: true }),
        ])

      if (feirasError) throw feirasError
      if (productError) throw productError

      const allFeiras = feiras ?? []

      const withTotals = allFeiras.map((f) => ({
        ...f,
        total: f.feira_items.reduce(
          (sum: number, item: { quantity: number; unit_price: number }) =>
            sum + item.quantity * item.unit_price,
          0
        ),
      }))

      const totalSpent = withTotals.reduce((sum, f) => sum + f.total, 0)
      const averagePerFeira = withTotals.length > 0 ? totalSpent / withTotals.length : 0

      const last = withTotals[withTotals.length - 1]
      const secondLast = withTotals[withTotals.length - 2]
      const trend =
        last && secondLast && secondLast.total > 0
          ? ((last.total - secondLast.total) / secondLast.total) * 100
          : null

      const spendingOverTime = withTotals.slice(-10).map((f) => ({
        date: f.date,
        name: f.name,
        total: f.total,
      }))

      // Category breakdown
      const categoryMap = new Map<string, number>()
      allFeiras.forEach((feira) => {
        feira.feira_items.forEach(
          (item: { quantity: number; unit_price: number; products?: { category: string } | null }) => {
            const category = item.products?.category ?? 'Outros'
            categoryMap.set(category, (categoryMap.get(category) ?? 0) + item.quantity * item.unit_price)
          }
        )
      })
      const categoryBreakdown = Array.from(categoryMap.entries())
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total)

      // Product price history: group (product, date, price) then compute % change
      type PriceEntry = { date: string; price: number }
      const productMap = new Map<
        number,
        { id: number; name: string; unit: string; entries: PriceEntry[] }
      >()

      allFeiras.forEach((feira) => {
        feira.feira_items.forEach(
          (item: {
            unit_price: number
            products?: { id: number; name: string; unit: string } | null
          }) => {
            if (!item.products) return
            const p = item.products
            if (!productMap.has(p.id)) {
              productMap.set(p.id, { id: p.id, name: p.name, unit: p.unit, entries: [] })
            }
            productMap.get(p.id)!.entries.push({ date: feira.date, price: item.unit_price })
          }
        )
      })

      const priceHistory = Array.from(productMap.values())
        .filter((p) => p.entries.length >= 2)
        .map((p) => {
          const sorted = [...p.entries].sort((a, b) => a.date.localeCompare(b.date))
          const latest = sorted[sorted.length - 1]
          const previous = sorted[sorted.length - 2]
          const change = ((latest.price - previous.price) / previous.price) * 100
          return {
            id: p.id,
            name: p.name,
            unit: p.unit,
            latestPrice: latest.price,
            previousPrice: previous.price,
            change,
          }
        })
        .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
        .slice(0, 6)

      return {
        totalSpent,
        averagePerFeira,
        totalFeiras: withTotals.length,
        productCount: productCount ?? 0,
        lastFeiraDate: last?.date ?? null,
        trend,
        spendingOverTime,
        categoryBreakdown,
        priceHistory,
      }
    },
    enabled: !!session,
  })
}
