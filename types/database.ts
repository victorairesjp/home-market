export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: number
          user_id: string
          name: string
          unit: string
          category: string
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          name: string
          unit: string
          category: string
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          name?: string
          unit?: string
          category?: string
          created_at?: string
        }
        Relationships: []
      }
      feiras: {
        Row: {
          id: number
          user_id: string
          name: string
          store: string
          date: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          name: string
          store: string
          date: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          name?: string
          store?: string
          date?: string
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      feira_items: {
        Row: {
          id: number
          feira_id: number
          product_id: number
          quantity: number
          unit_price: number
          created_at: string
        }
        Insert: {
          id?: number
          feira_id: number
          product_id: number
          quantity: number
          unit_price: number
          created_at?: string
        }
        Update: {
          id?: number
          feira_id?: number
          product_id?: number
          quantity?: number
          unit_price?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'feira_items_feira_id_fkey'
            columns: ['feira_id']
            isOneToOne: false
            referencedRelation: 'feiras'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'feira_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

export type Product = Database['public']['Tables']['products']['Row']
export type Feira = Database['public']['Tables']['feiras']['Row']
export type FeiraItem = Database['public']['Tables']['feira_items']['Row']

export type FeiraItemWithProduct = FeiraItem & {
  products: Product
}

export type FeiraWithSummary = Feira & {
  item_count: number
  total: number
}

export type FeiraWithItems = Feira & {
  feira_items: FeiraItemWithProduct[]
  total: number
}
