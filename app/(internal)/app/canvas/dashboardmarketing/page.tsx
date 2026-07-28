"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Building2, Handshake, MapPinned, CalendarClock, NotebookText, Hourglass, History, CalendarDays, Info } from "lucide-react";
import { InternalShell } from "@/components/internal/InternalShell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function MarketingDashboardPage() {
    // Tarik data asli dari Backend Laravel
    const { data: realData, isLoading } = useQuery({
        queryKey: ['canvas-dashboard-marketing'],
        queryFn: async () => (await api.get("/canvas/dashboard-marketing")).data.data,
    });

    // Fungsi untuk menggulir halus ke tabel prioritas saat kotak KPI diklik
    const scrollToPrioritas = () => {
        document.getElementById("prioritas-follow-up")?.scrollIntoView({ behavior: "smooth" });
    };

    // Tampilkan indikator loading tanpa merusak layout sidebar
    if (isLoading || !realData) {
        return (
            <InternalShell>
                <div className="flex h-[60vh] items-center justify-center">
                    <span className="animate-pulse text-sm font-medium text-muted-foreground">Menyiapkan pusat komando...</span>
                </div>
            </InternalShell>
        );
    }

    // Menghitung persentase target untuk lingkaran progress menggunakan data asli (maksimal 100%)
    // Mencegah pembagian dengan 0 jika targetKunjungan belum disetel di database
    const safeTarget = Math.max(1, realData.kpi.targetKunjungan);
    const pencapaianKunjungan = Math.min(100, Math.round((realData.kpi.kunjunganBulanIni / safeTarget) * 100));

    return (
        <InternalShell>
            <PageHeader title="Pusat Komando Marketing" subtitle="Pantau performa dan target pipeline sekolah mitra Anda hari ini." />

            <div className="mt-4 space-y-6">
                
                {/* BARIS 1: SCORECARD (Metrik Detak Jantung) */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Kpi 
                        icon={<Building2 />} 
                        label="Prospek Aktif" 
                        value={realData.kpi.prospekAktif} 
                        timeframe="Kondisi Saat Ini"
                        tooltip="Menampilkan total sekolah yang saat ini berstatus Prospek dan Dalam Proses."
                        tint="bg-blue-50 text-blue-600" 
                        border="border-t-blue-500" 
                    />
                    <Kpi 
                        icon={<Hourglass />} 
                        label="Menunggu Follow-up" 
                        value={realData.kpi.menungguFollowUp} 
                        timeframe="Kondisi Saat Ini"
                        tooltip="Sekolah status Dalam Proses yang belum dikunjungi lebih dari 7 hari. Klik untuk melihat daftar ke bawah!"
                        tint="bg-rose-50 text-rose-600" 
                        border="border-t-rose-500"
                        onClick={scrollToPrioritas} 
                    />
                    <Kpi 
                        icon={<Handshake />} 
                        label="MoU Bulan Ini" 
                        value={realData.kpi.mouBulanIni} 
                        timeframe="Bulan Ini"
                        tint="bg-emerald-50 text-emerald-600" 
                        border="border-t-emerald-500" 
                    />
                    <Kpi 
                        icon={<MapPinned />} 
                        label="Kunjungan Bulan Ini" 
                        value={realData.kpi.kunjunganBulanIni} 
                        timeframe="Bulan Ini"
                        tint="bg-amber-50 text-amber-600" 
                        border="border-t-amber-500" 
                    />
                </div>

                {/* BARIS 2: VISUALISASI KINERJA */}
                <div className="grid gap-4 lg:grid-cols-5">
                    
                    {/* Sisi Kiri (60%) - Corong Pipeline */}
                    <div className="lg:col-span-3">
                        <ChartCard title="Distribusi Tahapan Pipeline" subtitle="Kondisi Saat Ini (Real-time)">
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart layout="vertical" data={realData.status} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} fontSize={13} className="font-medium text-slate-600" />
                                    <Tooltip 
                                        cursor={{ fill: 'rgba(0,0,0,0.03)' }} 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                                    />
                                    <Bar dataKey="value" fill="#0476d9" radius={[0, 6, 6, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>

                    {/* Sisi Kanan (40%) - Pencapaian Target Kunjungan */}
                    <div className="lg:col-span-2">
                        <ChartCard title="Target Kunjungan Bulanan">
                            <div className="flex h-[260px] flex-col items-center justify-center">
                                <div className="relative flex h-44 w-44 items-center justify-center rounded-full bg-slate-50 shadow-inner">
                                    <svg className="absolute h-full w-full rotate-[-90deg]" viewBox="0 0 36 36">
                                        <path className="text-slate-200" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                        <path 
                                            className="text-amber-500" 
                                            strokeDasharray={`${pencapaianKunjungan}, 100`} 
                                            strokeWidth="3.5" 
                                            strokeLinecap="round" 
                                            stroke="currentColor" 
                                            fill="none" 
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                        />
                                    </svg>
                                    <div className="text-center">
                                        <span className="block text-4xl font-extrabold text-slate-800">{realData.kpi.kunjunganBulanIni}</span>
                                        <span className="block text-xs font-medium text-muted-foreground mt-1">dari {realData.kpi.targetKunjungan} Target</span>
                                    </div>
                                </div>
                                <p className="mt-6 text-sm font-medium text-slate-600">
                                    Pencapaian: <span className="font-bold text-amber-600">{pencapaianKunjungan}%</span> bulan ini.
                                </p>
                            </div>
                        </ChartCard>
                    </div>
                </div>

                {/* BARIS 3: AREA EKSEKUSI (Tabel Prioritas Follow-Up) */}
                <div id="prioritas-follow-up" className="grid gap-4 lg:grid-cols-1 scroll-mt-24">
                    <Card className="rounded-2xl border-t-4 border-t-brand shadow-sm bg-white overflow-hidden">
                        <div className="p-5 flex items-center justify-between border-b border-slate-100">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <NotebookText className="h-4 w-4 text-brand" /> Prioritas Follow-Up Hari Ini
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1">Sekolah berstatus "Dalam Proses" yang belum dikunjungi lebih dari 7 hari.</p>
                            </div>
                            <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200 uppercase tracking-widest text-[10px] font-bold">Mendesak</Badge>
                        </div>
                        
                        {realData.prioritas && realData.prioritas.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="bg-slate-50/70 text-xs uppercase tracking-wider text-slate-500">
                                            <th className="px-5 py-4 font-semibold">Nama Sekolah Mitra</th>
                                            <th className="px-5 py-4 font-semibold">Status Pipeline</th>
                                            <th className="px-5 py-4 font-semibold">Terakhir Tersentuh</th>
                                            <th className="px-5 py-4 text-right font-semibold">Aksi Eksekusi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {realData.prioritas.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                                                <td className="px-5 py-4 font-semibold text-slate-800">{item.name}</td>
                                                <td className="px-5 py-4">
                                                    <Badge variant="outline" className={item.status === "Dalam Proses" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-blue-50 text-blue-700 border-blue-200"}>
                                                        {item.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                                        <CalendarClock className="h-4 w-4 text-slate-400 group-hover:text-brand transition-colors" /> 
                                                        {item.last_touch}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <Link 
                                                        href={`/app/canvas/${item.id}`} 
                                                        className="inline-flex items-center justify-center rounded-lg bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand transition-colors hover:bg-brand hover:text-white"
                                                    >
                                                        Kunjungi
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="p-6 text-center text-sm text-muted-foreground">Tidak ada prioritas follow-up yang mendesak saat ini.</p>
                        )}
                    </Card>
                </div>

            </div>
        </InternalShell>
    );
}

// KOMPONEN PENDUKUNG UI
function Kpi({ icon, label, value, timeframe, tint, border, tooltip, onClick }: { icon: React.ReactNode; label: string; value: React.ReactNode; timeframe: string; tint: string; border: string; tooltip?: string; onClick?: () => void }) {
    return (
        <Card 
            className={cn("p-5 rounded-2xl shadow-sm border-t-4 bg-white flex flex-col justify-between h-full transition-all", border, onClick ? "cursor-pointer hover:shadow-md hover:-translate-y-1" : "")}
            onClick={onClick}
        >
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">
                        {label}
                        {/* Perbaikan Tooltip dengan bungkus span dan cursor-help */}
                        {tooltip && (
                            <span title={tooltip} className="cursor-help flex items-center">
                                <Info className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600" />
                            </span>
                        )}
                    </div>
                    <div className="mt-2 text-3xl font-extrabold tracking-tight text-slate-800">{value}</div>
                </div>
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tint}`}>{icon}</span>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                {timeframe === "Bulan Ini" ? <CalendarDays className="h-3 w-3" /> : <History className="h-3 w-3" />}
                {timeframe}
            </div>
        </Card>
    );
}

function ChartCard({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
    return (
        <Card className="p-5 rounded-2xl shadow-sm bg-white flex flex-col">
            <div className="mb-4 flex items-start justify-between">
                <div>
                    <h3 className="text-sm font-bold text-slate-800">{title}</h3>
                    {subtitle && (
                        <div className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                            <History className="h-3 w-3" /> {subtitle}
                        </div>
                    )}
                </div>
                {action && <div>{action}</div>}
            </div>
            <div className="flex-1">
                {children}
            </div>
        </Card>
    );
}