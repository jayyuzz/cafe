"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah, formatDate } from "@/lib/utils";
import { Order } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign, Receipt, CreditCard, Banknote } from "lucide-react";

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
        .select("*, order_items(quantity, product:products(name))")
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

  // Prepare line chart data (daily sales)
  const salesMap = orders.reduce((acc, order) => {
    const date = order.created_at.split("T")[0];
    acc[date] = (acc[date] || 0) + order.total;
    return acc;
  }, {} as Record<string, number>);
  
  const lineData = Object.entries(salesMap)
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Prepare bar chart data (top products)
  const productsMap = orders.reduce((acc, order: any) => {
    order.order_items?.forEach((item: any) => {
      const name = item.product?.name || "Unknown";
      acc[name] = (acc[name] || 0) + item.quantity;
    });
    return acc;
  }, {} as Record<string, number>);

  const topProductsData = Object.entries(productsMap)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(totalPendapatan)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransaksi}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Transaksi</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(rataRata)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Metode Pembayaran</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-sm font-medium">
            <div className="flex justify-between">
              <span>Tunai:</span><span>{cashCount}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>QRIS:</span><span>{qrisCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tren Penjualan</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(v) => v.substring(5)} />
                <YAxis tickFormatter={(v) => `Rp ${v/1000}k`} />
                <Tooltip formatter={(value: any) => formatRupiah(Number(value))} />
                <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>10 Produk Terlaris</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsData} layout="vertical" margin={{ left: 50 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                <Tooltip />
                <Bar dataKey="qty" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
