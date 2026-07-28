"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Users, Wallet, CheckCircle2, GraduationCap, BadgeCheck, Landmark, ClipboardList } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { api, type ApiEnvelope } from "@/lib/api";
import { SchoolShell } from "@/components/sekolah/SchoolShell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { COLORS } from "@/components/ui/chart-kit";

const rp = (n: number) => "Rp " + Number(n).toLocaleString("id-ID");

export default function SekolahDashboard() {
    const { data, isLoading } = useQuery({
        queryKey: ["sekolah-dash"],
        queryFn: async () => (await api.get<ApiEnvelope<any>>("/sekolah/dashboard")).data.data,
    });

    if (isLoading || !data)
        return (
            <SchoolShell>
                <PageHeader title="Beranda" subtitle="Ringkasan sekolah Anda." />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
                </div>
                <Skeleton className="mt-4 h-72 rounded-xl" />
            </SchoolShell>
        );

    const k = data.kpi;
    return (
        <SchoolShell>
            <PageHeader title="Beranda" subtitle="Ringkasan & analitik sekolah Anda." />

            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Kpi icon={<Users />} label="Total Murid" value={k.total} tone="blue" />
                <Kpi icon={<GraduationCap />} label="Murid Aktif" value={k.aktif} tone="green" />
                <Kpi icon={<Wallet />} label="Belum Bayar" value={rp(k.belum_bayar_nominal)} tone="amber" small />
                <Kpi icon={<CheckCircle2 />} label="Sudah Lunas" value={rp(k.lunas_nominal)} tone="emerald" small />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <ChartCard title="Status Murid">
                    <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                            <Pie data={data.status_murid} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                                {data.status_murid.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip /><Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Status Tagihan">
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={data.tagihan}>
                            <XAxis dataKey="name" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]}>{data.tagihan.map((_: any, i: number) => <Cell key={i} fill={COLORS[i]} />)}</Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Murid per Program">
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={data.per_program} layout="vertical">
                            <XAxis type="number" allowDecimals={false} fontSize={12} /><YAxis type="category" dataKey="name" width={110} fontSize={12} /><Tooltip />
                            <Bar dataKey="jumlah" fill="#0476d9" radius={[0, 6, 6, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Pendaftaran per Bulan">
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={data.pendaftaran}>
                            <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0476d9" stopOpacity={0.4} /><stop offset="100%" stopColor="#0476d9" stopOpacity={0} /></linearGradient></defs>
                            <XAxis dataKey="bulan" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip />
                            <Area type="monotone" dataKey="jumlah" stroke="#0476d9" fill="url(#g)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* Aksi cepat — !flex-row memaksa layout mendatar (Card default flex-col) */}
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <QuickAction href="/sekolah/murid" icon={<ClipboardList className="h-5 w-5" />} title="Pantau Murid" desc="Rekap kehadiran, nilai & tagihan" />
                <QuickAction href="/sekolah/pembayaran-masuk" icon={<BadgeCheck className="h-5 w-5" />} title="Verifikasi Pembayaran" desc="Konfirmasi bukti bayar orang tua" />
                <QuickAction href="/sekolah/setoran" icon={<Landmark className="h-5 w-5" />} title="Setoran ke Robotiku" desc="Setor pembayaran lunas (dipotong komisi)" />
            </div>
        </SchoolShell>
    );
}

function QuickAction({ href, icon, title, desc }: { href: string; icon: React.ReactNode; title: string; desc: string }) {
    return (
        <Link href={href} className="block">
            <Card className="group flex !flex-row items-center gap-3 border-2 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105">{icon}</span>
                <div className="min-w-0">
                    <div className="font-semibold">{title}</div>
                    <div className="truncate text-xs text-muted-foreground">{desc}</div>
                </div>
            </Card>
        </Link>
    );
}

function Kpi({ icon, label, value, tone, small }: { icon: React.ReactNode; label: string; value: React.ReactNode; tone: string; small?: boolean }) {
    const t: Record<string, string> = { blue: "bg-blue-50 text-blue-600", green: "bg-emerald-50 text-emerald-600", amber: "bg-amber-50 text-amber-600", emerald: "bg-emerald-50 text-emerald-600" };
    return (
        <Card className="border-2 p-5">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className={`mt-1 font-bold ${small ? "text-lg" : "text-2xl"}`}>{value}</div>
                </div>
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${t[tone]}`}>{icon}</span>
            </div>
        </Card>
    );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
    return <Card className="border-2 p-5"><h3 className="mb-3 text-sm font-semibold">{title}</h3>{children}</Card>;
}