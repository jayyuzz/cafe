import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus, GripVertical } from "lucide-react";
import { ProductRecipe, RawMaterial } from "@/types/database";
import { formatRupiah } from "@/lib/utils";

export function ProductRecipeEditor({ product, isOpen, onClose }: { product: any, isOpen: boolean, onClose: () => void }) {
  const [recipes, setRecipes] = useState<ProductRecipe[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const supabase = createClient();

  // Selected new material
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      fetchData();
      fetchMaterials();
    }
  }, [isOpen, product]);

  const fetchMaterials = async () => {
    const { data } = await supabase.from("raw_materials").select("*").order("name");
    if (data) setRawMaterials(data);
  };

  const fetchData = async () => {
    const { data } = await supabase
      .from("product_recipes")
      .select("*, raw_material:raw_materials(*)")
      .eq("product_id", product.id)
      .order("created_at");
    
    if (data) setRecipes(data as any);
  };

  const addRecipeItem = async () => {
    if (!selectedMaterialId || !quantity) return;
    setIsSubmitting(true);
    const { error } = await supabase.from("product_recipes").insert({
      product_id: product.id,
      material_id: selectedMaterialId,
      quantity: Number(quantity)
    });
    
    if (error) toast.error("Gagal menambah bahan resep");
    else { 
      toast.success("Bahan resep ditambahkan"); 
      setSelectedMaterialId("");
      setQuantity("");
      fetchData(); 
      updateProductCOGS();
    }
    setIsSubmitting(false);
  };

  const deleteRecipeItem = async (id: string) => {
    if (!confirm("Hapus bahan resep ini?")) return;
    await supabase.from("product_recipes").delete().eq("id", id);
    fetchData();
    updateProductCOGS();
  };

  const updateProductCOGS = async () => {
    // Recalculate COGS
    const { data: currentRecipes } = await supabase
      .from("product_recipes")
      .select("quantity, raw_material:raw_materials(cost_per_unit)")
      .eq("product_id", product.id);
      
    if (currentRecipes) {
      const totalCogs = currentRecipes.reduce((sum, item: any) => {
        return sum + (item.quantity * (item.raw_material?.cost_per_unit || 0));
      }, 0);
      
      await supabase.from("products").update({ cogs: totalCogs }).eq("id", product.id);
    }
  };

  const totalCOGS = recipes.reduce((sum, item) => sum + (item.quantity * (item.raw_material?.cost_per_unit || 0)), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Resep & HPP: {product?.name}</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="bg-muted p-4 rounded-md">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Total HPP (COGS) Saat Ini</h3>
            <p className="text-2xl font-bold text-primary">{formatRupiah(totalCOGS)}</p>
            <p className="text-xs text-muted-foreground mt-1">Harga Pokok Penjualan dihitung otomatis dari total harga modal bahan baku di bawah ini.</p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Komposisi Bahan Baku</h3>
            
            <div className="flex gap-2 items-end bg-card border p-3 rounded-lg">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium">Bahan Baku</label>
                <select 
                  className="w-full flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                  value={selectedMaterialId}
                  onChange={e => setSelectedMaterialId(e.target.value)}
                >
                  <option value="">-- Pilih Bahan --</option>
                  {rawMaterials.map(rm => (
                    <option key={rm.id} value={rm.id}>{rm.name} ({rm.unit})</option>
                  ))}
                </select>
              </div>
              <div className="w-28 space-y-1">
                <label className="text-xs font-medium">Takaran</label>
                <Input type="number" placeholder="Contoh: 15" value={quantity} onChange={e => setQuantity(e.target.value)} />
              </div>
              <Button onClick={addRecipeItem} disabled={isSubmitting || !selectedMaterialId || !quantity}>
                <Plus className="w-4 h-4 mr-1" /> Tambah
              </Button>
            </div>
            
            <div className="border rounded-md divide-y">
              {recipes.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">Belum ada bahan baku untuk produk ini.</p>
              ) : (
                recipes.map(r => {
                  const cost = r.quantity * (r.raw_material?.cost_per_unit || 0);
                  return (
                    <div key={r.id} className="flex items-center justify-between p-3">
                      <div>
                        <p className="font-medium text-sm">{r.raw_material?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.quantity} {r.raw_material?.unit} x {formatRupiah(r.raw_material?.cost_per_unit || 0)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-sm">{formatRupiah(cost)}</span>
                        <Button variant="ghost" size="icon" onClick={() => deleteRecipeItem(r.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

