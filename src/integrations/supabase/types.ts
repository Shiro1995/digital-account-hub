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
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      delivered_items: {
        Row: {
          credential_email: string | null
          credential_password: string | null
          credential_recovery_info: string | null
          credential_username: string | null
          delivered_at: string
          id: string
          inventory_item_id: string
          order_id: string
          order_item_id: string
          user_id: string
        }
        Insert: {
          credential_email?: string | null
          credential_password?: string | null
          credential_recovery_info?: string | null
          credential_username?: string | null
          delivered_at?: string
          id?: string
          inventory_item_id: string
          order_id: string
          order_item_id: string
          user_id: string
        }
        Update: {
          credential_email?: string | null
          credential_password?: string | null
          credential_recovery_info?: string | null
          credential_username?: string | null
          delivered_at?: string
          id?: string
          inventory_item_id?: string
          order_id?: string
          order_item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivered_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivered_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivered_items_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          created_at: string
          credential_email: string | null
          credential_password: string | null
          credential_recovery_info: string | null
          credential_username: string | null
          id: string
          internal_label: string | null
          internal_note: string | null
          product_id: string
          reserved_for_order_id: string | null
          sold_order_id: string | null
          status: Database["public"]["Enums"]["inventory_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          credential_email?: string | null
          credential_password?: string | null
          credential_recovery_info?: string | null
          credential_username?: string | null
          id?: string
          internal_label?: string | null
          internal_note?: string | null
          product_id: string
          reserved_for_order_id?: string | null
          sold_order_id?: string | null
          status?: Database["public"]["Enums"]["inventory_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          credential_email?: string | null
          credential_password?: string | null
          credential_recovery_info?: string | null
          credential_username?: string | null
          id?: string
          internal_label?: string | null
          internal_note?: string | null
          product_id?: string
          reserved_for_order_id?: string | null
          sold_order_id?: string | null
          status?: Database["public"]["Enums"]["inventory_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          product_name_snapshot: string
          quantity: number
          unit_price_vnd: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          product_name_snapshot: string
          quantity?: number
          unit_price_vnd: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          product_name_snapshot?: string
          quantity?: number
          unit_price_vnd?: number
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
          created_at: string
          delivered_at: string | null
          id: string
          order_code: string
          paid_at: string | null
          payment_provider: string | null
          payment_reference: string | null
          payment_status: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_amount_vnd: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          id?: string
          order_code: string
          paid_at?: string | null
          payment_provider?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount_vnd?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          id?: string
          order_code?: string
          paid_at?: string | null
          payment_provider?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount_vnd?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          amount_vnd: number | null
          created_at: string
          error_message: string | null
          external_transaction_id: string | null
          id: string
          matched_order_id: string | null
          processing_status: string
          provider: string | null
          raw_payload: Json | null
          transaction_content: string | null
        }
        Insert: {
          amount_vnd?: number | null
          created_at?: string
          error_message?: string | null
          external_transaction_id?: string | null
          id?: string
          matched_order_id?: string | null
          processing_status?: string
          provider?: string | null
          raw_payload?: Json | null
          transaction_content?: string | null
        }
        Update: {
          amount_vnd?: number | null
          created_at?: string
          error_message?: string | null
          external_transaction_id?: string | null
          id?: string
          matched_order_id?: string | null
          processing_status?: string
          provider?: string | null
          raw_payload?: Json | null
          transaction_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_matched_order_id_fkey"
            columns: ["matched_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_sessions: {
        Row: {
          amount_vnd: number
          created_at: string
          expires_at: string | null
          id: string
          order_id: string
          provider: string | null
          qr_image_url: string | null
          qr_payload: string | null
          status: Database["public"]["Enums"]["payment_session_status"]
          transfer_content: string
          updated_at: string
        }
        Insert: {
          amount_vnd: number
          created_at?: string
          expires_at?: string | null
          id?: string
          order_id: string
          provider?: string | null
          qr_image_url?: string | null
          qr_payload?: string | null
          status?: Database["public"]["Enums"]["payment_session_status"]
          transfer_content: string
          updated_at?: string
        }
        Update: {
          amount_vnd?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          order_id?: string
          provider?: string | null
          qr_image_url?: string | null
          qr_payload?: string | null
          status?: Database["public"]["Enums"]["payment_session_status"]
          transfer_content?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_sessions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          product_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          product_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          name: string
          price_vnd: number
          short_description: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name: string
          price_vnd?: number
          short_description?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name?: string
          price_vnd?: number
          short_description?: string | null
          slug?: string
          updated_at?: string
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
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shop_settings: {
        Row: {
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          id: string
          payment_provider: string | null
          shop_name: string
          support_email: string | null
          support_phone: string | null
          updated_at: string
        }
        Insert: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          id?: string
          payment_provider?: string | null
          shop_name?: string
          support_email?: string | null
          support_phone?: string | null
          updated_at?: string
        }
        Update: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          id?: string
          payment_provider?: string | null
          shop_name?: string
          support_email?: string | null
          support_phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: Database["public"]["Enums"]["support_message_status"]
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: Database["public"]["Enums"]["support_message_status"]
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: Database["public"]["Enums"]["support_message_status"]
          subject?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allocate_inventory_for_order: {
        Args: { p_order_id: string }
        Returns: Json
      }
      create_order_and_payment_session: {
        Args: { p_items: Json }
        Returns: Json
      }
      generate_order_code: { Args: never; Returns: string }
      get_delivered_credentials_for_user: {
        Args: { p_order_id: string }
        Returns: {
          credential_email: string
          credential_password: string
          credential_recovery_info: string
          credential_username: string
          delivered_at: string
          delivered_item_id: string
          inventory_item_id: string
          order_item_id: string
        }[]
      }
      get_product_stock: { Args: { p_product_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      process_payment_and_deliver: {
        Args: {
          p_order_id: string
          p_payment_reference: string
          p_provider: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "customer"
      inventory_status: "available" | "reserved" | "sold" | "disabled"
      order_status:
        | "pending_payment"
        | "paid"
        | "delivered"
        | "cancelled"
        | "refunded"
        | "payment_failed"
      payment_session_status: "pending" | "matched" | "expired" | "failed"
      support_message_status: "new" | "closed"
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
      app_role: ["admin", "customer"],
      inventory_status: ["available", "reserved", "sold", "disabled"],
      order_status: [
        "pending_payment",
        "paid",
        "delivered",
        "cancelled",
        "refunded",
        "payment_failed",
      ],
      payment_session_status: ["pending", "matched", "expired", "failed"],
      support_message_status: ["new", "closed"],
    },
  },
} as const
