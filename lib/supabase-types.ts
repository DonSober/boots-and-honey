import type { Database as Generated } from "@/types/database-generated";

// AppDatabase extends generated types to include new tables added during iteration
// without forcing a full regeneration. We keep shapes as unknown to avoid over-coupling.
export type AppDatabase = Generated & {
  public: Generated["public"] & {
    Tables: Generated["public"]["Tables"] & {
      profiles: {
        Row: unknown;
        Insert: unknown;
        Update: unknown;
        Relationships: unknown[];
      };
      contacts: {
        Row: unknown;
        Insert: unknown;
        Update: unknown;
        Relationships: unknown[];
      };
      accounts: {
        Row: unknown;
        Insert: unknown;
        Update: unknown;
        Relationships: unknown[];
      };
    };
  };
};