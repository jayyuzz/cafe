"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        router.push("/login");
        return;
      }
      
      // Fetch user profile to get role
      const { data: userData } = await supabase
        .from('users')
        .select('role, name')
        .eq('id', session.user.id)
        .single();
        
      let permissions: string[] = [];
      let roleName = 'User';
      
      if (userData?.role) {
        roleName = userData.name;
        // Fetch role permissions
        const { data: roleData } = await supabase
          .from('roles')
          .select('permissions')
          .eq('id', userData.role)
          .single();
          
        if (roleData) {
          permissions = roleData.permissions;
        }
      }

      // Add custom properties to the user object to pass to sidebar
      const extendedUser = {
        ...session.user,
        appRole: userData?.role || 'customer',
        appName: roleName,
        permissions
      };
      
      setUser(extendedUser as any);
      setLoading(false);
    };

    checkUser();
  }, [router, supabase]);

  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center bg-gray-50">Memuat...</div>;
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
