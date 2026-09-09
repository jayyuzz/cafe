import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import { id } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace(/IDR/g, "Rp").trim();
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), "d MMM yyyy, HH:mm", { locale: id })
}

export function generateOrderNumber(count: number): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const sequence = String(count).padStart(3, "0")
  return `YND-${year}${month}${day}-${sequence}`
}
