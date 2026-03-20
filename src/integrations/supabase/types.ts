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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string
          id: string
          user_email: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type: string
          id?: string
          user_email?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      bank_transactions: {
        Row: {
          amount: number
          bank_id: string
          created_at: string
          description: string
          id: string
          transaction_date: string
          transaction_type: string
        }
        Insert: {
          amount?: number
          bank_id: string
          created_at?: string
          description?: string
          id?: string
          transaction_date?: string
          transaction_type?: string
        }
        Update: {
          amount?: number
          bank_id?: string
          created_at?: string
          description?: string
          id?: string
          transaction_date?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "banks"
            referencedColumns: ["id"]
          },
        ]
      }
      banks: {
        Row: {
          account_number: string
          balance: number
          created_at: string
          id: string
          is_active: boolean
          name: string
          notes: string
          updated_at: string
        }
        Insert: {
          account_number?: string
          balance?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string
          updated_at?: string
        }
        Update: {
          account_number?: string
          balance?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string
          updated_at?: string
        }
        Relationships: []
      }
      branches: {
        Row: {
          address: string
          created_at: string
          id: string
          is_active: boolean
          manager: string
          name: string
          phone: string
          updated_at: string
        }
        Insert: {
          address?: string
          created_at?: string
          id?: string
          is_active?: boolean
          manager?: string
          name: string
          phone?: string
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          is_active?: boolean
          manager?: string
          name?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string
          code: number
          created_at: string
          email: string
          id: string
          loyalty_points: number
          name: string
          notes: string
          phone: string
          total_orders: number
          total_spent: number
          updated_at: string
        }
        Insert: {
          address?: string
          code?: number
          created_at?: string
          email?: string
          id?: string
          loyalty_points?: number
          name: string
          notes?: string
          phone?: string
          total_orders?: number
          total_spent?: number
          updated_at?: string
        }
        Update: {
          address?: string
          code?: number
          created_at?: string
          email?: string
          id?: string
          loyalty_points?: number
          name?: string
          notes?: string
          phone?: string
          total_orders?: number
          total_spent?: number
          updated_at?: string
        }
        Relationships: []
      }
      drivers: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          phone: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          phone?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string
        }
        Relationships: []
      }
      employee_actions: {
        Row: {
          action_date: string
          action_type: string
          amount: number
          created_at: string
          employee_id: string
          id: string
          reason: string
        }
        Insert: {
          action_date?: string
          action_type?: string
          amount?: number
          created_at?: string
          employee_id: string
          id?: string
          reason?: string
        }
        Update: {
          action_date?: string
          action_type?: string
          amount?: number
          created_at?: string
          employee_id?: string
          id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_actions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_departments: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      employee_nationalities: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string
          department_id: string | null
          email: string
          hire_date: string
          id: string
          is_active: boolean
          name: string
          nationality_id: string | null
          notes: string
          phone: string
          salary: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          email?: string
          hire_date?: string
          id?: string
          is_active?: boolean
          name: string
          nationality_id?: string | null
          notes?: string
          phone?: string
          salary?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          email?: string
          hire_date?: string
          id?: string
          is_active?: boolean
          name?: string
          nationality_id?: string | null
          notes?: string
          phone?: string
          salary?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "employee_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_nationality_id_fkey"
            columns: ["nationality_id"]
            isOneToOne: false
            referencedRelation: "employee_nationalities"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          description: string
          expense_date: string
          id: string
          notes: string
          payment_method: string
          updated_at: string
          voucher_number: string
        }
        Insert: {
          amount?: number
          category_id?: string | null
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          notes?: string
          payment_method?: string
          updated_at?: string
          voucher_number: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          notes?: string
          payment_method?: string
          updated_at?: string
          voucher_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          customer_id: string | null
          customer_phone: string | null
          delivery_address: string | null
          delivery_date: string | null
          driver_name: string | null
          id: string
          invoice_number: string
          items: Json
          payment_method: string
          status: string
          status_updated_at: string | null
          subtotal: number
          tax: number
          total: number
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_date?: string | null
          driver_name?: string | null
          id?: string
          invoice_number: string
          items?: Json
          payment_method?: string
          status?: string
          status_updated_at?: string | null
          subtotal?: number
          tax?: number
          total?: number
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_date?: string | null
          driver_name?: string | null
          id?: string
          invoice_number?: string
          items?: Json
          payment_method?: string
          status?: string
          status_updated_at?: string | null
          subtotal?: number
          tax?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          created_at: string
          customer_id: string
          description: string
          id: string
          invoice_id: string | null
          points: number
          transaction_type: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          description?: string
          id?: string
          invoice_id?: string | null
          points?: number
          transaction_type?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          description?: string
          id?: string
          invoice_id?: string | null
          points?: number
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          created_at: string
          description: string
          discount_type: string
          discount_value: number
          end_date: string | null
          id: string
          is_active: boolean
          name: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          discount_type?: string
          discount_value?: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          name: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          discount_type?: string
          discount_value?: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          name?: string
          start_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      packages: {
        Row: {
          created_at: string
          description: string
          discount_percent: number
          id: string
          is_active: boolean
          item_count: number
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          discount_percent?: number
          id?: string
          is_active?: boolean
          item_count?: number
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          discount_percent?: number
          id?: string
          is_active?: boolean
          item_count?: number
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string
          emoji: string
          id: string
          name: string
          price: number
          price_per_meter: number | null
          stock: number | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          emoji?: string
          id?: string
          name: string
          price?: number
          price_per_meter?: number | null
          stock?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          emoji?: string
          id?: string
          name?: string
          price?: number
          price_per_meter?: number | null
          stock?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      regions: {
        Row: {
          created_at: string
          delivery_fee: number
          estimated_time: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_fee?: number
          estimated_time?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_fee?: number
          estimated_time?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_branches: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          is_manager: boolean
          user_id: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          is_manager?: boolean
          user_id: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          is_manager?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_branches_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "employee"
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
      app_role: ["admin", "employee"],
    },
  },
} as const
