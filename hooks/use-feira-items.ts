import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type FeiraItemInsert = Database['public']['Tables']['feira_items']['Insert']

type BulkItem = { product_id: number; quantity: number; unit_price: number }

export function useBulkAddFeiraItems() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      feiraId,
      items,
    }: {
      feiraId: number
      items: BulkItem[]
    }) => {
      if (items.length === 0) return []
      const { data, error } = await supabase
        .from('feira_items')
        .insert(items.map((i) => ({ ...i, feira_id: feiraId })))
        .select('*, products(*)')

      if (error) throw error
      return data
    },
    onSuccess: (_data, { feiraId }) => {
      qc.invalidateQueries({ queryKey: ['feiras', feiraId] })
      qc.invalidateQueries({ queryKey: ['feiras'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['price-history'] })
    },
  })
}

export function useAddFeiraItem(feiraId: number) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (item: FeiraItemInsert) => {
      const { data, error } = await supabase
        .from('feira_items')
        .insert(item)
        .select('*, products(*)')
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feiras', feiraId] })
      qc.invalidateQueries({ queryKey: ['feiras'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateFeiraItem(feiraId: number) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      const { data, error } = await supabase
        .from('feira_items')
        .update({ quantity })
        .eq('id', id)
        .select('*, products(*)')
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feiras', feiraId] })
      qc.invalidateQueries({ queryKey: ['feiras'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteFeiraItem(feiraId: number) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (itemId: number) => {
      const { error } = await supabase.from('feira_items').delete().eq('id', itemId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feiras', feiraId] })
      qc.invalidateQueries({ queryKey: ['feiras'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
