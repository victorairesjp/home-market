import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type FeiraItemInsert = Database['public']['Tables']['feira_items']['Insert']

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
