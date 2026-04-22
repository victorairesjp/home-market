import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './use-auth'
import type { Database } from '@/types/database'

type FeiraInsert = Omit<Database['public']['Tables']['feiras']['Insert'], 'user_id'>
type FeiraUpdate = Database['public']['Tables']['feiras']['Update'] & { id: number }

export function useFeiras() {
  const { session } = useAuth()

  return useQuery({
    queryKey: ['feiras'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feiras')
        .select('*, feira_items(id, quantity, unit_price)')
        .order('date', { ascending: false })

      if (error) throw error

      return data.map((feira) => ({
        ...feira,
        total: feira.feira_items.reduce(
          (sum: number, item: { quantity: number; unit_price: number }) =>
            sum + item.quantity * item.unit_price,
          0
        ),
        item_count: feira.feira_items.length,
      }))
    },
    enabled: !!session,
  })
}

export function useFeira(id: number) {
  const { session } = useAuth()

  return useQuery({
    queryKey: ['feiras', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feiras')
        .select('*, feira_items(*, products(*))')
        .eq('id', id)
        .single()

      if (error) throw error

      return {
        ...data,
        total: data.feira_items.reduce(
          (sum: number, item: { quantity: number; unit_price: number }) =>
            sum + item.quantity * item.unit_price,
          0
        ),
      }
    },
    enabled: !!session && !!id,
  })
}

export function useFeiraDetail(id: number | null) {
  const { session } = useAuth()

  return useQuery({
    queryKey: ['feiras', 'detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feiras')
        .select('*, feira_items(*, products(*))')
        .eq('id', id!)
        .single()

      if (error) throw error

      return {
        ...data,
        total: data.feira_items.reduce(
          (sum: number, item: { quantity: number; unit_price: number }) =>
            sum + item.quantity * item.unit_price,
          0
        ),
      }
    },
    enabled: !!session && id !== null,
  })
}

export function useCreateFeira() {
  const qc = useQueryClient()
  const { session } = useAuth()

  return useMutation({
    mutationFn: async (feira: FeiraInsert) => {
      const { data, error } = await supabase
        .from('feiras')
        .insert({ ...feira, user_id: session!.user.id })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feiras'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateFeira() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...update }: FeiraUpdate) => {
      const { data, error } = await supabase
        .from('feiras')
        .update(update)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['feiras'] })
      qc.invalidateQueries({ queryKey: ['feiras', id] })
    },
  })
}

export function useDeleteFeira() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('feiras').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feiras'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
