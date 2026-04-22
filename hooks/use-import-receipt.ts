import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './use-auth'
import type { ProductWithPrice } from './use-products'

export type ReviewItem = {
  localId: string
  name: string
  price: number
  quantity: number
  matchedProductId: number | null
}

type ImportPayload = {
  feiraName: string
  feiraStore: string
  feiraDate: string  // yyyy-MM-dd
  feiraNotes?: string
  items: ReviewItem[]
  existingProducts: ProductWithPrice[]
}

/** Normalize a string for fuzzy matching (lowercase, no accents) */
export function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

/** Find the best matching product by name similarity */
export function matchProduct(
  itemName: string,
  products: ProductWithPrice[]
): ProductWithPrice | null {
  const needle = normalizeName(itemName)
  if (!needle) return null

  // 1. Exact match
  let found = products.find((p) => normalizeName(p.name) === needle)
  if (found) return found

  // 2. Product name contains item name (or vice versa), min 3 chars overlap
  if (needle.length >= 3) {
    found = products.find((p) => {
      const pn = normalizeName(p.name)
      return pn.includes(needle) || needle.includes(pn)
    })
  }

  return found ?? null
}

export function useImportReceipt() {
  const qc = useQueryClient()
  const { session } = useAuth()

  return useMutation({
    mutationFn: async ({
      feiraName,
      feiraStore,
      feiraDate,
      feiraNotes,
      items,
      existingProducts,
    }: ImportPayload) => {
      const userId = session!.user.id

      // 1. Create new products for unmatched items
      const productIdMap = new Map<string, number>() // localId → product_id

      for (const item of items) {
        if (item.matchedProductId !== null) {
          productIdMap.set(item.localId, item.matchedProductId)
          continue
        }

        const { data: newProduct, error } = await supabase
          .from('products')
          .insert({ name: item.name, unit: 'un', category: 'Outros', user_id: userId })
          .select('id')
          .single()

        if (error) throw new Error(`Erro ao criar produto "${item.name}": ${error.message}`)
        productIdMap.set(item.localId, newProduct.id)
      }

      // 2. Create the feira
      const { data: feira, error: feiraError } = await supabase
        .from('feiras')
        .insert({
          name: feiraName,
          store: feiraStore,
          date: feiraDate,
          notes: feiraNotes || null,
          user_id: userId,
        })
        .select('id')
        .single()

      if (feiraError) throw new Error(`Erro ao criar feira: ${feiraError.message}`)

      // 3. Create all feira_items
      const feiraItems = items.map((item) => ({
        feira_id: feira.id,
        product_id: productIdMap.get(item.localId)!,
        quantity: item.quantity,
        unit_price: item.price,
      }))

      const { error: itemsError } = await supabase.from('feira_items').insert(feiraItems)
      if (itemsError) throw new Error(`Erro ao salvar itens: ${itemsError.message}`)

      return feira.id as number
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feiras'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
