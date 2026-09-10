"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Coffee, Loader2, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/");
      }
    };
    checkSession();
  }, [router, supabase.auth]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error("Login gagal: " + error.message);
        return;
      }

      toast.success("Login berhasil!");
      router.push("/");
      router.refresh();
    } catch (error: any) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      
      {/* ─── KIRI: Form Login ────────────────────────────────────────────── */}
      <div className="flex flex-col justify-center px-8 sm:px-16 md:px-24 xl:px-32 relative z-10 bg-white">
        
        {/* Brand Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-16 w-16 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-amber-900/10 overflow-hidden border border-gray-100">
              <img src="/paylabs-logo.png" alt="Paylabs Logo" className="w-full h-full object-contain p-1" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-amber-950">Paylabs</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Selamat Datang 👋
          </h1>
          <p className="mt-2 text-base text-gray-500">
            Masuk ke sistem kasir untuk mengelola pesanan dan laporan.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2.5">
            <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@paylabs.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="h-12 px-4 bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all rounded-xl text-base"
            />
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Kata Sandi</Label>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="h-12 px-4 bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all rounded-xl text-base pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center text-gray-400 hover:text-amber-700 transition-colors rounded-r-xl focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 mt-4 bg-amber-900 hover:bg-amber-950 text-white rounded-xl text-base font-semibold shadow-xl shadow-amber-900/20 transition-all group" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                Masuk Sekarang
                <ArrowRight className="ml-2 h-5 w-5 opacity-70 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </form>

        {/* Footer info */}
        <div className="mt-16 text-sm text-gray-400 text-center lg:text-left">
          &copy; {new Date().getFullYear()} Paylabs-Kotamobagu.id. All rights reserved.
        </div>
      </div>

      {/* ─── KANAN: Visual (Hidden on Mobile) ───────────────────────────── */}
      <div className="hidden lg:flex relative bg-zinc-900 overflow-hidden items-end justify-center p-12">
        {/* Background Image - Cafe aesthetic */}
        <div 
          className="absolute inset-0 z-0 opacity-40 mix-blend-overlay bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2047&auto=format&fit=crop')" }}
        />
        
        {/* Gradients to blend text nicely */}
        <div className="absolute inset-0 bg-gradient-to-t from-amber-950/90 via-amber-900/40 to-transparent z-10" />

        {/* Text over image */}
        <div className="relative z-20 w-full max-w-md">
          <blockquote className="space-y-4">
            <p className="text-2xl font-medium text-amber-50 leading-snug">
              "Kualitas layanan dimulai dari sistem yang cepat, efisien, dan modern."
            </p>
            <footer className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-amber-500/20 backdrop-blur border border-amber-500/30 flex items-center justify-center">
                <Coffee className="h-5 w-5 text-amber-300" />
              </div>
              <div className="text-sm">
                <div className="font-semibold text-white">Paylabs System</div>
                <div className="text-amber-200/70">Point of Sales Dashboard</div>
              </div>
            </footer>
          </blockquote>
        </div>
      </div>

    </div>
  );
}
