"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Save, ShieldCheck } from "lucide-react";

interface Role {
  id: string;
  name: string;
  permissions: string[];
}

const AVAILABLE_FEATURES = [
  { id: "dashboard", label: "Dashboard (Ringkasan)" },
  { id: "pos", label: "Kasir / POS" },
  { id: "pesanan", label: "Kelola Pesanan (Dapur)" },
  { id: "menu", label: "Kelola Menu / Produk" },
  { id: "laporan", label: "Laporan & Statistik" },
  { id: "reservasi", label: "Reservasi Meja" },
  { id: "admin_log", label: "Admin & Log Aktivitas" },
  { id: "hak_akses", label: "Pengaturan Hak Akses" },
];

export default function HakAksesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("roles").select("*").order("id");
    if (error) {
      toast.error("Gagal mengambil data role");
    } else if (data) {
      setRoles(data);
    }
    setLoading(false);
  };

  const handleTogglePermission = (roleId: string, featureId: string) => {
    setRoles(prev => prev.map(role => {
      if (role.id === roleId) {
        const hasPermission = role.permissions.includes(featureId);
        const newPermissions = hasPermission 
          ? role.permissions.filter(p => p !== featureId)
          : [...role.permissions, featureId];
        return { ...role, permissions: newPermissions };
      }
      return role;
    }));
  };

  const saveChanges = async () => {
    setSaving(true);
    let successCount = 0;
    
    for (const role of roles) {
      const { error } = await supabase
        .from("roles")
        .update({ permissions: role.permissions })
        .eq("id", role.id);
        
      if (!error) successCount++;
    }
    
    if (successCount === roles.length) {
      toast.success("Berhasil menyimpan hak akses");
    } else {
      toast.error("Terjadi kesalahan saat menyimpan sebagian data");
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Memuat data hak akses...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hak Akses</h1>
          <p className="text-muted-foreground">Atur fitur apa saja yang bisa diakses oleh setiap jabatan (Role).</p>
        </div>
        <Button onClick={saveChanges} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.id} className="border-none shadow-md bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-full">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                {role.name}
              </CardTitle>
              <CardDescription>
                ID Sistem: <span className="font-mono text-xs">{role.id}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {AVAILABLE_FEATURES.map((feature) => {
                  const isChecked = role.permissions.includes(feature.id);
                  return (
                    <div key={feature.id} className="flex items-center space-x-3">
                      <Checkbox 
                        id={`${role.id}-${feature.id}`} 
                        checked={isChecked}
                        onCheckedChange={() => handleTogglePermission(role.id, feature.id)}
                      />
                      <label 
                        htmlFor={`${role.id}-${feature.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {feature.label}
                      </label>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
