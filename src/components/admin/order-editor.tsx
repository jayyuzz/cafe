"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah, cn } from "@/lib/utils";
import { Order, OrderItem, Product, ProductVariant } from "@/types/database";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Minus } from "lucide-react";
import { TAX_PERCENTAGE } from "@/lib/constants";
import { logActivity } from "@/lib/log-activity";

interface EditorItem {
  id?: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  unit_price: number;
  notes?: string;
  product_name: string;
  variant_name?: string;
}

export function OrderEditor({ order, isOpen, onClose, onSaved }: { order: any, isOpen: boolean, onClose: () => void, onSaved: () => void }) {
  const [customerName, setCustomerName] = useState("");
  const [status, setStatus] = useState<"pending" | "processing" | "ready" | "completed" | "cancelled">("pending");
  const [items, setItems] = useState<EditorItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (order && isOpen) {
      setCustomerName(order.customer_name || "");
      setStatus(order.status as any);
      setItems(order.order_items.map((i: any) => ({
        id: i.id,
        product_id: i.product_id,
        variant_id: i.variant_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
        notes: i.notes,
        product_name: i.product?.name || i.product_name || "Unknown",
        variant_name: i.variant_id ? "Variant" : undefined, // Simplify for now
      })));
    }
  }, [order, isOpen]);

  useEffect(() => {
    if (isOpen && products.length === 0) {
      supabase.from("products").select("*, product_variants(*)").eq("is_available", true).then(({ data }) => {
        if (data) setProducts(data);
      });
    }
  }, [isOpen, supabase, products.length]);

  const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const discount = order?.discount_amount || 0;
  const tax = order?.tax_amount ? (subtotal - discount) * (TAX_PERCENTAGE / 100) : 0;
  const total = subtotal - discount + tax;

  const updateQuantity = (index: number, delta: number) => {
    setItems(prev => {
      const newItems = [...prev];
      const newQty = newItems[index].quantity + delta;
      if (newQty <= 0) return newItems;
      newItems[index] = { ...newItems[index], quantity: newQty };
      return newItems;
    });
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const addItem = (prod: Product) => {
    setItems([...items, {
      product_id: prod.id,
      quantity: 1,
      unit_price: prod.price,
      product_name: prod.name,
    }]);
  };

  const addProduct = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prodId = e.target.value;
    if (!prodId) return;
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;

    // For simplicity in MVP admin editor, if product has variants, we just pick the first one or no variant
    // A full variant selector would require a secondary modal. Let's just add without variant for now, or prompt.
    addItem(prod);
    e.target.value = ""; // reset
  };

  const handleSave = async () => {
    if (items.length === 0) {
      toast.error("Pesanan tidak boleh kosong!");
      return;
    }
    setIsSaving(true);

    try {
      // 1. Delete all old items
      await supabase.from("order_items").delete().eq("order_id", order.id);

      // 2. Insert new items
      const newOrderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        variant_id: item.variant_id || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.unit_price * item.quantity,
        notes: item.notes || null,
      }));
      await supabase.from("order_items").insert(newOrderItems);

      // 3. Update order totals & info
      await supabase.from("orders").update({
        customer_name: customerName,
        status,
        subtotal,
        tax_amount: tax,
        total,
      }).eq("id", order.id);

      toast.success("Pesanan berhasil diperbarui");
      logActivity("EDIT_ORDER", `Pesanan ${order.order_number} dimodifikasi oleh Admin. Total baru: ${formatRupiah(total)}`);
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan saat menyimpan");
    } finally {
      setIsSaving(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>Edit Pesanan: {order.order_number}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/10">
          
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Nama Pelanggan</label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Status</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="pending">Menunggu</option>
                <option value="processing">Diproses</option>
                <option value="ready">Siap</option>
                <option value="completed">Selesai</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>
          </div>

          {/* Add Item */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Tambah Menu ke Pesanan</label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              onChange={addProduct}
              defaultValue=""
            >
              <option value="" disabled>-- Pilih Menu --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({formatRupiah(p.price)})</option>
              ))}
            </select>
          </div>

          {/* Items List */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-muted-foreground">Daftar Menu ({items.length})</label>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-background rounded-md border shadow-sm">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{item.product_name}</h4>
                    <p className="text-xs font-bold text-primary">{formatRupiah(item.unit_price)}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(index, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(index, 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="w-24 text-right font-bold text-sm shrink-0">
                    {formatRupiah(item.unit_price * item.quantity)}
                  </div>

                  <Button variant="ghost" size="icon" className="text-red-500 shrink-0 h-8 w-8" onClick={() => removeItem(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="p-6 border-t bg-background">
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatRupiah(subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Pajak (10%)</span><span>{formatRupiah(tax)}</span></div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Total Akhir</span><span className="text-primary">{formatRupiah(total)}</span></div>
          </div>

          <div className="flex gap-3 justify-end">
            <DialogClose>
              <Button variant="outline" type="button">Batal</Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
