"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User as DBUser } from "@/types/database";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCog, Plus, Edit, Trash2, Search, ShieldAlert, Key } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils";

export default function UsersManagementPage() {
  const [users, setUsers] = useState<DBUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClient();

  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState("");
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"super_admin" | "admin" | "cashier" | "chef" | "customer">("cashier");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    let query = supabase.from("users").select("*").order("name");
    
    if (searchQuery) {
      query = query.ilike("name", `%${searchQuery}%`);
    }

    const { data } = await query;
    if (data) setUsers(data as DBUser[]);
  };

  useEffect(() => {
    fetchUsers();
  }, [searchQuery]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setRole("cashier");
    setIsEditing(false);
    setEditingId("");
  };

  const handleOpenNew = () => {
    resetForm();
    setIsOpen(true);
  };

  const handleEdit = (user: DBUser) => {
    setName(user.name);
    setEmail(user.email);
    setRole(user.role as any);
    setEditingId(user.id);
    setIsEditing(true);
    setIsOpen(true);
  };

  const handleDelete = async (id: string, userName: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus user ${userName}? (Perhatian: Ini mungkin gagal jika user terikat dengan transaksi)`)) {
      const { error } = await supabase.from("users").delete().eq("id", id);
      if (error) {
        toast.error("Gagal menghapus user. Mungkin terikat dengan data lain.");
      } else {
        toast.success("User berhasil dihapus");
        fetchUsers();
      }
    }
  };

  const handleSave = async () => {
    if (!name || !email) {
      toast.error("Nama dan Email wajib diisi");
      return;
    }
    
    setIsSubmitting(true);
    
    const payload = {
      name,
      email,
      role,
      outlet_id: "00000000-0000-0000-0000-000000000001" // Default outlet
    };

    if (isEditing) {
      const { error } = await supabase.from("users").update(payload).eq("id", editingId);
      if (error) toast.error("Gagal memperbarui user");
      else toast.success("User berhasil diperbarui");
    } else {
      // In a real app, this should call an Edge Function to create Auth user too.
      // But we will insert into public.users for DB management purposes.
      const payloadWithId = {
        ...payload,
        id: crypto.randomUUID()
      };
      const { error } = await supabase.from("users").insert(payloadWithId);
      if (error) toast.error("Gagal menambah user. Email mungkin sudah ada.");
      else toast.success("User berhasil ditambahkan");
    }

    if (!isSubmitting) {
      setIsOpen(false);
      fetchUsers();
    }
    setIsSubmitting(false);
  };

  const roleColors: Record<string, string> = {
    super_admin: "bg-red-500 hover:bg-red-600",
    admin: "bg-blue-500 hover:bg-blue-600",
    cashier: "bg-green-500 hover:bg-green-600",
    chef: "bg-amber-500 hover:bg-amber-600",
    driver: "bg-teal-500 hover:bg-teal-600",
    customer: "bg-gray-500 hover:bg-gray-600",
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <UserCog className="w-8 h-8 text-primary" /> Manajemen User & Staf
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola data staf Anda dan atur peran (*role*) mereka di dalam sistem.
          </p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsOpen(open); }}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNew} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" /> Tambah Staf
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Staf" : "Tambah Staf Baru"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama Lengkap</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Budi Santoso" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Alamat Email</label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Contoh: budi@cafe.com" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Role / Jabatan</label>
                <Select value={role} onChange={(e: any) => setRole(e.target.value)}>
                  <option value="super_admin">Super Admin (Owner)</option>
                  <option value="admin">Admin (Manager)</option>
                  <option value="cashier">Cashier (Kasir)</option>
                  <option value="chef">Chef (Dapur / Barista)</option>
                  <option value="driver">Driver (Kurir Internal)</option>
                </Select>
              </div>

              {!isEditing && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-md flex gap-2 items-start mt-4">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>Catatan: Menambah pengguna di sini hanya menambah profil di *database*. Untuk mengizinkan login, *Auth System* Supabase mungkin memerlukan pendaftaran email/password terpisah.</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
              <Button onClick={handleSave} disabled={isSubmitting || !name || !email}>
                {isSubmitting ? "Menyimpan..." : "Simpan Data"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-md">
        <CardContent className="p-0">
          <div className="p-4 border-b flex items-center gap-2 bg-muted/20">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Cari nama staf..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-none shadow-none focus-visible:ring-0 max-w-md p-0 bg-transparent"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b">
                <tr>
                  <th className="px-6 py-4 font-medium">Nama Lengkap</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Role / Jabatan</th>
                  <th className="px-6 py-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">
                      Tidak ada data staf yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-foreground flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        {u.name}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                      <td className="px-6 py-4">
                        <Badge className={`${roleColors[u.role] || "bg-gray-500"} text-white border-none shadow-sm`}>
                          {u.role.replace("_", " ").toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(u)} className="h-8">
                            <Edit className="w-4 h-4 mr-1" /> Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(u.id, u.name)} className="h-8">
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
        </CardContent>
      </Card>
    </div>
  );
}
