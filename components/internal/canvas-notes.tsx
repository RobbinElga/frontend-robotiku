"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, MapPin, UploadCloud, Image as ImageIcon, ExternalLink, CalendarClock, X } from "lucide-react";
import { api, apiError, type ApiEnvelope } from "@/lib/api";
import { AuthImage } from "@/components/ui/auth-image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Note = { id: number; type: "pertemuan" | "audit"; note: string; photo: string | null; latitude: number | null; longitude: number | null; created_at: string; creator?: { name: string } | null };

function MiniMap({ lat, lng, className }: { lat: number; lng: number; className?: string }) {
    const d = 0.008;
    const bbox = `${lng - d},${lat - d},${lng + d},${lat + d}`;
    return <iframe title="peta" loading="lazy" className={cn("rounded-lg border", className)} src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`} />;
}

const tglJam = (s: string) => new Date(s).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function CanvasNotes({ schoolId, notes, onSaved }: { schoolId: number; notes: Note[]; onSaved: () => void }) {
    const [type, setType] = useState<"pertemuan" | "audit">("pertemuan");
    const [note, setNote] = useState("");
    const [photo, setPhoto] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
    const [locBusy, setLocBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const pickPhoto = (f: File | null) => {
        setPhoto(f);
        setPreview(f ? URL.createObjectURL(f) : null);
    };

    const ambilLokasi = () => {
        setErr(null);
        if (!navigator.geolocation) { setErr("Perangkat tidak mendukung GPS."); return; }
        setLocBusy(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => { setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocBusy(false); },
            (e) => { setErr("Gagal mengambil lokasi: " + e.message); setLocBusy(false); },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    };

    const isPertemuan = type === "pertemuan";
    const valid = note.trim() && (!isPertemuan || (photo && loc));

    const save = useMutation({
        mutationFn: async () => {
            const fd = new FormData();
            fd.append("type", type);
            fd.append("note", note);
            if (photo) fd.append("photo", photo);
            if (loc) { fd.append("latitude", String(loc.lat)); fd.append("longitude", String(loc.lng)); }
            return api.post<ApiEnvelope<Note>>(`/canvas/schools/${schoolId}/notes`, fd);
        },
        onSuccess: () => { setNote(""); pickPhoto(null); setLoc(null); setErr(null); onSaved(); },
        onError: (e) => setErr(apiError(e, "Gagal menyimpan catatan.")),
    });

    return (
        <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold">Catatan</h3>

            {/* Tipe */}
            <div className="mb-3 inline-flex rounded-lg border p-1">
                {(["pertemuan", "audit"] as const).map((t) => (
                    <button key={t} onClick={() => setType(t)} className={cn("rounded-md px-3 py-1.5 text-sm font-medium capitalize", type === t ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
                        {t === "pertemuan" ? "Catatan Pertemuan" : "Audit"}
                    </button>
                ))}
            </div>

            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Tulis catatan…"
                className="w-full resize-y rounded-md border border-input bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />

            {isPertemuan && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {/* Foto wajib */}
                    <div>
                        <label className="mb-1 block text-xs font-medium">Foto kunjungan <span className="text-red-600">*</span></label>
                        {preview ? (
                            <div className="relative overflow-hidden rounded-lg border">
                                <img src={preview} alt="foto" className="h-36 w-full object-cover" />
                                <button onClick={() => pickPhoto(null)} className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"><X className="h-4 w-4" /></button>
                            </div>
                        ) : (
                            <label className="flex h-36 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed text-muted-foreground hover:border-primary/50 hover:bg-muted/40">
                                <UploadCloud className="h-6 w-6" />
                                <span className="text-xs">Klik untuk unggah foto</span>
                                <input type="file" accept="image/jpeg,image/png" capture="environment" className="hidden" onChange={(e) => pickPhoto(e.target.files?.[0] ?? null)} />
                            </label>
                        )}
                    </div>

                    {/* Lokasi wajib */}
                    <div>
                        <label className="mb-1 block text-xs font-medium">Lokasi kedatangan <span className="text-red-600">*</span></label>
                        {loc ? (
                            <div className="space-y-1.5">
                                <MiniMap lat={loc.lat} lng={loc.lng} className="h-28 w-full" />
                                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                    <span>{loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}</span>
                                    <button onClick={ambilLokasi} className="text-primary hover:underline">Perbarui</button>
                                </div>
                            </div>
                        ) : (
                            <button type="button" onClick={ambilLokasi} disabled={locBusy}
                                className="flex h-36 w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed text-muted-foreground hover:border-primary/50 hover:bg-muted/40">
                                {locBusy ? <Loader2 className="h-6 w-6 animate-spin" /> : <MapPin className="h-6 w-6" />}
                                <span className="text-xs">{locBusy ? "Mengambil lokasi…" : "Ambil Lokasi Saya"}</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {err && <p className="mt-2 text-sm text-red-600">{err}</p>}

            <Button className="mt-3" disabled={!valid || save.isPending} onClick={() => save.mutate()}>
                {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Tambah Catatan
            </Button>
            {isPertemuan && !valid && <p className="mt-1.5 text-xs text-muted-foreground">Catatan pertemuan wajib menyertakan foto & lokasi.</p>}

            {/* Daftar catatan */}
            <div className="mt-5 space-y-3 border-t pt-4">
                {notes.length ? notes.map((n) => (
                    <div key={n.id} className="rounded-lg border p-3">
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                            <span className={cn("rounded px-2 py-0.5 text-[10px] font-bold uppercase", n.type === "pertemuan" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>{n.type}</span>
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><CalendarClock className="h-3 w-3" /> {tglJam(n.created_at)}{n.creator?.name ? ` · ${n.creator.name}` : ""}</span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm">{n.note}</p>
                        {(n.photo || n.latitude != null) && (
                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                {n.photo && <AuthImage path={n.photo} alt="foto kunjungan" className="h-32 w-full rounded-lg border object-cover" />}
                                {n.latitude != null && n.longitude != null && (
                                    <div className="space-y-1">
                                        <MiniMap lat={n.latitude} lng={n.longitude} className="h-28 w-full" />
                                        <a href={`https://www.openstreetmap.org/?mlat=${n.latitude}&mlon=${n.longitude}#map=17/${n.latitude}/${n.longitude}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"><ExternalLink className="h-3 w-3" /> Buka lokasi di peta</a>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )) : <p className="text-sm text-muted-foreground">Belum ada catatan.</p>}
            </div>
        </Card>
    );
}