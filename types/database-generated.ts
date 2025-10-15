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
    PostgrestVersion: "13.0.4"
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
      order_communications: {
        Row: {
          communication_type: string
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          order_id: string
          provider_message_id: string | null
          recipient_email: string
          retry_count: number
          sent_at: string | null
          status: string
          subject: string | null
          updated_at: string
          webhook_event_id: string | null
        }
        Insert: {
          communication_type: string
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          order_id: string
          provider_message_id?: string | null
          recipient_email: string
          retry_count?: number
          sent_at?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          webhook_event_id?: string | null
        }
        Update: {
          communication_type?: string
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string
          provider_message_id?: string | null
          recipient_email?: string
          retry_count?: number
          sent_at?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          webhook_event_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_communications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_documents: {
        Row: {
          created_at: string
          document_type: string
          error_message: string | null
          file_path: string | null
          file_url: string | null
          generated_at: string | null
          id: string
          metadata: Json | null
          order_id: string
          retry_count: number
          status: string
          updated_at: string
          webhook_event_id: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          error_message?: string | null
          file_path?: string | null
          file_url?: string | null
          generated_at?: string | null
          id?: string
          metadata?: Json | null
          order_id: string
          retry_count?: number
          status?: string
          updated_at?: string
          webhook_event_id?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          error_message?: string | null
          file_path?: string | null
          file_url?: string | null
          generated_at?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string
          retry_count?: number
          status?: string
          updated_at?: string
          webhook_event_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_documents_order_id_fkey"
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
      orders: {
        Row: {
          account_id: string | null
          addon_total: number
          business_address: string | null
          city: string | null
          company_name: string
          contact_id: string | null
          contact_name: string
          created_at: string
          email: string
          id: string
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
          business_address?: string | null
          city?: string | null
          company_name: string
          contact_id?: string | null
          contact_name: string
          created_at?: string
          email: string
          id?: string
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
          business_address?: string | null
          city?: string | null
          company_name?: string
          contact_id?: string | null
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
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
            foreignKeyName: "orders_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
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
      profiles: {
        Row: {
          business_name: string
          created_at: string
          is_complete: boolean
          phone: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          business_name: string
          created_at?: string
          is_complete?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          business_name?: string
          created_at?: string
          is_complete?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          processing_duration_ms: number | null
          record_id: string
          retry_count: number
          status: string
          table_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          payload: Json
          processed_at?: string | null
          processing_duration_ms?: number | null
          record_id: string
          retry_count?: number
          status?: string
          table_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          processing_duration_ms?: number | null
          record_id?: string
          retry_count?: number
          status?: string
          table_name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      citext: {
        Args: { "": boolean } | { "": string } | { "": unknown }
        Returns: string
      }
      citext_hash: {
        Args: { "": string }
        Returns: number
      }
      citextin: {
        Args: { "": unknown }
        Returns: string
      }
      citextout: {
        Args: { "": string }
        Returns: unknown
      }
      citextrecv: {
        Args: { "": unknown }
        Returns: string
      }
      citextsend: {
        Args: { "": string }
        Returns: string
      }
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      normalize_account_name: {
        Args: { raw: string }
        Returns: string
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
    }
    Enums: {
      order_status_enum:
        | "pending"
        | "confirmed"
        | "processing"
        | "ready_for_pickup"
        | "out_for_delivery"
        | "delivered"
        | "completed"
        | "cancelled"
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
      order_status_enum: [
        "pending",
        "confirmed",
        "processing",
        "ready_for_pickup",
        "out_for_delivery",
        "delivered",
        "completed",
        "cancelled",
      ],
      product_type_enum: ["starter", "premium"],
    },
  },
} as const
