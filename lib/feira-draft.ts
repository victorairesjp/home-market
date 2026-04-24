import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY = 'hm_feira_draft_v1'

export type FeiraDraftItem = {
  name: string
  category: string
  unit: string
  quantity: number
  unit_price: number
}

export type FeiraDraft = {
  suggestedName: string
  store?: string
  items: FeiraDraftItem[]
  source: 'list'
}

export async function saveFeiraDraft(draft: FeiraDraft): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(draft))
}

export async function consumeFeiraDraft(): Promise<FeiraDraft | null> {
  const raw = await AsyncStorage.getItem(KEY)
  if (!raw) return null
  await AsyncStorage.removeItem(KEY)
  try {
    return JSON.parse(raw) as FeiraDraft
  } catch {
    return null
  }
}

export async function clearFeiraDraft(): Promise<void> {
  await AsyncStorage.removeItem(KEY)
}
