"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Building2, Handshake, MapPinned, Users, TrendingUp, CalendarClock, ExternalLink, NotebookText, ChevronDown } from "lucide-react";
import { api, type ApiEnvelope } from "@/lib/api";
import { InternalShell } from "@/components/internal/InternalShell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { COLORS } from "@/components/ui/chart-kit";
import { publicMediaUrl as fileUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

type Canvaser = { name: string; total: number; mou: number; kunjungan: number; konversi: number };
type Recent = { id: number; school: string; note: string; photo: string | null; latitude: number | null; longitude: number | null; created_at: string; canvaser: string | null };
type Rekap = {
    kpi: { total: number; mou: number; konversi: number; kunjungan: number; canvaser_aktif: number };
    status: { name: string; value: number }[];
    per_canvaser: Canvaser[];
    tren: { bulan: string; jumlah: number }[];
    recent: Recent[];
};
type SchoolRef = { id: number; name: string; pipeline_status: string };
type Note = { id: number; kind: string; note: string; photo: string | null; latitude: number | null; longitude: number | null; created_at: string; creator?: { name: string } };

const tglJam = (s: string) => new Date(s).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function MiniMap({ lat, lng, className }: { lat: number; lng: number; className?: string }) {
    const d = 0.008;
    return <iframe title="peta" loading="lazy" className={className} src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - d},${lat - d},${lng + d},${lat + d}&layer=mapnik&marker=${lat},${lng}`} />;
}

export default function CanvasRekapPage() {
    const { data, isLoading } = useQuery({
        queryKey: ["canvas-rekap"],
        queryFn: async () => (await api.get<ApiEnvelope<Rekap>>("/canvas/rekap")).data.data,
    });

    return (
        <InternalShell>
            <PageHeader title="Rekap Canvas" subtitle="Pemantauan hasil pipeline CRM sekolah mitra." />

            {isLoading || !data ? (
                <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
                    <Skeleton className="h-72 rounded-xl" />
                </div>
            ) : (
                <div className="mt-4 space-y-4">
                    {/* KPI */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        <Kpi icon={<Building2 />} label="Total Sekolah" value={data.kpi.total} tint="bg-blue-50 text-blue-600" />
                        <Kpi icon={<Handshake />} label="Sudah MoU" value={data.kpi.mou} tint="bg-emerald-50 text-emerald-600" />
                        <Kpi icon={<TrendingUp />} label="Konversi" value={`${data.kpi.konversi}%`} tint="bg-violet-50 text-violet-600" />
                        <Kpi icon={<MapPinned />} label="Total Kunjungan" value={data.kpi.kunjungan} tint="bg-amber-50 text-amber-600" />
                        <Kpi icon={<Users />} label="Canvaser Aktif" value={data.kpi.canvaser_aktif} tint="bg-slate-100 text-slate-600" />
                    </div>

                    {/* Charts */}
                    <div className="grid gap-4 lg:grid-cols-2">
                        <ChartCard title="Distribusi Status Pipeline">
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie data={data.status} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                                        {data.status.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip /><Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartCard>
                        <ChartCard title="Sekolah Baru per Bulan">
                            <ResponsiveContainer width="100%" height={260}>
                                <AreaChart data={data.tren}>
                                    <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0476d9" stopOpacity={0.4} /><stop offset="100%" stopColor="#0476d9" stopOpacity={0} /></linearGradient></defs>
                                    <XAxis dataKey="bulan" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip />
                                    <Area type="monotone" dataKey="jumlah" stroke="#0476d9" fill="url(#cg)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>

                    {/* Performa canvaser */}
                    <Card className="overflow-hidden">
                        <h3 className="border-b p-5 text-sm font-semibold">Performa Canvaser (Marketing)</h3>
                        {data.per_canvaser.length ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                            <th className="px-5 py-3 font-medium">Canvaser</th>
                                            <th className="px-5 py-3 font-medium">Sekolah</th>
                                            <th className="px-5 py-3 font-medium">MoU</th>
                                            <th className="px-5 py-3 font-medium">Kunjungan</th>
                                            <th className="px-5 py-3 font-medium">Konversi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.per_canvaser.map((c, i) => (
                                            <tr key={i} className="border-b last:border-0">
                                                <td className="px-5 py-3 font-medium">{c.name}</td>
                                                <td className="px-5 py-3">{c.total}</td>
                                                <td className="px-5 py-3">{c.mou}</td>
                                                <td className="px-5 py-3">{c.kunjungan}</td>
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${c.konversi}%` }} /></div>
                                                        <span className="text-xs font-semibold">{c.konversi}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : <p className="p-6 text-center text-sm text-muted-foreground">Belum ada data canvaser.</p>}
                    </Card>

                    {/* Telusuri catatan per sekolah */}
                    <SchoolNotesExplorer />

                    {/* Kunjungan terbaru (global) */}
                    <Card className="p-5">
                        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold"><MapPinned className="h-4 w-4" /> Kunjungan Terbaru (Semua Sekolah)</h3>
                        {data.recent.length ? (
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {data.recent.map((r) => (
                                    <NoteCard key={r.id} title={r.school} kindLabel="Pertemuan" note={r.note} photo={r.photo} lat={r.latitude} lng={r.longitude} meta={`${tglJam(r.created_at)}${r.canvaser ? ` · ${r.canvaser}` : ""}`} />
                                ))}
                            </div>
                        ) : <p className="text-sm text-muted-foreground">Belum ada kunjungan tercatat.</p>}
                    </Card>
                </div>
            )}
        </InternalShell>
    );
}

function SchoolNotesExplorer() {
    const [schoolId, setSchoolId] = useState("");
    const [filter, setFilter] = useState<"semua" | "pertemuan" | "audit">("semua");

    const { data: schools } = useQuery({
        queryKey: ["rekap-schools"],
        queryFn: async () => (await api.get<ApiEnvelope<SchoolRef[]>>("/canvas/rekap/schools")).data.data,
    });

    const { data: notes, isLoading } = useQuery({
        queryKey: ["rekap-school-notes", schoolId],
        enabled: !!schoolId,
        queryFn: async () => (await api.get<ApiEnvelope<Note[]>>(`/canvas/rekap/schools/${schoolId}/notes`)).data.data,
    });

    const list = (notes ?? []).filter((n) => filter === "semua" || n.kind === filter);
    const school = schools?.find((s) => String(s.id) === schoolId);

    return (
        <Card className="p-5">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold"><NotebookText className="h-4 w-4" /> Telusuri Catatan per Sekolah</h3>

            {/* Pilih sekolah */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:max-w-sm">
                    <select value={schoolId} onChange={(e) => { setSchoolId(e.target.value); setFilter("semua"); }}
                        className="h-10 w-full appearance-none rounded-md border border-input bg-background px-3 pr-9 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                        <option value="">— pilih sekolah —</option>
                        {schools?.map((s) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>

                {schoolId && (
                    <div className="inline-flex rounded-lg border p-1">
                        {(["semua", "pertemuan", "audit"] as const).map((f) => (
                            <button key={f} onClick={() => setFilter(f)} className={cn("rounded-md px-3 py-1.5 text-xs font-semibold capitalize", filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
                                {f === "semua" ? "Semua" : f === "pertemuan" ? "Pertemuan" : "Audit"}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Isi */}
            <div className="mt-4">
                {!schoolId ? (
                    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-12 text-center">
                        <NotebookText className="h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">Pilih sekolah dulu untuk melihat catatan pertemuan & audit-nya.</p>
                    </div>
                ) : isLoading ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-lg" />)}</div>
                ) : list.length ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {list.map((n) => (
                            <NoteCard key={n.id} title={school?.name ?? ""} kindLabel={n.kind === "pertemuan" ? "Pertemuan" : "Audit"} kindTone={n.kind}
                                note={n.note} photo={n.photo} lat={n.latitude} lng={n.longitude} meta={`${tglJam(n.created_at)}${n.creator?.name ? ` · ${n.creator.name}` : ""}`} />
                        ))}
                    </div>
                ) : (
                    <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">Belum ada catatan {filter !== "semua" ? filter : ""} untuk sekolah ini.</p>
                )}
            </div>
        </Card>
    );
}

function NoteCard({ title, kindLabel, kindTone, note, photo, lat, lng, meta }: {
    title: string; kindLabel: string; kindTone?: string; note: string; photo: string | null; lat: number | null; lng: number | null; meta: string;
}) {
    return (
        <div className="overflow-hidden rounded-lg border">
            {photo && <img src={fileUrl(photo)!} alt="foto" className="h-32 w-full object-cover" />}
            <div className="p-3">
                <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold">{title}</span>
                    <Badge variant="outline" className={cn("shrink-0 text-[10px]", kindTone === "audit" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary")}>{kindLabel}</Badge>
                </div>
                <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs text-muted-foreground">{note}</p>
                <div className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground"><CalendarClock className="h-3 w-3" /> {meta}</div>
                {lat != null && lng != null && (
                    <div className="mt-2 space-y-1">
                        <MiniMap lat={lat} lng={lng} className="h-24 w-full rounded border" />
                        <a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"><ExternalLink className="h-3 w-3" /> Buka lokasi kedatangan</a>
                    </div>
                )}
            </div>
        </div>
    );
}

function Kpi({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: React.ReactNode; tint: string }) {
    return (
        <Card className="p-5">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className="mt-1 text-2xl font-bold">{value}</div>
                </div>
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tint}`}>{icon}</span>
            </div>
        </Card>
    );
}
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
    return <Card className="p-5"><h3 className="mb-3 text-sm font-semibold">{title}</h3>{children}</Card>;
}