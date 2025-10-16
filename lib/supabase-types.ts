import type { Database as Generated } from "@/types/database-generated";

// Extend the generated Database with only the extra tables we actually have (e.g., profiles)
// Keep all existing generated table shapes intact to preserve strong typing.
export type ExtendedDatabase = Generated & {
  public: Generated["public"] & {
    Tables: Generated["public"]["Tables"] & {
      profiles: {
        Row: {
          user_id: string;
          business_name: string;
          website: string | null;
          phone: string | null;
          is_complete: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          business_name: string;
          website?: string | null;
          phone?: string | null;
          is_complete?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          business_name?: string;
          website?: string | null;
          phone?: string | null;
          is_complete?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
  };
};
