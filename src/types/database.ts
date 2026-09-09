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
      outlets: {
        Row: Outlet
        Insert: Partial<Outlet> & Pick<Outlet, 'name'>
        Update: Partial<Outlet>
        Relationships: []
      }
      users: {
        Row: User
        Insert: Partial<User> & Pick<User, 'id' | 'email' | 'name' | 'role'>
        Update: Partial<User>
        Relationships: []
      }
      categories: {
        Row: Category
        Insert: Partial<Category> & Pick<Category, 'name' | 'outlet_id'>
        Update: Partial<Category>
        Relationships: []
      }
      products: {
        Row: Product
        Insert: Partial<Product> & Pick<Product, 'name' | 'price' | 'category_id' | 'outlet_id'>
        Update: Partial<Product>
        Relationships: []
      }
      product_variants: {
        Row: ProductVariant
        Insert: Partial<ProductVariant> & Pick<ProductVariant, 'product_id' | 'name'>
        Update: Partial<ProductVariant>
        Relationships: []
      }
      orders: {
        Row: Order
        Insert: Partial<Order> & Pick<Order, 'order_number' | 'outlet_id' | 'order_type'>
        Update: Partial<Order>
        Relationships: []
      }
      order_items: {
        Row: OrderItem
        Insert: Partial<OrderItem> & Pick<OrderItem, 'order_id' | 'product_id' | 'product_name' | 'quantity' | 'unit_price' | 'subtotal'>
        Update: Partial<OrderItem>
        Relationships: []
      }
      discounts: {
        Row: Discount
        Insert: Partial<Discount> & Pick<Discount, 'name' | 'type' | 'value' | 'outlet_id'>
        Update: Partial<Discount>
        Relationships: []
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

// ==========================================
// Convenience type aliases
// ==========================================

export type Outlet = {
  id: string
  name: string
  address: string | null
  phone: string | null
  logo_url: string | null
  tax_enabled: boolean
  tax_percentage: number
  total_tables: number
  is_active: boolean
  created_at: string
}

export type User = {
  id: string
  outlet_id: string | null
  email: string
  name: string
  role: 'super_admin' | 'admin' | 'cashier' | 'customer'
  is_member: boolean
  member_discount: number
  is_active: boolean
  created_at: string
}

export type Category = {
  id: string
  outlet_id: string
  name: string
  icon: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export type Product = {
  id: string
  outlet_id: string
  category_id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_available: boolean
  created_at: string
}

export type ProductVariant = {
  id: string
  product_id: string
  name: string
  additional_price: number
  is_available: boolean
  created_at: string
}

export type Order = {
  id: string
  outlet_id: string
  order_number: string
  customer_id: string | null
  customer_name: string | null
  cashier_id: string | null
  order_type: 'dine_in' | 'take_away'
  table_number: number | null
  status: 'pending' | 'processing' | 'ready' | 'completed' | 'cancelled'
  subtotal: number
  discount_amount: number
  discount_label: string | null
  tax_percentage: number
  tax_amount: number
  total: number
  payment_method: 'cash' | 'qris' | null
  cash_received: number | null
  change_amount: number | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined fields (optional)
  order_items?: OrderItem[]
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string
  variant_id: string | null
  product_name: string
  variant_name: string | null
  quantity: number
  unit_price: number
  subtotal: number
  notes: string | null
  created_at: string
}

export type Discount = {
  id: string
  outlet_id: string
  name: string
  type: 'percentage' | 'fixed'
  value: number
  min_purchase: number
  is_member_only: boolean
  is_active: boolean
  valid_from: string | null
  valid_until: string | null
  created_at: string
}
