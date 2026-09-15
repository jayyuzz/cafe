"use client";

import { useState, useEffect } from "react";
import { Menu, LayoutDashboard, ShoppingCart, ChefHat, ClipboardList, UtensilsCrossed, BarChart3, Users, Calendar, Settings, Archive, Combine, Trash2, KeySquare, QrCode, UserCog, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const [currentDate, setCurrentDate] = useState<string>("");

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
      setCurrentDate(now.toLocaleDateString("id-ID", options));
    };

    updateDate();
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, []);

  const getPageInfo = () => {
    if (pathname === "/") return { title: "Dashboard", icon: LayoutDashboard };
    if (pathname?.startsWith("/pos")) return { title: "Kasir / POS", icon: ShoppingCart };
    if (pathname?.startsWith("/kds")) return { title: "Dapur / KDS", icon: ChefHat };
    if (pathname?.startsWith("/pesanan")) return { title: "Pesanan", icon: ClipboardList };
    if (pathname?.startsWith("/driver")) return { title: "Tugas Antaran", icon: Bike };
    if (pathname?.startsWith("/shift")) return { title: "Shift Kasir", icon: KeySquare };
    if (pathname?.startsWith("/pelanggan")) return { title: "Pelanggan & Poin", icon: Users };
    if (pathname?.startsWith("/reservasi")) return { title: "Reservasi", icon: Calendar };
    if (pathname?.startsWith("/menu")) return { title: "Menu & Produk", icon: UtensilsCrossed };
    if (pathname?.startsWith("/bahan-baku")) return { title: "Bahan Baku & HPP", icon: Combine };
    if (pathname?.startsWith("/stok")) return { title: "Stok Barang", icon: Archive };
    if (pathname?.startsWith("/waste")) return { title: "Waste & Spoilage", icon: Trash2 };
    if (pathname?.startsWith("/laporan")) return { title: "Laporan & Analitik", icon: BarChart3 };
    if (pathname?.startsWith("/admin/qr-meja")) return { title: "QR Meja", icon: QrCode };
    if (pathname?.startsWith("/admin/users")) return { title: "Manajemen User", icon: UserCog };
    if (pathname?.startsWith("/admin/hak-akses")) return { title: "Hak Akses", icon: KeySquare };
    if (pathname?.startsWith("/admin")) return { title: "Admin Log", icon: Settings };
    return { title: "MVE", icon: LayoutDashboard };
  };

  const quickShortcuts = [
    { href: "/pos", icon: ShoppingCart, title: "Kasir / POS", colorClass: "text-emerald-600 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400" },
    { href: "/kds", icon: ChefHat, title: "Dapur / KDS", colorClass: "text-orange-600 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/40 dark:text-orange-400" },
    { href: "/pesanan", icon: ClipboardList, title: "Pesanan", colorClass: "text-blue-600 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-400" },
    { href: "/driver", icon: Bike, title: "Tugas Antaran", colorClass: "text-teal-600 bg-teal-100 hover:bg-teal-200 dark:bg-teal-900/40 dark:text-teal-400" },
    { href: "/shift", icon: KeySquare, title: "Shift Kasir", colorClass: "text-indigo-600 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-400" },
    { href: "/pelanggan", icon: Users, title: "Pelanggan & Poin", colorClass: "text-pink-600 bg-pink-100 hover:bg-pink-200 dark:bg-pink-900/40 dark:text-pink-400" },
    { href: "/reservasi", icon: Calendar, title: "Reservasi Meja", colorClass: "text-rose-600 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/40 dark:text-rose-400" },
    { href: "/menu", icon: UtensilsCrossed, title: "Menu & Produk", colorClass: "text-amber-600 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-400" },
    { href: "/bahan-baku", icon: Combine, title: "Bahan Baku", colorClass: "text-lime-600 bg-lime-100 hover:bg-lime-200 dark:bg-lime-900/40 dark:text-lime-400" },
    { href: "/stok", icon: Archive, title: "Stok Barang", colorClass: "text-cyan-600 bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-400" },
    { href: "/waste", icon: Trash2, title: "Waste & Spoilage", colorClass: "text-red-600 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400" },
    { href: "/laporan", icon: BarChart3, title: "Laporan & Analitik", colorClass: "text-violet-600 bg-violet-100 hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-400" },
    { href: "/admin/qr-meja", icon: QrCode, title: "QR Meja", colorClass: "text-fuchsia-600 bg-fuchsia-100 hover:bg-fuchsia-200 dark:bg-fuchsia-900/40 dark:text-fuchsia-400" },
    { href: "/admin/users", icon: UserCog, title: "Manajemen User", colorClass: "text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/40 dark:text-slate-400" },
  ];

  const pageInfo = getPageInfo();
  const Icon = pageInfo.icon;

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-card px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 transition-colors">
      <Button
        variant="ghost"
        size="icon"
        className="-m-2.5 p-2.5 text-foreground lg:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Buka menu sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </Button>

      {/* Separator */}
      <div className="h-6 w-px bg-border lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 overflow-hidden">
        <div className="flex flex-1 items-center justify-between overflow-hidden">
          <div className="flex items-center gap-2 text-primary shrink-0">
            <div className="p-2 bg-primary/10 rounded-md">
              <Icon className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold leading-6 text-foreground tracking-tight hidden sm:block">
              {pageInfo.title}
            </h1>
          </div>
          <div className="flex items-center gap-x-3 lg:gap-x-6 overflow-hidden ml-4">
            
            {/* Quick Shortcuts */}
            <div className="hidden md:flex items-center gap-1.5 border-r border-border pr-5 mr-1 overflow-x-auto hide-scrollbar max-w-[300px] lg:max-w-2xl" style={{ scrollBehavior: 'smooth' }}>
              {quickShortcuts.map((s, idx) => {
                const isCurrent = pathname === s.href || pathname?.startsWith(`${s.href}/`);
                if (isCurrent) return null; // Don't show shortcut to current page
                return (
                  <Link 
                    key={idx} 
                    href={s.href} 
                    className={cn("p-2 rounded-xl transition-all hover:scale-105 hover:shadow-sm shrink-0", s.colorClass)} 
                    title={s.title}
                  >
                    <s.icon className="w-5 h-5" />
                  </Link>
                );
              })}
            </div>

            <div className="hidden sm:block text-sm text-muted-foreground font-medium shrink-0">
              {currentDate}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
