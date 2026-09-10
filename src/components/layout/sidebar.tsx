"use client";

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
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white border-r border-gray-200 transition-transform duration-300 lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary">
            <div className="h-8 w-8 rounded overflow-hidden flex items-center justify-center">
              <img src="/mve-logo.png" alt="MVE" className="w-full h-full object-contain p-0.5" />
            </div>
            <span>MVE</span>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto">
          {navigation
            .filter((item) => user?.permissions?.includes(item.permission) || item.permission === "dashboard")
            .map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            // Exact match for dashboard
            const isActuallyActive = item.href === "/" ? pathname === "/" : isActive;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActuallyActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                onClick={() => onClose()}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <div className="mb-4">
            <select
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onChange={(e) => {
                const theme = e.target.value;
                document.documentElement.className = theme;
                localStorage.setItem("theme", theme);
              }}
              defaultValue={typeof window !== "undefined" ? localStorage.getItem("theme") || "" : ""}
            >
              <option value="">Default (Standard)</option>
              <option value="theme-japandi">Japandi (Terang & Bersih)</option>
              <option value="theme-industrial">Industrial (Gelap & Maskulin)</option>
              <option value="theme-earthy">Earthy (Hangat & Alam)</option>
            </select>
          </div>

          <div className="mb-4 px-2">
            <p className="text-sm font-medium text-foreground">{user?.email}</p>
            <p className="text-xs text-muted-foreground capitalize">
              Role: {user?.appName || user?.appRole || 'Loading...'}
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Keluar
          </Button>
        </div>
      </div>
    </>
  );
}
