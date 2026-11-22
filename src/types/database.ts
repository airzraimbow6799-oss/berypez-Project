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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      blocked_dates: {
        Row: {
          branch_id: number
          day: string
          reason: string | null
        }
        Insert: {
          branch_id: number
          day: string
          reason?: string | null
        }
        Update: {
          branch_id?: number
          day?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_dates_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string
          district: string
          id: number
          is_active: boolean
          maps_url: string | null
          name: string
          opening_hours: Json
          phone: string
          seats_per_slot: number
          slug: string
          whatsapp: string
        }
        Insert: {
          address: string
          district: string
          id?: never
          is_active?: boolean
          maps_url?: string | null
          name: string
          opening_hours?: Json
          phone: string
          seats_per_slot?: number
          slug: string
          whatsapp: string
        }
        Update: {
          address?: string
          district?: string
          id?: never
          is_active?: boolean
          maps_url?: string | null
          name?: string
          opening_hours?: Json
          phone?: string
          seats_per_slot?: number
          slug?: string
          whatsapp?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: number
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          id?: number
          name: string
          slug: string
          sort_order: number
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      complaints: {
        Row: {
          address: string | null
          amount_cents: number | null
          branch_id: number | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string
          description: string
          document_number: string
          document_type: string
          guardian_name: string | null
          id: number
          is_minor: boolean
          item_type: string
          kind: string
          number: number
          request: string
        }
        Insert: {
          address?: string | null
          amount_cents?: number | null
          branch_id?: number | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone: string
          description: string
          document_number: string
          document_type: string
          guardian_name?: string | null
          id?: never
          is_minor?: boolean
          item_type: string
          kind: string
          number?: number
          request: string
        }
        Update: {
          address?: string | null
          amount_cents?: number | null
          branch_id?: number | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          description?: string
          document_number?: string
          document_type?: string
          guardian_name?: string | null
          id?: never
          is_minor?: boolean
          item_type?: string
          kind?: string
          number?: number
          request?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_zones: {
        Row: {
          branch_id: number
          district: string
          eta_minutes: number
          fee_cents: number
          id: number
          is_active: boolean
          min_order_cents: number
        }
        Insert: {
          branch_id: number
          district: string
          eta_minutes: number
          fee_cents: number
          id?: never
          is_active?: boolean
          min_order_cents?: number
        }
        Update: {
          branch_id?: number
          district?: string
          eta_minutes?: number
          fee_cents?: number
          id?: never
          is_active?: boolean
          min_order_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "delivery_zones_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      email_log: {
        Row: {
          attempts: number
          complaint_id: number | null
          created_at: string
          id: number
          order_id: number | null
          resend_id: string | null
          reservation_id: number | null
          status: string
          template: string
          to_email: string
        }
        Insert: {
          attempts?: number
          complaint_id?: number | null
          created_at?: string
          id?: never
          order_id?: number | null
          resend_id?: string | null
          reservation_id?: number | null
          status?: string
          template: string
          to_email: string
        }
        Update: {
          attempts?: number
          complaint_id?: number | null
          created_at?: string
          id?: never
          order_id?: number | null
          resend_id?: string | null
          reservation_id?: number | null
          status?: string
          template?: string
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_log_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_log_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      menus: {
        Row: {
          description: string
          name: string
          slug: Database["public"]["Enums"]["menu_slug"]
          sort_order: number
        }
        Insert: {
          description?: string
          name: string
          slug: Database["public"]["Enums"]["menu_slug"]
          sort_order: number
        }
        Update: {
          description?: string
          name?: string
          slug?: Database["public"]["Enums"]["menu_slug"]
          sort_order?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          choices: Json
          id: number
          line_total_cents: number
          notes: string | null
          order_id: number
          product_id: number
          product_name: string
          quantity: number
          unit_price_cents: number
          variant_id: number | null
          variant_label: string | null
        }
        Insert: {
          choices?: Json
          id?: never
          line_total_cents: number
          notes?: string | null
          order_id: number
          product_id: number
          product_name: string
          quantity: number
          unit_price_cents: number
          variant_id?: number | null
          variant_label?: string | null
        }
        Update: {
          choices?: Json
          id?: never
          line_total_cents?: number
          notes?: string | null
          order_id?: number
          product_id?: number
          product_name?: string
          quantity?: number
          unit_price_cents?: number
          variant_id?: number | null
          variant_label?: string | null
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
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string | null
          address_reference: string | null
          branch_id: number
          cash_change_for_cents: number | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          delivery_cents: number
          district: string | null
          id: number
          modality: Database["public"]["Enums"]["order_modality"]
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          scheduled_for: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal_cents: number
          total_cents: number
          tracking_token: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          address_reference?: string | null
          branch_id: number
          cash_change_for_cents?: number | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          delivery_cents?: number
          district?: string | null
          id?: never
          modality: Database["public"]["Enums"]["order_modality"]
          notes?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_cents: number
          total_cents: number
          tracking_token?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          address_reference?: string | null
          branch_id?: number
          cash_change_for_cents?: number | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_cents?: number
          district?: string | null
          id?: never
          modality?: Database["public"]["Enums"]["order_modality"]
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_cents?: number
          total_cents?: number
          tracking_token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_events: {
        Row: {
          amount_cents: number
          id: number
          order_id: number
          payload: Json
          provider: string
          provider_event_id: string
          received_at: string
          type: string
        }
        Insert: {
          amount_cents: number
          id?: never
          order_id: number
          payload: Json
          provider: string
          provider_event_id: string
          received_at?: string
          type: string
        }
        Update: {
          amount_cents?: number
          id?: never
          order_id?: number
          payload?: Json
          provider?: string
          provider_event_id?: string
          received_at?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_menus: {
        Row: {
          menu_slug: Database["public"]["Enums"]["menu_slug"]
          product_id: number
        }
        Insert: {
          menu_slug: Database["public"]["Enums"]["menu_slug"]
          product_id: number
        }
        Update: {
          menu_slug?: Database["public"]["Enums"]["menu_slug"]
          product_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_menus_menu_slug_fkey"
            columns: ["menu_slug"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "product_menus_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allergens: string[]
          category_id: number
          choice_groups: Json
          created_at: string
          description: string
          id: number
          image_alt: string | null
          image_path: string | null
          is_available: boolean
          is_published: boolean
          name: string
          portion: string | null
          price_cents: number
          slug: string
          tags: string[]
          updated_at: string
          variant_label: string | null
        }
        Insert: {
          allergens?: string[]
          category_id: number
          choice_groups?: Json
          created_at?: string
          description?: string
          id?: number
          image_alt?: string | null
          image_path?: string | null
          is_available?: boolean
          is_published?: boolean
          name: string
          portion?: string | null
          price_cents: number
          slug: string
          tags?: string[]
          updated_at?: string
          variant_label?: string | null
        }
        Update: {
          allergens?: string[]
          category_id?: number
          choice_groups?: Json
          created_at?: string
          description?: string
          id?: number
          image_alt?: string | null
          image_path?: string | null
          is_available?: boolean
          is_published?: boolean
          name?: string
          portion?: string | null
          price_cents?: number
          slug?: string
          tags?: string[]
          updated_at?: string
          variant_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          hits: number
          key: string
          window_start: string
        }
        Insert: {
          hits?: number
          key: string
          window_start: string
        }
        Update: {
          hits?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          area: string | null
          branch_id: number
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          id: number
          manage_token: string
          occasion: string | null
          party_size: number
          starts_at: string
          status: Database["public"]["Enums"]["reservation_status"]
          updated_at: string
        }
        Insert: {
          area?: string | null
          branch_id: number
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          id?: never
          manage_token?: string
          occasion?: string | null
          party_size: number
          starts_at: string
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
        }
        Update: {
          area?: string | null
          branch_id?: number
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          id?: never
          manage_token?: string
          occasion?: string | null
          party_size?: number
          starts_at?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_roles: {
        Row: {
          branch_id: number | null
          role: Database["public"]["Enums"]["staff_role"]
          user_id: string
        }
        Insert: {
          branch_id?: number | null
          role: Database["public"]["Enums"]["staff_role"]
          user_id: string
        }
        Update: {
          branch_id?: number | null
          role?: Database["public"]["Enums"]["staff_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_roles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      variants: {
        Row: {
          id: number
          is_archived: boolean
          is_available: boolean
          label: string
          price_cents: number
          product_id: number
          selections: Json
          sort_order: number
        }
        Insert: {
          id?: number
          is_archived?: boolean
          is_available?: boolean
          label: string
          price_cents: number
          product_id: number
          selections?: Json
          sort_order?: number
        }
        Update: {
          id?: number
          is_archived?: boolean
          is_available?: boolean
          label?: string
          price_cents?: number
          product_id?: number
          selections?: Json
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_save_product: { Args: { p: Json }; Returns: number }
      admin_set_product_available: {
        Args: { p_available: boolean; p_id: number }
        Returns: undefined
      }
      admin_set_product_price: {
        Args: { p_id: number; p_price_cents: number }
        Returns: undefined
      }
      admin_unpublish_product: { Args: { p_id: number }; Returns: undefined }
      checkout_create_order: {
        Args: { p_items: Json; p_order: Json }
        Returns: {
          order_id: number
          tracking_token: string
        }[]
      }
      checkout_hit_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number }
        Returns: boolean
      }
      reservations_create: {
        Args: { p: Json }
        Returns: {
          manage_token: string
          reservation_id: number
        }[]
      }
      reservations_reserved_seats: {
        Args: { p_branch: number; p_from: string; p_to: string }
        Returns: {
          seats: number
          starts_at: string
        }[]
      }
    }
    Enums: {
      menu_slug:
        | "marina"
        | "criolla"
        | "berycafe"
        | "piqueos"
        | "el-bar"
        | "vegetariana"
      order_modality: "delivery" | "pickup"
      order_status:
        | "pending"
        | "received"
        | "in_kitchen"
        | "on_the_way"
        | "ready_for_pickup"
        | "delivered"
        | "cancelled"
      payment_method: "yape" | "plin" | "card" | "cash"
      payment_status: "unpaid" | "pending" | "paid" | "failed" | "refunded"
      reservation_status: "confirmed" | "arrived" | "no_show" | "cancelled"
      staff_role: "admin" | "cocina" | "salon"
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
      menu_slug: [
        "marina",
        "criolla",
        "berycafe",
        "piqueos",
        "el-bar",
        "vegetariana",
      ],
      order_modality: ["delivery", "pickup"],
      order_status: [
        "pending",
        "received",
        "in_kitchen",
        "on_the_way",
        "ready_for_pickup",
        "delivered",
        "cancelled",
      ],
      payment_method: ["yape", "plin", "card", "cash"],
      payment_status: ["unpaid", "pending", "paid", "failed", "refunded"],
      reservation_status: ["confirmed", "arrived", "no_show", "cancelled"],
      staff_role: ["admin", "cocina", "salon"],
    },
  },
} as const
