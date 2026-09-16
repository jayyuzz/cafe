"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, Cell } from "recharts";
import { Trophy, TrendingUp, Receipt, Banknote, Star, User, Target, Crown, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function LaporanLanjutPage() {
  const [salesData, setSalesData] = useState<any[]>([]);
  const [matrixData, setMatrixData] = useState<any[]>([]);
  const [staffData, setStaffData] = useState<any[]>([]);
  const [profitSummary, setProfitSummary] = useState({ revenue: 0, cogs: 0, profit: 0 });
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      // Fetch 30 days data for basic stats
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: orders } = await supabase
        .from("orders")
        .select("*, shifts(cashier_name)")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .neq("status", "cancelled");

      const { data: orderItems } = await supabase
        .from("order_items")
        .select(`*, orders!inner(created_at, status), products(cogs, name)`)
        .gte("orders.created_at", thirtyDaysAgo.toISOString())
        .neq("orders.status", "cancelled");

      if (orders) {
        // Staff Performance (Cashier/Shift analysis)
        const staffMap: Record<string, { revenue: number, count: number, name: string }> = {};
        orders.forEach(o => {
          const cashierName = (o.shifts as any)?.cashier_name || "Kasir Utama";
          if (!staffMap[cashierName]) staffMap[cashierName] = { revenue: 0, count: 0, name: cashierName };
          staffMap[cashierName].revenue += o.total;
          staffMap[cashierName].count += 1;
        });

        const staffArr = Object.values(staffMap).map(s => ({
          ...s,
          atv: s.revenue / s.count
        })).sort((a, b) => b.revenue - a.revenue);
        setStaffData(staffArr);

        // Basic Sales Trend (Last 7 days)
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return { date: d.toISOString().split("T")[0], name: d.toLocaleDateString("id-ID", { weekday: "short" }), total: 0 };
        }).reverse();

        orders.forEach((o) => {
          const dateStr = o.created_at.split("T")[0];
          const dayData = last7Days.find((d) => d.date === dateStr);
          if (dayData) dayData.total += o.total;
        });
        setSalesData(last7Days);
      }

      if (orderItems) {
        let tRev = 0;
        let tCogs = 0;

        // Menu Engineering Matrix
        const itemStats: Record<string, { qty: number, marginTotal: number, name: string }> = {};
        orderItems.forEach((item: any) => {
          const name = item.product_name;
          const cogs = item.products?.cogs || 0;
          const sellingPrice = item.unit_price;
          const margin = sellingPrice - cogs;

          tRev += (sellingPrice * item.quantity);
          tCogs += (cogs * item.quantity);

          if (!itemStats[name]) itemStats[name] = { qty: 0, marginTotal: 0, name };
          itemStats[name].qty += item.quantity;
          itemStats[name].marginTotal += (margin * item.quantity);
        });

        setProfitSummary({ revenue: tRev, cogs: tCogs, profit: tRev - tCogs });

        let totalQty = 0;
        let totalMargin = 0;
        const matrixArr = Object.values(itemStats).map(s => {
          const avgMargin = s.qty > 0 ? s.marginTotal / s.qty : 0;
          totalQty += s.qty;
          totalMargin += s.marginTotal;
          return { name: s.name, qty: s.qty, margin: avgMargin };
        });

        const avgMenuQty = matrixArr.length > 0 ? totalQty / matrixArr.length : 0;
        const avgMenuMargin = totalQty > 0 ? totalMargin / totalQty : 0;

        const classifiedMatrix = matrixArr.map(m => {
          let category = "Dog";
          let color = "#ef4444"; // red
          if (m.qty >= avgMenuQty && m.margin >= avgMenuMargin) { category = "Star"; color = "#eab308"; } // yellow
          else if (m.qty >= avgMenuQty && m.margin < avgMenuMargin) { category = "Plowhorse"; color = "#3b82f6"; } // blue
          else if (m.qty < avgMenuQty && m.margin >= avgMenuMargin) { category = "Puzzle"; color = "#a855f7"; } // purple
          
          return { ...m, category, color };
        });

        setMatrixData(classifiedMatrix);
      }
    }
    fetchData();
  }, [supabase]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border p-3 rounded-lg shadow-xl text-sm">
          <p className="font-bold text-base mb-1">{data.name}</p>
          <p className="text-muted-foreground">Kategori: <strong style={{color: data.color}}>{data.category}</strong></p>
          <p className="text-muted-foreground">Terjual: <strong>{data.qty} porsi</strong></p>
          <p className="text-muted-foreground">Margin/porsi: <strong>{formatRupiah(data.margin)}</strong></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Laporan & Analitik</h1>
          <p className="text-muted-foreground mt-1">
            Data intelijen bisnis tingkat lanjut untuk kafe Anda. (30 Hari Terakhir)
          </p>
        </div>
      </div>

      {/* Profit & Loss Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-md bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Omzet</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatRupiah(profitSummary.revenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Pendapatan Kotor Penjualan</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total HPP / Modal</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatRupiah(profitSummary.cogs)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total biaya bahan mentah</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-card/50 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laba Kotor (Gross Profit)</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatRupiah(profitSummary.profit)}</div>
            <p className="text-xs text-muted-foreground mt-1">Omzet dikurangi HPP</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="matrix" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="matrix" className="data-[state=active]:bg-background">Menu Engineering</TabsTrigger>
          <TabsTrigger value="staff" className="data-[state=active]:bg-background">Kinerja Staf (Kasir)</TabsTrigger>
          <TabsTrigger value="sales" className="data-[state=active]:bg-background">Penjualan Umum</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="space-y-4">
          <Card className="border-none shadow-md bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-primary"/> Menu Engineering Matrix</CardTitle>
              <CardDescription>Pemetaan profitabilitas menu. X = Jumlah Terjual (Popularitas), Y = Margin Keuntungan per Porsi.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[450px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis type="number" dataKey="qty" name="Popularitas (Terjual)" tickLine={false} axisLine={false} tick={{fontSize: 12}} />
                    <YAxis type="number" dataKey="margin" name="Margin (Rp)" tickFormatter={v => `Rp${v/1000}k`} tickLine={false} axisLine={false} tick={{fontSize: 12}} />
                    <ZAxis type="category" dataKey="name" name="Menu" />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{strokeDasharray: '3 3'}} />
                    <Scatter name="Menu" data={matrixData} fill="#8884d8">
                      {matrixData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
                <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-900/30">
                  <h4 className="font-bold text-yellow-700 dark:text-yellow-500 flex items-center mb-2"><Star className="w-4 h-4 mr-2"/> STAR</h4>
                  <p className="text-xs text-muted-foreground mb-3">Laris & Margin Tinggi. Promosikan habis-habisan!</p>
                  <ul className="text-sm font-medium space-y-1">
                    {matrixData.filter(m => m.category === "Star").slice(0,3).map(m => <li key={m.name}>• {m.name}</li>)}
                  </ul>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-200 dark:border-blue-900/30">
                  <h4 className="font-bold text-blue-700 dark:text-blue-500 flex items-center mb-2"><TrendingUp className="w-4 h-4 mr-2"/> PLOWHORSE</h4>
                  <p className="text-xs text-muted-foreground mb-3">Sangat Laris tapi Margin Tipis. Coba naikkan harga sedikit.</p>
                  <ul className="text-sm font-medium space-y-1">
                    {matrixData.filter(m => m.category === "Plowhorse").slice(0,3).map(m => <li key={m.name}>• {m.name}</li>)}
                  </ul>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-xl border border-purple-200 dark:border-purple-900/30">
                  <h4 className="font-bold text-purple-700 dark:text-purple-500 flex items-center mb-2"><Target className="w-4 h-4 mr-2"/> PUZZLE</h4>
                  <p className="text-xs text-muted-foreground mb-3">Margin Sangat Besar tapi Kurang Laku. Minta Kasir upselling!</p>
                  <ul className="text-sm font-medium space-y-1">
                    {matrixData.filter(m => m.category === "Puzzle").slice(0,3).map(m => <li key={m.name}>• {m.name}</li>)}
                  </ul>
                </div>
                <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-xl border border-red-200 dark:border-red-900/30">
                  <h4 className="font-bold text-red-700 dark:text-red-500 flex items-center mb-2"><Trash2 className="w-4 h-4 mr-2" /> DOG</h4>
                  <p className="text-xs text-muted-foreground mb-3">Margin Tipis & Tidak Laku. Pertimbangkan untuk dihapus.</p>
                  <ul className="text-sm font-medium space-y-1">
                    {matrixData.filter(m => m.category === "Dog").slice(0,3).map(m => <li key={m.name}>• {m.name}</li>)}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <Card className="border-none shadow-md bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-primary"/> Kinerja Kasir & Upselling (30 Hari)</CardTitle>
              <CardDescription>Peringkat staf berdasarkan total pendapatan yang dihasilkan dan rata-rata nilai transaksi (ATV).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b">
                    <tr>
                      <th className="px-4 py-4 font-medium rounded-tl-lg">Peringkat</th>
                      <th className="px-4 py-4 font-medium">Nama Kasir</th>
                      <th className="px-4 py-4 font-medium text-right">Total Transaksi (Nota)</th>
                      <th className="px-4 py-4 font-medium text-right">Rata-rata Penjualan (ATV)</th>
                      <th className="px-4 py-4 font-medium text-right rounded-tr-lg">Total Pendapatan Dihasilkan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {staffData.map((staff, index) => (
                      <tr key={index} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-4 font-bold">
                          {index === 0 ? <Crown className="w-5 h-5 text-yellow-500 inline mr-1" /> : `#${index + 1}`}
                        </td>
                        <td className="px-4 py-4 font-semibold text-foreground">{staff.name}</td>
                        <td className="px-4 py-4 text-right text-muted-foreground">{staff.count} Nota</td>
                        <td className="px-4 py-4 text-right font-medium text-primary">{formatRupiah(staff.atv)}</td>
                        <td className="px-4 py-4 text-right font-bold text-lg">{formatRupiah(staff.revenue)}</td>
                      </tr>
                    ))}
                    {staffData.length === 0 && (
                      <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Belum ada data shift staf.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <Card className="border-none shadow-md bg-card/50">
            <CardHeader>
              <CardTitle>Tren Penjualan (7 Hari Terakhir)</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => `Rp${v/1000}k`} axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    cursor={{fill: 'var(--theme-primary)', opacity: 0.1}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(val: any) => [formatRupiah(Number(val)), "Omzet"]}
                  />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
