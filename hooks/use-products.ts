import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './use-auth'
import type { Database } from '@/types/database'

type ProductInsert = Omit<Database['public']['Tables']['products']['Insert'], 'user_id'>
type ProductUpdate = Database['public']['Tables']['products']['Update'] & { id: number }

export type ProductWithPrice = Database['public']['Tables']['products']['Row'] & {
  avg_price: number | null
  last_price: number | null
  usage_count: number
}

export function useProducts() {
  const { session } = useAuth()

  return useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<ProductWithPrice[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('*, feira_items(unit_price, created_at)')
        .order('name')

      if (error) throw error

      return (data as any[]).map((p) => {
        const items: { unit_price: number; created_at: string }[] = p.feira_items ?? []
        const count = items.length
        const avg =
          count > 0 ? items.reduce((sum, i) => sum + Number(i.unit_price), 0) / count : null
        const last =
          count > 0
            ? Number(
                [...items].sort((a, b) => b.created_at.localeCompare(a.created_at))[0].unit_price
              )
            : null
        const { feira_items, ...rest } = p
        return { ...rest, avg_price: avg, last_price: last, usage_count: count }
      })
    },
    enabled: !!session,
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  const { session } = useAuth()

  return useMutation({
    mutationFn: async (product: ProductInsert) => {
      const { data, error } = await supabase
        .from('products')
        .insert({ ...product, user_id: session!.user.id })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...update }: ProductUpdate) => {
      const { data, error } = await supabase
        .from('products')
        .update(update)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}
