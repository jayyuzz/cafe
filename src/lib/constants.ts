export const APP_NAME = "MVE"
export const TAX_PERCENTAGE = 10
export const MAX_TABLES = 20

export const ORDER_STATUSES = {
  PENDING: { label: "Menunggu", color: "bg-yellow-100 text-yellow-800" },
  PROCESSING: { label: "Diproses", color: "bg-blue-100 text-blue-800" },
  COMPLETED: { label: "Selesai", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Dibatalkan", color: "bg-red-100 text-red-800" },
} as const

export const ORDER_TYPES = {
  DINE_IN: { label: "Makan di Tempat" },
  TAKEAWAY: { label: "Bawa Pulang" },
  DELIVERY: { label: "Pesan Antar" },
} as const

export const PAYMENT_METHODS = {
  CASH: { label: "Tunai" },
  QRIS: { label: "QRIS" },
  CARD: { label: "Kartu Debit/Kredit" },
} as const

export const ROLES = {
  ADMIN: { label: "Admin" },
  CASHIER: { label: "Kasir" },
  KITCHEN: { label: "Dapur" },
} as const
