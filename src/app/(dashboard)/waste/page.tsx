"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah, formatDate } from "@/lib/utils";
import { WasteLog, Product, RawMaterial } from "@/types/database";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Search, AlertTriangle, Coffee, PackageOpen } from "lucide-react";
import { Select } from "@/components/ui/select";

export default function WastePage() {
  const [logs, setLogs] = useState<WasteLog[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClient();

  const [isOpen, setIsOpen] = useState(false);
  const [itemType, setItemType] = useState<"product" | "material">("material");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    let query = supabase.from("waste_logs").select("*").order("created_at", { ascending: false });
    
    if (searchQuery) {
      query = query.or(`item_name.ilike.%${searchQuery}%,reason.ilike.%${searchQuery}%`);
    }

    const { data } = await query;
    if (data) setLogs(data);

    const { data: prods } = await supabase.from("products").select("*").eq("track_stock", true).order("name");
    if (prods) setProducts(prods);

    const { data: mats } = await supabase.from("raw_materials").select("*").order("name");
    if (mats) setMaterials(mats);
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery]);

  const handleSave = async () => {
    if (!selectedItemId || !quantity || !reason) {
      toast.error("Pilih barang, jumlah, dan alasan wajib diisi");
      return;
    }
    
    setIsSubmitting(true);
    let itemName = "";
    let costPerUnit = 0;
    let currentStock = 0;

    if (itemType === "material") {
      const mat = materials.find(m => m.id === selectedItemId);
      if (mat) {
        itemName = mat.name;
        costPerUnit = mat.cost_per_unit || 0;
        currentStock = mat.current_stock || 0;
      }
    } else {
      const prod = products.find(p => p.id === selectedItemId);
      if (prod) {
        itemName = prod.name;
        costPerUnit = prod.cogs || 0;
        currentStock = prod.current_stock || 0;
      }
    }

    const qtyNumber = Number(quantity);
    if (qtyNumber <= 0) {
      toast.error("Jumlah tidak valid");
      setIsSubmitting(false);
      return;
    }

    const totalLoss = qtyNumber * costPerUnit;

    const payload = {
      outlet_id: "00000000-0000-0000-0000-000000000001",
      item_type: itemType,
      item_id: selectedItemId,
      item_name: itemName,
      quantity: qtyNumber,
      cost_per_unit: costPerUnit,
      total_loss: totalLoss,
      reason,
      notes: notes || null
    };

    const { data, error } = await supabase.from("waste_logs").insert(payload);

    if (error) {
      toast.error("Gagal mencatat bahan terbuang");
    } else {
      // DEDUCT STOCK
      const newStock = currentStock - qtyNumber;
      if (itemType === "material") {
        await supabase.from("raw_materials").update({ current_stock: newStock }).eq("id", selectedItemId);
      } else {
        await supabase.from("products").update({ current_stock: newStock }).eq("id", selectedItemId);
        await supabase.from("stock_movements").insert({
          product_id: selectedItemId,
          movement_type: "out",
          quantity: qtyNumber,
          notes: `Waste/Spoilage: ${reason}`
        });
      }

      toast.success("Catatan berhasil disimpan dan stok dikurangi");
      setIsOpen(false);
      fetchData();
      
      // Reset form
      setSelectedItemId("");
      setQuantity("");
      setReason("");
      setNotes("");
    }
    setIsSubmitting(false);
  };

  const totalLossValue = logs.reduce((sum, log) => sum + Number(log.total_loss), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-8 h-8" /> Waste & Spoilage
          </h1>
          <p className="text-muted-foreground mt-1">
            Catat bahan mentah basi atau produk rusak untuk melacak kerugian HPP (Shrinkage).
          </p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" onClick={() => { setSelectedItemId(""); setQuantity(""); setReason(""); }}>
              <Plus className="w-4 h-4 mr-2" /> Catat Barang Terbuang
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Catat Bahan Terbuang</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Jenis Barang</label>
                <Select value={itemType} onChange={(e: any) => { setItemType(e.target.value); setSelectedItemId(""); }}>
                  <option value="material">Bahan Baku (Mentah)</option>
                  <option value="product">Produk Jadi (Makanan/Minuman)</option>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Pilih {itemType === "material" ? "Bahan Baku" : "Produk"}</label>
                <Select value={selectedItemId} onChange={(e: any) => setSelectedItemId(e.target.value)}>
                  <option value="">-- Pilih --</option>
                  {itemType === "material" 
                    ? materials.map(m => <option key={m.id} value={m.id}>{m.name} (Sisa: {m.current_stock} {m.unit})</option>)
                    : products.map(p => <option key={p.id} value={p.id}>{p.name} (Sisa: {p.current_stock})</option>)
                  }
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Jumlah Dibuang</label>
                <Input type="number" min="0.1" step="0.1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Contoh: 1.5" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Alasan Dibuang</label>
                <Select value={reason} onChange={(e: any) => setReason(e.target.value)}>
                  <option value="">-- Pilih Alasan --</option>
                  <option value="Kadaluarsa / Basi">Kadaluarsa / Basi</option>
                  <option value="Tumpah / Jatuh">Tumpah / Jatuh</option>
                  <option value="Rusak / Gosong">Rusak / Gosong</option>
                  <option value="Kualitas Buruk (Ditolak)">Kualitas Buruk (Ditolak)</option>
                  <option value="Lainnya">Lainnya...</option>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Catatan Tambahan (Opsional)</label>
                <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Contoh: Jatuh tersenggol karyawan" />
              </div>

            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
              <Button variant="destructive" onClick={handleSave} disabled={isSubmitting || !selectedItemId || !quantity || !reason}>
                {isSubmitting ? "Menyimpan..." : "Simpan Data"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-lg p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div>
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">Total Akumulasi Kerugian (Waste Cost)</p>
          <h3 className="text-3xl font-bold text-red-700 dark:text-red-500 mt-1">{formatRupiah(totalLossValue)}</h3>
        </div>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b flex items-center gap-2">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Cari catatan terbuang..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-none shadow-none focus-visible:ring-0 max-w-md p-0"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b">
              <tr>
                <th className="px-4 py-3 font-medium">Waktu</th>
                <th className="px-4 py-3 font-medium">Tipe</th>
                <th className="px-4 py-3 font-medium">Nama Barang</th>
                <th className="px-4 py-3 font-medium text-right">Jumlah</th>
                <th className="px-4 py-3 font-medium text-right">Kerugian (Rp)</th>
                <th className="px-4 py-3 font-medium">Alasan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Belum ada catatan bahan terbuang.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(log.created_at)}</td>
                    <td className="px-4 py-3">
                      {log.item_type === 'material' ? (
                        <span className="flex items-center text-amber-600 bg-amber-50 px-2 py-1 rounded-md text-xs w-fit"><Coffee className="w-3 h-3 mr-1"/> Bahan Baku</span>
                      ) : (
                        <span className="flex items-center text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-xs w-fit"><PackageOpen className="w-3 h-3 mr-1"/> Produk</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {log.item_name}
                      {log.notes && <div className="text-[10px] text-muted-foreground font-normal mt-1 opacity-70">Catatan: {log.notes}</div>}
                    </td>
                    <td className="px-4 py-3 text-right font-bold">{log.quantity}</td>
                    <td className="px-4 py-3 text-right text-red-600 font-medium">{formatRupiah(log.total_loss)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-1 bg-muted rounded-md">{log.reason}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
