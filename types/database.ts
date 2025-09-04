// =============================================================================
// Database Types - Updated for Enhanced MVP Schema
// =============================================================================

// Enum types matching database schema
export type ProductType = 'starter' | 'premium'
export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled'

export interface Database {
  public: {
    Tables: {
      orders: {
        Row: {
          id: string
          order_number: string
          company_name: string
          contact_name: string
          email: string
          phone: string
          business_address: string
          city: string
          state: string
          zip_code: string
          po_number: string | null
          requested_fulfillment_date: string | null
          special_instructions: string | null
          subtotal: number
          addon_total: number
          total: number
          status: OrderStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          company_name: string
          contact_name: string
          email: string
          phone: string
          business_address: string
          city: string
          state: string
          zip_code: string
          po_number?: string | null
          requested_fulfillment_date?: string | null
          special_instructions?: string | null
          subtotal: number
          addon_total: number
          total: number
          status?: OrderStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          company_name?: string
          contact_name?: string
          email?: string
          phone?: string
          business_address?: string
          city?: string
          state?: string
          zip_code?: string
          po_number?: string | null
          requested_fulfillment_date?: string | null
          special_instructions?: string | null
          subtotal?: number
          addon_total?: number
          total?: number
          status?: OrderStatus
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          quantity: number
          unit_price: number
          total_price: number
          custom_description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          quantity: number
          unit_price: number
          total_price: number
          custom_description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          quantity?: number
          unit_price?: number
          total_price?: number
          custom_description?: string | null
          created_at?: string
        }
      }
      order_addons: {
        Row: {
          id: string
          order_id: string
          addon_id: string
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          addon_id: string
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          addon_id?: string
          price?: number
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          type: ProductType
          price_per_bundle: number
          description: string | null
          features: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: ProductType
          price_per_bundle: number
          description?: string | null
          features?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: ProductType
          price_per_bundle?: number
          description?: string | null
          features?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      addons: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          requirements: string | null
          delivery_zone_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          requirements?: string | null
          delivery_zone_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          requirements?: string | null
          delivery_zone_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      delivery_zones: {
        Row: {
          id: string
          zip_code: string
          max_distance_miles: number
          delivery_price: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          zip_code: string
          max_distance_miles: number
          delivery_price: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          zip_code?: string
          max_distance_miles?: number
          delivery_price?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Convenience types for easier use
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type OrderUpdate = Database['public']['Tables']['orders']['Update']

export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type OrderItemInsert = Database['public']['Tables']['order_items']['Insert']
export type OrderItemUpdate = Database['public']['Tables']['order_items']['Update']

export type OrderAddon = Database['public']['Tables']['order_addons']['Row']
export type OrderAddonInsert = Database['public']['Tables']['order_addons']['Insert']
export type OrderAddonUpdate = Database['public']['Tables']['order_addons']['Update']

export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

export type Addon = Database['public']['Tables']['addons']['Row']
export type AddonInsert = Database['public']['Tables']['addons']['Insert']
export type AddonUpdate = Database['public']['Tables']['addons']['Update']

export type DeliveryZone = Database['public']['Tables']['delivery_zones']['Row']
export type DeliveryZoneInsert = Database['public']['Tables']['delivery_zones']['Insert']
export type DeliveryZoneUpdate = Database['public']['Tables']['delivery_zones']['Update']