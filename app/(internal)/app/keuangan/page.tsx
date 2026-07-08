"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Eye, Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { DrawerHeader } from "@/components/ui/drawer-header";
import { ProofView } from "@/components/ui/proof-view";
import { api, apiError, type ApiEnvelope } from "@/lib/api";
import { InternalShell } from "@/components/internal/InternalShell";
import { cn } from "@/lib/utils";

const rp = (n: number | string) => "Rp" + Math.round(Number(n)).toLocaleString("id-ID");
type Settle = {
    id: number; gross_amount: number; commission_amount: number; net_amount: number; commission_percent: string;
    proof_file: string | null; status: "menunggu_verifikasi" | "diverifikasi" | "ditolak"; created_at: string;
    school: { name: string } | null; invoices: { id: number; invoice_number: string; total_amount: string }[];
};
type Paginator = { data: Settle[]; current_page: number; last_page: number; total: number };
const tabs = [{ key: "menunggu_verifikasi", label: "Menunggu" }, { key: "diverifikasi", label: "Diverifikasi" }, { key: "ditolak", label: "Ditolak" }];
const statusCls: Record<string, string> = {
    menunggu_verifikasi: "bg-amber-50 text-amber-700 border-amber-200",
    diverifikasi: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ditolak: "bg-rose-50 text-rose-700 border-rose-200",
};

function Inner() {
    const qc = useQueryClient();
    const [status, setStatus] = useState("menunggu_verifikasi");
    const [page, setPage] = useState(1);
    const [sel, setSel] = useState<Settle | null>(null);

    const list = useQuery({
        queryKey: ["setoran", { status, page }],
        queryFn: async () => (await api.get<ApiEnvelope<Paginator>>("/keuangan/setoran", { params: { status, page } })).data.data,
        placeholderData: keepPreviousData,
    });
    const p = list.data; const rows = p?.data ?? [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Setoran Sekolah</h1>
                <p className="text-sm text-muted-foreground">Verifikasi setoran dari sekolah ke Robotiku (sudah dipotong komisi).</p>
            </div>

            <div className="flex gap-2">
                {tabs.map((t) => <Button key={t.key} size="sm" variant={status === t.key ? "default" : "outline"} onClick={() => { setStatus(t.key); setPage(1); }}>{t.label}</Button>)}
            </div>

            <Card className="overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow><TableHead>Sekolah</TableHead><TableHead>Invoice</TableHead><TableHead className="text-right">Disetor</TableHead><TableHead>Tanggal</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                        {list.isLoading && Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-9 w-full" /></TableCell></TableRow>)}
                        {rows.map((s) => (
                            <TableRow key={s.id} className="cursor-pointer" onClick={() => setSel(s)}>
                                <TableCell className="font-medium">{s.school?.name ?? "—"}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{s.invoices.length} invoice</TableCell>
                                <TableCell className="text-right font-medium">{rp(s.net_amount)}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{s.created_at?.slice(0, 10)}</TableCell>
                                <TableCell><Badge variant="outline" className={cn("capitalize", statusCls[s.status])}>{s.status.replace("_", " ")}</Badge></TableCell>
                                <TableCell className="text-right"><Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setSel(s); }}><Eye className="h-4 w-4" /></Button></TableCell>
                            </TableRow>
                        ))}
                        {!list.isLoading && rows.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Tidak ada data.</TableCell></TableRow>}
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

            <Sheet open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
                <SheetContent className="w-full overflow-y-auto sm:max-w-lg">{sel && <Detail s={sel} onDone={() => { setSel(null); qc.invalidateQueries({ queryKey: ["setoran"] }); }} />}</SheetContent>
            </Sheet>
        </div>
    );
}

function Detail({ s, onDone }: { s: Settle; onDone: () => void }) {
    const [notes, setNotes] = useState("");
    const [err, setErr] = useState<string | null>(null);
    const verify = useMutation({
        mutationFn: async (action: "approve" | "reject") => (await api.post(`/keuangan/setoran/${s.id}/verifikasi`, { action, note: notes || undefined })).data,
        onSuccess: onDone,
        onError: (e) => setErr(apiError(e)),
    });
    const pending = s.status === "menunggu_verifikasi";

    return (
        <div>
            <DrawerHeader title={s.school?.name ?? "Setoran"} subtitle={`${s.invoices.length} invoice`}
                badge={<Badge variant="outline" className={cn("capitalize", statusCls[s.status])}>{s.status.replace("_", " ")}</Badge>} />

            <div className="mb-4 space-y-2 rounded-xl border bg-primary/5 p-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Total bruto</span><span className="font-medium">{rp(s.gross_amount)}</span></div>
                <div className="flex justify-between text-emerald-700"><span>Komisi ({s.commission_percent}%)</span><span>− {rp(s.commission_amount)}</span></div>
                <div className="flex justify-between border-t pt-2"><span className="font-medium">Disetor ke Robotiku</span><span className="text-xl font-semibold">{rp(s.net_amount)}</span></div>
            </div>

            <p className="mb-2 text-sm font-semibold">Bukti Transfer</p>
            <ProofView path={s.proof_file} className="aspect-video w-full" />

            <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-primary">Rincian {s.invoices.length} invoice</summary>
                <ul className="mt-1 space-y-1">{s.invoices.map((i) => <li key={i.id} className="flex justify-between"><span className="font-mono text-xs">{i.invoice_number}</span><span>{rp(i.total_amount)}</span></li>)}</ul>
            </details>

            {pending && (
                <div className="mt-4 space-y-3 rounded-xl border p-4">
                    <Textarea rows={2} placeholder="Catatan (opsional / alasan tolak)" value={notes} onChange={(e) => setNotes(e.target.value)} />
                    {err && <p className="text-sm text-destructive">{err}</p>}
                    <div className="flex gap-3">
                        <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={verify.isPending} onClick={() => { setErr(null); verify.mutate("approve"); }}><Check className="mr-2 h-4 w-4" /> Verifikasi</Button>
                        <Button variant="destructive" className="flex-1" disabled={verify.isPending} onClick={() => { setErr(null); verify.mutate("reject"); }}><X className="mr-2 h-4 w-4" /> Tolak</Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Page() { return <InternalShell><Inner /></InternalShell>; }