import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './use-auth'

export type PricePoint = {
  feiraId: number
  feiraName: string
  date: string
  unitPrice: number
  quantity: number
}

export type ProductPriceHistory = {
  productId: number
  name: string
  unit: string
  category: string
  history: PricePoint[]
  latestPrice: number
  priceChange: number | null
  priceChangePercent: number | null
  purchaseCount: number
}

export function usePriceHistory() {
  const { session } = useAuth()

  return useQuery({
    queryKey: ['price-history'],
    queryFn: async (): Promise<ProductPriceHistory[]> => {
      const { data, error } = await supabase
        .from('feira_items')
        .select(`
          unit_price,
          quantity,
          product_id,
          feira_id,
          products(id, name, unit, category),
          feiras(id, date, name)
        `)

      if (error) throw error

      const byProduct = new Map<
        number,
        { product: { id: number; name: string; unit: string; category: string }; points: PricePoint[] }
      >()

      for (const item of data as any[]) {
        if (!item.products || !item.feiras) continue
        const product = item.products
        const feira = item.feiras

        const pid: number = product.id
        if (!byProduct.has(pid)) byProduct.set(pid, { product, points: [] })
        byProduct.get(pid)!.points.push({
          feiraId: item.feira_id,
          feiraName: feira.name,
          date: feira.date,
          unitPrice: Number(item.unit_price),
          quantity: Number(item.quantity),
        })
      }

      const result: ProductPriceHistory[] = []
      for (const [, { product, points }] of byProduct) {
        const sorted = points.sort((a, b) => b.date.localeCompare(a.date))
        const latestPrice = sorted[0].unitPrice
        const prevPrice = sorted[1]?.unitPrice ?? null
        const priceChange = prevPrice !== null ? latestPrice - prevPrice : null
        const priceChangePercent =
          prevPrice && prevPrice > 0 ? ((latestPrice - prevPrice) / prevPrice) * 100 : null

        result.push({
          productId: product.id,
          name: product.name,
          unit: product.unit,
          category: product.category,
          history: sorted,
          latestPrice,
          priceChange,
          priceChangePercent,
          purchaseCount: sorted.length,
        })
      }

      return result.sort((a, b) => b.purchaseCount - a.purchaseCount)
    },
    enabled: !!session,
  })
}
