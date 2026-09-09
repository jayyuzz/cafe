"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah, cn } from "@/lib/utils";
import { Category, Product } from "@/types/database";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, UtensilsCrossed } from "lucide-react";

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const supabase = createClient();

  // Category Form State
  const [catOpen, setCatOpen] = useState(false);
  const [catId, setCatId] = useState("");
  const [catName, setCatName] = useState("");
  
  // Product Form State
  const [prodOpen, setProdOpen] = useState(false);
  const [prodId, setProdId] = useState("");
  const [prodName, setProdName] = useState("");
  const [prodCat, setProdCat] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodAvail, setProdAvail] = useState(true);

  const fetchData = async () => {
    const { data: c } = await supabase.from("categories").select("*").order("name");
    if (c) setCategories(c);
    
    const { data: p } = await supabase.from("products").select("*, category:categories(name)").order("name");
    if (p) setProducts(p);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const saveCategory = async () => {
    if (!catName) return;
    const payload = { name: catName, outlet_id: "default-outlet-id" }; // Replace with real outlet_id if needed
    
    const res = catId 
      ? await supabase.from("categories").update(payload).eq("id", catId)
      : await supabase.from("categories").insert([payload]);
      
    if (res.error) toast.error("Gagal menyimpan kategori");
    else {
      toast.success("Kategori berhasil disimpan");
      setCatOpen(false);
      fetchData();
    }
  };

  const deleteCategory = async (id: string) => {
    if(!confirm("Yakin hapus kategori?")) return;
    await supabase.from("categories").delete().eq("id", id);
    fetchData();
  };

  const saveProduct = async () => {
    if (!prodName || !prodPrice || !prodCat) return;
    const payload = {
      name: prodName,
      category_id: prodCat,
      price: Number(prodPrice),
      description: prodDesc,
      is_available: prodAvail,
      outlet_id: "default-outlet-id"
    };

    const res = prodId
      ? await supabase.from("products").update(payload).eq("id", prodId)
      : await supabase.from("products").insert([payload]);

    if (res.error) toast.error("Gagal menyimpan produk");
    else {
      toast.success("Produk berhasil disimpan");
      setProdOpen(false);
      fetchData();
    }
  };

  const deleteProduct = async (id: string) => {
    if(!confirm("Yakin hapus produk?")) return;
    await supabase.from("products").delete().eq("id", id);
    fetchData();
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Manajemen Menu</h1>

      <Tabs defaultValue="produk" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="produk">Produk</TabsTrigger>
          <TabsTrigger value="kategori">Kategori</TabsTrigger>
        </TabsList>

        <TabsContent value="produk" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Daftar Produk</h2>
            <Dialog open={prodOpen} onOpenChange={setProdOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setProdId(""); setProdName(""); setProdPrice(""); setProdDesc(""); setProdCat(""); setProdAvail(true); }}>
                  <Plus className="mr-2 h-4 w-4" /> Tambah Produk
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{prodId ? "Edit Produk" : "Tambah Produk"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nama Produk</label>
                    <Input value={prodName} onChange={(e) => setProdName(e.target.value)} placeholder="Contoh: Kopi Susu Aren" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Kategori</label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={prodCat} onChange={(e) => setProdCat(e.target.value)}>
                      <option value="">Pilih Kategori</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Harga</label>
                    <Input type="number" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} placeholder="Contoh: 25000" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Deskripsi</label>
                    <Textarea value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} placeholder="Opsional..." />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="available" checked={prodAvail} onCheckedChange={setProdAvail} />
                    <label htmlFor="available" className="text-sm font-medium">Tersedia</label>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={saveProduct}>Simpan</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map(p => (
              <div key={p.id} className="border rounded-lg overflow-hidden flex flex-col bg-card">
                <div className="h-32 bg-muted flex items-center justify-center">
                  <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{(p as any).category?.name}</p>
                  <p className="font-bold text-primary mt-auto">{formatRupiah(p.price)}</p>
                  <div className="flex items-center justify-between mt-4">
                    <Badge variant={p.is_available ? "default" : "secondary"}>
                      {p.is_available ? "Tersedia" : "Habis"}
                    </Badge>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => {
                        setProdId(p.id); setProdName(p.name); setProdCat(p.category_id);
                        setProdPrice(p.price.toString()); setProdDesc(p.description || "");
                        setProdAvail(p.is_available); setProdOpen(true);
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteProduct(p.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="kategori" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Daftar Kategori</h2>
            <Dialog open={catOpen} onOpenChange={setCatOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setCatId(""); setCatName(""); }}>
                  <Plus className="mr-2 h-4 w-4" /> Tambah Kategori
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{catId ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nama Kategori</label>
                    <Input value={catName} onChange={(e) => setCatName(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={saveCategory}>Simpan</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="border rounded-md">
            {categories.map(c => (
              <div key={c.id} className="flex items-center justify-between p-4 border-b last:border-0">
                <span className="font-medium">{c.name}</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setCatId(c.id); setCatName(c.name); setCatOpen(true); }}>Edit</Button>
                  <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteCategory(c.id)}>Hapus</Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
