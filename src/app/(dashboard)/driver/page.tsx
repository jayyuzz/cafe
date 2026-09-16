"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Order } from "@/types/database";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bike, MapPin, Phone, CheckCircle2, Navigation, Clock, Package } from "lucide-react";
import { toast } from "sonner";
import { formatRupiah } from "@/lib/utils";

export default function DriverDashboardPage() {
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Hardcoded for now. In a real app, get from Supabase Auth
  const driverId = "driver-123"; 

  const supabase = createClient();

  const fetchOrders = async () => {
    setIsLoading(true);
    
    // Fetch active assignments (delivering)
    const { data: active } = await supabase
      .from("orders")
      .select("*")
      .eq("order_type", "delivery")
      .eq("status", "delivering")
      .order("created_at", { ascending: false });

    // Fetch ready orders waiting for a driver (can be claimed)
    const { data: ready } = await supabase
      .from("orders")
      .select("*")
      .eq("order_type", "delivery")
      .eq("status", "ready")
      .order("created_at", { ascending: true });

    // Fetch history (delivered today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data: history } = await supabase
      .from("orders")
      .select("*")
      .eq("order_type", "delivery")
      .eq("status", "delivered")
      .gte("updated_at", today.toISOString())
      .order("updated_at", { ascending: false });

    if (active || ready) {
      // For demo, we just merge ready and delivering into one view
      setActiveOrders([...(active || []), ...(ready || [])] as Order[]);
    }
    if (history) setHistoryOrders(history as Order[]);
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: 'delivering' | 'delivered') => {
    const payload = newStatus === 'delivering' 
      ? { status: newStatus, driver_id: driverId }
      : { status: newStatus };

    const { error } = await supabase
      .from("orders")
      .update(payload)
      .eq("id", orderId);

    if (error) {
      toast.error("Gagal memperbarui status");
    } else {
      toast.success(`Pesanan ${newStatus === 'delivering' ? 'diambil' : 'selesai diantar'}`);
      fetchOrders();
    }
  };

  const openGoogleMaps = (address: string) => {
    if (!address) return;
    
    // Cari apakah ada URL Google Maps di dalam teks (dari tombol Dapatkan Lokasi)
    const mapUrlMatch = address.match(/(https?:\/\/[^\s]+)/);
    
    if (mapUrlMatch && mapUrlMatch[0]) {
      // Jika ada URL, langsung buka URL tersebut
      window.open(mapUrlMatch[0], "_blank");
    } else {
      // Jika hanya teks biasa, gunakan fitur pencarian Maps
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, "_blank");
    }
  };

  if (isLoading && activeOrders.length === 0) {
    return <div className="p-6 text-center text-muted-foreground animate-pulse">Memuat data antaran...</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6 pb-24">
      <div className="bg-teal-600 text-white p-6 rounded-2xl shadow-lg flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Halo, Kurir! 🛵</h1>
          <p className="text-teal-100 mt-1">Anda memiliki {activeOrders.length} tugas antaran saat ini.</p>
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
          <Bike className="w-6 h-6 text-white" />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <Package className="w-5 h-5 text-teal-600" /> Tugas Antaran Aktif
        </h2>

        {activeOrders.length === 0 ? (
          <div className="text-center p-8 bg-muted/20 border border-dashed rounded-xl">
            <p className="text-muted-foreground">Belum ada pesanan delivery saat ini.</p>
          </div>
        ) : (
          activeOrders.map(order => (
            <Card key={order.id} className={`overflow-hidden transition-all shadow-sm ${order.status === 'delivering' ? 'border-teal-500 ring-1 ring-teal-500/20' : ''}`}>
              <CardContent className="p-0">
                <div className="p-4 border-b bg-muted/10 flex justify-between items-center">
                  <div>
                    <div className="font-mono text-sm font-semibold text-muted-foreground">{order.order_number}</div>
                    <div className="font-bold text-lg">{order.customer_name || 'Pelanggan'}</div>
                    {order.customer_phone && (
                      <div className="text-sm font-medium text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {order.customer_phone}
                      </div>
                    )}
                  </div>
                  <Badge className={
                    order.status === 'ready' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-teal-500 hover:bg-teal-600'
                  }>
                    {order.status === 'ready' ? 'MENUNGGU DIAMBIL' : 'DALAM PERJALANAN'}
                  </Badge>
                </div>
                
                <div className="p-4 space-y-4">
                  <div className="flex gap-3 text-sm">
                    <MapPin className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="font-medium">Alamat Pengiriman</p>
                      <p className="text-muted-foreground line-clamp-2">
                        {order.notes || "Alamat tidak tertulis di catatan. Silakan hubungi kasir/pelanggan."}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 text-sm">
                    <Phone className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="font-medium">Total Tagihan</p>
                      <p className="font-bold text-primary">{formatRupiah(order.total)} <span className="text-muted-foreground font-normal">({order.payment_method === 'cash' ? 'Bayar Tunai / COD' : 'Sudah Dibayar'})</span></p>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    {order.customer_phone && (
                      <Button 
                        variant="outline"
                        size="icon"
                        className="border-green-200 text-green-700 hover:bg-green-50 shrink-0"
                        onClick={() => window.open(`https://wa.me/${order.customer_phone?.replace(/^0/, '62').replace(/\D/g, '')}`, '_blank')}
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      className="flex-1 border-teal-200 text-teal-700 hover:bg-teal-50"
                      onClick={() => openGoogleMaps(order.notes || order.customer_name || "")}
                    >
                      <Navigation className="w-4 h-4 mr-2" /> Peta
                    </Button>
                    
                    {order.status === 'ready' ? (
                      <Button 
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                        onClick={() => handleUpdateStatus(order.id, 'delivering')}
                      >
                        Ambil
                      </Button>
                    ) : (
                      <Button 
                        className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                        onClick={() => handleUpdateStatus(order.id, 'delivered')}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Selesai
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <Clock className="w-5 h-5 text-muted-foreground" /> Riwayat Antaran Hari Ini
        </h2>
        {historyOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada pesanan selesai hari ini.</p>
        ) : (
          <div className="space-y-2">
            {historyOrders.map(order => (
              <div key={order.id} className="flex justify-between items-center p-3 bg-card border rounded-lg shadow-sm">
                <div>
                  <p className="font-medium">{order.customer_name || 'Pelanggan'}</p>
                  <p className="text-xs text-muted-foreground font-mono">{order.order_number}</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Selesai</Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(order.updated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
