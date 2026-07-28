"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Camera, Loader2, PlayCircle, CheckCircle2, ChevronRight, Building2, X, RefreshCw, Clock, GraduationCap, Users } from "lucide-react";
import { api, apiError, type ApiEnvelope } from "@/lib/api";
import { InternalShell } from "@/components/internal/InternalShell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const MapPreview = dynamic(() => import("@/components/ui/map-preview"), { ssr: false });

type TodaySession = { id: number; status: "started" | "ended"; started_at?: string } | null;
type Kelas = { id: number; name: string; program: { name: string } | null; school: { name: string } | null; active_count: number; today_session: TodaySession };
const jam = (s?: string) => (s ? new Date(s).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "");

export default function SesiPage() {
    const router = useRouter();
    const [startFor, setStartFor] = useState<Kelas | null>(null);
    const { data, isLoading } = useQuery({ queryKey: ["sesi-kelas"], queryFn: async () => (await api.get<ApiEnvelope<Kelas[]>>("/sesi/kelas")).data.data });

    const on = data?.filter((k) => k.today_session?.status === "started").length ?? 0;
    const done = data?.filter((k) => k.today_session?.status === "ended").length ?? 0;
    const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

    return (
        <InternalShell>
            <PageHeader title="Sesi & Absensi" subtitle={today} />

            <div className="mt-5 mb-5 grid grid-cols-3 gap-3">
                <Stat label="Total Kelas" value={data?.length ?? 0} tone="muted" />
                <Stat label="Berlangsung" value={on} tone="blue" />
                <Stat label="Selesai" value={done} tone="green" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-5">
                {isLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)
                    : data?.length ? data.map((k) => {
                        const ts = k.today_session;
                        const state = !ts ? "idle" : ts.status === "started" ? "on" : "done";
                        const accent = state === "on" ? "bg-blue-500" : state === "done" ? "bg-emerald-500" : "bg-primary";
                        return (
                            <Card key={k.id} className="flex flex-col overflow-hidden border-2">
                                <div className={`h-1.5 ${accent}`} />
                                <div className="flex flex-1 flex-col p-5">
                                    <div className="flex items-start gap-3">
                                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><GraduationCap className="h-5 w-5" /></span>
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate font-semibold leading-tight">{k.name}</div>
                                            {state === "on" && <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-blue-600"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" /> Sedang berlangsung</span>}
                                            {state === "done" && <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-emerald-600"><CheckCircle2 className="h-3 w-3" /> Selesai hari ini</span>}
                                            {state === "idle" && <span className="mt-0.5 text-xs text-muted-foreground">Belum dimulai</span>}
                                        </div>
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        <Chip icon={<Building2 className="h-3 w-3" />}>{k.school?.name ?? "Kantor"}</Chip>
                                        {k.program?.name && <Chip>{k.program.name}</Chip>}
                                        <Chip icon={<Users className="h-3 w-3" />}>{k.active_count} murid</Chip>
                                        {ts?.started_at && <Chip icon={<Clock className="h-3 w-3" />}>Mulai {jam(ts.started_at)}</Chip>}
                                    </div>

                                    <div className="mt-auto pt-4">
                                        {state === "idle" && <Button className="w-full" onClick={() => setStartFor(k)}><PlayCircle className="mr-1.5 h-4 w-4" /> Mulai Sesi</Button>}
                                        {state === "on" && <Button className="w-full" onClick={() => router.push(`/app/sesi/${ts!.id}`)}>Lanjut Absensi <ChevronRight className="ml-1 h-4 w-4" /></Button>}
                                        {state === "done" && <Button variant="outline" className="w-full" onClick={() => router.push(`/app/sesi/${ts!.id}`)}>Lihat Rekap Sesi</Button>}
                                    </div>
                                </div>
                            </Card>
                        );
                    }) : <Card className="col-span-full p-12 text-center text-sm text-muted-foreground">Belum ada kelas yang Anda ampu.</Card>}
            </div>

            <StartDialog kelas={startFor} onClose={() => setStartFor(null)} />
        </InternalShell>
    );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "muted" | "blue" | "green" }) {
    const cls = tone === "blue" ? "text-blue-600" : tone === "green" ? "text-emerald-600" : "text-foreground";
    return <Card className="p-4"><div className={`text-2xl font-bold ${cls}`}>{value}</div><div className="text-xs text-muted-foreground">{label}</div></Card>;
}
function Chip({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
    return <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{icon}{children}</span>;
}

function StartDialog({ kelas, onClose }: { kelas: Kelas | null; onClose: () => void }) {
    const router = useRouter();
    const qc = useQueryClient();
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [locating, setLocating] = useState(false);
    const [photo, setPhoto] = useState<File | null>(null);
    const [msg, setMsg] = useState<string | null>(null);
    const preview = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);
    useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

    const getLoc = () => {
        setMsg(null); setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (p) => { setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }); setLocating(false); },
            () => { setMsg("Gagal mengambil lokasi. Izinkan akses GPS."); setLocating(false); }, { enableHighAccuracy: true, timeout: 10000 });
    };
    useEffect(() => { if (kelas) { setCoords(null); setPhoto(null); setMsg(null); getLoc(); } }, [kelas]);

    const start = useMutation({
        mutationFn: async () => {
            const fd = new FormData();
            fd.append("class_id", String(kelas!.id));
            fd.append("latitude", String(coords!.lat));
            fd.append("longitude", String(coords!.lng));
            fd.append("photo", photo!);
            return (await api.post<ApiEnvelope<{ id: number }>>("/sesi/mulai", fd)).data;
        },
        onSuccess: (res) => { qc.invalidateQueries({ queryKey: ["sesi-kelas"] }); onClose(); const sid = res?.data?.id; if (sid) router.push(`/app/sesi/${sid}`); },
        onError: (e) => setMsg(apiError(e, "Gagal memulai sesi.")),
    });

    return (
        <Dialog open={!!kelas} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
                <DialogHeader><DialogTitle>Mulai Sesi — {kelas?.name}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                    <div>
                        <div className="mb-1.5 flex items-center justify-between"><span className="flex items-center gap-1.5 text-sm font-medium"><MapPin className="h-4 w-4" /> Lokasi</span>{coords && <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700"><CheckCircle2 className="mr-1 h-3 w-3" /> Terkunci</Badge>}</div>
                        {locating ? <div className="flex h-[150px] items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengambil lokasi…</div>
                            : coords ? <><MapPreview lat={coords.lat} lng={coords.lng} /><div className="mt-1.5 flex items-center justify-between"><span className="font-mono text-xs text-muted-foreground">{coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}</span><button onClick={getLoc} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"><RefreshCw className="h-3 w-3" /> Perbarui</button></div></>
                                : <div className="rounded-lg border border-dashed p-4 text-center"><Button size="sm" variant="outline" onClick={getLoc}>Ambil Lokasi</Button></div>}
                    </div>
                    <div>
                        <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium"><Camera className="h-4 w-4" /> Foto Selfie</span>
                        {preview ? <div className="relative overflow-hidden rounded-lg border"><img src={preview} alt="selfie" className="aspect-[4/3] w-full object-cover" /><button onClick={() => setPhoto(null)} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white"><X className="h-4 w-4" /></button></div>
                            : <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 border-dashed py-8 text-sm text-muted-foreground hover:border-primary/50 hover:bg-muted/40"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary"><Camera className="h-5 w-5" /></span><span>Ambil foto selfie</span><input type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} /></label>}
                    </div>
                    {msg && <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{msg}</p>}
                    <Button className="w-full" disabled={!coords || !photo || start.isPending} onClick={() => { setMsg(null); start.mutate(); }}>
                        {start.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />} Mulai & Kirim Notifikasi
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}