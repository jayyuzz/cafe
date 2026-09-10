"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah, formatDate } from "@/lib/utils";
import { Order, OrderItem } from "@/types/database";

export default function StrukPage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!id) return;
    const fetchOrder = async () => {
      const { data: orderData } = await supabase.from("orders").select("*").eq("id", id).single();
      const { data: itemsData } = await supabase.from("order_items").select("*").eq("order_id", id);
      
      if (orderData) setOrder(orderData);
      if (itemsData) setItems(itemsData);
      setLoading(false);
      
      if (orderData) {
        setTimeout(() => {
          window.print();
        }, 500);
      }
    };
    fetchOrder();
  }, [id, supabase]);

  if (loading) return <div className="p-4 text-center">Memuat struk...</div>;
  if (!order) return <div className="p-4 text-center">Pesanan tidak ditemukan.</div>;

  return (
    <div className="bg-white text-black p-4 text-[12px] font-mono leading-tight max-w-[80mm] mx-auto print:p-0 print:m-0">
      <div className="text-center mb-4">
        <h1 className="font-bold text-lg mb-1">MVE COFFEE</h1>
        <p className="text-[10px]">Kotamobagu, Sulawesi Utara</p>
      </div>

      <div className="border-b border-dashed border-black pb-2 mb-2">
        <div className="flex justify-between">
          <span>No: {order.order_number}</span>
          <span>{formatDate(order.created_at)}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>Kasir: Admin</span>
          <span>Pelanggan: {order.customer_name}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>Tipe: {order.order_type === 'dine_in' ? `Makan Sini (Meja ${order.table_number})` : 'Bawa Pulang'}</span>
        </div>
      </div>

      <div className="border-b border-dashed border-black pb-2 mb-2">
        {items.map((item) => (
          <div key={item.id} className="mb-1">
            <div className="font-bold">{item.product_name} {item.variant_name ? `(${item.variant_name})` : ''}</div>
            <div className="flex justify-between pl-2">
              <span>{item.quantity} x {formatRupiah(item.unit_price)}</span>
              <span>{formatRupiah(item.subtotal)}</span>
            </div>
            {item.notes && <div className="pl-2 text-[10px] italic">Catatan: {item.notes}</div>}
          </div>
        ))}
      </div>

      <div className="border-b border-dashed border-black pb-2 mb-2">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatRupiah(order.subtotal)}</span>
        </div>
        {order.tax_amount > 0 && (
          <div className="flex justify-between mt-1">
            <span>PB1 ({order.tax_percentage}%)</span>
            <span>{formatRupiah(order.tax_amount)}</span>
          </div>
        )}
        <div className="flex justify-between mt-1 font-bold text-sm">
          <span>TOTAL</span>
          <span>{formatRupiah(order.total)}</span>
        </div>
      </div>

      <div className="border-b border-dashed border-black pb-2 mb-2">
        <div className="flex justify-between">
          <span>Metode Pembayaran</span>
          <span className="uppercase">{order.payment_method}</span>
        </div>
        {order.payment_method === 'cash' && (
          <>
            <div className="flex justify-between mt-1">
              <span>Tunai</span>
              <span>{formatRupiah(order.cash_received || 0)}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Kembali</span>
              <span>{formatRupiah(order.change_amount || 0)}</span>
            </div>
          </>
        )}
      </div>

      <div className="text-center mt-4">
        <p className="font-bold">TERIMA KASIH</p>
        <p className="text-[10px] mt-1">Powered by Paylabs</p>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .max-w-\\[80mm\\], .max-w-\\[80mm\\] * {
            visibility: visible;
          }
          .max-w-\\[80mm\\] {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            margin: 0;
          }
        }
      `}} />
    </div>
  );
}
