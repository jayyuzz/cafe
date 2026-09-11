"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Coffee,
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  UtensilsCrossed,
  BarChart3,
  LogOut,
  X,
  KeySquare,
  Calendar,
  Settings,
  QrCode,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";

interface ExtendedUser extends User {
  appRole?: string;
  appName?: string;
  permissions?: string[];
}

interface SidebarProps {
  user: ExtendedUser | null;
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, permission: "dashboard" },
  { name: "Kasir / POS", href: "/pos", icon: ShoppingCart, permission: "pos" },
  { name: "Pesanan", href: "/pesanan", icon: ClipboardList, permission: "pesanan" },
  { name: "Menu", href: "/menu", icon: UtensilsCrossed, permission: "menu" },
  { name: "Laporan", href: "/laporan", icon: BarChart3, permission: "laporan" },
  { name: "Reservasi", href: "/reservasi", icon: Calendar, permission: "reservasi" },
  { name: "QR Meja", href: "/admin/qr-meja", icon: QrCode, permission: "admin_log" },
  { name: "Admin Log", href: "/admin", icon: Settings, permission: "admin_log" },
  { name: "Hak Akses", href: "/admin/hak-akses", icon: KeySquare, permission: "hak_akses" },
];

export function Sidebar({ user, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isMinimized, setIsMinimized] = useState(true);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/login");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Gagal keluar");
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        onMouseEnter={() => setIsMinimized(false)}
        onMouseLeave={() => setIsMinimized(true)}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border transition-all duration-300",
          isOpen ? "translate-x-0 w-64" : "-translate-x-full w-64",
          "lg:translate-x-0 lg:static",
          isMinimized ? "lg:w-[76px]" : "lg:w-64"
        )}
      >
        <div className={cn("flex h-16 shrink-0 items-center border-b border-border overflow-hidden", isMinimized ? "lg:justify-center px-4" : "justify-between px-6")}>
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary shrink-0">
            <div className="h-8 w-8 rounded overflow-hidden flex items-center justify-center shrink-0">
              <img src="/paylabs-logo.png" alt="Paylabs" className="w-full h-full object-contain p-0.5" />
            </div>
            <span className={cn("transition-all duration-300 whitespace-nowrap", isMinimized && "lg:hidden")}>Paylabs</span>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto overflow-x-hidden hide-scrollbar">
          {navigation
            .filter((item) => user?.permissions?.includes(item.permission) || item.permission === "dashboard")
            .map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const isActuallyActive = item.href === "/" ? pathname === "/" : isActive;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={isMinimized ? item.name : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors shrink-0",
                  isActuallyActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  isMinimized && "lg:justify-center"
                )}
                onClick={() => onClose()}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className={cn("transition-all duration-300 whitespace-nowrap", isMinimized && "lg:hidden")}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3 overflow-hidden shrink-0 flex flex-col gap-3">
          <div className={cn("flex items-center gap-2", isMinimized ? "lg:justify-center" : "")}>
            <div className={cn("relative flex items-center justify-center shrink-0", isMinimized ? "lg:w-full" : "w-full")}>
              {isMinimized && (
                <div className="hidden lg:flex w-10 h-10 rounded-md items-center justify-center bg-muted text-muted-foreground" title="Tema">
                  <Palette className="h-5 w-5" />
                </div>
              )}
              <select
                title="Pilih Tema"
                className={cn(
                  "h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-full",
                  isMinimized && "lg:hidden"
                )}
                onChange={(e) => {
                  const theme = e.target.value;
                  document.documentElement.className = theme;
                  localStorage.setItem("theme", theme);
                }}
                defaultValue={typeof window !== "undefined" ? localStorage.getItem("theme") || "theme-earthy" : "theme-earthy"}
              >
                <option value="">Default (Standard)</option>
                <option value="theme-japandi">Japandi (Terang)</option>
                <option value="theme-industrial">Industrial (Gelap)</option>
                <option value="theme-earthy">Earthy (Alam)</option>
              </select>
            </div>
          </div>

          <div className={cn("px-2 whitespace-nowrap transition-all duration-300", isMinimized && "lg:hidden")}>
            <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
            <p className="text-xs text-muted-foreground capitalize truncate">
              Role: {user?.appName || user?.appRole || 'Loading...'}
            </p>
          </div>
          
          <Button
            variant="outline"
            className={cn("justify-start text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0", isMinimized ? "lg:justify-center lg:px-0" : "w-full")}
            onClick={handleLogout}
            title={isMinimized ? "Keluar" : undefined}
          >
            <LogOut className={cn("h-4 w-4 shrink-0", !isMinimized && "mr-2")} />
            <span className={cn("transition-all duration-300", isMinimized && "lg:hidden")}>Keluar</span>
          </Button>
        </div>
      </div>
    </>
  );
}
