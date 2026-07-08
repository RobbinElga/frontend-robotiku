"use client";

import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight, Eye, X } from "lucide-react";
import { api, type ApiEnvelope } from "@/lib/api";
import { SchoolShell } from "@/components/sekolah/SchoolShell";
import { PageHeader } from "@/components/ui/page-header";
import { ProofView } from "@/components/ui/proof-view";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Payment = {
    id: number; status: "diverifikasi" | "ditolak"; notes: string | null; proof_file: string | null; verified_at: string | null; created_at: string;
    invoice: { invoice_number: string; total_amount: string; student: { name: string; student_code: string } };
};
type Paginator = { data: Payment[]; current_page: number; last_page: number; total: number };

const rp = (n: string | number) => "Rp " + Number(n).toLocaleString("id-ID");
const tgl = (s?: string | null) => (s ? new Date(s).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-");
const filters = [{ v: "semua", l: "Semua" }, { v: "diverifikasi", l: "Diverifikasi" }, { v: "ditolak", l: "Ditolak" }];

export default function SekolahRiwayat() {
    const [status, setStatus] = useState("semua");
    const [page, setPage] = useState(1);
    const [proof, setProof] = useState<Payment | null>(null);

    const q = useQuery({
        queryKey: ["sekolah-riwayat", status, page],
        placeholderData: keepPreviousData,
        queryFn: async () =>
            (await api.get<ApiEnvelope<Paginator>>("/sekolah/pembayaran-riwayat", {
                params: { status: status === "semua" ? undefined : status, page },
            })).data.data,
    });

    const rows = q.data?.data ?? [];

    return (
        <SchoolShell>
            <PageHeader title="Riwayat Verifikasi" subtitle="Pembayaran orang tua yang sudah Anda proses." />

            <Card className="mt-4 overflow-hidden border-2">
                <div className="flex flex-wrap gap-2 border-b p-4">
                    {filters.map((f) => (
                        <Button key={f.v} size="sm" variant={status === f.v ? "default" : "outline"} onClick={() => { setStatus(f.v); setPage(1); }}>{f.l}</Button>
                    ))}
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Murid</TableHead>
                            <TableHead>Invoice</TableHead>
                            <TableHead>Nominal</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Bukti</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {q.isLoading && Array.from({ length: 6 }).map((_, i) => (
                            <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-9 w-full" /></TableCell></TableRow>
                        ))}
                        {!q.isLoading && rows.length === 0 && (
                            <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Belum ada riwayat.</TableCell></TableRow>
                        )}
                        {rows.map((p) => (
                            <TableRow key={p.id}>
                                <TableCell>
                                    <div className="font-medium">{p.invoice.student.name}</div>
                                    <div className="font-mono text-xs text-muted-foreground">{p.invoice.student.student_code}</div>
                                </TableCell>
                                <TableCell className="font-mono text-xs">{p.invoice.invoice_number}</TableCell>
                                <TableCell>{rp(p.invoice.total_amount)}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{tgl(p.verified_at ?? p.created_at)}</TableCell>
                                <TableCell>
                                    {p.status === "diverifikasi"
                                        ? <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Diverifikasi</Badge>
                                        : <Badge variant="outline" className="gap-1 border-red-200 bg-red-50 text-red-700" title={p.notes ?? ""}><XCircle className="h-3.5 w-3.5" /> Ditolak</Badge>}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button size="icon" variant="ghost" onClick={() => setProof(p)}><Eye className="h-4 w-4" /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {q.data && q.data.last_page > 1 && (
                    <div className="flex items-center justify-between border-t p-4 text-sm text-muted-foreground">
                        <span>Total {q.data.total} · Hal. {q.data.current_page}/{q.data.last_page}</span>
                        <div className="flex gap-1">
                            <Button size="icon" variant="outline" disabled={page <= 1} onClick={() => setPage((x) => x - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                            <Button size="icon" variant="outline" disabled={page >= q.data.last_page} onClick={() => setPage((x) => x + 1)}><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Modal bukti */}
            {proof && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setProof(null)}>
                    <Card className="max-h-[90vh] w-full max-w-md overflow-auto border-2 p-5" onClick={(e) => e.stopPropagation()}>
                        <div className="mb-3 flex items-center justify-between">
                            <div>
                                <div className="font-semibold">{proof.invoice.student.name}</div>
                                <div className="font-mono text-xs text-muted-foreground">{proof.invoice.invoice_number}</div>
                            </div>
                            <Button size="icon" variant="ghost" onClick={() => setProof(null)}><X className="h-4 w-4" /></Button>
                        </div>
                        <ProofView path={proof.proof_file} className="w-full" />
                        {proof.status === "ditolak" && proof.notes && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">Alasan ditolak: {proof.notes}</p>}
                    </Card>
                </div>
            )}
        </SchoolShell>
    );
}