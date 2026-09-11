"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah, cn, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Receipt, TrendingUp, Clock, Banknote, QrCode } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Order } from "@/types/database";

export default function DashboardPage() {
  const [totalPenjualan, setTotalPenjualan] = useState(0);
  const [jumlahTransaksi, setJumlahTransaksi] = useState(0);
  const [rataRata, setRataRata] = useState(0);
  const [totalTunai, setTotalTunai] = useState(0);
  const [totalQris, setTotalQris] = useState(0);
  const [pesananAktif, setPesananAktif] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      // Dummy date logic for last 7 days
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch summary stats
      const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (orders && !error) {
        const validOrders = orders.filter((o) => o.status !== "cancelled");

        const todayOrders = validOrders.filter((o) => {
          const d = new Date(o.created_at);
          return d >= today;
        });

        const total = todayOrders.reduce((sum, o) => sum + o.total, 0);
        const tunai = todayOrders.filter(o => o.payment_method === 'cash').reduce((sum, o) => sum + o.total, 0);
        const qris = todayOrders.filter(o => o.payment_method === 'qris').reduce((sum, o) => sum + o.total, 0);
        
        setTotalPenjualan(total);
        setTotalTunai(tunai);
        setTotalQris(qris);
        setJumlahTransaksi(todayOrders.length);
        setRataRata(todayOrders.length ? total / todayOrders.length : 0);

        const active = orders.filter((o) =>
          ["pending", "processing", "ready"].includes(o.status)
        );
        setPesananAktif(active.length);

        setRecentOrders(orders.slice(0, 10));

        // Group for chart
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return {
            date: d.toISOString().split("T")[0],
            name: d.toLocaleDateString("id-ID", { weekday: "short" }),
            total: 0,
          };
        }).reverse();

        validOrders.forEach((o) => {
          const dateStr = o.created_at.split("T")[0];
          const dayData = last7Days.find((d) => d.date === dateStr);
          if (dayData) {
            dayData.total += o.total;
          }
        });

        setChartData(last7Days);
      }
    };

    fetchData();
  }, [supabase]);

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
    <div className="flex flex-col gap-6 p-2 sm:p-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm flex flex-col h-full hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Penjualan Hari Ini</CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="text-2xl font-bold">{formatRupiah(totalPenjualan)}</div>
            <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-border/50 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tunai</span>
                </div>
                <span className="font-semibold text-foreground">{formatRupiah(totalTunai)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-blue-600" />
                  <span>QRIS</span>
                </div>
                <span className="font-semibold text-foreground">{formatRupiah(totalQris)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm flex flex-col h-full hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Jumlah Transaksi</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-full">
              <Receipt className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="text-2xl font-bold">{jumlahTransaksi}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm flex flex-col h-full hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rata-rata Transaksi</CardTitle>
            <div className="p-2 bg-green-500/10 rounded-full">
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="text-2xl font-bold">{formatRupiah(rataRata)}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm flex flex-col h-full hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pesanan Aktif</CardTitle>
            <div className="p-2 bg-orange-500/10 rounded-full">
              <Clock className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="text-2xl font-bold">{pesananAktif}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1 border-none shadow-md bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Penjualan 7 Hari Terakhir</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                <YAxis tickFormatter={(value) => `Rp ${value / 1000}k`} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dx={-10} />
                <Tooltip 
                  formatter={(value: any) => formatRupiah(Number(value))} 
                  cursor={{ fill: 'currentColor', opacity: 0.05 }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="total" className="fill-primary" radius={[6, 6, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1 border-none shadow-md bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Pesanan Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
                  <Receipt className="h-12 w-12 opacity-20 mb-2" />
                  <p>Belum ada pesanan terbaru.</p>
                </div>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-background/80 rounded-xl border border-border/50 shadow-sm transition-all hover:shadow-md hover:border-border">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-foreground leading-none">{order.order_number}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider", getStatusColor(order.status))}>
                        {getStatusLabel(order.status)}
                      </span>
                      <span className="text-sm font-extrabold text-primary">{formatRupiah(order.total)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
