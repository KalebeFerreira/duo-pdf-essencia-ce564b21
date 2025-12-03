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
      catalogs: {
        Row: {
          about_image: string | null
          about_text: string | null
          about_title: string | null
          contact_email: string | null
          contact_facebook: string | null
          contact_instagram: string | null
          contact_whatsapp: string | null
          cover_image: string | null
          created_at: string
          gallery: Json
          id: string
          price_table: Json
          products: Json
          sections_order: Json
          testimonials: Json
          theme_font: string | null
          theme_primary_color: string | null
          theme_secondary_color: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          about_image?: string | null
          about_text?: string | null
          about_title?: string | null
          contact_email?: string | null
          contact_facebook?: string | null
          contact_instagram?: string | null
          contact_whatsapp?: string | null
          cover_image?: string | null
          created_at?: string
          gallery?: Json
          id?: string
          price_table?: Json
          products?: Json
          sections_order?: Json
          testimonials?: Json
          theme_font?: string | null
          theme_primary_color?: string | null
          theme_secondary_color?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          about_image?: string | null
          about_text?: string | null
          about_title?: string | null
          contact_email?: string | null
          contact_facebook?: string | null
          contact_instagram?: string | null
          contact_whatsapp?: string | null
          cover_image?: string | null
          created_at?: string
          gallery?: Json
          id?: string
          price_table?: Json
          products?: Json
          sections_order?: Json
          testimonials?: Json
          theme_font?: string | null
          theme_primary_color?: string | null
          theme_secondary_color?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      commissions: {
        Row: {
          commission_amount: number
          created_at: string | null
          id: string
          payment_amount: number
          payment_date: string | null
          pix_key: string | null
          referral_id: string
          referrer_id: string
          status: string | null
        }
        Insert: {
          commission_amount: number
          created_at?: string | null
          id?: string
          payment_amount: number
          payment_date?: string | null
          pix_key?: string | null
          referral_id: string
          referrer_id: string
          status?: string | null
        }
        Update: {
          commission_amount?: number
          created_at?: string | null
          id?: string
          payment_amount?: number
          payment_date?: string | null
          pix_key?: string | null
          referral_id?: string
          referrer_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          file_size: number | null
          file_url: string | null
          id: string
          photo_url: string | null
          signature_url: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          photo_url?: string | null
          signature_url?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          photo_url?: string | null
          signature_url?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ebooks: {
        Row: {
          chapters: Json
          color_palette: string
          created_at: string
          description: string | null
          id: string
          language: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chapters?: Json
          color_palette?: string
          created_at?: string
          description?: string | null
          id?: string
          language?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chapters?: Json
          color_palette?: string
          created_at?: string
          description?: string | null
          id?: string
          language?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          automations_used: number | null
          automations_used_today: number | null
          daily_automations_limit: number | null
          daily_pdfs_limit: number | null
          designs_used_this_month: number | null
          ebook_page_limit: number | null
          id: string
          last_automations_reset_date: string | null
          last_monthly_reset_date: string | null
          last_reset_date: string | null
          monthly_credits: number | null
          monthly_designs_limit: number | null
          monthly_resumes_limit: number | null
          nome_completo: string
          pdfs_limit: number | null
          pdfs_used: number | null
          pdfs_used_today: number | null
          pix_key: string | null
          plan: string | null
          remaining_credits: number | null
          renewal_date: string | null
          resumes_used_this_month: number | null
          stripe_customer_id: string | null
          stripe_product_id: string | null
          stripe_subscription_id: string | null
        }
        Insert: {
          automations_used?: number | null
          automations_used_today?: number | null
          daily_automations_limit?: number | null
          daily_pdfs_limit?: number | null
          designs_used_this_month?: number | null
          ebook_page_limit?: number | null
          id: string
          last_automations_reset_date?: string | null
          last_monthly_reset_date?: string | null
          last_reset_date?: string | null
          monthly_credits?: number | null
          monthly_designs_limit?: number | null
          monthly_resumes_limit?: number | null
          nome_completo?: string
          pdfs_limit?: number | null
          pdfs_used?: number | null
          pdfs_used_today?: number | null
          pix_key?: string | null
          plan?: string | null
          remaining_credits?: number | null
          renewal_date?: string | null
          resumes_used_this_month?: number | null
          stripe_customer_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id?: string | null
        }
        Update: {
          automations_used?: number | null
          automations_used_today?: number | null
          daily_automations_limit?: number | null
          daily_pdfs_limit?: number | null
          designs_used_this_month?: number | null
          ebook_page_limit?: number | null
          id?: string
          last_automations_reset_date?: string | null
          last_monthly_reset_date?: string | null
          last_reset_date?: string | null
          monthly_credits?: number | null
          monthly_designs_limit?: number | null
          monthly_resumes_limit?: number | null
          nome_completo?: string
          pdfs_limit?: number | null
          pdfs_used?: number | null
          pdfs_used_today?: number | null
          pix_key?: string | null
          plan?: string | null
          remaining_credits?: number | null
          renewal_date?: string | null
          resumes_used_this_month?: number | null
          stripe_customer_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id?: string | null
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          commission_expires_at: string | null
          created_at: string | null
          id: string
          referral_code_id: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          commission_expires_at?: string | null
          created_at?: string | null
          id?: string
          referral_code_id: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          commission_expires_at?: string | null
          created_at?: string | null
          id?: string
          referral_code_id?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
