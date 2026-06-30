"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Users, UserCheck, ReceiptText, Wallet, UserPlus, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { SchoolShell } from "@/components/sekolah/SchoolShell";

const rupiah = (n: number) => "Rp" + Math.round(n).toLocaleString("id-ID");

type Kpi = { total_siswa: number; siswa_aktif: number; tagihan_belum_bayar: number; total_tagihan_aktif: number };

function DashboardInner() {
    const kpi = useQuery({ queryKey: ["sekolah-kpi"], queryFn: async () => (await api.get("/sekolah/dashboard")).data.data as Kpi });

    const cards = [
        { label: "Total Siswa", value: kpi.data?.total_siswa, icon: Users },
        { label: "Siswa Aktif", value: kpi.data?.siswa_aktif, icon: UserCheck },
        { label: "Tagihan Belum Bayar", value: kpi.data?.tagihan_belum_bayar, icon: ReceiptText },
        { label: "Total Tagihan Aktif", value: kpi.data ? rupiah(kpi.data.total_tagihan_aktif) : undefined, icon: Wallet },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Ringkasan siswa dan tagihan sekolah Anda.</p>
            </div>

            {/* KPI */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map(({ label, value, icon: Icon }) => (
                    <Card key={label}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                            <Icon className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            {kpi.isLoading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-semibold">{value ?? 0}</div>}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Aksi cepat */}
            <Card>
                <CardHeader><CardTitle className="text-base">Aksi cepat</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                    <Button asChild><Link href="/daftar/instansi"><UserPlus className="mr-2 h-4 w-4" /> Daftarkan Murid</Link></Button>
                    <Button asChild variant="outline"><Link href="/daftar/instansi/excel"><FileSpreadsheet className="mr-2 h-4 w-4" /> Upload Excel</Link></Button>
                    <Button asChild variant="outline"><Link href="/sekolah/pembayaran"><Wallet className="mr-2 h-4 w-4" /> Pembayaran Kolektif</Link></Button>
                </CardContent>
            </Card>
        </div>
    );
}

export default function Page() {
    return <SchoolShell><DashboardInner /></SchoolShell>;
}