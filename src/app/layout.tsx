import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const inter = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Paylabs",
  description: "Aplikasi Kasir Cafe & Resto",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                if (theme) {
                  document.documentElement.className = theme;
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)} suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
