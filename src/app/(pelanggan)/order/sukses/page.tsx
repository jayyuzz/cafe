"use client";

import { useSearchParams } from "next/navigation";
import { formatRupiah } from "@/lib/utils";
import {
  CheckCircle2, Coffee, MapPin, Bike, ArrowRight,
  QrCode, Banknote, Smartphone, Clock,
} from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import QRCode from "qrcode";

/* ─── QRIS Block ─────────────────────────────────────────────────────────── */
function QrisBlock({ orderNumber }: { orderNumber: string }) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    // Generate QR code from order number so cashier can scan to confirm payment
    QRCode.toDataURL(orderNumber, {
      width: 280,
      margin: 1,
      color: { dark: "#000000", light: "#FFFFFF" },
      errorCorrectionLevel: "H",
    }).then(setQrDataUrl).catch(console.error);
  }, [orderNumber]);

  return (
    <div className="px-5 py-4 border-b border-border/50">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-xl bg-violet-100 flex items-center justify-center">
          <QrCode className="h-4 w-4 text-violet-700" />
        </div>
        <div>
          <p className="text-sm font-bold text-violet-700">Bayar via QRIS</p>
          <p className="text-xs text-muted-foreground">Scan QR di bawah di mesin kasir</p>
        </div>
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center">
        <div className="bg-white rounded-2xl p-3 border-2 border-violet-200 shadow-sm">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR Order" className="h-[180px] w-[180px]" />
          ) : (
            <div className="h-[180px] w-[180px] bg-muted animate-pulse rounded-lg" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Tunjukkan QR ini ke kasir untuk scan & konfirmasi pembayaran QRIS
        </p>
      </div>

      {/* Steps */}
      <div className="mt-4 space-y-2">
        {[
          { icon: <Smartphone className="h-3.5 w-3.5" />, text: "Tunjukkan layar HP ini ke kasir" },
          { icon: <QrCode className="h-3.5 w-3.5" />, text: "Kasir scan QR di atas untuk konfirmasi" },
          { icon: <CheckCircle2 className="h-3.5 w-3.5" />, text: "Pembayaran selesai & pesanan diproses" },
        ].map(({ icon, text }, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
              {icon}
            </div>
            <p className="text-xs text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Cash Block ─────────────────────────────────────────────────────────── */
function CashBlock({ total }: { total: number }) {
  return (
    <div className="px-5 py-4 border-b border-border/50">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-xl bg-amber-100 flex items-center justify-center">
          <Banknote className="h-4 w-4 text-amber-800" />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-800">Bayar di Kasir</p>
          <p className="text-xs text-muted-foreground">Siapkan uang atau kartu</p>
        </div>
      </div>

      {/* Amount chip */}
      <div className="bg-amber-50 rounded-2xl px-4 py-3 flex items-center justify-between border border-amber-200/70">
        <span className="text-sm text-amber-900 font-medium">Siapkan pembayaran</span>
        <span className="text-base font-bold text-amber-900">{formatRupiah(total)}</span>
      </div>

      {/* Steps */}
      <div className="mt-4 space-y-2">
        {[
          { icon: <Clock className="h-3.5 w-3.5" />, text: "Tunggu pesananmu selesai disiapkan" },
          { icon: <Banknote className="h-3.5 w-3.5" />, text: "Datang ke kasir dan tunjukkan nomor pesanan" },
          { icon: <CheckCircle2 className="h-3.5 w-3.5" />, text: "Bayar & nikmati pesananmu 😋" },
        ].map(({ icon, text }, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              {icon}
            </div>
            <p className="text-xs text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Content ───────────────────────────────────────────────────────── */
function SuksesContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("no") ?? "-";
  const total = Number(searchParams.get("total") ?? 0);
  const table = searchParams.get("table");
  const type = searchParams.get("type");
  const method = searchParams.get("method"); // "qris" | "cash"
  const outletId = searchParams.get("outlet");

  const isDineIn = type === "dine_in" && table;
  const isQris = method === "qris";

  const headerColor = isQris
    ? "bg-gradient-to-br from-violet-700 to-purple-800"
    : "bg-gradient-to-br from-amber-800 to-amber-950";

  const menuHref = `/order${table ? `?table=${table}` : ""}${outletId ? `${table ? "&" : "?"}outlet=${outletId}` : ""}`;

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex flex-col">

      {/* ══ HEADER ═════════════════════════════════════════════════════════ */}
      <div className={`${headerColor} pt-14 pb-20 px-6 text-center relative overflow-hidden`}>
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-white/5" />
        <div className="relative">
          <div className="h-20 w-20 rounded-full bg-white/15 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <CheckCircle2 className="h-11 w-11 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Pesanan Diterima!</h1>
          <p className="text-white/70 text-sm">
            {isDineIn
              ? `Pesananmu untuk Meja ${table} sedang diproses 🍽️`
              : "Pesananmu sedang disiapkan! 🛍️"}
          </p>
        </div>
      </div>

      {/* ══ CARD ═══════════════════════════════════════════════════════════ */}
      <div className="flex-1 -mt-10 px-4 pb-8">
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">

          {/* Order summary header */}
          <div className="px-5 pt-5 pb-4 border-b border-border/50">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${isQris ? "bg-violet-100" : "bg-amber-50"}`}>
                {isQris
                  ? <QrCode className="h-6 w-6 text-violet-700" />
                  : <Coffee className="h-6 w-6 text-amber-900" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Nomor Pesanan</p>
                <p className="text-base font-bold font-mono tracking-wide">{orderNumber}</p>
              </div>
              {/* Status pulse */}
              <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 shrink-0">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[11px] font-bold text-amber-700">Diproses</span>
              </div>
            </div>
          </div>

          {/* Order type + total */}
          <div className="px-5 py-3 flex items-center justify-between border-b border-border/50">
            <div className="flex items-center gap-1.5">
              {isDineIn ? (
                <>
                  <MapPin className="h-3.5 w-3.5 text-amber-700" />
                  <span className="text-sm font-semibold text-amber-700">Meja {table}</span>
                </>
              ) : (
                <>
                  <Bike className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-600">Bawa Pulang</span>
                </>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total Tagihan</p>
              <p className="text-sm font-bold text-amber-900">{formatRupiah(total)}</p>
            </div>
          </div>

          {/* Payment-specific content */}
          {isQris
            ? <QrisBlock orderNumber={orderNumber} />
            : <CashBlock total={total} />}

        </div>

        {/* ── CTA ── */}
        <div className="mt-4 space-y-2">
          <Link
            href={menuHref}
            className={`flex items-center justify-between w-full text-white px-5 py-4 rounded-2xl font-semibold text-sm shadow-lg active:scale-[0.98] transition-transform ${isQris ? "bg-violet-700 shadow-violet-700/20" : "bg-amber-900 shadow-amber-900/20"}`}
          >
            <span>Tambah Pesanan Lagi</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-center text-[11px] text-muted-foreground/50 pt-1">
            Terima kasih sudah berkunjung ☕
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Export ─────────────────────────────────────────────────────────────── */
export default function SuksesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#f8f7f4]">
        <Coffee className="h-10 w-10 animate-pulse text-amber-900/30" />
      </div>
    }>
      <SuksesContent />
    </Suspense>
  );
}
