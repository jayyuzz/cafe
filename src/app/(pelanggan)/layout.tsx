import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Pesan Menu — MVE",
  description: "Lihat menu dan pesan langsung dari meja kamu",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#78350f",
};

export default function PelangganLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
