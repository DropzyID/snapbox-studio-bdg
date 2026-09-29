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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      blocked_slots: {
        Row: {
          branch_id: string
          created_at: string
          ends_at: string
          id: string
          reason: string
          starts_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          ends_at: string
          id?: string
          reason?: string
          starts_at: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          ends_at?: string
          id?: string
          reason?: string
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_slots_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_code: string
          branch_id: string
          created_at: string
          customer_name: string
          deposit_status: Database["public"]["Enums"]["deposit_status"]
          id: string
          package_id: string
          people_count: number
          recovered_via_waitlist: boolean
          slot_end: string
          slot_start: string
          status: Database["public"]["Enums"]["booking_status"]
          theme_id: string
          total_price: number | null
          whatsapp: string
        }
        Insert: {
          booking_code: string
          branch_id: string
          created_at?: string
          customer_name: string
          deposit_status?: Database["public"]["Enums"]["deposit_status"]
          id?: string
          package_id: string
          people_count: number
          recovered_via_waitlist?: boolean
          slot_end: string
          slot_start: string
          status?: Database["public"]["Enums"]["booking_status"]
          theme_id: string
          total_price?: number | null
          whatsapp: string
        }
        Update: {
          booking_code?: string
          branch_id?: string
          created_at?: string
          customer_name?: string
          deposit_status?: Database["public"]["Enums"]["deposit_status"]
          id?: string
          package_id?: string
          people_count?: number
          recovered_via_waitlist?: boolean
          slot_end?: string
          slot_start?: string
          status?: Database["public"]["Enums"]["booking_status"]
          theme_id?: string
          total_price?: number | null
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string
          close_time: string
          id: string
          name: string
          open_time: string
        }
        Insert: {
          address: string
          close_time: string
          id: string
          name: string
          open_time: string
        }
        Update: {
          address?: string
          close_time?: string
          id?: string
          name?: string
          open_time?: string
        }
        Relationships: []
      }
      lookup_attempts: {
        Row: {
          booking_code: string
          client_key: string
          created_at: string
          id: number
        }
        Insert: {
          booking_code: string
          client_key: string
          created_at?: string
          id?: number
        }
        Update: {
          booking_code?: string
          client_key?: string
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      packages: {
        Row: {
          duration_minutes: number
          id: string
          max_people: number
          name: string
          price: number
        }
        Insert: {
          duration_minutes: number
          id: string
          max_people: number
          name: string
          price: number
        }
        Update: {
          duration_minutes?: number
          id?: string
          max_people?: number
          name?: string
          price?: number
        }
        Relationships: []
      }
      themes: {
        Row: {
          description: string
          id: string
          name: string
        }
        Insert: {
          description: string
          id: string
          name: string
        }
        Update: {
          description?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          branch_id: string
          created_at: string
          customer_name: string
          id: string
          slot_start: string
          status: string
          whatsapp: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          customer_name: string
          id?: string
          slot_start: string
          status?: string
          whatsapp: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          customer_name?: string
          id?: string
          slot_start?: string
          status?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_offers: {
        Row: {
          branch_id: string
          created_at: string
          expires_at: string
          id: string
          slot_start: string
          status: string
          token: string
          waitlist_id: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          expires_at: string
          id?: string
          slot_start: string
          status?: string
          token: string
          waitlist_id: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          slot_start?: string
          status?: string
          token?: string
          waitlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_offers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_offers_waitlist_id_fkey"
            columns: ["waitlist_id"]
            isOneToOne: false
            referencedRelation: "waitlist"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_day_bookings: {
        Args: { _day: string }
        Returns: {
          booking_code: string
          branch_id: string
          customer_name: string
          deposit_status: Database["public"]["Enums"]["deposit_status"]
          id: string
          package_id: string
          people_count: number
          recovered_via_waitlist: boolean
          slot_end: string
          slot_start: string
          status: Database["public"]["Enums"]["booking_status"]
          whatsapp: string
        }[]
      }
      admin_set_booking_status: {
        Args: {
          _id: string
          _status: Database["public"]["Enums"]["booking_status"]
        }
        Returns: boolean
      }
      admin_stats: { Args: never; Returns: Json }
      assert_lookup_allowed: {
        Args: { _booking_code: string }
        Returns: undefined
      }
      cancel_my_booking: {
        Args: { _booking_code: string; _whatsapp: string }
        Returns: boolean
      }
      create_booking: {
        Args: {
          _branch_id: string
          _claim_token?: string
          _customer_name: string
          _package_id: string
          _people_count: number
          _slot_start: string
          _theme_id: string
          _whatsapp: string
        }
        Returns: string
      }
      expire_unpaid_booking: {
        Args: { _booking_code: string }
        Returns: boolean
      }
      find_my_booking: {
        Args: { _booking_code: string; _whatsapp: string }
        Returns: {
          booking_code: string
          branch_id: string
          customer_name: string
          deposit_status: Database["public"]["Enums"]["deposit_status"]
          package_id: string
          people_count: number
          slot_end: string
          slot_start: string
          status: Database["public"]["Enums"]["booking_status"]
          theme_id: string
        }[]
      }
      get_booked_slots: {
        Args: { _branch_id: string; _from: string; _to: string }
        Returns: {
          slot_end: string
          slot_start: string
        }[]
      }
      get_waitlist_offer: {
        Args: { _token: string }
        Returns: {
          branch_id: string
          expires_at: string
          slot_start: string
          status: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      join_waitlist: {
        Args: {
          _branch_id: string
          _customer_name: string
          _slot_start: string
          _whatsapp: string
        }
        Returns: boolean
      }
      list_active_offers: {
        Args: never
        Returns: {
          branch_id: string
          expires_at: string
          slot_start: string
          token: string
        }[]
      }
      normalize_wa: { Args: { _w: string }; Returns: string }
      offer_next_waitlist: {
        Args: { _branch_id: string; _slot_start: string }
        Returns: undefined
      }
      process_waitlist_offers: { Args: never; Returns: undefined }
      request_client_key: { Args: never; Returns: string }
      reschedule_my_booking: {
        Args: { _booking_code: string; _new_start: string; _whatsapp: string }
        Returns: boolean
      }
      simulate_deposit_paid: {
        Args: { _booking_code: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner"
      booking_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "no_show"
        | "completed"
      deposit_status: "unpaid" | "paid"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["owner"],
      booking_status: [
        "pending",
        "confirmed",
        "cancelled",
        "no_show",
        "completed",
      ],
      deposit_status: ["unpaid", "paid"],
    },
  },
} as const
