"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah, cn, formatDate } from "@/lib/utils";
import { ActivityLog, Order } from "@/types/database";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Shield, Trash2, Edit, ChevronLeft, ChevronRight, TrendingUp, Receipt, Banknote } from "lucide-react";
import { Select, SelectOption } from "@/components/ui/select";
import { OrderEditor } from "@/components/admin/order-editor";

export default function AdminPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [logPage, setLogPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const [timeRange, setTimeRange] = useState("today");
  const [profitSummary, setProfitSummary] = useState({ revenue: 0, cogs: 0, profit: 0 });
  const ITEMS_PER_PAGE = 15;
  const supabase = createClient();

  const fetchLogs = async () => {
    const { data } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (data) setLogs(data);
  };

  const fetchOrders = async () => {
    let startDate = new Date();
    if (timeRange === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (timeRange === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeRange === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (timeRange === 'this_month') {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate.setFullYear(2000); // effectively all time
    }

    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*, product:products(*))")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });
      
    if (data) {
      setOrders(data);
      
      // Hitung ringkasan
      let totalRev = 0;
      let totalCogs = 0;
      data.filter(o => o.status !== 'cancelled').forEach(order => {
        totalRev += order.total;
        order.order_items?.forEach((item: any) => {
          totalCogs += (item.product?.cogs || 0) * item.quantity;
        });
      });
      setProfitSummary({ revenue: totalRev, cogs: totalCogs, profit: totalRev - totalCogs });
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchOrders();

    // Listen to logs
    const channel = supabase
      .channel("admin_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "activity_logs" }, () => {
        fetchLogs();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const deleteOrder = async (id: string) => {
    if (!window.confirm("Yakin ingin menghapus pesanan ini selamanya? Data tidak bisa dikembalikan!")) return;

    // Delete items first (or rely on CASCADE if setup)
    await supabase.from("order_items").delete().eq("order_id", id);
    const { error } = await supabase.from("orders").delete().eq("id", id);

    if (error) {
      toast.error("Gagal menghapus pesanan");
    } else {
      toast.success("Pesanan berhasil dihapus");
      
      // Log it
      import("@/lib/log-activity").then(({ logActivity }) => {
        logActivity("DELETE_ORDER", `Pesanan dengan ID ${id} dihapus secara permanen`);
      });

      fetchOrders();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "processing": return "bg-blue-100 text-blue-800";
      case "ready": return "bg-green-100 text-green-800";
      case "completed": return "bg-gray-100 text-gray-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        </div>
                <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="w-[180px]">
          <SelectOption value="today">Hari Ini</SelectOption>
          <SelectOption value="7d">7 Hari Terakhir</SelectOption>
          <SelectOption value="30d">30 Hari Terakhir</SelectOption>
          <SelectOption value="this_month">Bulan Ini</SelectOption>
          <SelectOption value="all">Semua Waktu</SelectOption>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium text-muted-foreground">Total Pendapatan</h3>
            </div>
            <div className="mt-4 text-3xl font-bold">{formatRupiah(profitSummary.revenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Receipt className="h-4 w-4 text-orange-500" />
              <h3 className="text-sm font-medium text-muted-foreground">Estimasi Modal (HPP)</h3>
            </div>
            <div className="mt-4 text-3xl font-bold text-orange-600">{formatRupiah(profitSummary.cogs)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Banknote className="h-4 w-4 text-green-500" />
              <h3 className="text-sm font-medium text-muted-foreground">Laba Kotor</h3>
            </div>
            <div className="mt-4 text-3xl font-bold text-green-600">{formatRupiah(profitSummary.profit)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="log" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="log">Log Aktivitas</TabsTrigger>
          <TabsTrigger value="riwayat">Riwayat Transaksi (Edit/Hapus)</TabsTrigger>
        </TabsList>

        <TabsContent value="log">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b">
                    <tr>
                      <th className="px-6 py-3">Waktu</th>
                      <th className="px-6 py-3">User</th>
                      <th className="px-6 py-3">Aksi</th>
                      <th className="px-6 py-3">Deskripsi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.slice((logPage - 1) * ITEMS_PER_PAGE, logPage * ITEMS_PER_PAGE).map((log) => (
                      <tr key={log.id} className="border-b hover:bg-muted/30">
                        <td className="px-6 py-3 whitespace-nowrap">{formatDate(log.created_at)}</td>
                        <td className="px-6 py-3">{log.user_name || "Kasir"}</td>
                        <td className="px-6 py-3">
                          <Badge variant="outline">{log.action}</Badge>
                        </td>
                        <td className="px-6 py-3">{log.description}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                          Belum ada aktivitas terekam.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {logs.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between px-6 py-3 border-t">
                  <div className="text-sm text-muted-foreground">
                    Menampilkan {((logPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(logPage * ITEMS_PER_PAGE, logs.length)} dari {logs.length}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={logPage === 1} onClick={() => setLogPage(p => p - 1)}><ChevronLeft className="w-4 h-4 mr-1" /> Prev</Button>
                    <Button variant="outline" size="sm" disabled={logPage >= Math.ceil(logs.length / ITEMS_PER_PAGE)} onClick={() => setLogPage(p => p + 1)}>Next <ChevronRight className="w-4 h-4 ml-1" /></Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="riwayat">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b">
                    <tr>
                      <th className="px-6 py-3">Nomor / Waktu</th>
                      <th className="px-6 py-3">Pelanggan</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Total</th>
                      <th className="px-6 py-3 text-center">Aksi (Admin)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice((orderPage - 1) * ITEMS_PER_PAGE, orderPage * ITEMS_PER_PAGE).map((order) => (
                      <tr key={order.id} className="border-b hover:bg-muted/30">
                        <td className="px-6 py-3">
                          <div className="font-semibold">{order.order_number}</div>
                          <div className="text-xs text-muted-foreground">{formatDate(order.created_at)}</div>
                        </td>
                        <td className="px-6 py-3">{order.customer_name || "Tamu"}</td>
                        <td className="px-6 py-3">
                          <Badge className={cn("capitalize", getStatusColor(order.status))} variant="secondary">
                            {order.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-3 text-right font-medium text-primary">
                          {formatRupiah(order.total)}
                        </td>
                        <td className="px-6 py-3 flex justify-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8"
                            onClick={() => setEditingOrder(order)}
                          >
                            <Edit className="h-4 w-4 mr-1" /> Edit
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            className="h-8"
                            onClick={() => deleteOrder(order.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Hapus
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                          Belum ada pesanan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {orders.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between px-6 py-3 border-t">
                  <div className="text-sm text-muted-foreground">
                    Menampilkan {((orderPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(orderPage * ITEMS_PER_PAGE, orders.length)} dari {orders.length}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={orderPage === 1} onClick={() => setOrderPage(p => p - 1)}><ChevronLeft className="w-4 h-4 mr-1" /> Prev</Button>
                    <Button variant="outline" size="sm" disabled={orderPage >= Math.ceil(orders.length / ITEMS_PER_PAGE)} onClick={() => setOrderPage(p => p + 1)}>Next <ChevronRight className="w-4 h-4 ml-1" /></Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Editor Modal */}
      <OrderEditor 
        order={editingOrder} 
        isOpen={!!editingOrder} 
        onClose={() => setEditingOrder(null)} 
        onSaved={fetchOrders}
      />
    </div>
  );
}






