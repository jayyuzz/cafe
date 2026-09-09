"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah, cn } from "@/lib/utils";
import { TAX_PERCENTAGE, MAX_TABLES } from "@/lib/constants";
import { Product, Category, ProductVariant } from "@/types/database";
import { Search, UtensilsCrossed, Trash2, Plus, Minus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

type CartItem = {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  notes: string;
};

export default function POSPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("semua");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<"dine_in" | "take_away">("dine_in");
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris">("cash");
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: cats } = await supabase.from("categories").select("*").order("name");
      if (cats) setCategories(cats);

      const { data: prods } = await supabase.from("products").select("*, product_variants(*)").order("name");
      if (prods) setProducts(prods);
    }
    fetchData();
  }, [supabase]);

  const filteredProducts = products.filter((p) => {
    const matchCategory = activeCategory === "semua" || p.category_id === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const addToCart = (product: Product, variant?: ProductVariant) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id && item.variant?.id === variant?.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id && item.variant?.id === variant?.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, variant, quantity: 1, notes: "" }];
    });
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const newCart = [...prev];
      newCart[index].quantity += delta;
      if (newCart[index].quantity <= 0) {
        return newCart.filter((_, i) => i !== index);
      }
      return newCart;
    });
  };

  const updateNotes = (index: number, notes: string) => {
    setCart((prev) => {
      const newCart = [...prev];
      newCart[index].notes = notes;
      return newCart;
    });
  };

  const subtotal = cart.reduce((sum, item) => {
    const price = item.product.price + (item.variant?.additional_price || 0);
    return sum + price * item.quantity;
  }, 0);

  const discount = 0; // Implement discount logic if needed
  const tax = (subtotal - discount) * (TAX_PERCENTAGE / 100);
  const total = subtotal - discount + tax;

  const handleProcessOrder = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === "cash" && amountReceived < total) {
      toast.error("Uang tidak cukup");
      return;
    }

    setIsProcessing(true);
    const orderNumber = `YND-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*1000).toString().padStart(3,'0')}`;

    const { data: order, error: orderError } = await supabase.from("orders").insert({
      outlet_id: cart[0].product.outlet_id,
      order_number: orderNumber,
      customer_name: customerName || "Tamu",
      order_type: orderType,
      table_number: tableNumber,
      status: "pending",
      subtotal,
      tax_amount: tax,
      discount_amount: discount,
      total: total,
      payment_method: paymentMethod,
      cash_received: paymentMethod === "cash" ? amountReceived : total,
      change_amount: paymentMethod === "cash" ? amountReceived - total : 0,
    }).select().single();

    if (orderError || !order) {
      toast.error("Gagal membuat pesanan");
      setIsProcessing(false);
      return;
    }

    const orderItems = cart.map(item => ({
      order_id: order.id,
      product_id: item.product.id,
      variant_id: item.variant?.id,
      product_name: item.product.name,
      variant_name: item.variant?.name,
      quantity: item.quantity,
      unit_price: item.product.price + (item.variant?.additional_price || 0),
      subtotal: (item.product.price + (item.variant?.additional_price || 0)) * item.quantity,
      notes: item.notes
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

    if (itemsError) {
      toast.error("Gagal menyimpan item pesanan");
    } else {
      toast.success("Pesanan berhasil diproses");
      setCart([]);

      setCustomerName("");
      setTableNumber(null);
      setAmountReceived(0);
    }
    setIsProcessing(false);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Left Panel */}
      <div className="w-[60%] flex flex-col p-4 border-r overflow-hidden">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari produk..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <Tabs defaultValue="semua" className="w-full mb-4" onValueChange={setActiveCategory}>
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="semua">Semua</TabsTrigger>
            {categories.map((c) => (
              <TabsTrigger key={c.id} value={c.id}>{c.name}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => product.is_available && addToCart(product)}
                className={cn(
                  "border rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md",
                  !product.is_available && "opacity-50 cursor-not-allowed grayscale"
                )}
              >
                <div className="h-32 bg-muted flex items-center justify-center">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                  <p className="text-sm font-bold text-primary mt-1">{formatRupiah(product.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-[40%] flex flex-col bg-muted/30">
        <div className="p-4 border-b flex justify-between items-center bg-background">
          <h2 className="font-bold text-lg">Pesanan Baru</h2>
          <Button variant="ghost" size="icon" onClick={() => setCart([])} disabled={cart.length === 0}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>

        <div className="p-4 space-y-4 border-b bg-background">
          <div className="flex gap-2">
            <Button
              variant={orderType === "dine_in" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setOrderType("dine_in")}
            >
              Makan di tempat
            </Button>
            <Button
              variant={orderType === "take_away" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setOrderType("take_away")}
            >
              Bawa pulang
            </Button>
          </div>

          {orderType === "dine_in" && (
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={tableNumber || ""}
              onChange={(e) => setTableNumber(Number(e.target.value))}
            >
              <option value="">Pilih Nomor Meja</option>
              {Array.from({ length: MAX_TABLES }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>Meja {n}</option>
              ))}
            </select>
          )}
          
          <Input
            placeholder="Nama pelanggan (opsional)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.map((item, index) => {
            const itemPrice = item.product.price + (item.variant?.additional_price || 0);
            return (
              <div key={`${item.product.id}-${item.variant?.id}-${index}`} className="flex flex-col gap-2 p-3 bg-background rounded-lg border">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-sm">{item.product.name}</h4>
                    {item.variant && <p className="text-xs text-muted-foreground">{item.variant.name}</p>}
                    <p className="text-xs font-semibold">{formatRupiah(itemPrice)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(index, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm w-4 text-center">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(index, 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Input
                  placeholder="Catatan..."
                  className="h-7 text-xs"
                  value={item.notes}
                  onChange={(e) => updateNotes(index, e.target.value)}
                />
              </div>
            );
          })}
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <UtensilsCrossed className="h-12 w-12 mb-2 opacity-20" />
              <p>Belum ada pesanan</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-background border-t space-y-3">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatRupiah(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Diskon</span><span>-{formatRupiah(discount)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">PB1 (10%)</span><span>{formatRupiah(tax)}</span></div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Total</span><span>{formatRupiah(total)}</span></div>
          </div>

          <div className="flex gap-2">
            <Button
              variant={paymentMethod === "cash" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setPaymentMethod("cash")}
            >
              Tunai
            </Button>
            <Button
              variant={paymentMethod === "qris" ? "default" : "outline"}
              className="flex-1"
              onClick={() => { setPaymentMethod("qris"); setAmountReceived(total); }}
            >
              QRIS
            </Button>
          </div>

          {paymentMethod === "cash" && (
            <div className="space-y-2">
              <Input
                type="number"
                placeholder="Nominal uang diterima"
                value={amountReceived || ""}
                onChange={(e) => setAmountReceived(Number(e.target.value))}
              />
              <div className="flex flex-wrap gap-2">
                {[10000, 20000, 50000, 100000].map(amt => (
                  <Button key={amt} variant="outline" size="sm" onClick={() => setAmountReceived(amt)} className="flex-1 min-w-[70px]">
                    {amt / 1000}k
                  </Button>
                ))}
                <Button variant="secondary" size="sm" onClick={() => setAmountReceived(total)} className="flex-1 min-w-[70px]">Pas</Button>
              </div>
              <div className="flex justify-between text-sm font-medium pt-2 text-primary">
                <span>Kembalian:</span>
                <span>{formatRupiah(Math.max(0, amountReceived - total))}</span>
              </div>
            </div>
          )}

          <Button 
            className="w-full py-6 text-lg"
            disabled={cart.length === 0 || isProcessing || (paymentMethod === "cash" && amountReceived < total)}
            onClick={handleProcessOrder}
          >
            {isProcessing ? "Memproses..." : "Proses Pesanan"}
          </Button>
        </div>
      </div>
    </div>
  );
}
