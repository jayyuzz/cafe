"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah } from "@/lib/utils";
import { RawMaterial } from "@/types/database";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2 } from "lucide-react";

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
              setId(""); setName(""); setUnit(""); setCost(""); setStock("");
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Satuan (Unit)</label>
                  <Input value={unit} onChange={e => setUnit(e.target.value)} placeholder="Contoh: gram, ml, pcs" />
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
                        <Button variant="ghost" size="icon" onClick={() => {
                          setId(m.id); setName(m.name); setUnit(m.unit); 
                          setCost(m.cost_per_unit.toString()); setStock(m.current_stock.toString());
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
    </div>
  );
}
