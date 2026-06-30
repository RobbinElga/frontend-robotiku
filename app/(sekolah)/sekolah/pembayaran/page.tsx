"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UploadCloud, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { api, apiError } from "@/lib/api";
import { SchoolShell } from "@/components/sekolah/SchoolShell";
import { cn } from "@/lib/utils";

const rupiah = (n: number) => "Rp" + Math.round(n).toLocaleString("id-ID");

type Invoice = { id: number; invoice_number: string; total_amount: string; status: "belum_bayar" | "menunggu_verifikasi"; due_date: string | null; student: { id: number; name: string; student_code: string } };
type Data = { invoices: Invoice[]; total_belum_bayar: number; count_belum_bayar: number };

const statusBadge: Record<string, { label: string; cls: string }> = {
    belum_bayar: { label: "Belum bayar", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    menunggu_verifikasi: { label: "Menunggu verifikasi", cls: "bg-sky-50 text-sky-700 border-sky-200" },
};

function PembayaranInner() {
    const qc = useQueryClient();
    const q = useQuery({ queryKey: ["sekolah-pembayaran"], queryFn: async () => (await api.get("/sekolah/pembayaran")).data.data as Data });

    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [file, setFile] = useState<File | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [done, setDone] = useState<number | null>(null);
    const inited = useRef(false);

    const invoices = q.data?.invoices ?? [];
    const payable = invoices.filter((i) => i.status === "belum_bayar");

    useEffect(() => {
        if (q.data && !inited.current) {
            inited.current = true;
            setSelected(new Set(payable.map((i) => i.id)));
        }
    }, [q.data]); // eslint-disable-line

    const toggle = (id: number) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const toggleAll = () => setSelected((s) => (s.size === payable.length ? new Set() : new Set(payable.map((i) => i.id))));

    const selectedTotal = payable.filter((i) => selected.has(i.id)).reduce((a, i) => a + Number(i.total_amount), 0);

    const upload = useMutation({
        mutationFn: async () => {
            const fd = new FormData();
            fd.append("file", file!);
            [...selected].forEach((id) => fd.append("invoice_ids[]", String(id)));
            return (await api.post("/sekolah/pembayaran/upload", fd)).data;
        },
        onSuccess: (res) => { setDone(res.data.count); setFile(null); setErr(null); inited.current = false; qc.invalidateQueries({ queryKey: ["sekolah-pembayaran"] }); },
        onError: (e) => setErr(apiError(e, "Gagal mengunggah bukti.")),
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Pembayaran Kolektif</h1>
                    <p className="text-sm text-muted-foreground">Bayar seluruh tagihan murid sekolah dalam satu bukti transfer.</p>
                </div>
                <Card className="min-w-[260px]">
                    <CardContent className="pt-6">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Total tagihan belum bayar</p>
                        <p className="mt-1 text-2xl font-semibold text-primary">{q.data ? rupiah(q.data.total_belum_bayar) : "—"}</p>
                    </CardContent>
                </Card>
            </div>

            {done !== null && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> Bukti untuk {done} tagihan terkirim, menunggu verifikasi.
                </div>
            )}

            {/* tabel tagihan */}
            <Card className="overflow-hidden">
                <CardHeader><CardTitle className="text-base">Daftar Tagihan</CardTitle></CardHeader>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-10">
                                <Checkbox checked={payable.length > 0 && selected.size === payable.length} onCheckedChange={toggleAll} aria-label="Pilih semua" />
                            </TableHead>
                            <TableHead>Siswa</TableHead>
                            <TableHead>Invoice</TableHead>
                            <TableHead className="text-right">Jumlah</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {q.isLoading && Array.from({ length: 4 }).map((_, i) => (
                            <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-9 w-full" /></TableCell></TableRow>
                        ))}
                        {invoices.map((inv) => {
                            const b = statusBadge[inv.status];
                            const payableRow = inv.status === "belum_bayar";
                            return (
                                <TableRow key={inv.id}>
                                    <TableCell>
                                        <Checkbox checked={selected.has(inv.id)} disabled={!payableRow} onCheckedChange={() => toggle(inv.id)} />
                                    </TableCell>
                                    <TableCell>
                                        <p className="font-medium leading-none">{inv.student.name}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">{inv.student.student_code}</p>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{inv.invoice_number}</TableCell>
                                    <TableCell className="text-right font-medium">{rupiah(Number(inv.total_amount))}</TableCell>
                                    <TableCell><Badge variant="outline" className={cn(b.cls)}>{b.label}</Badge></TableCell>
                                </TableRow>
                            );
                        })}
                        {q.data && invoices.length === 0 && (
                            <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Tidak ada tagihan aktif.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* upload */}
            <Card>
                <CardHeader><CardTitle className="text-base">Unggah Bukti Pembayaran</CardTitle></CardHeader>
                <CardContent className="grid gap-6 lg:grid-cols-[1fr_300px]">
                    <div>
                        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 p-8 text-center transition-colors hover:border-primary">
                            <UploadCloud className="mb-3 h-8 w-8 text-primary" />
                            <span className="text-sm font-medium">{file ? file.name : "Klik untuk pilih file bukti transfer"}</span>
                            <span className="mt-1 text-xs text-muted-foreground">JPG, PNG, atau PDF · maks 5MB</span>
                            <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                        </label>
                        {err && <p className="mt-2 text-sm font-medium text-destructive">{err}</p>}
                    </div>
                    <div className="flex flex-col justify-between rounded-lg border bg-muted/30 p-4">
                        <div className="space-y-1 text-sm">
                            <p className="text-muted-foreground">Tagihan dipilih</p>
                            <p className="text-lg font-semibold">{[...selected].length} tagihan</p>
                            <p className="text-muted-foreground">Total dibayar</p>
                            <p className="text-xl font-bold text-primary">{rupiah(selectedTotal)}</p>
                        </div>
                        <Button className="mt-4 w-full" disabled={!file || selected.size === 0 || upload.isPending} onClick={() => upload.mutate()}>
                            {upload.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengirim…</> : "Kirim Bukti Pembayaran"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function Page() {
    return <SchoolShell><PembayaranInner /></SchoolShell>;
}