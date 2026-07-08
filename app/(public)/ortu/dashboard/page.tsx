"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CalendarCheck, Wallet, GraduationCap, ClipboardList, FileText, ChevronRight, CheckCircle2 } from "lucide-react";
import { api, type ApiEnvelope } from "@/lib/api";
import { ParentShell } from "@/components/ortu/ParentShell";
import { useParent } from "@/lib/parent-store";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useParentGuard } from "@/lib/use-parent-guard";

type Progress = {
    student: { id: number; name: string; student_code: string; status: string };
    summary: { hadir: number; izin: number; tidak_hadir: number; total_sesi: number };
    attendances: unknown[];
};
type Invoice = { id: number; status: string };
type Rapot = { id: number };

const COLORS = { hadir: "#10b981", izin: "#3b82f6", tidak_hadir: "#ef4444" };

export default function OrtuDashboard() {
    const { parent, ready } = useParentGuard();

    const progQ = useQuery({
        queryKey: ["ortu-progress", parent?.studentId],
        enabled: !!parent?.studentId,
        queryFn: async () =>
            (await api.post<ApiEnvelope<Progress>>("/murid/progress", { student_id: parent!.studentId, phone: parent!.phone })).data.data,
    });
    const invQ = useQuery({
        queryKey: ["ortu-invoices", parent?.studentId],
        enabled: !!parent?.studentId,
        queryFn: async () =>
            (await api.post<ApiEnvelope<{ invoices: Invoice[] }>>("/bayar/tagihan", { student_id: parent!.studentId, phone: parent!.phone })).data.data.invoices,
    });
    const rapotQ = useQuery({
        queryKey: ["ortu-rapot-count", parent?.studentId],
        enabled: !!parent?.studentId,
        queryFn: async () =>
            (await api.post<ApiEnvelope<Rapot[]>>("/e-rapot/parent", { student_id: parent!.studentId, phone: parent!.phone })).data.data,
    });

    // semua hook di atas dipanggil dulu, baru boleh early-return
    if (!ready || !parent) {
        return (
            <ParentShell>
                <Skeleton className="h-64 rounded-xl" />
            </ParentShell>
        );
    }

    const s = progQ.data?.summary;
    const belumLunas = (invQ.data ?? []).filter((i) => i.status !== "lunas").length;
    const rapotCount = rapotQ.data?.length ?? 0;

    const pie = s
        ? [
            { name: "Hadir", key: "hadir", value: s.hadir },
            { name: "Izin", key: "izin", value: s.izin },
            { name: "Tidak Hadir", key: "tidak_hadir", value: s.tidak_hadir },
        ].filter((d) => d.value > 0)
        : [];

    const loading = progQ.isLoading;

    return (
        <ParentShell>
            <PageHeader
                title={progQ.data ? `Halo, ${progQ.data.student.name} 👋` : "Beranda"}
                subtitle={progQ.data ? `${progQ.data.student.student_code} · Status: ${progQ.data.student.status}` : "Ringkasan perkembangan ananda."}
            />

            {loading || !s ? (
                <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
                    <Skeleton className="h-72 rounded-xl" />
                </div>
            ) : (
                <div className="mt-4 space-y-6">
                    {/* KPI */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Kpi icon={<ClipboardList className="h-5 w-5" />} label="Total Sesi" value={s.total_sesi} tint="bg-slate-100 text-slate-700" />
                        <Kpi icon={<CalendarCheck className="h-5 w-5" />} label="Hadir" value={s.hadir} tint="bg-emerald-100 text-emerald-700" />
                        <Kpi icon={<Wallet className="h-5 w-5" />} label="Tagihan Belum Lunas" value={belumLunas} tint="bg-amber-100 text-amber-700" />
                        <Kpi icon={<GraduationCap className="h-5 w-5" />} label="E-Rapot" value={rapotCount} tint="bg-blue-100 text-blue-700" />
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Chart kehadiran */}
                        <Card className="border-2 p-5 lg:col-span-2">
                            <h3 className="mb-4 flex items-center gap-1.5 text-sm font-semibold"><CalendarCheck className="h-4 w-4" /> Rekap Kehadiran</h3>
                            {pie.length ? (
                                <div className="flex flex-col items-center gap-6 sm:flex-row">
                                    <div className="h-52 w-52">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={pie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                                                    {pie.map((d) => <Cell key={d.key} fill={COLORS[d.key as keyof typeof COLORS]} />)}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        {pie.map((d) => (
                                            <div key={d.key} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                                                <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: COLORS[d.key as keyof typeof COLORS] }} /> {d.name}</span>
                                                <span className="font-semibold">{d.value} sesi</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="py-10 text-center text-sm text-muted-foreground">Belum ada data kehadiran.</p>
                            )}
                        </Card>

                        {/* Tagihan ringkas → tautan ke halaman Tagihan */}
                        <Card className="flex flex-col border-2 p-5">
                            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold"><Wallet className="h-4 w-4" /> Tagihan</h3>
                            {belumLunas > 0 ? (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                                    <div className="text-sm text-amber-800">Ada tagihan menunggu</div>
                                    <div className="mt-1 text-3xl font-bold text-amber-600">{belumLunas}</div>
                                    <div className="text-xs text-amber-700">tagihan belum lunas</div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                                    <CheckCircle2 className="h-5 w-5" /> Semua tagihan lunas
                                </div>
                            )}
                            <Link href="/ortu/tagihan" className="mt-auto pt-3">
                                <Button className="w-full" variant={belumLunas > 0 ? "default" : "outline"}>Buka Halaman Tagihan <ChevronRight className="ml-1 h-4 w-4" /></Button>
                            </Link>
                        </Card>
                    </div>

                    {/* Shortcut */}
                    <div className="grid gap-4 sm:grid-cols-3">
                        <ShortcutCard href="/ortu/progres" icon={<ClipboardList className="h-5 w-5" />} title="Progres Belajar" desc="Kehadiran & catatan trainer" />
                        <ShortcutCard href="/ortu/tagihan" icon={<Wallet className="h-5 w-5" />} title="Tagihan" desc="Bayar & unggah bukti" />
                        <ShortcutCard href="/ortu/rapot" icon={<FileText className="h-5 w-5" />} title="E-Rapot" desc="Unduh rapor per semester" />
                    </div>
                </div>
            )}
        </ParentShell>
    );
}

function Kpi({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: number; tint: string }) {
    return (
        <Card className="border-2 p-4">
            <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${tint}`}>{icon}</span>
                <div>
                    <div className="text-2xl font-bold leading-none">{value}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{label}</div>
                </div>
            </div>
        </Card>
    );
}

function ShortcutCard({
    href,
    icon,
    title,
    desc,
    tint = "primary",
}: {
    href: string;
    icon: React.ReactNode;
    title: string;
    desc: string;
    tint?: "primary" | "emerald" | "amber" | "blue";
}) {
    const tints: Record<string, { icon: string; ring: string }> = {
        primary: { icon: "bg-primary/10 text-primary", ring: "hover:border-primary/40" },
        emerald: { icon: "bg-emerald-100 text-emerald-600", ring: "hover:border-emerald-300" },
        amber: { icon: "bg-amber-100 text-amber-600", ring: "hover:border-amber-300" },
        blue: { icon: "bg-blue-100 text-blue-600", ring: "hover:border-blue-300" },
    };
    const t = tints[tint];

    return (
        <Link href={href} className="block">
            <Card
                className={`group flex !flex-row items-center gap-4 border-2 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${t.ring}`}
            >
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${t.icon} transition-transform duration-200 group-hover:scale-105`}>
                    {icon}
                </span>

                <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{title}</div>
                    <div className="truncate text-xs text-muted-foreground">{desc}</div>
                </div>

                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-all duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                    <ChevronRight className="h-4 w-4" />
                </span>
            </Card>
        </Link>
    );
}