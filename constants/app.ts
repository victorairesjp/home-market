export const CATEGORIES = [
  'Frutas',
  'Verduras',
  'Carnes',
  'Laticínios',
  'Grãos e Cereais',
  'Bebidas',
  'Higiene',
  'Limpeza',
  'Outros',
] as const

export type Category = (typeof CATEGORIES)[number]

export const UNITS = ['kg', 'g', 'L', 'mL', 'un', 'cx', 'pct', 'dz'] as const

export type Unit = (typeof UNITS)[number]

export const CATEGORY_COLORS: Record<string, string> = {
  Frutas: '#FF6B6B',
  Verduras: '#4CAF50',
  Carnes: '#FF8C00',
  Laticínios: '#81D4FA',
  'Grãos e Cereais': '#D4A574',
  Bebidas: '#AB47BC',
  Higiene: '#26C6DA',
  Limpeza: '#7E57C2',
  Outros: '#9E9E9E',
}
