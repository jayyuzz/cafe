"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Reservation } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar, Clock, Users, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ReservasiPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .order("reservation_date", { ascending: true })
      .order("reservation_time", { ascending: true });

    if (error) {
      toast.error("Gagal memuat data reservasi");
      console.error(error);
    } else if (data) {
      setReservations(data);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleUpdateStatus = async (resId: string, newStatus: string) => {
    const { error } = await supabase
      .from("reservations")
      .update({ status: newStatus as any })
      .eq("id", resId);

    if (error) {
      toast.error("Gagal mengubah status");
    } else {
      toast.success(`Status reservasi diperbarui`);
      fetchReservations();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "default"; // or yellow
      case "confirmed": return "secondary"; // or blue
      case "completed": return "outline"; // green/gray
      case "cancelled": return "destructive"; // red
      default: return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Menunggu";
      case "confirmed": return "Dikonfirmasi";
      case "completed": return "Selesai";
      case "cancelled": return "Dibatalkan";
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daftar Reservasi</h1>
          <p className="text-muted-foreground">Kelola pemesanan meja pelanggan.</p>
        </div>
        <NewReservationDialog onSaved={fetchReservations} />
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground">Memuat data...</div>
      ) : reservations.length === 0 ? (
        <Card className="bg-card/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-foreground">Belum ada reservasi</p>
            <p className="text-sm text-muted-foreground">Reservasi yang ditambahkan akan muncul di sini.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reservations.map((res) => (
            <Card key={res.id} className="flex flex-col shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg truncate" title={res.customer_name}>
                    {res.customer_name}
                  </CardTitle>
                  {res.customer_phone && (
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Phone className="w-3 h-3 mr-1" />
                      {res.customer_phone}
                    </div>
                  )}
                </div>
                <Badge variant={getStatusColor(res.status) as any}>
                  {getStatusLabel(res.status)}
                </Badge>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <div className="flex items-center text-sm">
                  <Calendar className="w-4 h-4 mr-2 text-primary" />
                  <span>{format(parseISO(res.reservation_date), "d MMM yyyy", { locale: id })}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Clock className="w-4 h-4 mr-2 text-primary" />
                  <span>{res.reservation_time.substring(0, 5)} WIB</span>
                </div>
                <div className="flex items-center text-sm">
                  <Users className="w-4 h-4 mr-2 text-primary" />
                  <span>{res.party_size} Orang</span>
                </div>
                {res.table_number && (
                  <div className="flex items-center text-sm font-medium">
                    <MapPin className="w-4 h-4 mr-2 text-primary" />
                    <span>Meja #{res.table_number}</span>
                  </div>
                )}
                {res.notes && (
                  <div className="text-xs bg-muted p-2 rounded-md mt-2 italic">
                    "{res.notes}"
                  </div>
                )}
                
                <div className="pt-4 flex gap-2 flex-wrap border-t mt-4">
                  {res.status === "pending" && (
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleUpdateStatus(res.id, "confirmed")}>
                      Konfirmasi
                    </Button>
                  )}
                  {res.status === "confirmed" && (
                    <Button size="sm" className="flex-1" onClick={() => handleUpdateStatus(res.id, "completed")}>
                      Selesai
                    </Button>
                  )}
                  {(res.status === "pending" || res.status === "confirmed") && (
                    <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleUpdateStatus(res.id, "cancelled")}>
                      Batal
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function NewReservationDialog({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [pax, setPax] = useState("1");
  const [table, setTable] = useState("");
  const [notes, setNotes] = useState("");

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date || !time) {
      toast.error("Nama, tanggal, dan waktu wajib diisi");
      return;
    }

    setSaving(true);
    
    // Default outlet for now (MVP)
    const outletId = "00000000-0000-0000-0000-000000000001";
    
    const { error } = await supabase.from("reservations").insert({
      outlet_id: outletId,
      customer_name: name,
      customer_phone: phone || null,
      reservation_date: date,
      reservation_time: time + ":00", // to meet TIME format usually
      party_size: parseInt(pax) || 1,
      table_number: table ? parseInt(table) : null,
      notes: notes || null,
      status: "confirmed" // Assume manual entry is confirmed
    });

    setSaving(false);

    if (error) {
      toast.error("Gagal menyimpan reservasi");
      console.error(error);
    } else {
      toast.success("Reservasi berhasil ditambahkan");
      setOpen(false);
      
      // Reset form
      setName(""); setPhone(""); setDate(""); setTime(""); setPax("1"); setTable(""); setNotes("");
      
      onSaved();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button>+ Reservasi Manual</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reservasi Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nama Pelanggan *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} required placeholder="Contoh: Budi" />
          </div>
          <div className="space-y-2">
            <Label>Nomor HP</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0812..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tanggal *</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Waktu *</Label>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Jumlah Orang</Label>
              <Input type="number" min="1" value={pax} onChange={e => setPax(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>No. Meja (Opsional)</Label>
              <Input type="number" min="1" value={table} onChange={e => setTable(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Catatan Khusus</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Contoh: Meja di sudut" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <DialogClose>
              <Button type="button" variant="outline">Batal</Button>
            </DialogClose>
            <Button type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
