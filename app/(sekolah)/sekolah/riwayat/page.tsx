"use client";

import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api, type ApiEnvelope } from "@/lib/api";
import { SchoolShell } from "@/components/sekolah/SchoolShell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

type Invoice = {
    id: number; invoice_number: string; total_amount: string; status: string;
    created_at: string; student: { name: string; student_code: string };
};
type Paginated = { data: Invoice[]; current_page: number; last_page: number; total: number };

const STATUS: { key: string; label: string }[] = [
    { key: "", label: "Semua" },
    { key: "belum_bayar", label: "Belum Bayar" },
    { key: "menunggu_verifikasi", label: "Menunggu" },
    { key: "lunas", label: "Lunas" },
];
const badge: Record<string, string> = {
    belum_bayar: "bg-red-50 text-red-700 border-red-200",
    menunggu_verifikasi: "bg-amber-50 text-amber-700 border-amber-200",
    lunas: "bg-emerald-50 text-emerald-700 border-emerald-200",
};
const rp = (v: string) => "Rp " + Number(v).toLocaleString("id-ID");
const tgl = (s: string) => new Date(s).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

export default function RiwayatPage() {
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ["sekolah-riwayat", status, page],
        queryFn: async () =>
            (await api.get<ApiEnvelope<Paginated>>("/bayar/sekolah/invoices", { params: { status: status || undefined, page } })).data.data,
        placeholderData: keepPreviousData,
    });

    return (
        <SchoolShell>
            <PageHeader title="Riwayat Tagihan" subtitle="Seluruh tagihan murid instansi Anda." />

            <div className="mb-4 flex flex-wrap gap-2">
                {STATUS.map((s) => (
                    <Button key={s.key} size="sm" variant={status === s.key ? "default" : "outline"}
                        onClick={() => { setStatus(s.key); setPage(1); }}>{s.label}</Button>
                ))}
            </div>

            <Card className="overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>No. Tagihan</TableHead>
                            <TableHead>Murid</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead className="text-right">Jumlah</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading
                            ? Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>{Array.from({ length: 5 }).map((_, j) => (
                                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>))}</TableRow>))
                            : data?.data.length
                                ? data.data.map((inv) => (
                                    <TableRow key={inv.id}>
                                        <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{inv.student.name}</div>
                                            <div className="text-xs text-muted-foreground">{inv.student.student_code}</div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{tgl(inv.created_at)}</TableCell>
                                        <TableCell className="text-right font-medium">{rp(inv.total_amount)}</TableCell>
                                        <TableCell><Badge variant="outline" className={badge[inv.status]}>{inv.status.replace("_", " ")}</Badge></TableCell>
                                    </TableRow>))
                                : <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Belum ada tagihan.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </Card>

            {data && data.last_page > 1 && (
                <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Halaman {data.current_page} dari {data.last_page} · {data.total} tagihan</span>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Sebelumnya</Button>
                        <Button size="sm" variant="outline" disabled={page >= data.last_page} onClick={() => setPage((p) => p + 1)}>Berikutnya</Button>
                    </div>
                </div>
            )}
        </SchoolShell>
    );
}