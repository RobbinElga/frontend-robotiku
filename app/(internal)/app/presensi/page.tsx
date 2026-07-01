"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { MapPin, Camera, Loader2, Check, CalendarClock, Trash2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { api, apiError, type ApiEnvelope } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { InternalShell } from "@/components/internal/InternalShell";

function Presensi() {
    const qc = useQueryClient();
    const today = useQuery({ queryKey: ["presensi-today"], queryFn: async () => (await api.get<ApiEnvelope<{ sudah_presensi: boolean }>>("/absensi-karyawan/today")).data.data });
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [photo, setPhoto] = useState<File | null>(null);
    const [notes, setNotes] = useState("");
    const [msg, setMsg] = useState<string | null>(null);
    const [locating, setLocating] = useState(false);

    const getLocation = () => {
        setMsg(null); setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
            () => { setMsg("Gagal mengambil lokasi. Izinkan akses lokasi di browser."); setLocating(false); },
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
                <p className="text-sm text-muted-foreground">Presensi sekali per hari dengan lokasi & foto.</p>
            </div>

            <Card>
                <CardHeader><CardTitle className="text-base">Presensi Hari Ini</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {today.isLoading ? <Skeleton className="h-24 w-full" /> : sudah ? (
                        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
                            <Check className="h-5 w-5" /> <span className="font-medium">Anda sudah presensi hari ini.</span>
                        </div>
                    ) : (
                        <>
                            <Button variant="outline" className="w-full" onClick={getLocation} disabled={locating}>
                                {locating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                                {coords ? "Perbarui Lokasi" : "Ambil Lokasi"}
                            </Button>
                            {coords && <p className="text-center text-xs text-muted-foreground">Lokasi: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</p>}

                            <div>
                                <Label className="flex items-center gap-2"><Camera className="h-4 w-4" /> Foto</Label>
                                <input type="file" accept="image/*" capture="user" className="mt-1 block w-full text-sm file:mr-3 file:rounded-md file:border file:bg-muted file:px-3 file:py-1.5" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
                            </div>
                            <div><Label>Catatan (opsional)</Label><Input className="mt-1" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>

                            {msg && <p className="text-sm text-destructive">{msg}</p>}
                            <Button className="w-full" disabled={!coords || !photo || submit.isPending} onClick={() => { setMsg(null); submit.mutate(); }}>
                                {submit.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Presensi Sekarang
                            </Button>
                            <p className="text-center text-xs text-muted-foreground">Presensi ditolak jika di luar radius lokasi.</p>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function Rekap() {
    const qc = useQueryClient();
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [page, setPage] = useState(1);

    const q = useQuery({
        queryKey: ["presensi-rekap", { dateFrom, dateTo, page }],
        queryFn: async () => (await api.get("/absensi-karyawan/rekap", { params: { date_from: dateFrom || undefined, date_to: dateTo || undefined, page } })).data.data,
        placeholderData: keepPreviousData,
    });
    const remove = useMutation({
        mutationFn: async (id: number) => (await api.delete(`/absensi-karyawan/${id}`)).data,
        onSuccess: () => qc.invalidateQueries({ queryKey: ["presensi-rekap"] }),
    });

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
                        <TableRow><TableHead>Tanggal</TableHead><TableHead>Trainer</TableHead><TableHead>Lokasi</TableHead><TableHead>Catatan</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                        {q.isLoading && Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-9 w-full" /></TableCell></TableRow>
                        ))}
                        {rows.map((r: any) => (
                            <TableRow key={r.id}>
                                <TableCell className="text-sm">{r.attendance_date?.slice(0, 10)}</TableCell>
                                <TableCell className="font-medium">{r.trainer?.name ?? "—"}</TableCell>
                                <TableCell>
                                    <a href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary">
                                        Peta <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">{r.notes ?? "—"}</TableCell>
                                <TableCell className="text-right"><Button size="icon" variant="ghost" className="text-destructive" onClick={() => confirm("Hapus presensi ini?") && remove.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                            </TableRow>
                        ))}
                        {!q.isLoading && rows.length === 0 && <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Belum ada presensi.</TableCell></TableRow>}
                    </TableBody>
                </Table>
                {q.data && (
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

function Inner() {
    const role = useAuth((s) => (s.actor?.kind === "user" ? s.actor.role : ""));
    return role === "trainer" ? <Presensi /> : <Rekap />;
}

export default function Page() {
    return <InternalShell><Inner /></InternalShell>;
}