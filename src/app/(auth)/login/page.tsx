"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Coffee, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <Card className="w-full max-w-md shadow-xl border-amber-100">
      <CardHeader className="space-y-2 text-center pb-6">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-amber-100 rounded-full">
            <Coffee className="w-10 h-10 text-amber-900" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-amber-950">MVE POS</CardTitle>
        <CardDescription className="text-gray-500">
          Masuk ke sistem kasir untuk melanjutkan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@mve.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="focus-visible:ring-amber-500"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Kata Sandi</Label>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="focus-visible:ring-amber-500"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-amber-700 hover:bg-amber-800 text-white" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Masuk...
              </>
            ) : (
              "Masuk"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
