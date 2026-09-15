"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah, formatDate } from "@/lib/utils";
import { Customer } from "@/types/database";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Search, Award, Users } from "lucide-react";

export default function PelangganPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClient();

  const [isOpen, setIsOpen] = useState(false);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    let query = supabase.from("customers").select("*").order("total_spent", { ascending: false });
    
    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
    }

    const { data } = await query;
    if (data) setCustomers(data);
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery]);

  const handleSave = async () => {
    if (!name) {
      toast.error("Nama pelanggan wajib diisi");
      return;
    }
    
    setIsSubmitting(true);
    const payload = {
      name,
      phone: phone || null,
      outlet_id: "00000000-0000-0000-0000-000000000001"
    };

    const res = id 
      ? await supabase.from("customers").update(payload).eq("id", id)
      : await supabase.from("customers").insert(payload);

    if (res.error) {
      if (res.error.code === '23505') {
        toast.error("Nomor HP sudah terdaftar untuk pelanggan lain");
      } else {
        toast.error("Gagal menyimpan data pelanggan");
      }
    } else {
      toast.success("Pelanggan berhasil disimpan");
      setIsOpen(false);
      fetchData();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (deleteId: string) => {
    if (!confirm("Yakin ingin menghapus pelanggan ini? Riwayat pesanan tidak akan terhapus, namun tidak lagi tertaut ke pelanggan ini.")) return;
    const { error } = await supabase.from("customers").delete().eq("id", deleteId);
    if (error) toast.error("Gagal menghapus pelanggan");
    else {
      toast.success("Pelanggan dihapus");
      fetchData();
    }
  };

  const totalMembers = customers.length;
  const totalPoints = customers.reduce((sum, c) => sum + (c.points || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM & Loyalitas</h1>
          <p className="text-muted-foreground mt-1">
            Kelola data pelanggan, member, dan akumulasi poin loyalitas.
          </p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setId(""); setName(""); setPhone(""); }}>
              <Plus className="w-4 h-4 mr-2" /> Tambah Pelanggan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{id ? "Edit Pelanggan" : "Pelanggan Baru"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama Lengkap</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Budi Santoso" autoFocus />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nomor Handphone (WhatsApp)</label>
                <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Contoh: 08123456789" />
                <p className="text-xs text-muted-foreground">Digunakan untuk pencarian saat bertransaksi di Kasir.</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
              <Button onClick={handleSave} disabled={isSubmitting || !name}>
                {isSubmitting ? "Menyimpan..." : "Simpan Data"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-card border rounded-lg p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-500/10 rounded-full text-blue-500">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Total Member Terdaftar</p>
            <h3 className="text-2xl font-bold">{totalMembers} <span className="text-sm font-normal text-muted-foreground">orang</span></h3>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-amber-500/10 rounded-full text-amber-500">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Total Poin Beredar</p>
            <h3 className="text-2xl font-bold">{totalPoints} <span className="text-sm font-normal text-muted-foreground">poin</span></h3>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b flex items-center gap-2">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Cari nama atau nomor HP pelanggan..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-none shadow-none focus-visible:ring-0 max-w-md p-0"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b">
              <tr>
                <th className="px-4 py-3 font-medium">Nama Pelanggan</th>
                <th className="px-4 py-3 font-medium">Nomor HP</th>
                <th className="px-4 py-3 font-medium text-right">Poin Loyalitas</th>
                <th className="px-4 py-3 font-medium text-right">Total Belanja</th>
                <th className="px-4 py-3 font-medium">Bergabung Sejak</th>
                <th className="px-4 py-3 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    {searchQuery ? "Tidak ada pelanggan yang cocok dengan pencarian." : "Belum ada data pelanggan."}
                  </td>
                </tr>
              ) : (
                customers.map(c => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.phone || "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">{c.points} Pts</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatRupiah(c.total_spent)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(c.created_at)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => {
                          setId(c.id); setName(c.name); setPhone(c.phone || ""); setIsOpen(true);
                        }}>
                          <Edit className="w-4 h-4 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(c.id)}>
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
