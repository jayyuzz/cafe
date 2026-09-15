"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah, cn, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, Receipt, TrendingUp, Clock, Banknote, QrCode, Timer, UtensilsCrossed, AlertTriangle, Coffee } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Order, OrderItem, Product, RawMaterial } from "@/types/database";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  // Original Metrics
  const [totalPenjualan, setTotalPenjualan] = useState(0);
  const [jumlahTransaksi, setJumlahTransaksi] = useState(0);
  const [rataRata, setRataRata] = useState(0);
  const [totalTunai, setTotalTunai] = useState(0);
  const [totalQris, setTotalQris] = useState(0);
  const [pesananAktif, setPesananAktif] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  // Advanced Metrics (Level Up)
  const [averagePrepTime, setAveragePrepTime] = useState<string>("0 Menit");
  const [grossProfit, setGrossProfit] = useState(0);
  const [channelData, setChannelData] = useState<any[]>([]);
  const [topSellers, setTopSellers] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [lowStockMaterials, setLowStockMaterials] = useState<RawMaterial[]>([]);

  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 1. Fetch Orders for basic stats & SOS
      const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (orders && !error) {
        const validOrders = orders.filter((o) => o.status !== "cancelled");
        const todayOrders = validOrders.filter((o) => new Date(o.created_at) >= today);

        // Revenue
        const total = todayOrders.reduce((sum, o) => sum + o.total, 0);
        const tunai = todayOrders.filter(o => o.payment_method === 'cash').reduce((sum, o) => sum + o.total, 0);
        const qris = todayOrders.filter(o => o.payment_method === 'qris').reduce((sum, o) => sum + o.total, 0);
        
        setTotalPenjualan(total);
        setTotalTunai(tunai);
        setTotalQris(qris);
        setJumlahTransaksi(todayOrders.length);
        setRataRata(todayOrders.length ? total / todayOrders.length : 0);

        const active = orders.filter((o) => ["pending", "processing", "ready"].includes(o.status));
        setPesananAktif(active.length);
        setRecentOrders(orders.slice(0, 8));

        // Speed of Service (SOS) - Calculate average time from created to completed for today
        const completedToday = todayOrders.filter(o => o.status === "completed" && o.updated_at);
        if (completedToday.length > 0) {
          const totalSeconds = completedToday.reduce((sum, o) => {
            const start = new Date(o.created_at).getTime();
            const end = new Date(o.updated_at).getTime();
            return sum + (end - start) / 1000;
          }, 0);
          const avgSeconds = totalSeconds / completedToday.length;
          const mins = Math.floor(avgSeconds / 60);
          const secs = Math.floor(avgSeconds % 60);
          setAveragePrepTime(`${mins}m ${secs}s`);
        } else {
          setAveragePrepTime("-");
        }

        // Sales by Channel
        const channels = { dine_in: 0, take_away: 0, delivery: 0 };
        todayOrders.forEach(o => {
          if (o.order_type === 'dine_in') channels.dine_in += o.total;
          if (o.order_type === 'take_away') channels.take_away += o.total;
          if (o.order_type === 'delivery') channels.delivery += o.total;
        });
        setChannelData([
          { name: "Dine-in", value: channels.dine_in, color: "#10b981" },
          { name: "Takeaway", value: channels.take_away, color: "#f59e0b" },
          { name: "Delivery", value: channels.delivery, color: "#3b82f6" }
        ]);

        // Weekly Chart
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return { date: d.toISOString().split("T")[0], name: d.toLocaleDateString("id-ID", { weekday: "short" }), total: 0 };
        }).reverse();

        validOrders.forEach((o) => {
          const dateStr = o.created_at.split("T")[0];
          const dayData = last7Days.find((d) => d.date === dateStr);
          if (dayData) dayData.total += o.total;
        });
        setChartData(last7Days);
      }

      // 2. Fetch Order Items for Top Sellers and COGS
      const { data: orderItems } = await supabase
        .from("order_items")
        .select(`
          quantity, 
          product_name,
          unit_price,
          order_id,
          orders!inner(created_at, status),
          products(cogs)
        `)
        .gte("orders.created_at", today.toISOString())
        .neq("orders.status", "cancelled");

      if (orderItems) {
        // Calculate Top Sellers
        const itemCounts: Record<string, number> = {};
        let totalCOGS = 0;

        orderItems.forEach((item: any) => {
          itemCounts[item.product_name] = (itemCounts[item.product_name] || 0) + item.quantity;
          
          // Accumulate COGS using the current product COGS mapping
          const itemCogs = (item.products?.cogs || 0) * item.quantity;
          totalCOGS += itemCogs;
        });

        const sortedSellers = Object.entries(itemCounts)
          .map(([name, qty]) => ({ name, qty }))
          .sort((a, b) => b.qty - a.qty)
          .slice(0, 5);
          
        setTopSellers(sortedSellers);

        // Gross Profit (Total Sales - Total COGS)
        // Wait, totalPenjualan includes tax/service charge. Revenue is usually subtotal - discount.
        // Let's use simple logic: sum of (unit_price * qty) - totalCOGS
        const grossRevenue = orderItems.reduce((sum, item: any) => sum + (item.unit_price * item.quantity), 0);
        setGrossProfit(grossRevenue - totalCOGS);
      }

      // 3. Fetch Low Stock Alerts
      const { data: lowProducts } = await supabase.from("products").select("*").eq("track_stock", true).lt("current_stock", 10).order("current_stock");
      if (lowProducts) setLowStockProducts(lowProducts);

      const { data: lowMaterials } = await supabase.from("raw_materials").select("*").lt("current_stock", 500).order("current_stock");
      if (lowMaterials) setLowStockMaterials(lowMaterials);
    };

    fetchData();
  }, [supabase, totalPenjualan]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-amber-100 text-amber-700";
      case "processing": return "bg-blue-100 text-blue-700";
      case "ready": return "bg-teal-100 text-teal-700";
      case "completed": return "bg-emerald-100 text-emerald-700";
      case "cancelled": return "bg-rose-100 text-rose-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Menunggu";
      case "processing": return "Diproses";
      case "ready": return "Siap";
      case "completed": return "Selesai";
      case "cancelled": return "Dibatalkan";
      default: return status;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-2 sm:p-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Interaktif</h1>
          <p className="text-sm text-muted-foreground mt-1">Ringkasan operasional kafe kelas dunia Anda hari ini.</p>
        </div>
      </div>

      {/* Top Main Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm flex flex-col h-full hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Penjualan</CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="text-2xl font-bold">{formatRupiah(totalPenjualan)}</div>
            <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-border/50 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5"><Banknote className="w-3.5 h-3.5 text-emerald-600" /><span>Tunai</span></div>
                <span className="font-semibold text-foreground">{formatRupiah(totalTunai)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5"><QrCode className="w-3.5 h-3.5 text-blue-600" /><span>QRIS</span></div>
                <span className="font-semibold text-foreground">{formatRupiah(totalQris)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm flex flex-col h-full hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estimasi Laba Kotor</CardTitle>
            <div className="p-2 bg-emerald-500/10 rounded-full">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="text-2xl font-bold text-emerald-600">{formatRupiah(grossProfit)}</div>
            <p className="text-xs text-muted-foreground mt-2">Dihitung dari Total Pendapatan dikurangi Total HPP hari ini.</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm flex flex-col h-full hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Jumlah Transaksi</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-full">
              <Receipt className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="text-2xl font-bold">{jumlahTransaksi}</div>
            <p className="text-xs text-muted-foreground mt-2">ATV: <strong>{formatRupiah(rataRata)}</strong> per transaksi.</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm flex flex-col h-full hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Waktu Penyajian (SOS)</CardTitle>
            <div className="p-2 bg-orange-500/10 rounded-full">
              <Timer className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="text-2xl font-bold">{averagePrepTime}</div>
            <p className="text-xs text-muted-foreground mt-2">Rata-rata waktu tunggu pesanan pelanggan hari ini.</p>
          </CardContent>
        </Card>
      </div>

      {/* Middle Section: Chart & Channels & Top Sellers */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Chart */}
        <Card className="md:col-span-2 border-none shadow-md bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Penjualan 7 Hari Terakhir</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                <XAxis dataKey="name" stroke="currentColor" fontSize={12} tickLine={false} axisLine={false} className="opacity-50" />
                <YAxis stroke="currentColor" fontSize={12} tickLine={false} axisLine={false} className="opacity-50" tickFormatter={(value) => `Rp${value / 1000}k`} />
                <Tooltip 
                  cursor={{ fill: 'var(--theme-primary)', opacity: 0.1 }}
                  contentStyle={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)', borderRadius: '8px' }}
                  formatter={(value: any) => [formatRupiah(value as number), "Total"]}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Breakdown Channel & Top Sellers */}
        <div className="space-y-6">
          <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Penjualan per Tipe Pesanan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={channelData} innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                      {channelData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(val: any) => formatRupiah(val as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 text-xs">
                {channelData.map((c, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="text-muted-foreground">{c.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center"><UtensilsCrossed className="w-4 h-4 mr-2" /> Top 5 Terlaris</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topSellers.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="font-medium truncate">{item.name}</span>
                    <span className="font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{item.qty}x</span>
                  </div>
                ))}
                {topSellers.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Belum ada pesanan hari ini.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Section: Recent Orders & Alerts */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 border-none shadow-md bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pesanan Terakhir</CardTitle>
            <Badge variant="outline" className="font-normal">{pesananAktif} Pesanan Aktif</Badge>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">No. Pesanan</th>
                    <th className="pb-3 font-medium">Waktu</th>
                    <th className="pb-3 font-medium">Pelanggan</th>
                    <th className="pb-3 font-medium">Total</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="group">
                      <td className="py-3 font-medium">{order.order_number}</td>
                      <td className="py-3 text-muted-foreground">{formatDate(order.created_at)}</td>
                      <td className="py-3">{order.customer_name || "Tamu"}</td>
                      <td className="py-3 font-medium">{formatRupiah(order.total)}</td>
                      <td className="py-3">
                        <span className={cn("inline-flex items-center px-2 py-1 rounded-full text-xs font-medium", getStatusColor(order.status))}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted-foreground">Belum ada pesanan hari ini.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="border border-red-100 shadow-md bg-red-50/30 backdrop-blur-sm dark:bg-red-950/10 dark:border-red-900/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-red-600 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" /> Peringatan Stok Tipis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockProducts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground">Produk Jadi</h4>
                  {lowStockProducts.slice(0, 3).map(p => (
                    <div key={p.id} className="flex justify-between items-center text-sm border-b border-red-100 pb-1">
                      <span className="truncate">{p.name}</span>
                      <span className="font-bold text-red-600">{p.current_stock}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {lowStockMaterials.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground flex items-center mt-3"><Coffee className="w-3 h-3 mr-1"/> Bahan Baku</h4>
                  {lowStockMaterials.slice(0, 3).map(m => (
                    <div key={m.id} className="flex justify-between items-center text-sm border-b border-red-100 pb-1">
                      <span className="truncate">{m.name}</span>
                      <span className="font-bold text-red-600">{m.current_stock} <span className="text-xs">{m.unit}</span></span>
                    </div>
                  ))}
                </div>
              )}

              {lowStockProducts.length === 0 && lowStockMaterials.length === 0 && (
                <p className="text-sm text-emerald-600 text-center py-4">Semua stok produk dan bahan baku aman.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
