"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Users, Wallet, ReceiptText, Clock, Building2, CalendarCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { InternalShell } from "@/components/internal/InternalShell";
import { KeuanganDashboard } from "@/components/dashboard/KeuanganDashboard";

const rupiah = (n: number) => "Rp" + Math.round(n).toLocaleString("id-ID");

type Kpi = {
    siswa_aktif: number; siswa_total: number; pendapatan: number;
    tagihan_belum_bayar: number; menunggu_verifikasi: number; sekolah_mou: number;
    pipeline: { prospek: number; dalam_proses: number; sudah_mou: number; tidak_lanjut: number };
    kehadiran_bulan_ini: number;
};

function MainDashboard() {
    const role = useAuth((s) => s.actor?.kind === "user" ? s.actor.role : null);

    if (role === "admin_keuangan") {
        return <KeuanganDashboard />;
    }

    const q = useQuery({ queryKey: ["internal-kpi"], queryFn: async () => (await api.get("/dashboard")).data.data as Kpi });
    const d = q.data;

    const cards = [
        { label: "Siswa Aktif", value: d?.siswa_aktif, icon: Users },
        { label: "Pendapatan (lunas)", value: d ? rupiah(d.pendapatan) : undefined, icon: Wallet },
        { label: "Tagihan Belum Bayar", value: d?.tagihan_belum_bayar, icon: ReceiptText },
        { label: "Menunggu Verifikasi", value: d?.menunggu_verifikasi, icon: Clock },
        { label: "Sekolah MOU", value: d?.sekolah_mou, icon: Building2 },
        { label: "Kehadiran Bulan Ini", value: d?.kehadiran_bulan_ini, icon: CalendarCheck },
    ];

    const pipeline = d ? [
        { k: "Prospek", v: d.pipeline.prospek },
        { k: "Dalam Proses", v: d.pipeline.dalam_proses },
        { k: "Sudah MOU", v: d.pipeline.sudah_mou },
        { k: "Tidak Lanjut", v: d.pipeline.tidak_lanjut },
    ] : [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Ringkasan platform Robotiku.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cards.map(({ label, value, icon: Icon }) => (
                    <Card key={label}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                            <Icon className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>{q.isLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-semibold">{value ?? 0}</div>}</CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader><CardTitle className="text-base">Pipeline Sekolah (Canvas)</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                    {q.isLoading ? <Skeleton className="h-8 w-full" /> : pipeline.map((p) => (
                        <div key={p.k} className="flex items-center gap-2 rounded-lg border px-4 py-2">
                            <span className="text-sm text-muted-foreground">{p.k}</span>
                            <Badge variant="secondary">{p.v}</Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}

export default function Page() {
    return <InternalShell><MainDashboard /></InternalShell>;
}