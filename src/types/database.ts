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
      activity_logs: {
        Row: ActivityLog
        Insert: Partial<ActivityLog> & Pick<ActivityLog, 'outlet_id' | 'action' | 'description'>
        Update: Partial<ActivityLog>
        Relationships: []
      }
      outlets: {
        Row: Outlet
        Insert: Partial<Outlet> & Pick<Outlet, 'name'>
        Update: Partial<Outlet>
        Relationships: []
      }
      delivery_checklists: {
        Row: DeliveryChecklist
        Insert: Partial<DeliveryChecklist> & Pick<DeliveryChecklist, 'task' | 'outlet_id'>
        Update: Partial<DeliveryChecklist>
        Relationships: []
      }
      roles: {
        Row: Role
        Insert: Partial<Role> & Pick<Role, 'id' | 'name'>
        Update: Partial<Role>
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
      customers: {
        Row: Customer
        Insert: Partial<Customer> & Pick<Customer, 'name' | 'outlet_id'>
        Update: Partial<Customer>
        Relationships: []
      }
      waste_logs: {
        Row: WasteLog
        Insert: Partial<WasteLog> & Pick<WasteLog, 'item_type' | 'item_id' | 'item_name' | 'quantity' | 'cost_per_unit' | 'total_loss' | 'reason' | 'outlet_id'>
        Update: Partial<WasteLog>
        Relationships: []
      }
      raw_materials: {
        Row: RawMaterial
        Insert: Partial<RawMaterial> & Pick<RawMaterial, 'name' | 'unit' | 'outlet_id'>
        Update: Partial<RawMaterial>
        Relationships: []
      }
      product_recipes: {
        Row: ProductRecipe
        Insert: Partial<ProductRecipe> & Pick<ProductRecipe, 'product_id' | 'material_id' | 'quantity'>
        Update: Partial<ProductRecipe>
        Relationships: []
      }
      shifts: {
        Row: Shift
        Insert: Partial<Shift> & Pick<Shift, 'outlet_id' | 'cashier_name' | 'starting_cash'>
        Update: Partial<Shift>
        Relationships: []
      }
      product_addons: {
        Row: ProductAddon
        Insert: Partial<ProductAddon> & Pick<ProductAddon, 'product_id' | 'name'>
        Update: Partial<ProductAddon>
        Relationships: []
      }
      stock_movements: {
        Row: StockMovement
        Insert: Partial<StockMovement> & Pick<StockMovement, 'product_id' | 'movement_type' | 'quantity'>
        Update: Partial<StockMovement>
        Relationships: []
      }
      discounts: {
        Row: Discount
        Insert: Partial<Discount> & Pick<Discount, 'name' | 'type' | 'value' | 'outlet_id'>
        Update: Partial<Discount>
        Relationships: []
      }
      reservations: {
        Row: Reservation
        Insert: Partial<Reservation> & Pick<Reservation, 'outlet_id' | 'customer_name' | 'reservation_date' | 'reservation_time'>
        Update: Partial<Reservation>
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
  service_charge_enabled: boolean
  service_charge_percentage: number
  total_tables: number
  is_active: boolean
  delivery_fee: number | null
  delivery_wa_template: string | null
  created_at: string
}

export type DeliveryChecklist = {
  id: string
  outlet_id: string
  task: string
  is_active: boolean
  created_at: string
}

export type Role = {
  id: string
  name: string
  permissions: string[]
}

export type User = {
  id: string
  outlet_id: string | null
  email: string
  name: string
  role: 'super_admin' | 'admin' | 'cashier' | 'chef' | 'driver' | 'customer'
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
  track_stock: boolean
  current_stock: number
  cogs: number
  created_at: string
}

export type Customer = {
  id: string
  outlet_id: string
  name: string
  phone: string | null
  points: number
  total_spent: number
  created_at: string
}

export type WasteLog = {
  id: string
  outlet_id: string
  item_type: 'product' | 'material'
  item_id: string
  item_name: string
  quantity: number
  cost_per_unit: number
  total_loss: number
  reason: string
  notes: string | null
  created_at: string
}

export type RawMaterial = {
  id: string
  outlet_id: string
  name: string
  unit: string
  cost_per_unit: number
  current_stock: number
  created_at: string
}

export type ProductRecipe = {
  id: string
  product_id: string
  material_id: string
  quantity: number
  created_at: string
  // Joined fields
  raw_material?: RawMaterial
}

export type StockMovement = {
  id: string
  product_id: string
  movement_type: 'in' | 'out' | 'adjustment'
  quantity: number
  notes: string | null
  created_at: string
  // Joined fields (optional)
  product?: Product
}

export type ProductVariant = {
  id: string
  product_id: string
  name: string
  additional_price: number
  is_available: boolean
  created_at: string
}

export type ProductAddon = {
  id: string
  product_id: string
  name: string
  price: number
  is_active: boolean
  created_at: string
}

export type Order = {
  id: string
  outlet_id: string
  shift_id: string | null
  order_number: string
  customer_id: string | null
  customer_name: string | null
  customer_phone: string | null
  cashier_id: string | null
  driver_id: string | null
  order_type: 'dine_in' | 'take_away' | 'delivery'
  table_number: number | null
  status: 'pending' | 'processing' | 'ready' | 'delivering' | 'delivered' | 'completed' | 'cancelled'
  subtotal: number
  discount_amount: number
  discount_label: string | null
  tax_percentage: number
  tax_amount: number
  service_charge_amount: number
  total: number
  payment_method: 'cash' | 'qris' | 'transfer' | 'dana' | null
  cash_received: number | null
  change_amount: number | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined fields (optional)
  order_items?: OrderItem[]
  driver?: User
}

export type Shift = {
  id: string
  outlet_id: string
  cashier_name: string
  start_time: string
  end_time: string | null
  starting_cash: number
  expected_ending_cash: number | null
  actual_ending_cash: number | null
  status: 'open' | 'closed'
  notes: string | null
  created_at: string
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
  addons: { id: string; name: string; price: number }[]
  created_at: string
}

export type ActivityLog = {
  id: string
  outlet_id: string
  user_name?: string
  action: string
  description: string
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

export type Reservation = {
  id: string
  outlet_id: string
  customer_name: string
  customer_phone: string | null
  reservation_date: string
  reservation_time: string
  party_size: number
  table_number: number | null
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  notes: string | null
  created_at: string
  updated_at: string
}
