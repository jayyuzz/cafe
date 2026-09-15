import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus, GripVertical } from "lucide-react";
import { ProductVariant, ProductAddon } from "@/types/database";
import { formatRupiah } from "@/lib/utils";

export function ProductOptionsEditor({ product, isOpen, onClose }: { product: any, isOpen: boolean, onClose: () => void }) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [addons, setAddons] = useState<ProductAddon[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (isOpen && product) {
      fetchData();
    }
  }, [isOpen, product]);

  const fetchData = async () => {
    const { data: v } = await supabase.from("product_variants").select("*").eq("product_id", product.id).order("created_at");
    if (v) setVariants(v);
    
    const { data: a } = await supabase.from("product_addons").select("*").eq("product_id", product.id).order("created_at");
    if (a) setAddons(a);
  };

  const addVariant = async () => {
    const name = window.prompt("Nama Varian (contoh: Large, Less Sugar)");
    if (!name) return;
    const price = parseInt(window.prompt("Tambahan Harga (contoh: 5000, isi 0 jika gratis)") || "0");
    
    const { error } = await supabase.from("product_variants").insert({
      product_id: product.id,
      name,
      additional_price: price || 0,
      is_available: true
    });
    if (error) toast.error("Gagal menambah varian");
    else { toast.success("Varian ditambahkan"); fetchData(); }
  };

  const deleteVariant = async (id: string) => {
    if (!confirm("Hapus varian ini?")) return;
    await supabase.from("product_variants").delete().eq("id", id);
    fetchData();
  };

  const addAddon = async () => {
    const name = window.prompt("Nama Add-on/Topping (contoh: Extra Shot Espresso)");
    if (!name) return;
    const price = parseInt(window.prompt("Tambahan Harga (contoh: 5000, isi 0 jika gratis)") || "0");
    
    const { error } = await supabase.from("product_addons").insert({
      product_id: product.id,
      name,
      price: price || 0,
      is_active: true
    });
    if (error) toast.error("Gagal menambah add-on");
    else { toast.success("Add-on ditambahkan"); fetchData(); }
  };

  const deleteAddon = async (id: string) => {
    if (!confirm("Hapus add-on ini?")) return;
    await supabase.from("product_addons").delete().eq("id", id);
    fetchData();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Varian & Add-on: {product?.name}</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 py-4">
          {/* Variants Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Pilihan Varian</h3>
              <Button size="sm" onClick={addVariant}><Plus className="w-4 h-4 mr-1" /> Tambah</Button>
            </div>
            <p className="text-xs text-muted-foreground">Varian adalah opsi wajib pilih tunggal (misal: Ukuran, Level Pedas).</p>
            
            <div className="space-y-2">
              {variants.map(v => (
                <div key={v.id} className="flex items-center justify-between p-2 border rounded-md">
                  <div>
                    <p className="font-medium text-sm">{v.name}</p>
                    <p className="text-xs text-muted-foreground">+{formatRupiah(v.additional_price)}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteVariant(v.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
              {variants.length === 0 && <p className="text-sm text-center py-4 text-muted-foreground border border-dashed rounded-md">Belum ada varian</p>}
            </div>
          </div>

          {/* Addons Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Topping / Add-on</h3>
              <Button size="sm" onClick={addAddon}><Plus className="w-4 h-4 mr-1" /> Tambah</Button>
            </div>
            <p className="text-xs text-muted-foreground">Add-on adalah opsi tambahan opsional yang bisa dipilih banyak (misal: Extra Shot, Boba).</p>
            
            <div className="space-y-2">
              {addons.map(a => (
                <div key={a.id} className="flex items-center justify-between p-2 border rounded-md">
                  <div>
                    <p className="font-medium text-sm">{a.name}</p>
                    <p className="text-xs text-muted-foreground">+{formatRupiah(a.price)}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteAddon(a.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
              {addons.length === 0 && <p className="text-sm text-center py-4 text-muted-foreground border border-dashed rounded-md">Belum ada add-on</p>}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
