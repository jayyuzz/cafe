"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Outlet } from "@/types/database";
import { MAX_TABLES } from "@/lib/constants";
import { QrCode, Download, Printer, Coffee } from "lucide-react";
import QRCode from "qrcode";

export default function QRMejaPage() {
  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [selectedTable, setSelectedTable] = useState<number>(1);
  const [baseUrl, setBaseUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const supabase = createClient();

  // Fetch outlet
  useEffect(() => {
    async function fetchOutlet() {
      const { data } = await supabase
        .from("outlets")
        .select("*")
        .eq("is_active", true)
        .limit(1)
        .single();
      if (data) setOutlet(data);
    }
    fetchOutlet();
    // Always use production URL for QR codes so they work when scanned by customers.
    // Falls back to current origin when env var is not set (local dev).
    const productionUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    setBaseUrl(productionUrl);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Generate QR Code whenever selection changes
  useEffect(() => {
    if (!outlet || !baseUrl) return;
    generateQR();
  }, [outlet, selectedTable, baseUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const getMenuUrl = () => {
    if (!outlet || !baseUrl) return "";
    return `${baseUrl}/order?table=${selectedTable}&outlet=${outlet.id}`;
  };


  const generateQR = async () => {
    const url = getMenuUrl();
    if (!url) return;
    setIsGenerating(true);
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "H",
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error(err);
    }
    setIsGenerating(false);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.download = `qr-meja-${selectedTable}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>QR Code Meja ${selectedTable}</title>
          <style>
            body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; background: white; }
            .card { text-align: center; padding: 32px; border: 2px solid #e5e7eb; border-radius: 16px; width: 300px; }
            .title { font-size: 20px; font-weight: bold; margin-bottom: 4px; }
            .subtitle { font-size: 13px; color: #6b7280; margin-bottom: 20px; }
            img { width: 220px; height: 220px; }
            .meja { font-size: 18px; font-weight: bold; margin-top: 16px; }
            .url { font-size: 10px; color: #9ca3af; margin-top: 8px; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="title">${outlet?.name ?? "Kafe"}</div>
            <div class="subtitle">Scan untuk memesan</div>
            <img src="${qrDataUrl}" alt="QR Code" />
            <div class="meja">Meja ${selectedTable}</div>
            <div class="url">${getMenuUrl()}</div>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  const totalTables = outlet?.total_tables ?? MAX_TABLES;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">QR Code Meja</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Generate QR Code untuk setiap meja agar pelanggan bisa langsung memesan.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left: Controls */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
            <div>
              <label className="text-sm font-semibold block mb-2">Pilih Nomor Meja</label>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: totalTables }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setSelectedTable(n)}
                    className={`h-9 rounded-lg text-sm font-semibold border transition-colors ${
                      selectedTable === n
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {outlet && (
              <div className="bg-muted/50 rounded-xl p-3 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">URL yang di-generate</p>
                <p className="text-xs text-foreground break-all font-mono leading-relaxed">
                  {getMenuUrl()}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!qrDataUrl}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors"
              >
                <Download className="h-4 w-4" />
                Unduh
              </button>
              <button
                onClick={handlePrint}
                disabled={!qrDataUrl}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border border-border text-sm font-semibold disabled:opacity-50 hover:bg-muted transition-colors"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-xs text-amber-800 font-medium mb-1">💡 Cara penggunaan</p>
            <ol className="text-xs text-amber-700 space-y-1 list-decimal list-inside">
              <li>Pilih nomor meja yang ingin dibuatkan QR Code</li>
              <li>Unduh atau print QR Code</li>
              <li>Tempelkan di meja yang sesuai</li>
              <li>Pelanggan scan → langsung muncul menu dengan nomor meja otomatis</li>
            </ol>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="flex flex-col items-center">
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center gap-3 w-full">
            <div className="flex items-center gap-2 mb-1">
              <Coffee className="h-5 w-5 text-primary" />
              <span className="font-bold text-base">{outlet?.name ?? "Kafe"}</span>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">Scan untuk memesan</p>

            <div className="h-[200px] w-[200px] flex items-center justify-center bg-muted/50 rounded-xl border border-border overflow-hidden">
              {isGenerating ? (
                <QrCode className="h-12 w-12 text-muted-foreground/30 animate-pulse" />
              ) : qrDataUrl ? (
                <img src={qrDataUrl} alt={`QR Meja ${selectedTable}`} className="w-full h-full object-contain p-2" />
              ) : (
                <QrCode className="h-12 w-12 text-muted-foreground/30" />
              )}
            </div>

            <div className="text-center">
              <p className="font-bold text-lg">Meja {selectedTable}</p>
              <p className="text-xs text-muted-foreground">Tap QR untuk memesan</p>
            </div>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
