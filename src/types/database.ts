export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number
          created_at?: string
        }
      }
      subcategories: {
        Row: {
          id: string
          category_id: string
          name: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          category_id: string
          name: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          name?: string
          sort_order?: number
          created_at?: string
        }
      }
      services: {
        Row: {
          id: string
          category_id: string
          subcategory_id: string | null
          name: string
          size_label: string | null
          active: boolean
          pricing_type: 'FIXED' | 'PER_UNIT' | 'PER_UNIT_MIN'
          unit_label: string | null
          rate: number
          min_charge: number | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          category_id: string
          subcategory_id?: string | null
          name: string
          size_label?: string | null
          active?: boolean
          pricing_type: 'FIXED' | 'PER_UNIT' | 'PER_UNIT_MIN'
          unit_label?: string | null
          rate: number
          min_charge?: number | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          subcategory_id?: string | null
          name?: string
          size_label?: string | null
          active?: boolean
          pricing_type?: 'FIXED' | 'PER_UNIT' | 'PER_UNIT_MIN'
          unit_label?: string | null
          rate?: number
          min_charge?: number | null
          sort_order?: number
          created_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          phone: string | null
          is_account: boolean
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
          is_account?: boolean
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          is_account?: boolean
          active?: boolean
          created_at?: string
        }
      }
      bills: {
        Row: {
          id: string
          bill_date: string
          token_no: number | null
          customer_id: string | null
          customer_name: string | null
          phone: string | null
          payment_method: 'cash' | 'upi' | 'account'
          total: number
          tailoring_order_id: string | null
          deleted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          bill_date: string
          token_no?: number | null
          customer_id?: string | null
          customer_name?: string | null
          phone?: string | null
          payment_method: 'cash' | 'upi' | 'account'
          total: number
          tailoring_order_id?: string | null
          deleted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          bill_date?: string
          token_no?: number | null
          customer_id?: string | null
          customer_name?: string | null
          phone?: string | null
          payment_method?: 'cash' | 'upi' | 'account'
          total?: number
          tailoring_order_id?: string | null
          deleted_at?: string | null
          created_at?: string
        }
      }
      bill_items: {
        Row: {
          id: string
          bill_id: string
          service_id: string | null
          category_id: string
          service_name: string
          pricing_type: string
          quantity: number
          unit_rate: number
          min_charge: number | null
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          bill_id: string
          service_id?: string | null
          category_id: string
          service_name: string
          pricing_type: string
          quantity: number
          unit_rate: number
          min_charge?: number | null
          amount: number
          created_at?: string
        }
        Update: {
          id?: string
          bill_id?: string
          service_id?: string | null
          category_id?: string
          service_name?: string
          pricing_type?: string
          quantity?: number
          unit_rate?: number
          min_charge?: number | null
          amount?: number
          created_at?: string
        }
      }
      account_payments: {
        Row: {
          id: string
          customer_id: string
          amount: number
          method: 'cash' | 'upi'
          paid_on: string
          note: string | null
          deleted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          amount: number
          method: 'cash' | 'upi'
          paid_on: string
          note?: string | null
          deleted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          amount?: number
          method?: 'cash' | 'upi'
          paid_on?: string
          note?: string | null
          deleted_at?: string | null
          created_at?: string
        }
      }
      tailoring_orders: {
        Row: {
          id: string
          customer_name: string
          phone: string
          received_on: string
          delivery_date: string
          status: 'received' | 'ready' | 'delivered'
          total: number
          note: string | null
          delivered_at: string | null
          customer_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_name: string
          phone: string
          received_on: string
          delivery_date: string
          status?: 'received' | 'ready' | 'delivered'
          total?: number
          note?: string | null
          delivered_at?: string | null
          customer_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_name?: string
          phone?: string
          received_on?: string
          delivery_date?: string
          status?: 'received' | 'ready' | 'delivered'
          total?: number
          note?: string | null
          delivered_at?: string | null
          customer_id?: string | null
          created_at?: string
        }
      }
      tailoring_order_items: {
        Row: {
          id: string
          order_id: string
          service_id: string | null
          service_name: string
          quantity: number
          unit_rate: number
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          service_id?: string | null
          service_name: string
          quantity: number
          unit_rate: number
          amount: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          service_id?: string | null
          service_name?: string
          quantity?: number
          unit_rate?: number
          amount?: number
          created_at?: string
        }
      }
      expense_categories: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          expense_date: string
          category_id: string
          amount: number
          method: 'cash' | 'upi'
          note: string | null
          vendor_order_id: string | null
          deleted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          expense_date: string
          category_id: string
          amount: number
          method: 'cash' | 'upi'
          note?: string | null
          vendor_order_id?: string | null
          deleted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          expense_date?: string
          category_id?: string
          amount?: number
          method?: 'cash' | 'upi'
          note?: string | null
          vendor_order_id?: string | null
          deleted_at?: string | null
          created_at?: string
        }
      }
      vendor_products: {
        Row: {
          id: string
          name: string
          unit: string | null
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          unit?: string | null
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          unit?: string | null
          active?: boolean
          created_at?: string
        }
      }
      vendor_orders: {
        Row: {
          id: string
          order_no: number
          order_date: string
          status: 'ordered' | 'delivered' | 'paid'
          quoted_amount: number | null
          delivered_on: string | null
          paid_on: string | null
          payment_method: 'cash' | 'upi' | null
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_date: string
          status?: 'ordered' | 'delivered' | 'paid'
          quoted_amount?: number | null
          delivered_on?: string | null
          paid_on?: string | null
          payment_method?: 'cash' | 'upi' | null
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_date?: string
          status?: 'ordered' | 'delivered' | 'paid'
          quoted_amount?: number | null
          delivered_on?: string | null
          paid_on?: string | null
          payment_method?: 'cash' | 'upi' | null
          note?: string | null
          created_at?: string
        }
      }
      vendor_order_items: {
        Row: {
          id: string
          order_id: string
          product_name: string
          quantity: number
          unit: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_name: string
          quantity: number
          unit?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_name?: string
          quantity?: number
          unit?: string | null
          created_at?: string
        }
      }
      settings: {
        Row: {
          id: number
          shop_name: string
          shop_address: string | null
          vendor_name: string | null
          vendor_phone: string | null
          shop_phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          shop_name?: string
          shop_address?: string | null
          vendor_name?: string | null
          vendor_phone?: string | null
          shop_phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          shop_name?: string
          shop_address?: string | null
          vendor_name?: string | null
          vendor_phone?: string | null
          shop_phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      next_token: {
        Args: { p_date: string }
        Returns: number
      }
      create_bill: {
        Args: {
          p_date: string
          p_customer_id: string | null
          p_name: string | null
          p_phone: string | null
          p_method: string
          p_items: Json
        }
        Returns: Json
      }
      update_bill: {
        Args: {
          p_bill_id: string
          p_customer_id: string | null
          p_name: string | null
          p_phone: string | null
          p_method: string
          p_items: Json
        }
        Returns: Json
      }
      soft_delete_bill: {
        Args: { p_bill_id: string }
        Returns: void
      }
      deliver_tailoring_order: {
        Args: {
          p_order_id: string
          p_method: string
          p_date: string
        }
        Returns: Json
      }
      pay_vendor_order: {
        Args: {
          p_order_id: string
          p_method: string
          p_date: string
        }
        Returns: Json
      }
      get_sales_by_category: {
        Args: { p_from: string; p_to: string }
        Returns: { category_name: string; total_sales: number }[]
      }
      get_collected: {
        Args: { p_from: string; p_to: string }
        Returns: { cash_collected: number; upi_collected: number; total_collected: number }[]
      }
      get_expenses_by_category: {
        Args: { p_from: string; p_to: string }
        Returns: { category_name: string; total_expense: number }[]
      }
      get_customer_account_balance: {
        Args: { p_customer_id: string }
        Returns: number
      }
      get_vendor_payables: {
        Args: Record<string, never>
        Returns: number
      }
    }
  }
}

