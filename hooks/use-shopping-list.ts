import { useCallback, useEffect, useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const LIST_KEY    = 'hm_shopping_list_v1'
const BARCODE_KEY = 'hm_barcode_registry_v1'

export type ShoppingItem = {
  id: string
  name: string
  category: string
  unit: string
  qty: number
  price: number
  checked: boolean
  barcode?: string
}

export type ShoppingList = {
  items: ShoppingItem[]
  createdAt: string
}

type BarcodeRegistry = Record<string, { name: string; price: number; unit: string; category: string }>

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

export function useShoppingList() {
  const [list, setList]       = useState<ShoppingList | null>(null)
  const [loading, setLoading] = useState(true)
  const saveTimer             = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    AsyncStorage.getItem(LIST_KEY).then((raw) => {
      if (raw) setList(JSON.parse(raw))
      setLoading(false)
    })
  }, [])

  const persist = useCallback((next: ShoppingList | null) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      if (next) AsyncStorage.setItem(LIST_KEY, JSON.stringify(next))
      else AsyncStorage.removeItem(LIST_KEY)
    }, 300)
  }, [])

  const startEmpty = useCallback(() => {
    const next: ShoppingList = { items: [], createdAt: new Date().toISOString() }
    setList(next)
    persist(next)
  }, [persist])

  const startFromItems = useCallback((items: Omit<ShoppingItem, 'id' | 'checked'>[]) => {
    const next: ShoppingList = {
      items: items.map((i) => ({ ...i, id: uid(), checked: false })),
      createdAt: new Date().toISOString(),
    }
    setList(next)
    persist(next)
  }, [persist])

  const addItem = useCallback((item: Omit<ShoppingItem, 'id' | 'checked'>) => {
    setList((prev) => {
      const next: ShoppingList = {
        items: [...(prev?.items ?? []), { ...item, id: uid(), checked: false }],
        createdAt: prev?.createdAt ?? new Date().toISOString(),
      }
      persist(next)
      return next
    })
  }, [persist])

  const toggleItem = useCallback((id: string) => {
    setList((prev) => {
      if (!prev) return prev
      const next = {
        ...prev,
        items: prev.items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)),
      }
      persist(next)
      return next
    })
  }, [persist])

  const updateItem = useCallback((id: string, patch: Partial<ShoppingItem>) => {
    setList((prev) => {
      if (!prev) return prev
      const next = {
        ...prev,
        items: prev.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
      }
      persist(next)
      return next
    })
  }, [persist])

  const removeItem = useCallback((id: string) => {
    setList((prev) => {
      if (!prev) return prev
      const next = { ...prev, items: prev.items.filter((i) => i.id !== id) }
      persist(next)
      return next
    })
  }, [persist])

  const clearList = useCallback(() => {
    setList(null)
    persist(null)
  }, [persist])

  async function lookupBarcode(barcode: string): Promise<BarcodeRegistry[string] | null> {
    const raw = await AsyncStorage.getItem(BARCODE_KEY)
    const registry: BarcodeRegistry = raw ? JSON.parse(raw) : {}
    return registry[barcode] ?? null
  }

  async function saveBarcode(barcode: string, data: BarcodeRegistry[string]) {
    const raw = await AsyncStorage.getItem(BARCODE_KEY)
    const registry: BarcodeRegistry = raw ? JSON.parse(raw) : {}
    registry[barcode] = data
    await AsyncStorage.setItem(BARCODE_KEY, JSON.stringify(registry))
  }

  const checkedCount = list?.items.filter((i) => i.checked).length ?? 0
  const totalCount   = list?.items.length ?? 0
  const total        = list?.items.reduce((s, i) => s + (i.checked ? i.qty * i.price : 0), 0) ?? 0
  const grandTotal   = list?.items.reduce((s, i) => s + i.qty * i.price, 0) ?? 0

  return {
    list,
    loading,
    checkedCount,
    totalCount,
    total,
    grandTotal,
    startEmpty,
    startFromItems,
    addItem,
    toggleItem,
    updateItem,
    removeItem,
    clearList,
    lookupBarcode,
    saveBarcode,
  }
}
