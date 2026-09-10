"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah, formatDate, cn } from "@/lib/utils";
import { Order } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign, Receipt, CreditCard, Banknote, UtensilsCrossed, Trophy } from "lucide-react";

export default function LaporanPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const supabase = createClient();

  useEffect(() => {
    // Set default to last 30 days
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - 30);
    setFromDate(past.toISOString().split("T")[0]);
    setToDate(today.toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    if (!fromDate || !toDate) return;
    
    const fetchOrders = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(quantity, product:products(name, image_url))")
        .gte("created_at", `${fromDate}T00:00:00`)
        .lte("created_at", `${toDate}T23:59:59`)
        .eq("status", "completed");
        
      if (data) setOrders(data);
    };

    fetchOrders();
  }, [fromDate, toDate, supabase]);

  const totalPendapatan = orders.reduce((sum, o) => sum + o.total, 0);
  const totalTransaksi = orders.length;
  const rataRata = totalTransaksi ? totalPendapatan / totalTransaksi : 0;
  
  const cashCount = orders.filter(o => o.payment_method === "cash").length;
  const qrisCount = orders.filter(o => o.payment_method === "qris").length;

  // Prepare line chart data (daily sales grouped by Senin-Minggu)
  const daysOfWeek = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
  const dayNames: Record<number, string> = {
    1: "Senin", 2: "Selasa", 3: "Rabu", 4: "Kamis", 5: "Jumat", 6: "Sabtu", 0: "Minggu"
  };

  const salesMap = daysOfWeek.reduce((acc, day) => {
    acc[day] = 0;
    return acc;
  }, {} as Record<string, number>);

  orders.forEach((order) => {
    const d = new Date(order.created_at);
    const dayName = dayNames[d.getDay()];
    if (dayName) {
      salesMap[dayName] += order.total;
    }
  });
  
  const lineData = daysOfWeek.map(day => ({
    date: day,
    total: salesMap[day]
  }));

  // Prepare top products data
  const productsMap = orders.reduce((acc, order: any) => {
    order.order_items?.forEach((item: any) => {
      if (item.product) {
        const id = item.product.name; // Use name as unique key for grouping
        if (!acc[id]) {
          acc[id] = { name: item.product.name, image_url: item.product.image_url, qty: 0 };
        }
        acc[id].qty += item.quantity;
      }
    });
    return acc;
  }, {} as Record<string, { name: string; image_url: string | null; qty: number }>);

  const topProductsData = Object.values(productsMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const setPreset = (days: number) => {
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - days);
    setFromDate(past.toISOString().split("T")[0]);
    setToDate(today.toISOString().split("T")[0]);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Laporan Penjualan</h1>

      <div className="flex flex-wrap items-end gap-4 bg-muted/50 p-4 rounded-lg">
        <div className="space-y-1">
          <label className="text-xs font-medium">Dari Tanggal</label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Sampai Tanggal</label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreset(0)}>Hari Ini</Button>
          <Button variant="outline" onClick={() => setPreset(7)}>Minggu Ini</Button>
          <Button variant="outline" onClick={() => setPreset(30)}>Bulan Ini</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pendapatan</CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(totalPendapatan)}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Transaksi</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-full">
              <Receipt className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransaksi}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rata-rata Transaksi</CardTitle>
            <div className="p-2 bg-green-500/10 rounded-full">
              <CreditCard className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(rataRata)}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Metode Pembayaran</CardTitle>
            <div className="p-2 bg-purple-500/10 rounded-full">
              <Banknote className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="flex justify-between font-medium">
              <span>Tunai:</span><span className="text-primary">{cashCount}</span>
            </div>
            <div className="flex justify-between font-medium mt-1">
              <span>QRIS:</span><span className="text-primary">{qrisCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-none shadow-md bg-card/50">
          <CardHeader>
            <CardTitle>Tren Penjualan</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                <XAxis dataKey="date" tickFormatter={(v) => v.substring(0, 3)} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `Rp ${v/1000}k`} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: any) => formatRupiah(Number(value))} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="total" stroke="currentColor" className="stroke-primary" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              5 Produk Terlaris
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] overflow-y-auto hide-scrollbar">
            <div className="flex flex-col gap-3">
              {topProductsData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground pt-10">
                  <UtensilsCrossed className="h-10 w-10 opacity-20 mb-2" />
                  <p className="text-sm">Belum ada data penjualan.</p>
                </div>
              ) : (
                topProductsData.map((product, index) => (
                  <div key={product.name} className="flex items-center gap-4 p-2 pr-4 bg-background rounded-full border shadow-sm transition-all hover:shadow-md hover:border-primary/50">
                    <div className="w-14 h-14 shrink-0 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-background shadow-inner">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <UtensilsCrossed className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">Terjual <span className="font-bold text-primary">{product.qty}</span> porsi</p>
                    </div>
                    <div className={cn("w-8 h-8 shrink-0 flex items-center justify-center font-bold rounded-full text-sm", 
                      index === 0 ? "bg-yellow-400 text-yellow-900 shadow-sm" : 
                      index === 1 ? "bg-slate-300 text-slate-800 shadow-sm" :
                      index === 2 ? "bg-amber-600 text-amber-50 shadow-sm" :
                      "bg-muted text-muted-foreground"
                    )}>
                      #{index + 1}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Transaksi (Completed)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tanggal</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">No. Pesanan</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Pelanggan</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Pembayaran</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {orders.slice(0, 10).map((order) => (
                  <tr key={order.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <td className="p-4 align-middle">{formatDate(order.created_at)}</td>
                    <td className="p-4 align-middle font-medium">{order.order_number}</td>
                    <td className="p-4 align-middle">{order.customer_name || "Tamu"}</td>
                    <td className="p-4 align-middle uppercase">{order.payment_method}</td>
                    <td className="p-4 align-middle text-right font-medium">{formatRupiah(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && (
              <div className="py-6 text-center text-muted-foreground">Tidak ada transaksi di rentang waktu ini.</div>
            )}
            {orders.length > 10 && (
              <div className="py-2 text-center text-xs text-muted-foreground">
                Menampilkan 10 transaksi terakhir.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
