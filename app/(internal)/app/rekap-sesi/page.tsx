"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Eye, CalendarDays, SlidersHorizontal, X, Clock, User, Users } from "lucide-react";
import { api, type ApiEnvelope } from "@/lib/api";
import { InternalShell } from "@/components/internal/InternalShell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type Sesi = { id: number; started_at: string; ended_at: string | null; status: string; kelas: { name: string } | null; trainer: { name: string } | null; hadir: number; izin: number; sakit: number; alpa: number };
type Paginated = { data: Sesi[]; current_page: number; last_page: number; total: number };

const iso = (d: Date) => d.toISOString().slice(0, 10);
const tgl = (s: string) => new Date(s).toLocaleDateString("id-ID", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
const jam = (s: string) => new Date(s).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

const PRESETS: { key: string; label: string; range: () => [string, string] }[] = [
    { key: "today", label: "Hari ini", range: () => { const t = new Date(); return [iso(t), iso(t)]; } },
    { key: "7", label: "7 hari", range: () => { const t = new Date(); const f = new Date(); f.setDate(t.getDate() - 6); return [iso(f), iso(t)]; } },
    { key: "30", label: "30 hari", range: () => { const t = new Date(); const f = new Date(); f.setDate(t.getDate() - 29); return [iso(f), iso(t)]; } },
];

export default function RekapSesiPage() {
    const router = useRouter();
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [preset, setPreset] = useState<string>("all");
    const [page, setPage] = useState(1);

    const applyPreset = (p: typeof PRESETS[number] | null) => {
        if (!p) { setFrom(""); setTo(""); setPreset("all"); } else { const [f, t] = p.range(); setFrom(f); setTo(t); setPreset(p.key); }
        setPage(1);
    };

    const { data, isLoading } = useQuery({
        queryKey: ["rekap-sesi", from, to, page],
        queryFn: async () => (await api.get<ApiEnvelope<Paginated>>("/sesi/rekap", { params: { date_from: from || undefined, date_to: to || undefined, page } })).data.data,
        placeholderData: keepPreviousData,
    });

    const hasFilter = !!from || !!to;

    return (
        <InternalShell>
            <PageHeader title="Rekap Sesi" subtitle="Riwayat sesi & kehadiran murid." />

            {/* Filter bar modern */}
            <Card className="mt-5 mb-5 border-2 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <SlidersHorizontal className="h-4 w-4" /> Filter
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                    {PRESETS.map((p) => (
                        <button key={p.key} onClick={() => applyPreset(p)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${preset === p.key ? "border-primary bg-primary text-white" : "bg-background hover:bg-muted"}`}>
                            {p.label}
                        </button>
                    ))}
                    {hasFilter && (
                        <button onClick={() => applyPreset(null)} className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                            <X className="h-3 w-3" /> Reset
                        </button>
                    )}
                </div>

                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                    <DateField label="Dari" value={from} onChange={(v) => { setFrom(v); setPreset("custom"); setPage(1); }} />
                    <span className="hidden pb-2.5 text-muted-foreground sm:inline">—</span>
                    <DateField label="Sampai" value={to} onChange={(v) => { setTo(v); setPreset("custom"); setPage(1); }} />
                    <div className="flex-1 sm:text-right">
                        {data && <span className="text-xs text-muted-foreground">{data.total} sesi ditemukan</span>}
                    </div>
                </div>
            </Card>

            {/* List */}
            <div className="space-y-3">
                {isLoading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
                    : data?.data.length ? data.data.map((s) => <SesiCard key={s.id} s={s} onOpen={() => router.push(`/app/rekap-sesi/${s.id}`)} />)
                        : <Card className="flex flex-col items-center gap-2 border-2 p-12 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"><CalendarDays className="h-6 w-6" /></span><p className="text-sm text-muted-foreground">Tidak ada sesi pada rentang ini.</p></Card>}
            </div>

            {data && data.last_page > 1 && (
                <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Hal. {data.current_page}/{data.last_page}</span>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Sebelumnya</Button>
                        <Button size="sm" variant="outline" disabled={page >= data.last_page} onClick={() => setPage((p) => p + 1)}>Berikutnya</Button>
                    </div>
                </div>
            )}
        </InternalShell>
    );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
            <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="date" value={value} onChange={(e) => onChange(e.target.value)}
                    className="h-10 rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
        </label>
    );
}

function SesiCard({ s, onOpen }: { s: Sesi; onOpen: () => void }) {
    const total = s.hadir + s.izin + s.sakit + s.alpa;
    const seg = [
        { n: s.hadir, cls: "bg-emerald-500", label: "Hadir" },
        { n: s.izin, cls: "bg-blue-500", label: "Izin" },
        { n: s.sakit, cls: "bg-amber-500", label: "Sakit" },
        { n: s.alpa, cls: "bg-red-500", label: "Alpa" },
    ];
    const accent = s.status === "ended" ? "bg-emerald-500" : "bg-blue-500";

    return (
        <Card className="overflow-hidden border-2">
            <div className="flex">
                <div className={`w-1.5 shrink-0 ${accent}`} />
                <div className="min-w-0 flex-1 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                            <div className="truncate font-semibold">{s.kelas?.name ?? "—"}</div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {tgl(s.started_at)}</span>
                                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {jam(s.started_at)}{s.ended_at ? `–${jam(s.ended_at)}` : ""}</span>
                                {s.trainer && <span className="inline-flex items-center gap-1"><User className="h-3 w-3" /> {s.trainer.name}</span>}
                            </div>
                        </div>
                        <Badge variant="outline" className={s.status === "ended" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-blue-200 bg-blue-50 text-blue-700"}>{s.status === "ended" ? "Selesai" : "Berlangsung"}</Badge>
                    </div>

                    {/* bar komposisi kehadiran */}
                    <div className="mt-3">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3 w-3" /> {total} murid ditandai</div>
                        <div className="mt-1 flex h-2.5 overflow-hidden rounded-full bg-muted">
                            {total === 0 ? null : seg.map((g, i) => g.n > 0 && <div key={i} className={g.cls} style={{ width: `${(g.n / total) * 100}%` }} title={`${g.label} ${g.n}`} />)}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {seg.map((g) => (
                                <span key={g.label} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                                    <span className={`h-2 w-2 rounded-full ${g.cls}`} /> {g.label} {g.n}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="mt-3 flex justify-end">
                        <Button size="sm" variant="outline" onClick={onOpen}><Eye className="mr-1.5 h-4 w-4" /> Detail</Button>
                    </div>
                </div>
            </div>
        </Card>
    );
}