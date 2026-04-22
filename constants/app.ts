export const CATEGORIES = [
  'Frutas',
  'Verduras',
  'Carnes',
  'Laticínios',
  'Grãos e Cereais',
  'Bebidas',
  'Lanches',
  'Guloseimas',
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
  Lanches: '#FF7043',
  Guloseimas: '#EC407A',
  Higiene: '#26C6DA',
  Limpeza: '#7E57C2',
  Outros: '#9E9E9E',
}

type DefaultProduct = { name: string; unit: string; category: string }

export const DEFAULT_PRODUCTS: DefaultProduct[] = [
  // Verduras
  { name: 'Tomate', unit: 'kg', category: 'Verduras' },
  { name: 'Cebola', unit: 'kg', category: 'Verduras' },
  { name: 'Alho', unit: 'un', category: 'Verduras' },
  { name: 'Batata', unit: 'kg', category: 'Verduras' },
  { name: 'Cenoura', unit: 'kg', category: 'Verduras' },
  { name: 'Alface', unit: 'un', category: 'Verduras' },
  { name: 'Pimentão', unit: 'un', category: 'Verduras' },
  { name: 'Abobrinha', unit: 'un', category: 'Verduras' },
  { name: 'Brócolis', unit: 'un', category: 'Verduras' },
  { name: 'Couve', unit: 'un', category: 'Verduras' },
  // Frutas
  { name: 'Banana', unit: 'kg', category: 'Frutas' },
  { name: 'Maçã', unit: 'kg', category: 'Frutas' },
  { name: 'Laranja', unit: 'kg', category: 'Frutas' },
  { name: 'Limão', unit: 'un', category: 'Frutas' },
  { name: 'Mamão', unit: 'kg', category: 'Frutas' },
  { name: 'Abacaxi', unit: 'un', category: 'Frutas' },
  { name: 'Uva', unit: 'kg', category: 'Frutas' },
  { name: 'Melancia', unit: 'kg', category: 'Frutas' },
  // Carnes
  { name: 'Frango', unit: 'kg', category: 'Carnes' },
  { name: 'Carne Moída', unit: 'kg', category: 'Carnes' },
  { name: 'Acém', unit: 'kg', category: 'Carnes' },
  { name: 'Costela', unit: 'kg', category: 'Carnes' },
  { name: 'Peixe', unit: 'kg', category: 'Carnes' },
  { name: 'Linguiça', unit: 'kg', category: 'Carnes' },
  { name: 'Bacon', unit: 'kg', category: 'Carnes' },
  // Laticínios
  { name: 'Leite', unit: 'L', category: 'Laticínios' },
  { name: 'Queijo', unit: 'kg', category: 'Laticínios' },
  { name: 'Iogurte', unit: 'un', category: 'Laticínios' },
  { name: 'Manteiga', unit: 'un', category: 'Laticínios' },
  { name: 'Requeijão', unit: 'un', category: 'Laticínios' },
  { name: 'Ovo', unit: 'dz', category: 'Laticínios' },
  // Grãos e Cereais
  { name: 'Arroz', unit: 'kg', category: 'Grãos e Cereais' },
  { name: 'Feijão', unit: 'kg', category: 'Grãos e Cereais' },
  { name: 'Macarrão', unit: 'un', category: 'Grãos e Cereais' },
  { name: 'Farinha de Trigo', unit: 'kg', category: 'Grãos e Cereais' },
  { name: 'Aveia', unit: 'un', category: 'Grãos e Cereais' },
  { name: 'Lentilha', unit: 'kg', category: 'Grãos e Cereais' },
  // Bebidas
  { name: 'Água Mineral', unit: 'un', category: 'Bebidas' },
  { name: 'Suco de Caixinha', unit: 'un', category: 'Bebidas' },
  { name: 'Refrigerante', unit: 'un', category: 'Bebidas' },
  { name: 'Cerveja', unit: 'un', category: 'Bebidas' },
  // Lanches
  { name: 'Pão de Forma', unit: 'un', category: 'Lanches' },
  { name: 'Biscoito Cream Cracker', unit: 'un', category: 'Lanches' },
  { name: 'Granola', unit: 'un', category: 'Lanches' },
  { name: 'Salgadinho', unit: 'un', category: 'Lanches' },
  { name: 'Barra de Cereal', unit: 'un', category: 'Lanches' },
  { name: 'Pão Francês', unit: 'un', category: 'Lanches' },
  // Guloseimas
  { name: 'Chocolate', unit: 'un', category: 'Guloseimas' },
  { name: 'Sorvete', unit: 'un', category: 'Guloseimas' },
  { name: 'Doce de Leite', unit: 'un', category: 'Guloseimas' },
  { name: 'Gelatina', unit: 'un', category: 'Guloseimas' },
  { name: 'Pirulito', unit: 'un', category: 'Guloseimas' },
  // Higiene
  { name: 'Sabonete', unit: 'un', category: 'Higiene' },
  { name: 'Shampoo', unit: 'un', category: 'Higiene' },
  { name: 'Creme Dental', unit: 'un', category: 'Higiene' },
  { name: 'Papel Higiênico', unit: 'pct', category: 'Higiene' },
  { name: 'Desodorante', unit: 'un', category: 'Higiene' },
  // Limpeza
  { name: 'Detergente', unit: 'un', category: 'Limpeza' },
  { name: 'Sabão em Pó', unit: 'un', category: 'Limpeza' },
  { name: 'Água Sanitária', unit: 'un', category: 'Limpeza' },
  { name: 'Desinfetante', unit: 'un', category: 'Limpeza' },
  { name: 'Esponja', unit: 'un', category: 'Limpeza' },
  // Outros
  { name: 'Azeite', unit: 'un', category: 'Outros' },
  { name: 'Óleo', unit: 'L', category: 'Outros' },
  { name: 'Sal', unit: 'un', category: 'Outros' },
  { name: 'Açúcar', unit: 'kg', category: 'Outros' },
  { name: 'Café', unit: 'un', category: 'Outros' },
  { name: 'Molho de Tomate', unit: 'un', category: 'Outros' },
  { name: 'Maionese', unit: 'un', category: 'Outros' },
]
