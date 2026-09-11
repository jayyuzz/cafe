import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MVE Coffee — Kotamobagu",
  description:
    "MVE Coffee Shop Kotamobagu — Nikmati kopi pilihan terbaik dengan suasana hangat dan nyaman di Kotamobagu, Sulawesi Utara.",
  keywords: ["MVE Coffee", "Coffee Shop", "Kotamobagu", "Kopi", "Cafe"],
  openGraph: {
    title: "MVE Coffee — Kotamobagu",
    description:
      "Nikmati kopi pilihan terbaik dengan suasana hangat dan nyaman.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
