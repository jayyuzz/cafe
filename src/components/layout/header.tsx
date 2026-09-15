"use client";

import { useState, useEffect } from "react";
import { Menu, LayoutDashboard, ShoppingCart, ChefHat, ClipboardList, UtensilsCrossed, BarChart3, Users, Calendar, Settings, Archive, Combine, Trash2, KeySquare, QrCode, UserCog } from "lucide-react";
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

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <div className="p-2 bg-primary/10 rounded-md">
              <Icon className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold leading-6 text-foreground tracking-tight">
              {pageInfo.title}
            </h1>
          </div>
          <div className="flex items-center gap-x-3 lg:gap-x-6">
            
            {/* Quick Shortcuts */}
            <div className="hidden md:flex items-center gap-1 border-r border-border pr-5 mr-1">
              <Link href="/pos" className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors" title="Buka Kasir / POS">
                <ShoppingCart className="w-5 h-5" />
              </Link>
              <Link href="/kds" className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors" title="Buka Dapur / KDS">
                <ChefHat className="w-5 h-5" />
              </Link>
              <Link href="/pesanan" className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors" title="Daftar Pesanan">
                <ClipboardList className="w-5 h-5" />
              </Link>
              <Link href="/shift" className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors" title="Shift Kasir">
                <KeySquare className="w-5 h-5" />
              </Link>
              <Link href="/reservasi" className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors" title="Daftar Reservasi">
                <Calendar className="w-5 h-5" />
              </Link>
              <Link href="/pelanggan" className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors" title="Database Pelanggan">
                <Users className="w-5 h-5" />
              </Link>
            </div>

            <div className="hidden sm:block text-sm text-muted-foreground font-medium">
              {currentDate}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
