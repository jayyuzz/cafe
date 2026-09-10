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
  const [outlet, setOutlet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [rolesRes, outletRes] = await Promise.all([
      supabase.from("roles").select("*").order("id"),
      supabase.from("outlets").select("*").eq("is_active", true).limit(1).single()
    ]);

    if (rolesRes.error) {
      toast.error("Gagal mengambil data role");
    } else {
      setRoles(rolesRes.data || []);
    }

    if (outletRes.data) {
      setOutlet(outletRes.data);
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
    
    // Save roles
    for (const role of roles) {
      const { error } = await supabase
        .from("roles")
        .update({ permissions: role.permissions })
        .eq("id", role.id);
        
      if (!error) successCount++;
    }

    // Save outlet tax settings
    if (outlet) {
      const { error: outletError } = await supabase
        .from("outlets")
        .update({ tax_enabled: outlet.tax_enabled, tax_percentage: outlet.tax_percentage })
        .eq("id", outlet.id);
      
      if (!outletError) successCount++; // just tracking overall success
    }
    
    toast.success("Berhasil menyimpan pengaturan");
    setSaving(false);
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Memuat data...</div>;
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
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

      {outlet && (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-8 mb-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Pengaturan Tambahan</h2>
              <p className="text-muted-foreground">Atur fitur pajak dan biaya lainnya.</p>
            </div>
          </div>
          <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm max-w-md">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-amber-900/10 rounded-full">
                  <ShieldCheck className="h-5 w-5 text-amber-900" />
                </div>
                Pajak (PB1)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="tax-toggle" className="text-sm font-medium">Aktifkan Pajak</label>
                    <p className="text-xs text-muted-foreground mt-1">Hitung otomatis pajak di kasir & QR order.</p>
                  </div>
                  <Checkbox 
                    id="tax-toggle" 
                    checked={outlet.tax_enabled}
                    onCheckedChange={(checked) => setOutlet({ ...outlet, tax_enabled: !!checked })}
                  />
                </div>

                {outlet.tax_enabled && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Persentase Pajak (%)</label>
                    <input 
                      type="number"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={outlet.tax_percentage}
                      onChange={(e) => setOutlet({ ...outlet, tax_percentage: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
