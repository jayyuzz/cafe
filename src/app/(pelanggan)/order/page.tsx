"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah, cn } from "@/lib/utils";
import { TAX_PERCENTAGE } from "@/lib/constants";
import type { Category, Product, ProductVariant, Outlet } from "@/types/database";
import {
  ShoppingCart, Search, UtensilsCrossed, Plus, Minus, Trash2,
  X, Coffee, CupSoda, Utensils, Cookie, Cake, LayoutGrid,
  ChevronDown, MapPin, Bike, MessageSquare, ChevronRight,
  Star, QrCode, Banknote, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

/* ─── Types ──────────────────────────────────────────────────────────────── */
type CartItem = {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  notes: string;
};
type PaymentMethod = "qris" | "cash" | null;

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function getCategoryIcon(name: string) {
  const l = name.toLowerCase();
  if (l.includes("coffee") || l.includes("kopi")) return Coffee;
  if (l.includes("non") || l.includes("minuman") || l.includes("soda")) return CupSoda;
  if (l.includes("berat") || l.includes("makanan") || l.includes("food")) return Utensils;
  if (l.includes("snack") || l.includes("camilan")) return Cookie;
  if (l.includes("dessert") || l.includes("kue") || l.includes("cake")) return Cake;
  return UtensilsCrossed;
}

/* ─── Skeleton ───────────────────────────────────────────────────────────── */
function ProductSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-border/50 bg-white animate-pulse">
      <div className="h-[130px] bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="flex justify-between items-center mt-2">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-7 w-7 bg-muted rounded-full" />
        </div>
      </div>
    </div>
  );
}

/* ─── Payment Method Cards ───────────────────────────────────────────────── */
function PaymentMethodPicker({
  value,
  onChange,
}: {
  value: PaymentMethod;
  onChange: (v: PaymentMethod) => void;
}) {
  const options: { id: PaymentMethod; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
    {
      id: "qris",
      label: "QRIS",
      desc: "Scan QR Code — GoPay, OVO, Dana, dll.",
      icon: <QrCode className="h-5 w-5" />,
      color: "from-violet-600 to-purple-700",
    },
    {
      id: "cash",
      label: "Bayar di Kasir",
      desc: "Bayar tunai / kartu langsung di kasir",
      icon: <Banknote className="h-5 w-5" />,
      color: "from-amber-700 to-amber-900",
    },
  ];

  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const isSelected = value === opt.id;
        return (
          <button
            key={opt.id!}
            onClick={() => onChange(opt.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-left transition-all duration-150 active:scale-[0.98]",
              isSelected
                ? "border-amber-900 bg-amber-50/60"
                : "border-border/60 bg-white hover:border-amber-900/30"
            )}
          >
            {/* Icon */}
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-white bg-gradient-to-br",
              opt.color
            )}>
              {opt.icon}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-bold", isSelected ? "text-amber-900" : "text-foreground")}>
                {opt.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{opt.desc}</p>
            </div>

            {/* Check */}
            <div className={cn(
              "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
              isSelected ? "border-amber-900 bg-amber-900" : "border-border"
            )}>
              {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-white fill-white stroke-[3]" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Main Page Content ──────────────────────────────────────────────────── */
function OrderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tableParam = searchParams.get("table");
  const outletParam = searchParams.get("outlet");

  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState("semua");
  const [searchQuery, setSearchQuery] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showVariantPicker, setShowVariantPicker] = useState<Product | null>(null);

  const [orderType, setOrderType] = useState<"dine_in" | "take_away">(
    tableParam ? "dine_in" : "take_away"
  );
  const [tableNumber, setTableNumber] = useState<number | null>(
    tableParam ? parseInt(tableParam) : null
  );
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [noteTarget, setNoteTarget] = useState<number | null>(null);
  const [noteValue, setNoteValue] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const supabase = createClient();

  /* ── Fetch ─────────────────────────────────────────────────────────────── */
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);

      // Coba cari outlet berdasarkan param, fallback ke outlet pertama
      let outletData = null;

      if (outletParam) {
        const { data } = await supabase
          .from("outlets")
          .select("*")
          .eq("id", outletParam)
          .single();
        outletData = data;
      }

      // Fallback: ambil outlet pertama jika param kosong atau tidak ditemukan
      if (!outletData) {
        const { data } = await supabase
          .from("outlets")
          .select("*")
          .eq("is_active", true)
          .limit(1)
          .single();
        outletData = data;
      }

      if (outletData) setOutlet(outletData);

      const id = outletData?.id;
      if (!id) { setIsLoading(false); return; }

      const [{ data: cats }, { data: prods }] = await Promise.all([
        supabase.from("categories").select("*").eq("outlet_id", id).eq("is_active", true).order("sort_order"),
        supabase.from("products").select("*, product_variants(*)").eq("outlet_id", id).order("name"),
      ]);
      if (cats) setCategories(cats);
      if (prods) setProducts(prods as any);
      setIsLoading(false);
    }
    fetchData();
  }, [outletParam]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Cart helpers ──────────────────────────────────────────────────────── */
  const addToCart = useCallback((product: Product, variant?: ProductVariant) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id && i.variant?.id === variant?.id);
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id && i.variant?.id === variant?.id
            ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, variant, quantity: 1, notes: "" }];
    });
    toast.success(`${product.name} ditambahkan`, { duration: 1500 });
  }, []);

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => {
      const next = [...prev];
      next[index] = { ...next[index], quantity: next[index].quantity + delta };
      if (next[index].quantity <= 0) return next.filter((_, i) => i !== index);
      return next;
    });
  };

  const handleProductTap = (product: Product) => {
    if (!product.is_available) return;
    const variants: ProductVariant[] = (product as any).product_variants ?? [];
    if (variants.length > 0) setShowVariantPicker(product);
    else addToCart(product);
  };

  /* ── Totals ────────────────────────────────────────────────────────────── */
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.reduce((s, i) => {
    const price = i.product.price + (i.variant?.additional_price ?? 0);
    return s + price * i.quantity;
  }, 0);
  const tax = subtotal * (TAX_PERCENTAGE / 100);
  const total = subtotal + tax;

  /* ── Submit ────────────────────────────────────────────────────────────── */
  const handleSubmitOrder = async () => {
    if (cart.length === 0 || !outlet || !paymentMethod) return;
    if (orderType === "dine_in" && !tableNumber) {
      toast.error("Pilih nomor meja terlebih dahulu");
      return;
    }

    setIsSubmitting(true);
    const orderNumber = `YND-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 9000 + 1000)}`;

    const { data: order, error: orderError } = await supabase.from("orders").insert({
      outlet_id: outlet.id,
      order_number: orderNumber,
      customer_name: customerName.trim() || "Tamu",
      order_type: orderType,
      table_number: orderType === "dine_in" ? tableNumber : null,
      status: "pending",
      subtotal,
      tax_amount: tax,
      tax_percentage: TAX_PERCENTAGE,
      discount_amount: 0,
      total,
      payment_method: paymentMethod,
      notes: null,
    }).select().single();

    if (orderError || !order) {
      toast.error("Gagal membuat pesanan. Coba lagi.");
      setIsSubmitting(false);
      return;
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      cart.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        variant_id: item.variant?.id ?? null,
        product_name: item.product.name,
        variant_name: item.variant?.name ?? null,
        quantity: item.quantity,
        unit_price: item.product.price + (item.variant?.additional_price ?? 0),
        subtotal: (item.product.price + (item.variant?.additional_price ?? 0)) * item.quantity,
        notes: item.notes || null,
      }))
    );

    if (itemsError) {
      toast.error("Gagal menyimpan item pesanan");
      setIsSubmitting(false);
      return;
    }

    const params = new URLSearchParams({
      no: orderNumber,
      total: String(total),
      table: String(tableNumber ?? ""),
      type: orderType,
      method: paymentMethod,
      outlet: outlet.id,
    });
    router.push(`/order/sukses?${params.toString()}`);
  };

  /* ── Filtered products ─────────────────────────────────────────────────── */
  const filtered = products.filter(p => {
    const matchCat = activeCategory === "semua" || p.category_id === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const canSubmit = cart.length > 0 && paymentMethod !== null && !isSubmitting
    && (orderType === "take_away" || tableNumber !== null);

  /* ── Loading ────────────────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f7f4]">
        <div className="sticky top-0 z-40 bg-[#f8f7f4] border-b border-border/50 px-4 pt-4 pb-3 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-muted animate-pulse" />
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              <div className="h-3 w-20 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="h-11 bg-muted rounded-2xl animate-pulse" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => <div key={i} className="h-8 w-20 bg-muted rounded-full animate-pulse" />)}
          </div>
        </div>
        <div className="px-4 py-4 grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => <ProductSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (!outlet) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8f7f4] px-6">
        <div className="text-center">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <UtensilsCrossed className="h-10 w-10 text-muted-foreground/40" />
          </div>
          <h2 className="text-lg font-bold mb-1">Outlet tidak ditemukan</h2>
          <p className="text-sm text-muted-foreground">Pastikan kamu scan QR Code yang benar.</p>
        </div>
      </div>
    );
  }

  const allCategories = [
    { id: "semua", name: "Semua", icon: LayoutGrid },
    ...categories.map(c => ({ ...c, icon: getCategoryIcon(c.name) })),
  ];

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#f8f7f4] pb-36 select-none">

      {/* ══ HEADER ═════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-[#f8f7f4]/95 backdrop-blur-md">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              {outlet.logo_url ? (
                <img src={outlet.logo_url} alt={outlet.name}
                  className="h-11 w-11 rounded-2xl object-cover shadow-sm" />
              ) : (
                <div className="h-11 w-11 rounded-2xl bg-amber-900 flex items-center justify-center shadow-sm">
                  <Coffee className="h-5 w-5 text-amber-100" />
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-[#f8f7f4]" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold leading-tight truncate">{outlet.name}</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                {orderType === "dine_in" && tableNumber ? (
                  <>
                    <MapPin className="h-3 w-3 text-amber-700" />
                    <span className="text-xs text-amber-700 font-semibold">Meja {tableNumber}</span>
                  </>
                ) : orderType === "take_away" ? (
                  <>
                    <Bike className="h-3 w-3 text-blue-600" />
                    <span className="text-xs text-blue-600 font-semibold">Bawa Pulang</span>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">Pilih tipe di keranjang</span>
                )}
                <span className="text-muted-foreground/40 text-xs">•</span>
                <div className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs text-muted-foreground font-medium">4.9</span>
                </div>
              </div>
            </div>
            {cartCount > 0 && (
              <button
                onClick={() => setShowCart(true)}
                className="relative shrink-0 h-10 w-10 rounded-2xl bg-amber-900 flex items-center justify-center shadow-sm active:scale-95 transition-transform"
              >
                <ShoppingCart className="h-4.5 w-4.5 text-amber-100" />
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              </button>
            )}
          </div>

          <div className={cn(
            "relative mt-3 flex items-center transition-all",
            searchFocused ? "ring-2 ring-amber-900/30 rounded-2xl" : ""
          )}>
            <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
            <input
              type="search"
              placeholder="Cari menu favorit kamu..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="w-full pl-10 pr-4 h-11 rounded-2xl bg-white border border-border/40 text-sm shadow-sm focus:outline-none placeholder:text-muted-foreground/50"
            />
          </div>
        </div>

        <div className="flex gap-2 px-4 py-2.5 overflow-x-auto hide-scrollbar">
          {allCategories.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 h-8 rounded-full text-xs font-semibold shrink-0 transition-all duration-200",
                  isActive
                    ? "bg-amber-900 text-amber-50 shadow-sm shadow-amber-900/20"
                    : "bg-white text-muted-foreground border border-border/50 hover:border-amber-900/30"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.name}
              </button>
            );
          })}
        </div>
        <div className="h-px bg-border/40 mx-4" />
      </header>

      {/* ══ PRODUCT GRID ═══════════════════════════════════════════════════ */}
      <main className="px-4 pt-4">
        {!searchQuery && (
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-foreground/80">
              {activeCategory === "semua"
                ? "Semua Menu"
                : categories.find(c => c.id === activeCategory)?.name ?? "Menu"}
            </h2>
            <span className="text-xs text-muted-foreground">{filtered.length} item</span>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-muted-foreground">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-3">
              <UtensilsCrossed className="h-8 w-8 opacity-30" />
            </div>
            <p className="text-sm font-medium">Menu tidak ditemukan</p>
            <p className="text-xs mt-1 opacity-60">Coba kata kunci lain</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(product => {
              const variants: ProductVariant[] = (product as any).product_variants ?? [];
              const inCart = cart.filter(i => i.product.id === product.id).reduce((s, i) => s + i.quantity, 0);
              const isAvailable = product.is_available;
              return (
                <button
                  key={product.id}
                  onClick={() => handleProductTap(product)}
                  disabled={!isAvailable}
                  className={cn(
                    "group rounded-2xl overflow-hidden bg-white border border-border/40 shadow-sm text-left transition-all duration-200 active:scale-[0.97]",
                    !isAvailable && "opacity-60"
                  )}
                >
                  <div className="relative h-[130px] bg-muted/60 overflow-hidden">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name}
                        className={cn("w-full h-full object-cover transition-transform duration-300 group-active:scale-105", !isAvailable && "grayscale")} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <UtensilsCrossed className="h-10 w-10 text-muted-foreground/20" />
                      </div>
                    )}
                    {!isAvailable && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <span className="px-2.5 py-1 bg-black/70 text-white text-xs font-bold rounded-full">Habis</span>
                      </div>
                    )}
                    {inCart > 0 && isAvailable && (
                      <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-amber-900 flex items-center justify-center shadow-md">
                        <span className="text-[11px] font-bold text-amber-50">{inCart}</span>
                      </div>
                    )}
                    {variants.length > 0 && isAvailable && (
                      <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/50 backdrop-blur-sm rounded-md">
                        <span className="text-[10px] text-white font-medium">{variants.length} varian</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-[13px] font-semibold leading-tight line-clamp-2 mb-1">{product.name}</p>
                    {product.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mb-2">{product.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-amber-900">{formatRupiah(product.price)}</p>
                      {isAvailable && (
                        <div className={cn(
                          "h-7 w-7 rounded-full flex items-center justify-center transition-colors",
                          inCart > 0 ? "bg-amber-900 shadow-sm" : "bg-amber-900/10"
                        )}>
                          <Plus className={cn("h-3.5 w-3.5", inCart > 0 ? "text-amber-50" : "text-amber-900")} />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* ══ FLOATING CART BUTTON ═══════════════════════════════════════════ */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-4 right-4 z-50">
          <button
            onClick={() => setShowCart(true)}
            className="w-full flex items-center bg-amber-900 text-amber-50 pl-2 pr-4 py-2 rounded-2xl shadow-xl shadow-amber-900/30 active:scale-[0.98] transition-transform"
          >
            <div className="h-9 w-9 rounded-xl bg-amber-800 flex items-center justify-center mr-3 shrink-0">
              <span className="text-sm font-bold">{cartCount}</span>
            </div>
            <span className="text-sm font-semibold flex-1 text-left">Lihat Keranjang</span>
            <span className="text-sm font-bold">{formatRupiah(total)}</span>
            <ChevronRight className="h-4 w-4 ml-1 opacity-70" />
          </button>
        </div>
      )}

      {/* ══ VARIANT PICKER ════════════════════════════════════════════════ */}
      {showVariantPicker && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => setShowVariantPicker(null)} />
          <div className="relative w-full bg-white rounded-t-3xl shadow-2xl">
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 bg-border rounded-full" />
            </div>
            <div className="px-5 pt-2 pb-3 border-b border-border/50">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-base">{showVariantPicker.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Pilih ukuran atau varian</p>
                </div>
                <button onClick={() => setShowVariantPicker(null)}
                  className="h-7 w-7 rounded-full bg-muted flex items-center justify-center -mt-0.5">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="px-5 py-4 space-y-2.5 max-h-[50vh] overflow-y-auto">
              <button
                onClick={() => { addToCart(showVariantPicker); setShowVariantPicker(null); }}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 border-border/50 hover:border-amber-900/30 hover:bg-amber-50/50 active:scale-[0.98] transition-all text-left"
              >
                <div>
                  <p className="text-sm font-semibold">Original</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Tanpa varian tambahan</p>
                </div>
                <p className="text-sm font-bold text-amber-900">{formatRupiah(showVariantPicker.price)}</p>
              </button>
              {((showVariantPicker as any).product_variants as ProductVariant[]).map(v => (
                <button
                  key={v.id}
                  disabled={!v.is_available}
                  onClick={() => { addToCart(showVariantPicker, v); setShowVariantPicker(null); }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 text-left transition-all",
                    v.is_available
                      ? "border-border/50 hover:border-amber-900/40 hover:bg-amber-50/50 active:scale-[0.98]"
                      : "opacity-40 cursor-not-allowed bg-muted/30"
                  )}
                >
                  <div>
                    <p className="text-sm font-semibold">{v.name}</p>
                    {!v.is_available && <p className="text-xs text-muted-foreground">Tidak tersedia</p>}
                  </div>
                  <p className="text-sm font-bold text-amber-900">
                    {v.additional_price > 0
                      ? `+${formatRupiah(v.additional_price)}`
                      : formatRupiah(showVariantPicker.price)}
                  </p>
                </button>
              ))}
            </div>
            <div className="h-6" />
          </div>
        </div>
      )}

      {/* ══ CART BOTTOM SHEET ═════════════════════════════════════════════ */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => setShowCart(false)} />
          <div className="relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[94dvh]">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="h-1 w-10 bg-border rounded-full" />
            </div>

            {/* Sheet header */}
            <div className="px-5 pb-3 border-b border-border/50 shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-base flex items-center gap-2">
                  <ShoppingCart className="h-4.5 w-4.5 text-amber-900" />
                  Pesananmu
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-900/20">
                    {cartCount} item
                  </span>
                  <button onClick={() => setShowCart(false)}
                    className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Cart items */}
            <div className="overflow-y-auto px-5 py-3 space-y-3" style={{ maxHeight: "30vh" }}>
              {cart.map((item, index) => {
                const price = item.product.price + (item.variant?.additional_price ?? 0);
                return (
                  <div key={`${item.product.id}-${item.variant?.id ?? "base"}-${index}`} className="flex gap-3">
                    <div className="h-14 w-14 rounded-xl bg-muted overflow-hidden shrink-0">
                      {item.product.image_url ? (
                        <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <UtensilsCrossed className="h-5 w-5 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold line-clamp-1">
                        {item.product.name}
                        {item.variant && <span className="font-normal text-muted-foreground"> · {item.variant.name}</span>}
                      </p>
                      <p className="text-xs font-bold text-amber-900 mt-0.5">{formatRupiah(price)}</p>
                      {noteTarget === index ? (
                        <input
                          autoFocus
                          type="text"
                          placeholder="Catatan (misal: tanpa es)"
                          value={noteValue}
                          onChange={e => setNoteValue(e.target.value)}
                          onBlur={() => {
                            setCart(prev => prev.map((it, i) => i === index ? { ...it, notes: noteValue } : it));
                            setNoteTarget(null);
                          }}
                          onKeyDown={e => {
                            if (e.key === "Enter") {
                              setCart(prev => prev.map((it, i) => i === index ? { ...it, notes: noteValue } : it));
                              setNoteTarget(null);
                            }
                          }}
                          className="mt-1 w-full h-7 px-2 text-xs rounded-lg border border-input bg-muted/30 focus:outline-none"
                        />
                      ) : (
                        <button
                          onClick={() => { setNoteTarget(index); setNoteValue(item.notes); }}
                          className={cn("mt-1 text-[11px] flex items-center gap-1 transition-colors",
                            item.notes ? "text-amber-900 font-medium" : "text-muted-foreground/70")}
                        >
                          <MessageSquare className="h-3 w-3" />
                          <span className="truncate max-w-[140px]">{item.notes || "Tambah catatan"}</span>
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 self-start mt-1">
                      <button onClick={() => updateQuantity(index, -1)}
                        className="h-7 w-7 rounded-full border border-border flex items-center justify-center active:scale-90 transition-transform">
                        {item.quantity === 1
                          ? <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          : <Minus className="h-3.5 w-3.5 text-foreground/70" />}
                      </button>
                      <span className="text-sm font-bold w-5 text-center tabular-nums">{item.quantity}</span>
                      <button onClick={() => updateQuantity(index, 1)}
                        className="h-7 w-7 rounded-full bg-amber-900 flex items-center justify-center active:scale-90 transition-transform">
                        <Plus className="h-3.5 w-3.5 text-amber-50" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Checkout form */}
            <div className="shrink-0 px-5 pt-3 pb-6 border-t border-border/50 space-y-4 bg-white overflow-y-auto">

              {/* ── Order type ── */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Tipe Pesanan</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setOrderType("dine_in"); if (tableParam) setTableNumber(parseInt(tableParam)); }}
                    className={cn(
                      "flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-bold border-2 transition-all",
                      orderType === "dine_in" ? "border-amber-900 bg-amber-900 text-amber-50" : "border-border text-muted-foreground"
                    )}
                  >
                    <MapPin className="h-3.5 w-3.5" /> Makan Sini
                  </button>
                  <button
                    onClick={() => { setOrderType("take_away"); setTableNumber(null); }}
                    className={cn(
                      "flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-bold border-2 transition-all",
                      orderType === "take_away" ? "border-amber-900 bg-amber-900 text-amber-50" : "border-border text-muted-foreground"
                    )}
                  >
                    <Bike className="h-3.5 w-3.5" /> Bawa Pulang
                  </button>
                </div>
              </div>

              {/* ── Table picker ── */}
              {orderType === "dine_in" && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Nomor Meja</p>
                  <div className="relative">
                    <select
                      value={tableNumber ?? ""}
                      onChange={e => setTableNumber(Number(e.target.value))}
                      className="w-full h-10 pl-4 pr-9 rounded-xl border-2 border-border bg-muted/30 text-sm font-medium appearance-none focus:outline-none focus:border-amber-900/50"
                    >
                      <option value="">— Pilih nomor meja —</option>
                      {Array.from({ length: outlet.total_tables || 20 }, (_, i) => i + 1).map(n => (
                        <option key={n} value={n}>Meja {n}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              )}

              {/* ── Customer name ── */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Nama <span className="font-normal normal-case">(opsional)</span>
                </p>
                <input
                  type="text"
                  placeholder="Nama kamu..."
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full h-10 px-4 rounded-xl border-2 border-border bg-muted/30 text-sm focus:outline-none focus:border-amber-900/50"
                />
              </div>

              {/* ══ PAYMENT METHOD ════════════════════════════════════════ */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                  Metode Pembayaran
                </p>
                <PaymentMethodPicker value={paymentMethod} onChange={setPaymentMethod} />
              </div>

              {/* ── Summary ── */}
              <div className="bg-muted/30 rounded-2xl px-4 py-3 space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Subtotal ({cartCount} item)</span>
                  <span>{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>PB1 ({TAX_PERCENTAGE}%)</span>
                  <span>{formatRupiah(tax)}</span>
                </div>
                <div className="h-px bg-border my-1" />
                <div className="flex justify-between font-bold text-sm">
                  <span>Total</span>
                  <span className="text-amber-900">{formatRupiah(total)}</span>
                </div>
              </div>

              {/* ── Submit ── */}
              <button
                disabled={!canSubmit}
                onClick={handleSubmitOrder}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold text-sm transition-all duration-200",
                  canSubmit
                    ? "bg-amber-900 text-amber-50 shadow-lg shadow-amber-900/25 active:scale-[0.98]"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-amber-50/30 border-t-amber-50 animate-spin" />
                    Memproses...
                  </span>
                ) : !paymentMethod ? (
                  "Pilih Metode Pembayaran"
                ) : (
                  `🛎️  Pesan Sekarang · ${formatRupiah(total)}`
                )}
              </button>

              {!paymentMethod && (
                <p className="text-center text-[11px] text-muted-foreground/60 -mt-2">
                  Pilih metode pembayaran di atas untuk melanjutkan
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Page export ────────────────────────────────────────────────────────── */
export default function OrderPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#f8f7f4]">
        <Coffee className="h-10 w-10 animate-pulse text-amber-900/30" />
      </div>
    }>
      <OrderPageContent />
    </Suspense>
  );
}
