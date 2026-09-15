"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah, cn } from "@/lib/utils";
import { Shift, Order } from "@/types/database";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Play, Square, FileText } from "lucide-react";

export default function ShiftPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const supabase = createClient();

  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [cashierName, setCashierName] = useState("");
  const [startingCash, setStartingCash] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [expectedCash, setExpectedCash] = useState(0);
  const [actualCash, setActualCash] = useState("");
  const [shiftNotes, setShiftNotes] = useState("");

  const fetchData = async () => {
    const { data: s } = await supabase
      .from("shifts")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (s) {
      setShifts(s);
      const openShift = s.find((shift) => shift.status === "open");
      setActiveShift(openShift || null);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStartShift = async () => {
    if (!cashierName || !startingCash) {
      toast.error("Nama kasir dan modal awal harus diisi");
      return;
    }
    
    setIsSubmitting(true);
    // Hardcoded outlet ID for now
    const outlet_id = "00000000-0000-0000-0000-000000000001";
    
    const { error } = await supabase.from("shifts").insert({
      outlet_id,
      cashier_name: cashierName,
      starting_cash: Number(startingCash)
    });

    if (error) {
      toast.error("Gagal membuka kasir: " + error.message);
    } else {
      toast.success("Kasir berhasil dibuka");
      setIsStartModalOpen(false);
      setCashierName("");
      setStartingCash("");
      fetchData();
    }
    setIsSubmitting(false);
  };

  const calculateExpectedCash = async () => {
    if (!activeShift) return;
    
    // Get all orders in this shift with cash payment
    const { data: orders } = await supabase
      .from("orders")
      .select("*")
      .eq("shift_id", activeShift.id)
      .eq("payment_method", "cash");
      
    let totalCashReceived = 0;
    if (orders) {
      totalCashReceived = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    }
    
    setExpectedCash(activeShift.starting_cash + totalCashReceived);
  };

  const openCloseModal = () => {
    calculateExpectedCash();
    setIsCloseModalOpen(true);
  };

  const handleCloseShift = async () => {
    if (!activeShift) return;
    if (!actualCash) {
      toast.error("Uang fisik di laci harus diisi");
      return;
    }
    
    setIsSubmitting(true);
    const { error } = await supabase.from("shifts").update({
      end_time: new Date().toISOString(),
      expected_ending_cash: expectedCash,
      actual_ending_cash: Number(actualCash),
      status: "closed",
      notes: shiftNotes
    }).eq("id", activeShift.id);

    if (error) {
      toast.error("Gagal menutup kasir");
    } else {
      toast.success("Kasir berhasil ditutup");
      setIsCloseModalOpen(false);
      setActualCash("");
      setShiftNotes("");
      fetchData();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manajemen Shift</h1>
        <p className="text-muted-foreground mt-1">
          Buka dan tutup kasir untuk mencatat pergerakan uang tunai.
        </p>
      </div>

      <div className="bg-card border rounded-lg p-6 flex flex-col md:flex-row gap-6 items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold mb-2">Status Kasir Saat Ini</h2>
          {activeShift ? (
            <div className="space-y-1 text-sm">
              <p><span className="text-muted-foreground">Status:</span> <span className="font-bold text-emerald-600">TERBUKA</span></p>
              <p><span className="text-muted-foreground">Kasir:</span> <span className="font-medium">{activeShift.cashier_name}</span></p>
              <p><span className="text-muted-foreground">Mulai:</span> {new Date(activeShift.start_time).toLocaleString('id-ID')}</p>
              <p><span className="text-muted-foreground">Modal Awal:</span> {formatRupiah(activeShift.starting_cash)}</p>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Tidak ada sesi kasir yang terbuka. Anda tidak bisa membuat pesanan baru sebelum kasir dibuka.
            </div>
          )}
        </div>
        
        <div className="shrink-0">
          {activeShift ? (
            <Button onClick={openCloseModal} variant="destructive" size="lg" className="w-full md:w-auto">
              <Square className="w-5 h-5 mr-2" /> Tutup Kasir
            </Button>
          ) : (
            <Button onClick={() => setIsStartModalOpen(true)} size="lg" className="w-full md:w-auto">
              <Play className="w-5 h-5 mr-2" /> Buka Kasir
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-semibold">Riwayat Sesi Kasir</h3>
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Kasir</th>
                  <th className="px-4 py-3 font-medium">Waktu Buka</th>
                  <th className="px-4 py-3 font-medium">Waktu Tutup</th>
                  <th className="px-4 py-3 font-medium text-right">Modal Awal</th>
                  <th className="px-4 py-3 font-medium text-right">Uang Kas Aktual</th>
                  <th className="px-4 py-3 font-medium text-center">Selisih</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {shifts.map(s => {
                  let selisih = 0;
                  if (s.actual_ending_cash !== null && s.expected_ending_cash !== null) {
                    selisih = s.actual_ending_cash - s.expected_ending_cash;
                  }
                  
                  return (
                    <tr key={s.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{s.cashier_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(s.start_time).toLocaleString('id-ID', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.end_time ? new Date(s.end_time).toLocaleString('id-ID', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'}) : '-'}</td>
                      <td className="px-4 py-3 text-right">{formatRupiah(s.starting_cash)}</td>
                      <td className="px-4 py-3 text-right font-medium">{s.actual_ending_cash !== null ? formatRupiah(s.actual_ending_cash) : '-'}</td>
                      <td className="px-4 py-3 text-center font-bold">
                        {s.status === 'closed' ? (
                          <span className={selisih < 0 ? "text-red-500" : selisih > 0 ? "text-emerald-500" : "text-muted-foreground"}>
                            {selisih > 0 ? '+' : ''}{formatRupiah(selisih)}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                          s.status === 'open' ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-800"
                        )}>
                          {s.status === 'open' ? 'Terbuka' : 'Ditutup'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Start Shift Modal */}
      <Dialog open={isStartModalOpen} onOpenChange={setIsStartModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Buka Kasir</DialogTitle>
            <DialogDescription>Masukkan nama kasir yang bertugas dan modal uang tunai awal.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Kasir</label>
              <Input 
                value={cashierName} 
                onChange={(e) => setCashierName(e.target.value)} 
                placeholder="Contoh: Budi"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Modal Awal (Tunai di laci)</label>
              <Input 
                type="number"
                value={startingCash} 
                onChange={(e) => setStartingCash(e.target.value)} 
                placeholder="Contoh: 500000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStartModalOpen(false)}>Batal</Button>
            <Button onClick={handleStartShift} disabled={isSubmitting || !cashierName || !startingCash}>
              {isSubmitting ? "Memproses..." : "Buka Kasir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Shift Modal */}
      <Dialog open={isCloseModalOpen} onOpenChange={setIsCloseModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Tutup Kasir</DialogTitle>
            <DialogDescription>Hitung uang fisik yang ada di laci kasir saat ini.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted p-3 rounded-md space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Modal Awal:</span>
                <span>{formatRupiah(activeShift?.starting_cash || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pemasukan Tunai:</span>
                <span>{formatRupiah(expectedCash - (activeShift?.starting_cash || 0))}</span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t">
                <span>Total Seharusnya (Sistem):</span>
                <span className="text-primary">{formatRupiah(expectedCash)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Total Uang Fisik Aktual</label>
              <Input 
                type="number"
                value={actualCash} 
                onChange={(e) => setActualCash(e.target.value)} 
                placeholder="Hitung jumlah uang di laci"
                autoFocus
              />
              {actualCash && (
                <p className={cn("text-xs mt-1", Number(actualCash) < expectedCash ? "text-red-500" : Number(actualCash) > expectedCash ? "text-emerald-500" : "text-muted-foreground")}>
                  Selisih: {formatRupiah(Number(actualCash) - expectedCash)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Catatan Penutupan</label>
              <Input 
                value={shiftNotes} 
                onChange={(e) => setShiftNotes(e.target.value)} 
                placeholder="Catatan tambahan bila ada selisih"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCloseModalOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleCloseShift} disabled={isSubmitting || !actualCash}>
              {isSubmitting ? "Memproses..." : "Konfirmasi Tutup Kasir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
