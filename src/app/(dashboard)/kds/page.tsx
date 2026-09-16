"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Order, OrderItem } from "@/types/database";
import { formatRupiah } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Clock, CheckCircle2, ChefHat, Play, UtensilsCrossed, Bell, CheckSquare } from "lucide-react";

type OrderWithItems = Order & { order_items: OrderItem[] };

// Fungsi untuk membunyikan suara (Voice TTS)
const playVoiceNotification = () => {
  try {
    // 1. Coba gunakan Speech Synthesis (Suara Robot Google/Browser)
    if ('speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance("Ada pesanan baru masuk!");
      msg.lang = 'id-ID'; // Bahasa Indonesia
      msg.rate = 1.0;     // Kecepatan normal
      msg.pitch = 1.1;    // Nada sedikit tinggi agar terdengar ramah
      window.speechSynthesis.speak(msg);
      return;
    }

    // 2. Fallback: Jika tidak mendukung Voice, gunakan Web Audio API (Lonceng)
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime); 
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1); 
    
    gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.error("Audio/Voice play error: ", e);
  }
};

export default function KDSPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [soundEnabled, setSoundEnabled] = useState(true);
  const supabase = createClient();
  const prevOrdersCount = useRef(0);

  const fetchOrders = async (isRealtimeUpdate = false) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .gte("created_at", today.toISOString())
      .in("status", ["pending", "processing"])
      .order("created_at", { ascending: true });

    if (data) {
      setOrders(data as OrderWithItems[]);
      
      // Jika dari update realtime dan ada order bertambah, bunyikan suara
      if (isRealtimeUpdate && data.length > prevOrdersCount.current && soundEnabled) {
        playVoiceNotification();
      }
      prevOrdersCount.current = data.length;
    }
  };

  useEffect(() => {
    fetchOrders();

    // Subscribe ke Realtime Supabase
    const channel = supabase
      .channel('kds_orders_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Realtime orders change received!', payload);
          fetchOrders(payload.eventType === 'INSERT');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [soundEnabled, supabase]);

  const updateStatus = async (orderId: string, newStatus: "processing" | "ready") => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (error) {
      toast.error("Gagal memperbarui status");
    } else {
      toast.success(newStatus === "processing" ? "Pesanan mulai dibuat" : "Pesanan siap disajikan!");
      fetchOrders();
    }
  };

  const toggleCheckItem = (itemId: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const pendingOrders = orders.filter(o => o.status === "pending");
  const processingOrders = orders.filter(o => o.status === "processing");

  // Hitung rekap/summary
  const summaryMenu: Record<string, number> = {};
  orders.forEach(o => {
    o.order_items.forEach(item => {
      const name = item.product_name + (item.variant_name ? ` (${item.variant_name})` : '');
      summaryMenu[name] = (summaryMenu[name] || 0) + item.quantity;
    });
  });

  const renderOrderCard = (order: OrderWithItems) => {
    const timeDiffMinutes = Math.floor((new Date().getTime() - new Date(order.created_at).getTime()) / 60000);
    
    return (
      <div key={order.id} className="bg-card border shadow-sm rounded-lg flex flex-col transition-all hover:shadow-md h-full">
        <div className={`px-4 py-2 flex justify-between items-center text-primary-foreground ${order.status === 'pending' ? 'bg-amber-600' : 'bg-blue-600'}`}>
          <div className="font-bold text-lg">{order.order_number.slice(-4)}</div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="w-4 h-4" /> {timeDiffMinutes}m
          </div>
        </div>
        
        <div className="px-4 py-2 border-b bg-muted/30 flex justify-between items-center text-sm">
          <span className="font-medium text-muted-foreground">{order.order_type.replace('_', ' ').toUpperCase()}</span>
          {order.table_number && <Badge variant="outline" className="font-bold bg-background text-foreground">Meja {order.table_number}</Badge>}
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <p className="font-semibold text-sm mb-3">Pelanggan: {order.customer_name || "Tamu"}</p>
          <ul className="space-y-3">
            {order.order_items.map(item => {
              const addons = item.addons || [];
              const isChecked = checkedItems[item.id];
              return (
                <li 
                  key={item.id} 
                  className={`flex gap-2 text-sm p-2 rounded-md cursor-pointer transition-all hover:bg-muted/50 ${isChecked ? 'opacity-40 grayscale line-through' : ''}`}
                  onClick={() => toggleCheckItem(item.id)}
                >
                  <div className="font-bold text-lg min-w-[24px]">{item.quantity}x</div>
                  <div className="flex-1">
                    <div className="font-medium leading-tight">
                      {item.product_name}
                      {item.variant_name && <span className="font-normal text-muted-foreground ml-1">({item.variant_name})</span>}
                    </div>
                    {addons.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-0.5">+ {addons.map((a:any) => a.name).join(', ')}</div>
                    )}
                    {item.notes && (
                      <div className="text-xs text-red-600 font-medium mt-1 bg-red-50 p-1 rounded-sm border border-red-100">
                        Catatan: {item.notes}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        
        <div className="p-4 border-t mt-auto bg-muted/10">
          {order.status === "pending" ? (
            <Button onClick={() => updateStatus(order.id, "processing")} className="w-full font-bold bg-blue-600 hover:bg-blue-700" size="lg">
              <Play className="w-5 h-5 mr-2" /> Mulai Buat
            </Button>
          ) : (
            <Button onClick={() => updateStatus(order.id, "ready")} className="w-full font-bold bg-emerald-600 hover:bg-emerald-700" size="lg">
              <CheckCircle2 className="w-5 h-5 mr-2" /> Selesai & Siap
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 max-w-full mx-auto h-[calc(100vh-4rem)] flex flex-col gap-4">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ChefHat className="w-8 h-8 text-primary" /> Kitchen Display
          </h1>
          <p className="text-muted-foreground mt-1">Layar pemantauan pesanan dapur secara real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant={soundEnabled ? "default" : "outline"} 
            size="sm" 
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playVoiceNotification(); // Test sound
            }}
            className={soundEnabled ? "bg-amber-600 hover:bg-amber-700" : ""}
          >
            <Bell className="w-4 h-4 mr-2" /> 
            {soundEnabled ? "Notifikasi Suara: Nyala" : "Notifikasi Suara: Mati"}
          </Button>
          <Button onClick={() => fetchOrders()} variant="outline" size="sm">
            Refresh Manual
          </Button>
        </div>
      </div>

      {/* Rekap Menu Area */}
      {Object.keys(summaryMenu).length > 0 && (
        <div className="bg-card border rounded-lg p-3 shadow-sm flex flex-wrap items-center gap-3">
          <div className="font-bold flex items-center text-sm text-muted-foreground mr-2">
            <CheckSquare className="w-4 h-4 mr-1" /> Rekap Perlu Dibuat:
          </div>
          {Object.entries(summaryMenu).map(([name, qty]) => (
            <Badge key={name} variant="secondary" className="text-sm px-2 py-1">
              {qty}x {name}
            </Badge>
          ))}
        </div>
      )}

      {/* Board Area */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
        {/* Kolom Menunggu */}
        <div className="flex flex-col bg-amber-50/50 dark:bg-amber-950/10 rounded-xl border border-amber-200/50 dark:border-amber-900/30 overflow-hidden shadow-inner">
          <div className="bg-amber-100 dark:bg-amber-900/40 py-3 px-4 flex justify-between items-center border-b border-amber-200/50 dark:border-amber-900/50">
            <h2 className="font-bold text-amber-800 dark:text-amber-400 flex items-center text-lg">
              <Clock className="w-5 h-5 mr-2" /> Menunggu Dibuat
            </h2>
            <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-bold">{pendingOrders.length}</Badge>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            {pendingOrders.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-amber-600/50 opacity-50">
                <UtensilsCrossed className="w-16 h-16 mb-4" />
                <p className="font-medium text-lg">Dapur Kosong</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {pendingOrders.map(renderOrderCard)}
              </div>
            )}
          </div>
        </div>

        {/* Kolom Sedang Dibuat */}
        <div className="flex flex-col bg-blue-50/50 dark:bg-blue-950/10 rounded-xl border border-blue-200/50 dark:border-blue-900/30 overflow-hidden shadow-inner">
          <div className="bg-blue-100 dark:bg-blue-900/40 py-3 px-4 flex justify-between items-center border-b border-blue-200/50 dark:border-blue-900/50">
            <h2 className="font-bold text-blue-800 dark:text-blue-400 flex items-center text-lg">
              <ChefHat className="w-5 h-5 mr-2" /> Sedang Dibuat
            </h2>
            <Badge className="bg-blue-500 hover:bg-blue-600 text-white font-bold">{processingOrders.length}</Badge>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            {processingOrders.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-blue-600/50 opacity-50">
                <CheckCircle2 className="w-16 h-16 mb-4" />
                <p className="font-medium text-lg">Belum Ada Antrian Dapur</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {processingOrders.map(renderOrderCard)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
