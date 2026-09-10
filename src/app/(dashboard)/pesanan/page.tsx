"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah, cn, formatDate } from "@/lib/utils";
import { Order } from "@/types/database";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Utensils, ShoppingBag } from "lucide-react";

export default function PesananPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<string>("semua");
  const supabase = createClient();

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*, product:products(*))")
      .order("created_at", { ascending: false });
    if (data) setOrders(data);
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("orders_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          fetchOrders();
          if (payload.eventType === "INSERT") {
            toast("Ada pesanan baru masuk.");
          } else if (payload.eventType === "UPDATE") {
            toast("Pesanan diperbarui.");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const updateOrderStatus = async (id: string, status: Order["status"], orderNumber: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast.error("Gagal update status");
    } else {
      toast.success(`Status diubah menjadi ${status}`);
      
      // Catat log
      import("@/lib/log-activity").then(({ logActivity }) => {
        logActivity(
          "UPDATE_STATUS", 
          `Status pesanan ${orderNumber} diubah menjadi ${status}`
        );
      });

      fetchOrders();
    }
  };

  const filteredOrders = orders.filter(
    (o) => activeTab === "semua" || o.status === activeTab
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "processing": return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "ready": return "bg-green-100 text-green-800 hover:bg-green-200";
      case "completed": return "bg-gray-100 text-gray-800 hover:bg-gray-200";
      case "cancelled": return "bg-red-100 text-red-800 hover:bg-red-200";
      default: return "bg-gray-100 text-gray-800";
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

  const tabs = [
    { id: "semua", label: "Semua" },
    { id: "pending", label: "Menunggu" },
    { id: "processing", label: "Diproses" },
    { id: "ready", label: "Siap" },
    { id: "completed", label: "Selesai" },
    { id: "cancelled", label: "Dibatalkan" },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Manajemen Pesanan</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap h-auto w-full justify-start gap-2 bg-transparent">
          {tabs.map((tab) => {
            const count = tab.id === "semua" ? orders.length : orders.filter(o => o.status === tab.id).length;
            return (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border rounded-full px-4 py-2"
              >
                {tab.label} <span className="ml-2 text-xs opacity-70">({count})</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="overflow-hidden flex flex-col">
            <div className="bg-muted p-3 border-b flex justify-between items-center">
              <div>
                <p className="font-semibold">{order.order_number}</p>
                <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
              </div>
              <Badge className={cn("capitalize", getStatusColor(order.status))} variant="secondary">
                {getStatusLabel(order.status)}
              </Badge>
            </div>
            
            <CardContent className="p-4 flex-1 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="font-medium text-lg">
                  {order.customer_name || "Tamu"}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                  {order.order_type === "dine_in" ? (
                    <><Utensils className="h-4 w-4" /> Meja {order.table_number}</>
                  ) : (
                    <><ShoppingBag className="h-4 w-4" /> Takeaway</>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm flex-1">
                {(order as any).order_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <span className="font-medium">
                      {item.quantity}x {item.product?.name}
                    </span>
                    <span className="text-muted-foreground">{formatRupiah(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t flex justify-between items-center font-bold text-lg">
                <span>Total</span>
                <span>{formatRupiah(order.total)}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-2">
                {order.status === "pending" && (
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => updateOrderStatus(order.id, "processing", order.order_number)}>
                    Proses
                  </Button>
                )}
                {order.status === "processing" && (
                  <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => updateOrderStatus(order.id, "ready", order.order_number)}>
                    Siap
                  </Button>
                )}
                {order.status === "ready" && (
                  <Button className="flex-1 bg-gray-800 hover:bg-gray-900" onClick={() => updateOrderStatus(order.id, "completed", order.order_number)}>
                    Selesai
                  </Button>
                )}
                {!["completed", "cancelled"].includes(order.status) && (
                  <Button variant="destructive" className="flex-none" onClick={() => updateOrderStatus(order.id, "cancelled", order.order_number)}>
                    Batalkan
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredOrders.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            Tidak ada pesanan ditemukan.
          </div>
        )}
      </div>
    </div>
  );
}
