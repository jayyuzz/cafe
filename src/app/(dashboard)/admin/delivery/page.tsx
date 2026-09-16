"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Bike, Users, Settings, CheckSquare, Loader2, Save, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Order, User, Outlet, DeliveryChecklist } from "@/types/database";
import { formatRupiah, formatDate } from "@/lib/utils";

export default function AdminDeliveryPage() {
  const [activeTab, setActiveTab] = useState("monitor");
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  // Data states
  const [orders, setOrders] = useState<(Order & { driver_name?: string })[]>([]);
  const [drivers, setDrivers] = useState<(User & { completed_orders?: number })[]>([]);
  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [checklists, setChecklists] = useState<DeliveryChecklist[]>([]);

  // Settings form states
  const [deliveryFee, setDeliveryFee] = useState(10000);
  const [waTemplate, setWaTemplate] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // SOP form state
  const [newTask, setNewTask] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Get Outlet (assume only 1 active outlet for now)
      const { data: outletData } = await supabase.from("outlets").select("*").limit(1).single();
      if (outletData) {
        setOutlet(outletData);
        setDeliveryFee(outletData.delivery_fee ?? 10000);
        setWaTemplate(outletData.delivery_wa_template ?? 'Halo kak {nama}, saya kurir dari MVE Cafe. Pesanan kakak sedang saya antar menuju lokasi ya. Mohon ditunggu!');
        setAdminPhone(outletData.phone ?? '082211603512');
      }

      // 2. Get Delivery Orders for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: ordersData } = await supabase
        .from("orders")
        .select("*")
        .eq("order_type", "delivery")
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false });

      // 3. Get Drivers
      const { data: usersData } = await supabase.from("users").select("*");
      
      if (ordersData && usersData) {
        // Map driver names to orders
        const ordersWithDrivers = ordersData.map(o => {
          const driver = usersData.find(u => u.id === o.driver_id);
          return { ...o, driver_name: driver?.name };
        });
        setOrders(ordersWithDrivers);

        // Filter users who are drivers
        const driverUsers = usersData.filter(u => u.role === "driver" || u.role === "admin");
        const driversWithStats = driverUsers.map(d => {
          const completed = ordersData.filter(o => o.driver_id === d.id && o.status === "delivered").length;
          return { ...d, completed_orders: completed };
        });
        setDrivers(driversWithStats);
      }

      // 4. Get Checklists
      if (outletData) {
        const { data: checklistData } = await supabase
          .from("delivery_checklists")
          .select("*")
          .eq("outlet_id", outletData.id)
          .order("created_at", { ascending: true });
        if (checklistData) setChecklists(checklistData);
      }

    } catch (error) {
      console.error("Error fetching delivery data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!outlet) return;
    setIsSavingSettings(true);
    try {
      const { error } = await supabase
        .from("outlets")
        .update({
          delivery_fee: deliveryFee,
          delivery_wa_template: waTemplate,
          phone: adminPhone
        })
        .eq("id", outlet.id);

      if (error) throw error;
      toast.success("Pengaturan berhasil disimpan");
    } catch (error) {
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const addChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outlet || !newTask.trim()) return;
    setIsAddingTask(true);
    try {
      const { error } = await supabase.from("delivery_checklists").insert({
        outlet_id: outlet.id,
        task: newTask.trim(),
        is_active: true
      });
      if (error) throw error;
      setNewTask("");
      toast.success("Checklist berhasil ditambahkan");
      fetchData(); // reload checklists
    } catch (error) {
      toast.error("Gagal menambah checklist");
    } finally {
      setIsAddingTask(false);
    }
  };

  const toggleChecklist = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("delivery_checklists")
        .update({ is_active: !currentStatus })
        .eq("id", id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      toast.error("Gagal mengubah status checklist");
    }
  };

  const deleteChecklist = async (id: string) => {
    if (!confirm("Hapus checklist ini?")) return;
    try {
      const { error } = await supabase.from("delivery_checklists").delete().eq("id", id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      toast.error("Gagal menghapus checklist");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="secondary">Menunggu Pembayaran</Badge>;
      case "processing": return <Badge className="bg-orange-500">Disiapkan</Badge>;
      case "ready": return <Badge className="bg-amber-500">Menunggu Kurir</Badge>;
      case "delivering": return <Badge className="bg-blue-500">Sedang Diantar</Badge>;
      case "delivered": return <Badge className="bg-teal-500">Selesai Diantar</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Manajemen Delivery</h1>
        <p className="text-muted-foreground mt-2">
          Control tower untuk memantau status antaran, kurir, pengaturan ongkir, dan SOP.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full md:w-[600px] bg-slate-200/50">
          <TabsTrigger value="monitor" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
            <Bike className="w-4 h-4 mr-2" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="kurir" className="data-[state=active]:bg-teal-500 data-[state=active]:text-white">
            <Users className="w-4 h-4 mr-2" />
            Kurir
          </TabsTrigger>
          <TabsTrigger value="pengaturan" className="data-[state=active]:bg-violet-500 data-[state=active]:text-white">
            <Settings className="w-4 h-4 mr-2" />
            Pengaturan
          </TabsTrigger>
          <TabsTrigger value="sop" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            <CheckSquare className="w-4 h-4 mr-2" />
            SOP
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Monitoring Delivery</CardTitle>
              <CardDescription>Pantau pesanan yang sedang diantar atau menunggu kurir hari ini.</CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Tidak ada pesanan delivery hari ini.</div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {orders.map((order) => (
                    <div key={order.id} className="border rounded-xl p-4 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold">{order.customer_name || 'Tamu'}</p>
                          <p className="text-xs text-muted-foreground font-mono">{order.order_number}</p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                      
                      <div className="text-sm bg-muted/30 p-2 rounded-lg my-1 flex flex-col gap-1">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{order.notes || 'Tidak ada alamat'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span>{formatDate(order.created_at)}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-sm border-t pt-2 mt-1">
                        <span className="text-muted-foreground">Kurir:</span>
                        <span className="font-semibold">{order.driver_name || '-'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kurir" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performa Kurir</CardTitle>
              <CardDescription>Daftar staf kurir dan jumlah antaran yang diselesaikan hari ini.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {drivers.map(driver => (
                  <div key={driver.id} className="flex items-center justify-between p-4 border rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold text-lg">
                        {driver.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold">{driver.name}</p>
                        <p className="text-sm text-muted-foreground">{driver.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">Antaran Selesai</p>
                      <Badge variant="secondary" className="text-base px-3 py-1">
                        {driver.completed_orders || 0}
                      </Badge>
                    </div>
                  </div>
                ))}
                {drivers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">Belum ada user dengan hak akses Kurir/Driver.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pengaturan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Pengiriman</CardTitle>
              <CardDescription>Atur biaya ongkir, nomor admin, dan template pesan WhatsApp otomatis.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Nomor WA Admin</label>
                <Input 
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  placeholder="Contoh: 082211603512 atau 6282211603512"
                  className="w-full sm:w-[300px]"
                />
                <p className="text-xs text-muted-foreground">Nomor ini akan dihubungi oleh pelanggan jika mereka klik tombol Chat Admin/Kirim Bukti Pembayaran.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Biaya Ongkir (Delivery Fee)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rp</span>
                  <Input 
                    type="number" 
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(Number(e.target.value))}
                    className="pl-9 w-full sm:w-[300px]"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Biaya ini akan otomatis ditambahkan ke total belanja tipe Delivery.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Template Pesan WhatsApp Kurir</label>
                <textarea 
                  value={waTemplate}
                  onChange={(e) => setWaTemplate(e.target.value)}
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Halo kak {nama}, pesanan sedang saya antar..."
                />
                <p className="text-xs text-muted-foreground">
                  Gunakan <code>{`{nama}`}</code> untuk menyisipkan nama pelanggan secara otomatis, dan <code>{`{order_id}`}</code> untuk nomor pesanan.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveSettings} disabled={isSavingSettings} className="w-full sm:w-auto">
                {isSavingSettings ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Simpan Pengaturan
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="sop" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Standar Operasional (SOP)</CardTitle>
              <CardDescription>Atur daftar checklist operasional yang harus diperhatikan kurir.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={addChecklist} className="flex gap-2">
                <Input 
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  placeholder="Contoh: Pastikan sedotan sudah dimasukkan..."
                />
                <Button type="submit" disabled={isAddingTask || !newTask.trim()}>Tambah</Button>
              </form>

              <div className="space-y-2">
                {checklists.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={item.is_active}
                        onChange={() => toggleChecklist(item.id, item.is_active)}
                        className="w-4 h-4 rounded"
                      />
                      <span className={item.is_active ? "font-medium" : "text-muted-foreground line-through"}>
                        {item.task}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => deleteChecklist(item.id)} className="text-destructive hover:bg-destructive/10">
                      Hapus
                    </Button>
                  </div>
                ))}
                {checklists.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm border border-dashed rounded-lg">
                    Belum ada daftar SOP checklist.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
