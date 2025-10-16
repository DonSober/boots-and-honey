export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          created_at: string
          id: string
          name: string
          normalized_name: string
          updated_at: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          normalized_name: string
          updated_at?: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          normalized_name?: string
          updated_at?: string
          verified?: boolean
        }
        Relationships: []
      }
      addons: {
        Row: {
          created_at: string
          delivery_zone_id: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          price: number
          requirements: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_zone_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price: number
          requirements?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_zone_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          requirements?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "addons_delivery_zone_id_fkey"
            columns: ["delivery_zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      addresses: {
        Row: {
          city: string
          created_at: string
          geocoded_at: string | null
          id: string
          lat: number | null
          lng: number | null
          state: string
          street: string | null
          updated_at: string
          zip_code: string
        }
        Insert: {
          city: string
          created_at?: string
          geocoded_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          state: string
          street?: string | null
          updated_at?: string
          zip_code: string
        }
        Update: {
          city?: string
          created_at?: string
          geocoded_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          state?: string
          street?: string | null
          updated_at?: string
          zip_code?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          business_name: string | null
          created_at: string
          email: string
          first_seen_at: string
          id: string
          last_seen_at: string
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          email: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          business_name?: string | null
          created_at?: string
          email?: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      delivery_settings: {
        Row: {
          base_zip: string
          id: number
          max_distance_miles: number
          price: number
          updated_at: string
        }
        Insert: {
          base_zip?: string
          id?: number
          max_distance_miles?: number
          price?: number
          updated_at?: string
        }
        Update: {
          base_zip?: string
          id?: number
          max_distance_miles?: number
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      delivery_zones: {
        Row: {
          created_at: string
          delivery_price: number
          id: string
          is_active: boolean
          max_distance_miles: number
          updated_at: string
          zip_code: string
        }
        Insert: {
          created_at?: string
          delivery_price: number
          id?: string
          is_active?: boolean
          max_distance_miles: number
          updated_at?: string
          zip_code: string
        }
        Update: {
          created_at?: string
          delivery_price?: number
          id?: string
          is_active?: boolean
          max_distance_miles?: number
          updated_at?: string
          zip_code?: string
        }
        Relationships: []
      }
      order_addons: {
        Row: {
          addon_id: string
          created_at: string
          id: string
          order_id: string
          price: number
        }
        Insert: {
          addon_id: string
          created_at?: string
          id?: string
          order_id: string
          price: number
        }
        Update: {
          addon_id?: string
          created_at?: string
          id?: string
          order_id?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_addons_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_addons_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          custom_description: string | null
          id: string
          order_id: string
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          custom_description?: string | null
          id?: string
          order_id: string
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          custom_description?: string | null
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_public_tokens: {
        Row: {
          created_at: string
          expires_at: string
          order_id: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          order_id: string
          token: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          order_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_public_tokens_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          account_id: string | null
          addon_total: number
          address_id: string | null
          business_address: string | null
          city: string | null
          company_name: string
          contact_id: string | null
          contact_name: string
          created_at: string
          delivery_distance_miles: number | null
          delivery_notes: string | null
          delivery_price: number
          delivery_selected: boolean
          email: string
          id: string
          idempotency_key: string | null
          order_number: string
          phone: string | null
          po_number: string | null
          requested_fulfillment_date: string
          special_instructions: string | null
          state: string | null
          status: string
          subtotal: number
          total: number
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          account_id?: string | null
          addon_total?: number
          address_id?: string | null
          business_address?: string | null
          city?: string | null
          company_name: string
          contact_id?: string | null
          contact_name: string
          created_at?: string
          delivery_distance_miles?: number | null
          delivery_notes?: string | null
          delivery_price?: number
          delivery_selected?: boolean
          email: string
          id?: string
          idempotency_key?: string | null
          order_number: string
          phone?: string | null
          po_number?: string | null
          requested_fulfillment_date: string
          special_instructions?: string | null
          state?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          account_id?: string | null
          addon_total?: number
          address_id?: string | null
          business_address?: string | null
          city?: string | null
          company_name?: string
          contact_id?: string | null
          contact_name?: string
          created_at?: string
          delivery_distance_miles?: number | null
          delivery_notes?: string | null
          delivery_price?: number
          delivery_selected?: boolean
          email?: string
          id?: string
          idempotency_key?: string | null
          order_number?: string
          phone?: string | null
          po_number?: string | null
          requested_fulfillment_date?: string
          special_instructions?: string | null
          state?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string
          features: Json | null
          id: string
          is_active: boolean
          price_per_bundle: number
          product_id: string
          updated_at: string
          variant_code: string
        }
        Insert: {
          created_at?: string
          features?: Json | null
          id?: string
          is_active?: boolean
          price_per_bundle: number
          product_id: string
          updated_at?: string
          variant_code: string
        }
        Update: {
          created_at?: string
          features?: Json | null
          id?: string
          is_active?: boolean
          price_per_bundle?: number
          product_id?: string
          updated_at?: string
          variant_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          features: Json | null
          id: string
          name: string
          price_per_bundle: number
          type: Database["public"]["Enums"]["product_type_enum"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          name: string
          price_per_bundle: number
          type: Database["public"]["Enums"]["product_type_enum"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          name?: string
          price_per_bundle?: number
          type?: Database["public"]["Enums"]["product_type_enum"]
          updated_at?: string
        }
        Relationships: []
      }
      products_v2: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      mv_customers: {
        Row: {
          average_order_value: number | null
          company_name: string | null
          last_order_date: string | null
          total_orders: number | null
          total_spent: number | null
        }
        Relationships: []
      }
      mv_product_performance: {
        Row: {
          average_selling_price: number | null
          name: string | null
          times_ordered: number | null
          total_quantity_sold: number | null
          total_revenue: number | null
          variant_code: string | null
        }
        Relationships: []
      }
      mv_sales_by_day: {
        Row: {
          average_order_value: number | null
          day: string | null
          total_orders: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      products_view: {
        Row: {
          created_at: string | null
          features: Json | null
          id: string | null
          name: string | null
          price_per_bundle: number | null
          type: Database["public"]["Enums"]["product_type_enum"] | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_apply_delivery: {
        Args: { p_zip: string }
        Returns: boolean
      }
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      normalize_account_name: {
        Args: { raw: string }
        Returns: string
      }
      refresh_analytics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      submit_purchase_order: {
        Args: { p_payload: Json }
        Returns: {
          order_id: string
          order_number: string
        }[]
      }
    }
    Enums: {
      product_type_enum: "starter" | "premium"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      product_type_enum: ["starter", "premium"],
    },
  },
} as const
