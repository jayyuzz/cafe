"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah, cn } from "@/lib/utils";
import { TAX_PERCENTAGE, MAX_TABLES } from "@/lib/constants";
import { Product, Category, ProductVariant } from "@/types/database";
import { Search, UtensilsCrossed, Trash2, Plus, Minus, MessageSquare, Calculator, Delete, ShoppingCart, Coffee, Utensils, CupSoda, Cookie, LayoutGrid, Cake } from "lucide-react";
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
  const [customerName, setCustomerName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris">("cash");
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [showKeypad, setShowKeypad] = useState(false);
  
  // Mobile responsive state
  const [isCartOpenMobile, setIsCartOpenMobile] = useState(false);

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
      newCart[index] = { ...newCart[index], quantity: newCart[index].quantity + delta };
      if (newCart[index].quantity <= 0) {
        return newCart.filter((_, i) => i !== index);
      }
      return newCart;
    });
  };

  const updateNotes = (index: number, notes: string) => {
    setCart((prev) => {
      const newCart = [...prev];
      newCart[index] = { ...newCart[index], notes };
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
    const orderNumber = `MVE-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*1000).toString().padStart(3,'0')}`;

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
      
      // Catat log aktivitas
      import("@/lib/log-activity").then(({ logActivity }) => {
        logActivity(
          "CREATE_ORDER", 
          `Pesanan baru ${orderNumber} dibuat (Total: ${formatRupiah(total)})`
        );
      });

      setCart([]);
      setCustomerName("");
      setTableNumber(null);
      setAmountReceived(0);
    }
    setIsProcessing(false);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden relative">
      {/* Left Panel */}
      <div className={cn("flex-1 flex-col p-4 border-r border-border overflow-hidden", isCartOpenMobile ? "hidden lg:flex" : "flex")}>
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
          <TabsList className="w-full justify-start overflow-x-auto hide-scrollbar">
            <TabsTrigger value="semua">
              <LayoutGrid className="w-4 h-4 mr-2" />
              Semua
            </TabsTrigger>
            {categories.map((c) => {
              const lower = c.name.toLowerCase();
              let Icon = UtensilsCrossed;
              if (lower.includes("coffee") || lower.includes("kopi")) Icon = Coffee;
              else if (lower.includes("non") || lower.includes("minuman") || lower.includes("soda")) Icon = CupSoda;
              else if (lower.includes("berat") || lower.includes("makanan") || lower.includes("food")) Icon = Utensils;
              else if (lower.includes("snack") || lower.includes("camilan")) Icon = Cookie;
              else if (lower.includes("dessert") || lower.includes("kue") || lower.includes("cake")) Icon = Cake;

              return (
                <TabsTrigger key={c.id} value={c.id}>
                  <Icon className="w-4 h-4 mr-2" />
                  {c.name}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        <div className="flex-1 overflow-y-auto hide-scrollbar">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => product.is_available && addToCart(product)}
                className={cn(
                  "border rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md bg-card",
                  !product.is_available && "opacity-50 cursor-not-allowed grayscale"
                )}
              >
                <div className="h-32 bg-muted flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                  <p className="font-bold text-primary text-sm mt-1">{formatRupiah(product.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className={cn("w-full lg:w-[340px] shrink-0 flex-col bg-muted/10 overflow-y-auto hide-scrollbar", isCartOpenMobile ? "flex" : "hidden lg:flex")}>
        <div className="p-4 border-b border-border bg-background/50 shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Pesanan Baru</h2>
            <Button variant="ghost" size="icon" onClick={() => setCart([])} className="text-red-500 hover:text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex gap-2 mb-3">
            <Button 
              variant={orderType === "dine_in" ? "default" : "outline"} 
              className="flex-1 text-xs h-8"
              onClick={() => setOrderType("dine_in")}
            >
              Makan Sini
            </Button>
            <Button 
              variant={orderType === "take_away" ? "default" : "outline"} 
              className="flex-1 text-xs h-8"
              onClick={() => { setOrderType("take_away"); setTableNumber(null); }}
            >
              Bawa Pulang
            </Button>
          </div>

          {orderType === "dine_in" && (
            <select 
              className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs mb-3"
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
            className="h-8 text-xs"
            placeholder="Nama pelanggan (opsional)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>

        <div className="overflow-y-auto p-3 space-y-2 h-[260px] shrink-0 hide-scrollbar bg-background/30">
          {cart.map((item, index) => {
            const itemPrice = item.product.price + (item.variant?.additional_price || 0);
            return (
              <div key={`${item.product.id}-${item.variant?.id}-${index}`} className="flex items-center gap-2 p-2 bg-background rounded-md border shadow-sm">
                <div className="flex-1 min-w-0 flex items-center">
                  <h4 className="font-semibold text-xs truncate" title={item.product.name}>
                    {item.product.name}
                    {item.variant && <span className="font-normal text-muted-foreground ml-1">({item.variant.name})</span>}
                  </h4>
                </div>
                
                <div className="text-xs font-bold text-primary shrink-0 mr-2">
                  {formatRupiah(itemPrice)}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6 rounded-md mr-1 shrink-0 transition-colors",
                    item.notes ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => {
                    const note = window.prompt(`Catatan untuk ${item.product.name}:`, item.notes);
                    if (note !== null) updateNotes(index, note);
                  }}
                  title={item.notes ? `Catatan: ${item.notes}` : "Tambah catatan"}
                >
                  <MessageSquare className={cn("h-4 w-4", item.notes && "fill-current")} />
                </Button>

                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="outline" size="icon" className="h-6 w-6 rounded-md" onClick={() => updateQuantity(index, -1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-xs font-medium w-4 text-center">{item.quantity}</span>
                  <Button variant="outline" size="icon" className="h-6 w-6 rounded-md" onClick={() => updateQuantity(index, 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground mt-10">
              <UtensilsCrossed className="h-12 w-12 mb-2 opacity-20" />
              <p>Belum ada pesanan</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border space-y-3 shrink-0 mt-auto bg-background/50">
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
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Nominal uang diterima"
                  value={amountReceived || ""}
                  onChange={(e) => setAmountReceived(Number(e.target.value))}
                  className="flex-1 text-lg font-semibold"
                />
                <Button 
                  variant={showKeypad ? "default" : "outline"} 
                  size="icon" 
                  onClick={() => setShowKeypad(!showKeypad)}
                >
                  <Calculator className="h-5 w-5" />
                </Button>
              </div>

              {showKeypad && (
                <div className="grid grid-cols-3 gap-2 bg-muted/20 p-2 rounded-lg border">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "000"].map((btn) => (
                    <Button 
                      key={btn} 
                      variant={btn === "C" ? "destructive" : "outline"} 
                      className="h-10 font-semibold text-lg"
                      onClick={() => {
                        if (btn === "C") setAmountReceived(0);
                        else {
                          const currentStr = (amountReceived || 0).toString();
                          // Prevent leading zeros issues
                          const newVal = currentStr === "0" && btn !== "000" ? btn : currentStr + btn;
                          setAmountReceived(Number(newVal));
                        }
                      }}
                    >
                      {btn}
                    </Button>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button variant="destructive" size="sm" onClick={() => setAmountReceived(0)} className="min-w-[40px]">
                  C
                </Button>
                {[10000, 20000, 50000, 100000].map(amt => (
                  <Button key={amt} variant="outline" size="sm" onClick={() => setAmountReceived(prev => (prev || 0) + amt)} className="flex-1 min-w-[60px]">
                    +{amt / 1000}k
                  </Button>
                ))}
                <Button variant="secondary" size="sm" onClick={() => setAmountReceived(total)} className="flex-1 min-w-[60px]">Pas</Button>
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

      {/* Mobile Cart Toggle Button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <Button 
          onClick={() => setIsCartOpenMobile(!isCartOpenMobile)} 
          className="rounded-full h-14 px-6 shadow-xl"
        >
          {isCartOpenMobile ? (
            <>
              <UtensilsCrossed className="mr-2 h-5 w-5" />
              Menu
            </>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-5 w-5" />
              Pesanan ({cart.length})
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
