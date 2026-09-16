"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah, formatDate } from "@/lib/utils";
import { RawMaterial, RawMaterialMovement } from "@/types/database";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Calculator, History, ArrowDownToLine, ArrowUpFromLine, RefreshCcw } from "lucide-react";

export default function BahanBakuPage() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const supabase = createClient();

  const [isOpen, setIsOpen] = useState(false);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [cost, setCost] = useState("");
  const [stock, setStock] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showCalc, setShowCalc] = useState(false);
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkQty, setBulkQty] = useState("");

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyMaterial, setHistoryMaterial] = useState<RawMaterial | null>(null);
  const [historyLogs, setHistoryLogs] = useState<RawMaterialMovement[]>([]);

  const openHistory = async (m: RawMaterial) => {
    setHistoryMaterial(m);
    setHistoryOpen(true);
    setHistoryLogs([]);
    const { data } = await supabase
      .from("raw_material_movements")
      .select("*")
      .eq("material_id", m.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setHistoryLogs(data);
  };

  useEffect(() => {
    if (showCalc && bulkPrice && bulkQty) {
      const p = parseFloat(bulkPrice) || 0;
      const q = parseFloat(bulkQty) || 0;
      if (q > 0) setCost(Math.round(p / q).toString());
    }
  }, [showCalc, bulkPrice, bulkQty]);

  const fetchData = async () => {
    const { data } = await supabase.from("raw_materials").select("*").order("name");
    if (data) setMaterials(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!name || !unit) {
      toast.error("Nama dan satuan harus diisi");
      return;
    }
    
    setIsSubmitting(true);
    const payload = {
      name,
      unit,
      cost_per_unit: Number(cost) || 0,
      current_stock: Number(stock) || 0,
      outlet_id: "00000000-0000-0000-0000-000000000001"
    };

    const res = id 
      ? await supabase.from("raw_materials").update(payload).eq("id", id)
      : await supabase.from("raw_materials").insert(payload);

    if (res.error) {
      toast.error("Gagal menyimpan bahan baku");
    } else {
      toast.success("Bahan baku berhasil disimpan");
      
      // Jika update, hitung ulang COGS untuk produk yang menggunakan bahan baku ini
      if (id) {
        const { data: affected } = await supabase.from("product_recipes").select("product_id").eq("material_id", id);
        if (affected && affected.length > 0) {
          const productIds = Array.from(new Set(affected.map(a => a.product_id)));
          for (const pId of productIds) {
            const { data: recipes } = await supabase.from("product_recipes").select("quantity, raw_material:raw_materials(cost_per_unit)").eq("product_id", pId);
            if (recipes) {
              const totalCogs = recipes.reduce((sum, item: any) => sum + (item.quantity * (item.raw_material?.cost_per_unit || 0)), 0);
              await supabase.from("products").update({ cogs: totalCogs }).eq("id", pId);
            }
          }
        }
      }

      setIsOpen(false);
      fetchData();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (deleteId: string) => {
    if (!confirm("Yakin ingin menghapus bahan baku ini?")) return;
    const { error } = await supabase.from("raw_materials").delete().eq("id", deleteId);
    if (error) toast.error("Gagal menghapus bahan baku");
    else {
      toast.success("Bahan baku dihapus");
      fetchData();
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bahan Baku</h1>
          <p className="text-muted-foreground mt-1">
            Kelola inventaris bahan baku dasar untuk resep menu.
          </p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setId(""); setName(""); setUnit(""); setCost(""); setStock(""); setShowCalc(false); setBulkPrice(""); setBulkQty("");
            }}>
              <Plus className="w-4 h-4 mr-2" /> Tambah Bahan Baku
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{id ? "Edit Bahan Baku" : "Tambah Bahan Baku"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama Bahan Baku</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Biji Kopi Arabica" autoFocus />
              </div>

              {/* Kalkulator Konversi */}
              <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 space-y-3">
                <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setShowCalc(!showCalc)}>
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">Kalkulator Konversi Otomatis</span>
                  </div>
                  <div className="text-xs text-primary font-medium">{showCalc ? "Tutup" : "Buka"}</div>
                </div>
                
                {showCalc && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-primary/10">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Harga Beli Kemasan (Rp)</label>
                      <Input type="number" value={bulkPrice} onChange={e => setBulkPrice(e.target.value)} placeholder="Contoh: 225000" className="h-8 text-sm bg-background" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Isi per Kemasan (g/ml)</label>
                      <Input type="number" value={bulkQty} onChange={e => {
                        setBulkQty(e.target.value);
                        if (!stock || stock === "0") setStock(e.target.value);
                      }} placeholder="Contoh: 1000" className="h-8 text-sm bg-background" />
                    </div>
                    <div className="col-span-2 text-xs text-muted-foreground leading-tight">
                      Masukkan harga beli dan total isi (misal 1 kg = 1000 gram). Sistem akan otomatis menghitung Harga Modal per gram dan mengisi Stok Awal.
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Satuan (Unit)</label>
                  <select 
                    value={unit} 
                    onChange={e => setUnit(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="" disabled>Pilih Satuan...</option>
                    <option value="gram">gram (g)</option>
                    <option value="kg">kilogram (kg)</option>
                    <option value="ml">mililiter (ml)</option>
                    <option value="liter">liter (L)</option>
                    <option value="pcs">pieces (pcs)</option>
                    <option value="porsi">porsi</option>
                    <option value="botol">botol</option>
                    <option value="kaleng">kaleng</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Harga Modal per {unit || 'Satuan'}</label>
                  <Input type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="Contoh: 150" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Stok Awal</label>
                <Input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="Contoh: 1000" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
              <Button onClick={handleSave} disabled={isSubmitting || !name || !unit}>
                {isSubmitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b">
              <tr>
                <th className="px-4 py-3 font-medium">Nama Bahan Baku</th>
                <th className="px-4 py-3 font-medium text-right">Harga Modal (COGS)</th>
                <th className="px-4 py-3 font-medium text-right">Stok Aktual</th>
                <th className="px-4 py-3 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {materials.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    Belum ada data bahan baku.
                  </td>
                </tr>
              ) : (
                materials.map(m => (
                  <tr key={m.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{m.name}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-medium text-primary">{formatRupiah(m.cost_per_unit)}</span> <span className="text-muted-foreground text-xs">/ {m.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold">{m.current_stock}</span> <span className="text-muted-foreground text-xs">{m.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="icon" title="Kartu Stok" onClick={() => openHistory(m)}>
                          <History className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => {
                          setId(m.id); setName(m.name); setUnit(m.unit); 
                          setCost(m.cost_per_unit.toString()); setStock(m.current_stock.toString());
                          setShowCalc(false); setBulkPrice(""); setBulkQty("");
                          setIsOpen(true);
                        }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(m.id)}>
                          <Trash2 className="w-4 h-4" />
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

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Kartu Stok: {historyMaterial?.name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto mt-4">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b sticky top-0">
                <tr>
                  <th className="px-4 py-3 font-medium">Waktu</th>
                  <th className="px-4 py-3 font-medium">Jenis</th>
                  <th className="px-4 py-3 font-medium text-right">Perubahan</th>
                  <th className="px-4 py-3 font-medium">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {historyLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Belum ada riwayat pergerakan stok.</td>
                  </tr>
                ) : (
                  historyLogs.map(log => (
                    <tr key={log.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(log.created_at)}</td>
                      <td className="px-4 py-3">
                        {log.movement_type === 'in' && <span className="inline-flex items-center text-green-600"><ArrowDownToLine className="w-3 h-3 mr-1"/> Masuk</span>}
                        {log.movement_type === 'out' && <span className="inline-flex items-center text-red-600"><ArrowUpFromLine className="w-3 h-3 mr-1"/> Keluar</span>}
                        {log.movement_type === 'adjustment' && <span className="inline-flex items-center text-orange-600"><RefreshCcw className="w-3 h-3 mr-1"/> Penyesuaian</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        <span className={log.movement_type === 'in' ? 'text-green-600' : (log.movement_type === 'out' ? 'text-red-600' : 'text-orange-600')}>
                          {log.movement_type === 'in' ? '+' : (log.movement_type === 'out' ? '-' : '')}{log.quantity} {historyMaterial?.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{log.notes || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button onClick={() => setHistoryOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}




