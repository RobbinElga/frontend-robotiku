"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Eye, Loader2, Check, X, MessageCircle, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { api, apiError, type ApiEnvelope } from "@/lib/api";
import { InternalShell } from "@/components/internal/InternalShell";
import { cn } from "@/lib/utils";
import { DrawerHeader } from "@/components/ui/drawer-header";

const rupiah = (n: number | string) => "Rp" + Math.round(Number(n)).toLocaleString("id-ID");
type Payment = {
    id: number; invoice_id: number; uploader_type: string; status: "menunggu_verifikasi" | "diverifikasi" | "ditolak"; created_at: string;
    invoice: { invoice_number: string; total_amount: string; student: { name: string; student_code: string } };
};
type Paginator = { data: Payment[]; current_page: number; last_page: number; total: number };

const tabs = [
    { key: "menunggu_verifikasi", label: "Menunggu" },
    { key: "diverifikasi", label: "Diverifikasi" },
    { key: "ditolak", label: "Ditolak" },
];
const statusCls: Record<string, string> = {
    menunggu_verifikasi: "bg-amber-50 text-amber-700 border-amber-200",
    diverifikasi: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ditolak: "bg-rose-50 text-rose-700 border-rose-200",
};

function VerifikasiInner() {
    const qc = useQueryClient();
    const [status, setStatus] = useState("menunggu_verifikasi");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<Payment | null>(null);

    const list = useQuery({
        queryKey: ["payments", { status, page }],
        queryFn: async () => (await api.get("/bayar/payments", { params: { status, page } })).data.data as Paginator,
        placeholderData: keepPreviousData,
    });

    const p = list.data;
    const rows = p?.data ?? [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Verifikasi Pembayaran</h1>
                <p className="text-sm text-muted-foreground">Periksa bukti bayar lalu setujui atau tolak.</p>
            </div>

            <div className="flex gap-2">
                {tabs.map((t) => (
                    <Button key={t.key} size="sm" variant={status === t.key ? "default" : "outline"} onClick={() => { setStatus(t.key); setPage(1); }}>{t.label}</Button>
                ))}
            </div>

            <Card className="overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow><TableHead>Siswa</TableHead><TableHead>Invoice</TableHead><TableHead className="text-right">Jumlah</TableHead><TableHead>Pengunggah</TableHead><TableHead>Tanggal</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                        {list.isLoading && Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-9 w-full" /></TableCell></TableRow>
                        ))}
                        {rows.map((pay) => (
                            <TableRow key={pay.id} className="cursor-pointer" onClick={() => setSelected(pay)}>
                                <TableCell>
                                    <p className="font-medium leading-none">{pay.invoice.student.name}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">{pay.invoice.student.student_code}</p>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">{pay.invoice.invoice_number}</TableCell>
                                <TableCell className="text-right font-medium">{rupiah(pay.invoice.total_amount)}</TableCell>
                                <TableCell className="text-sm capitalize text-muted-foreground">{pay.uploader_type === "school_admin" ? "Admin Sekolah" : "Orang Tua"}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{pay.created_at?.slice(0, 10)}</TableCell>
                                <TableCell><Badge variant="outline" className={cn("capitalize", statusCls[pay.status])}>{pay.status.replace("_", " ")}</Badge></TableCell>
                                <TableCell className="text-right"><Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelected(pay); }}><Eye className="h-4 w-4" /></Button></TableCell>
                            </TableRow>
                        ))}
                        {!list.isLoading && rows.length === 0 && <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Tidak ada data.</TableCell></TableRow>}
                    </TableBody>
                </Table>
                {p && (
                    <div className="flex items-center justify-between border-t p-4 text-sm text-muted-foreground">
                        <span>Total {p.total} · Halaman {p.current_page}/{p.last_page}</span>
                        <div className="flex gap-1">
                            <Button size="icon" variant="outline" disabled={p.current_page <= 1} onClick={() => setPage((x) => x - 1)}>‹</Button>
                            <Button size="icon" variant="outline" disabled={p.current_page >= p.last_page} onClick={() => setPage((x) => x + 1)}>›</Button>
                        </div>
                    </div>
                )}
            </Card>

            <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
                <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
                    {selected && <Detail payment={selected} onDone={() => { setSelected(null); qc.invalidateQueries({ queryKey: ["payments"] }); }} />}
                </SheetContent>
            </Sheet>
        </div>
    );
}

function Detail({ payment, onDone }: { payment: Payment; onDone: () => void }) {
    const [notes, setNotes] = useState("");
    const [err, setErr] = useState<string | null>(null);

    const proof = useQuery({
        queryKey: ["proof", payment.id],
        queryFn: async () => {
            const res = await api.get(`/bayar/payments/${payment.id}/proof`, { responseType: "blob" });
            const blob = res.data as Blob;
            return { url: URL.createObjectURL(blob), isPdf: blob.type.includes("pdf") };
        },
    });
    const verify = useMutation({
        mutationFn: async (action: "approve" | "reject") => (await api.post(`/bayar/payments/${payment.id}/verify`, { action, notes: notes || undefined })).data,
        onSuccess: onDone,
        onError: (e: any) => setErr(e?.response?.status === 422 ? (e.response.data.message ?? "Alasan wajib diisi untuk penolakan.") : apiError(e)),
    });
    const wa = useMutation({ mutationFn: async () => (await api.get<ApiEnvelope<{ url: string }>>(`/bayar/invoices/${payment.invoice_id}/wa`)).data.data, onSuccess: (d) => window.open(d.url, "_blank") });
    const pending = payment.status === "menunggu_verifikasi";

    return (
        <div>
            <DrawerHeader title={payment.invoice.student.name} subtitle={payment.invoice.invoice_number}
                badge={<Badge variant="outline" className={cn("capitalize", statusCls[payment.status])}>{payment.status.replace("_", " ")}</Badge>} />

            {/* highlight jumlah */}
            <div className="mb-4 flex items-center justify-between rounded-xl border bg-primary/5 p-4">
                <div>
                    <p className="text-xs text-muted-foreground">Jumlah tagihan</p>
                    <p className="text-2xl font-semibold">{rupiah(payment.invoice.total_amount)}</p>
                </div>
                <Badge variant="secondary" className="capitalize">{payment.uploader_type === "school_admin" ? "Admin Sekolah" : "Orang Tua"}</Badge>
            </div>

            {/* bukti */}
            <p className="mb-2 text-sm font-semibold">Bukti Pembayaran</p>
            <div className="rounded-lg border p-2">
                {proof.isLoading && <div className="grid h-48 place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}
                {proof.data && (proof.data.isPdf
                    ? <a href={proof.data.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-4 text-sm text-primary"><FileText className="h-5 w-5" /> Buka bukti (PDF)</a>
                    : <img src={proof.data.url} alt="Bukti" className="max-h-96 w-full rounded-md object-contain" />)}
            </div>

            <Button variant="outline" size="sm" className="mt-4" disabled={wa.isPending} onClick={() => wa.mutate()}>
                {wa.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageCircle className="mr-2 h-4 w-4" />} Tagih via WhatsApp
            </Button>

            {pending && (
                <div className="mt-4 space-y-3 rounded-xl border p-4">
                    <Textarea rows={2} placeholder="Catatan (wajib jika menolak)" value={notes} onChange={(e) => setNotes(e.target.value)} />
                    {err && <p className="text-sm text-destructive">{err}</p>}
                    <div className="flex gap-3">
                        <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={verify.isPending} onClick={() => { setErr(null); verify.mutate("approve"); }}><Check className="mr-2 h-4 w-4" /> Setujui</Button>
                        <Button variant="destructive" className="flex-1" disabled={verify.isPending} onClick={() => { setErr(null); verify.mutate("reject"); }}><X className="mr-2 h-4 w-4" /> Tolak</Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Page() {
    return <InternalShell><VerifikasiInner /></InternalShell>;
}