"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah, cn } from "@/lib/utils";
import { Product, StockMovement } from "@/types/database";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Minus, FileText, ArrowDownToLine, ArrowUpFromLine, RefreshCcw } from "lucide-react";

export default function StokPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const supabase = createClient();

  // Stock update modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [movementType, setMovementType] = useState<"in" | "out" | "adjustment">("in");
  const [quantity, setQuantity] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    // Only fetch products that have track_stock enabled
    const { data: p } = await supabase
      .from("products")
      .select("*, category:categories(name)")
      .eq("track_stock", true)
      .order("name");
    
    if (p) setProducts(p);

    const { data: m } = await supabase
      .from("stock_movements")
      .select("*, product:products(name)")
      .order("created_at", { ascending: false })
      .limit(50);
      
    if (m) setMovements(m as any[]);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openStockModal = (product: Product, type: "in" | "out" | "adjustment") => {
    setSelectedProduct(product);
    setMovementType(type);
    setQuantity("");
    
    if (type === "adjustment") {
      setQuantity(product.current_stock.toString());
      setNotes("Penyesuaian stok (Opname)");
    } else if (type === "in") {
      setNotes("Restock barang masuk");
    } else {
      setNotes("Barang keluar / rusak");
    }
    
    setIsModalOpen(true);
  };

  const handleUpdateStock = async () => {
    if (!selectedProduct) return;
    
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 0) {
      toast.error("Jumlah tidak valid");
      return;
    }

    setIsSubmitting(true);
    let newStock = selectedProduct.current_stock;
    let movementQty = qty;

    if (movementType === "in") {
      newStock += qty;
    } else if (movementType === "out") {
      newStock -= qty;
    } else if (movementType === "adjustment") {
      movementQty = Math.abs(qty - selectedProduct.current_stock);
      // Determine real movement type based on diff
      const realType = qty > selectedProduct.current_stock ? "in" : (qty < selectedProduct.current_stock ? "out" : "adjustment");
      newStock = qty;
      
      // If no change in adjustment
      if (movementQty === 0) {
        setIsModalOpen(false);
        setIsSubmitting(false);
        return;
      }
    }

    // 1. Update product stock
    const { error: pError } = await supabase
      .from("products")
      .update({ current_stock: newStock })
      .eq("id", selectedProduct.id);

    if (pError) {
      toast.error("Gagal mengupdate stok produk");
      setIsSubmitting(false);
      return;
    }

    // 2. Log movement
    const actualMovementType = movementType === "adjustment" 
      ? (qty > selectedProduct.current_stock ? "in" : "out")
      : movementType;

    const { error: mError } = await supabase
      .from("stock_movements")
      .insert({
        product_id: selectedProduct.id,
        movement_type: actualMovementType,
        quantity: movementQty,
        notes: notes
      });

    if (mError) {
      toast.error("Stok terupdate tapi gagal mencatat riwayat");
    } else {
      toast.success("Stok berhasil diperbarui");
    }

    setIsModalOpen(false);
    setIsSubmitting(false);
    fetchData();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manajemen Stok</h1>
        <p className="text-muted-foreground mt-1">
          Pantau persediaan barang dan catat barang masuk/keluar. (Hanya menampilkan produk dengan fitur Lacak Stok diaktifkan).
        </p>
      </div>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="inventory">Daftar Stok</TabsTrigger>
          <TabsTrigger value="history">Riwayat Pergerakan</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium">Nama Produk</th>
                    <th className="px-4 py-3 font-medium">Kategori</th>
                    <th className="px-4 py-3 font-medium text-center">Stok Saat Ini</th>
                    <th className="px-4 py-3 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        Belum ada produk yang dilacak stoknya. Aktifkan fitur "Lacak Stok" di menu Manajemen Menu.
                      </td>
                    </tr>
                  ) : (
                    products.map(p => (
                      <tr key={p.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-muted rounded overflow-hidden shrink-0 flex items-center justify-center">
                              {p.image_url ? (
                                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="bg-primary/10 text-primary w-full h-full flex items-center justify-center font-bold text-xs">
                                  {p.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            {p.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{(p as any).category?.name || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            "inline-flex items-center justify-center px-2.5 py-0.5 rounded-full font-bold",
                            p.current_stock > 10 ? "bg-emerald-100 text-emerald-800" : 
                            p.current_stock > 0 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                          )}>
                            {p.current_stock}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" className="h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700" onClick={() => openStockModal(p, "in")}>
                              <ArrowDownToLine className="w-3 h-3 mr-1" /> Masuk
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" onClick={() => openStockModal(p, "out")}>
                              <ArrowUpFromLine className="w-3 h-3 mr-1" /> Keluar
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openStockModal(p, "adjustment")} title="Penyesuaian (Opname)">
                              <RefreshCcw className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium">Waktu</th>
                    <th className="px-4 py-3 font-medium">Produk</th>
                    <th className="px-4 py-3 font-medium">Tipe</th>
                    <th className="px-4 py-3 font-medium text-center">Jumlah</th>
                    <th className="px-4 py-3 font-medium">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        Belum ada riwayat pergerakan stok.
                      </td>
                    </tr>
                  ) : (
                    movements.map(m => (
                      <tr key={m.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {new Date(m.created_at).toLocaleString('id-ID', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td className="px-4 py-3 font-medium">{(m as any).product?.name || '-'}</td>
                        <td className="px-4 py-3">
                          {m.movement_type === 'in' ? (
                            <span className="text-emerald-600 flex items-center text-xs font-medium"><ArrowDownToLine className="w-3 h-3 mr-1"/> Masuk</span>
                          ) : m.movement_type === 'out' ? (
                            <span className="text-red-600 flex items-center text-xs font-medium"><ArrowUpFromLine className="w-3 h-3 mr-1"/> Keluar</span>
                          ) : (
                            <span className="text-blue-600 flex items-center text-xs font-medium"><RefreshCcw className="w-3 h-3 mr-1"/> Opname</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-bold">
                          {m.movement_type === 'in' ? '+' : '-'}{m.quantity}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{m.notes || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {movementType === "in" ? "Barang Masuk" : movementType === "out" ? "Barang Keluar" : "Penyesuaian Stok"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted p-3 rounded-md flex justify-between items-center">
              <span className="font-medium text-sm">{selectedProduct?.name}</span>
              <span className="text-xs text-muted-foreground">Stok saat ini: <strong className="text-foreground text-sm">{selectedProduct?.current_stock}</strong></span>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {movementType === "adjustment" ? "Stok Aktual (Hasil Opname)" : "Jumlah"}
              </label>
              <Input 
                type="number" 
                value={quantity} 
                onChange={(e) => setQuantity(e.target.value)} 
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Catatan (Opsional)</label>
              <Input 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="Misal: Restock dari supplier A"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button onClick={handleUpdateStock} disabled={isSubmitting || !quantity}>
              {isSubmitting ? "Menyimpan..." : "Simpan Stok"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
