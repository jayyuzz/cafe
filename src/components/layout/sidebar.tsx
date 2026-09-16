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
  Archive,
  Combine,
  Users,
  Trash2,
  ChefHat,
  UserCog,
  Bike,
  Key,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  isOpen?: boolean;
  onClose?: () => void;
}

const navigationGroups = [
  {
    title: "Operasional Harian",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard, permission: "dashboard" },
      { name: "Kasir / POS", href: "/pos", icon: ShoppingCart, permission: "pos" },
      { name: "Dapur / KDS", href: "/kds", icon: ChefHat, permission: "kds" },
      { name: "Pesanan", href: "/pesanan", icon: ClipboardList, permission: "pesanan" },
      { name: "Tugas Antaran", href: "/driver", icon: Bike, permission: "driver" },
      { name: "Shift Kasir", href: "/shift", icon: KeySquare, permission: "pos" },
      { name: "Pelanggan", href: "/customers", icon: Users, permission: "pos" },
    ]
  },
  {
    title: "Pelanggan & Booking",
    items: [
      { name: "Pelanggan & Poin", href: "/pelanggan", icon: Users, permission: "pos" },
      { name: "Reservasi", href: "/reservasi", icon: Calendar, permission: "reservasi" },
    ]
  },
  {
    title: "Katalog Menu",
    items: [
      { name: "Menu & Produk", href: "/menu", icon: UtensilsCrossed, permission: "menu" },
    ]
  },
  {
    title: "Manajemen Gudang",
    items: [
      { name: "Bahan Baku & HPP", href: "/bahan-baku", icon: Combine, permission: "menu" },
      { name: "Stok Barang", href: "/stok", icon: Archive, permission: "menu" },
      { name: "Waste & Spoilage", href: "/waste", icon: Trash2, permission: "menu" },
    ]
  },
  {
    title: "Manajerial & Admin",
    items: [
      { name: "Laporan & Analitik", href: "/laporan", icon: BarChart3, permission: "laporan" },
      { name: "Manajemen Delivery", href: "/admin/delivery", icon: Bike, permission: "admin_log" },
      { name: "QR Meja", href: "/admin/qr-meja", icon: QrCode, permission: "admin_log" },
      { name: "Manajemen User", href: "/admin/users", icon: UserCog, permission: "hak_akses" },
      { name: "Hak Akses", href: "/admin/hak-akses", icon: KeySquare, permission: "hak_akses" },
      { name: "Admin Log", href: "/admin", icon: Settings, permission: "admin_log" },
    ]
  }
];

export function Sidebar({ user, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isMinimized, setIsMinimized] = useState(true);

  // Password Modal States
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Password dan Konfirmasi tidak cocok");
      return;
    }
    
    setIsUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      toast.error(`Gagal mengganti password: ${error.message}`);
    } else {
      toast.success("Password berhasil diganti!");
      setIsPasswordModalOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    }
    setIsUpdatingPassword(false);
  };

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

        <nav className="flex-1 space-y-4 px-3 py-4 overflow-y-auto overflow-x-hidden hide-scrollbar">
          {navigationGroups.map((group, groupIdx) => {
            const filteredItems = group.items.filter((item) => user?.permissions?.includes(item.permission));
            if (filteredItems.length === 0) return null;

            return (
              <div key={groupIdx} className="space-y-1 relative">
                <div className={cn("px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider transition-all whitespace-nowrap", isMinimized && "opacity-0 h-0 mb-0 overflow-hidden")}>
                  {group.title}
                </div>
                {isMinimized && groupIdx > 0 && <div className="h-px bg-border my-2 mx-4" />}
                
                {filteredItems.map((item) => {
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
                      onClick={() => onClose?.()}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span className={cn("transition-all duration-300 whitespace-nowrap", isMinimized && "lg:hidden")}>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
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
            className={cn("justify-start text-muted-foreground shrink-0 mt-1", isMinimized ? "lg:justify-center lg:px-0" : "w-full")}
            onClick={() => setIsPasswordModalOpen(true)}
            title={isMinimized ? "Ganti Password" : undefined}
          >
            <Key className={cn("h-4 w-4 shrink-0", !isMinimized && "mr-2")} />
            <span className={cn("transition-all duration-300", isMinimized && "lg:hidden")}>Ganti Password</span>
          </Button>
          
          <Button
            variant="outline"
            className={cn("justify-start text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0 mt-1", isMinimized ? "lg:justify-center lg:px-0" : "w-full")}
            onClick={handleLogout}
            title={isMinimized ? "Keluar" : undefined}
          >
            <LogOut className={cn("h-4 w-4 shrink-0", !isMinimized && "mr-2")} />
            <span className={cn("transition-all duration-300", isMinimized && "lg:hidden")}>Keluar</span>
          </Button>
        </div>
      </div>

      {/* Password Change Modal */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ganti Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Password Baru</label>
              <Input
                type="password"
                placeholder="Minimal 6 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Konfirmasi Password</label>
              <Input
                type="password"
                placeholder="Tulis ulang password baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)}>Batal</Button>
            <Button onClick={handleUpdatePassword} disabled={isUpdatingPassword || !newPassword || !confirmPassword}>
              {isUpdatingPassword ? "Menyimpan..." : "Simpan Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
