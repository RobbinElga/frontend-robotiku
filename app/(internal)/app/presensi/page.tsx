"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { MapPin, Camera, Loader2, Check, Trash2, ExternalLink, CalendarClock, ShieldCheck, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { api, apiError, type ApiEnvelope } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useConfirm } from "@/components/ui/confirm";
import { InternalShell } from "@/components/internal/InternalShell";
import { cn } from "@/lib/utils";

// ------------------------------------------------------------------ Presensi (trainer)
function Presensi() {
    const qc = useQueryClient();
    const today = useQuery({
        queryKey: ["presensi-today"],
        queryFn: async () => (await api.get<ApiEnvelope<{ sudah_presensi: boolean }>>("/absensi-karyawan/today")).data.data,
    });

    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [photo, setPhoto] = useState<File | null>(null);
    const [notes, setNotes] = useState("");
    const [msg, setMsg] = useState<string | null>(null);
    const [locating, setLocating] = useState(false);

    const preview = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);
    useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

    const getLocation = () => {
        setMsg(null); setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
            () => { setMsg("Gagal mengambil lokasi. Izinkan akses lokasi di browser Anda."); setLocating(false); },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const submit = useMutation({
        mutationFn: async () => {
            const fd = new FormData();
            fd.append("latitude", String(coords!.lat));
            fd.append("longitude", String(coords!.lng));
            if (photo) fd.append("photo", photo);
            if (notes) fd.append("notes", notes);
            return (await api.post("/absensi-karyawan", fd)).data;
        },
        onSuccess: () => { setMsg(null); qc.invalidateQueries({ queryKey: ["presensi-today"] }); },
        onError: (e) => setMsg(apiError(e, "Gagal presensi.")),
    });

    const sudah = today.data?.sudah_presensi;

    return (
        <div className="mx-auto max-w-lg space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Presensi Harian</h1>
                <p className="text-sm text-muted-foreground">Sekali per hari — wajib lokasi & foto.</p>
            </div>

            {today.isLoading ? (
                <Skeleton className="h-64 w-full rounded-xl" />
            ) : sudah ? (
                // ---- sudah presensi
                <Card className="overflow-hidden">
                    <div className="flex flex-col items-center gap-3 bg-emerald-50 px-6 py-10 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
                            <Check className="h-7 w-7" />
                        </div>
                        <div>
                            <p className="text-lg font-semibold text-emerald-800">Presensi tercatat</p>
                            <p className="text-sm text-emerald-700">Anda sudah presensi hari ini. Sampai jumpa besok!</p>
                        </div>
                    </div>
                </Card>
            ) : (
                // ---- form presensi
                <Card>
                    <CardContent className="space-y-5 p-5">
                        {/* langkah 1 — lokasi */}
                        <Step n={1} title="Ambil Lokasi" done={!!coords}>
                            <Button variant={coords ? "outline" : "default"} className="w-full" onClick={getLocation} disabled={locating}>
                                {locating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                                {coords ? "Perbarui Lokasi" : "Ambil Lokasi Saya"}
                            </Button>
                            {coords && (
                                <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-xs">
                                    <span className="font-mono text-muted-foreground">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</span>
                                    <a href={`https://www.google.com/maps?q=${coords.lat},${coords.lng}`} target="_blank" rel="noreferrer"
                                        className="inline-flex items-center gap-1 font-medium text-primary">Lihat <ExternalLink className="h-3 w-3" /></a>
                                </div>
                            )}
                        </Step>

                        {/* langkah 2 — foto */}
                        <Step n={2} title="Foto Wajah" done={!!photo}>
                            {preview ? (
                                <div className="relative overflow-hidden rounded-lg border">
                                    <img src={preview} alt="Pratinjau foto presensi" className="aspect-video w-full object-cover" />
                                    <button onClick={() => setPhoto(null)}
                                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed py-8 text-center text-sm text-muted-foreground hover:border-primary/50 hover:bg-muted/40">
                                    <Camera className="h-6 w-6" />
                                    <span>Ketuk untuk ambil / pilih foto</span>
                                    <input type="file" accept="image/*" capture="user" className="hidden"
                                        onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
                                </label>
                            )}
                        </Step>

                        {/* langkah 3 — catatan + kirim */}
                        <Step n={3} title="Kirim" done={false}>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Catatan (opsional)</Label>
                                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="mis. mengajar kelas A1" />
                            </div>
                            {msg && <p className="text-sm text-destructive">{msg}</p>}
                            <Button className="w-full" disabled={!coords || !photo || submit.isPending}
                                onClick={() => { setMsg(null); submit.mutate(); }}>
                                {submit.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                                Presensi Sekarang
                            </Button>
                            <p className="flex items-center justify-center gap-1 text-center text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" /> Ditolak jika di luar radius lokasi kelas.
                            </p>
                        </Step>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function Step({ n, title, done, children }: { n: number; title: string; done: boolean; children: React.ReactNode }) {
    return (
        <div className="space-y-2.5">
            <div className="flex items-center gap-2">
                <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                    done ? "bg-emerald-500 text-white" : "bg-primary/10 text-primary")}>
                    {done ? <Check className="h-3.5 w-3.5" /> : n}
                </span>
                <span className="text-sm font-medium">{title}</span>
            </div>
            <div className="space-y-2 pl-8">{children}</div>
        </div>
    );
}

// ------------------------------------------------------------------ Rekap (admin/super)
type Row = { id: number; attendance_date: string; latitude: number; longitude: number; notes: string | null; trainer?: { name: string } };

function Rekap() {
    const qc = useQueryClient();
    const confirm = useConfirm();
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [page, setPage] = useState(1);

    const q = useQuery({
        queryKey: ["presensi-rekap", { dateFrom, dateTo, page }],
        queryFn: async () =>
            (await api.get<ApiEnvelope<{ data: Row[]; total: number; current_page: number; last_page: number }>>(
                "/absensi-karyawan/rekap",
                { params: { date_from: dateFrom || undefined, date_to: dateTo || undefined, page } }
            )).data.data,
        placeholderData: keepPreviousData,
    });

    const remove = useMutation({
        mutationFn: async (id: number) => (await api.delete(`/absensi-karyawan/${id}`)).data,
        onSuccess: () => qc.invalidateQueries({ queryKey: ["presensi-rekap"] }),
    });

    const onDelete = async (r: Row) => {
        const ok = await confirm({
            title: "Hapus presensi?",
            description: `Presensi ${r.trainer?.name ?? "trainer"} tanggal ${r.attendance_date?.slice(0, 10)} akan dihapus.`,
            confirmText: "Hapus", variant: "destructive",
        });
        if (ok) remove.mutate(r.id);
    };

    const rows = q.data?.data ?? [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Rekap Presensi Trainer</h1>
                <p className="text-sm text-muted-foreground">Riwayat presensi harian trainer.</p>
            </div>

            <Card className="overflow-hidden">
                <div className="flex flex-wrap items-end gap-3 border-b p-4">
                    <div><Label className="text-xs">Dari</Label><Input type="date" className="mt-1" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} /></div>
                    <div><Label className="text-xs">Sampai</Label><Input type="date" className="mt-1" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} /></div>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tanggal</TableHead><TableHead>Trainer</TableHead>
                            <TableHead>Lokasi</TableHead><TableHead>Catatan</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {q.isLoading
                            ? Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-9 w-full" /></TableCell></TableRow>))
                            : rows.length
                                ? rows.map((r) => (
                                    <TableRow key={r.id}>
                                        <TableCell className="whitespace-nowrap text-sm">
                                            <span className="inline-flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />{r.attendance_date?.slice(0, 10)}</span>
                                        </TableCell>
                                        <TableCell className="font-medium">{r.trainer?.name ?? "—"}</TableCell>
                                        <TableCell>
                                            <a href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`} target="_blank" rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-sm text-primary">Peta <ExternalLink className="h-3.5 w-3.5" /></a>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{r.notes ?? "—"}</TableCell>
                                        <TableCell className="text-right">
                                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => onDelete(r)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>))
                                : <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Belum ada presensi.</TableCell></TableRow>}
                    </TableBody>
                </Table>

                {q.data && q.data.last_page > 1 && (
                    <div className="flex items-center justify-between border-t p-4 text-sm text-muted-foreground">
                        <span>Total {q.data.total} · Halaman {q.data.current_page}/{q.data.last_page}</span>
                        <div className="flex gap-1">
                            <Button size="icon" variant="outline" disabled={q.data.current_page <= 1} onClick={() => setPage((x) => x - 1)}>‹</Button>
                            <Button size="icon" variant="outline" disabled={q.data.current_page >= q.data.last_page} onClick={() => setPage((x) => x + 1)}>›</Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}

// ------------------------------------------------------------------ router by role
function Inner() {
    const role = useAuth((s) => (s.actor?.kind === "user" ? s.actor.role : ""));
    return role === "trainer" ? <Presensi /> : <Rekap />;
}

export default function Page() {
    return <InternalShell><Inner /></InternalShell>;
}