"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Loader2, Building2 } from "lucide-react";
import { api, type ApiEnvelope } from "@/lib/api";
import { InternalShell } from "@/components/internal/InternalShell";
import { PageHeader } from "@/components/ui/page-header";
import { ProofView } from "@/components/ui/proof-view";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type MouSchool = { id: number; name: string };
type Payment = { id: number; proof_file: string | null; status: string; invoice: { invoice_number: string; total_amount: string; student: { name: string; student_code: string; school: { name: string } | null } } };
type Paginator = { data: Payment[]; current_page: number; last_page: number; total: number };
const rp = (n: string | number) => "Rp " + Number(n).toLocaleString("id-ID");
const TABS = [{ k: "menunggu_verifikasi", l: "Menunggu" }, { k: "diverifikasi", l: "Diverifikasi" }, { k: "ditolak", l: "Ditolak" }];
const stCls: Record<string, string> = { menunggu_verifikasi: "border-amber-200 bg-amber-50 text-amber-700", diverifikasi: "border-emerald-200 bg-emerald-50 text-emerald-700", ditolak: "border-red-200 bg-red-50 text-red-700" };

export default function PembayaranInstansiPage() {
    const qc = useQueryClient();
    const [status, setStatus] = useState("menunggu_verifikasi");
    const [school, setSchool] = useState("");
    const [page, setPage] = useState(1);

    const { data: schools } = useQuery({ queryKey: ["sekolah-mou"], queryFn: async () => (await api.get<ApiEnvelope<MouSchool[]>>("/sekolah/mou")).data.data });
    const { data, isLoading } = useQuery({
        queryKey: ["instansi-bayar", status, school, page],
        queryFn: async () => (await api.get<ApiEnvelope<Paginator>>("/instansi/pembayaran", { params: { status, school_id: school || undefined, page } })).data.data,
        placeholderData: keepPreviousData,
    });
    const rows = data?.data ?? [];

    return (
        <InternalShell>
            <PageHeader title="Pembayaran Instansi" subtitle="Verifikasi pembayaran ortu jalur sekolah (oversight Admin/Super Admin)." />

            <div className="mb-4 flex flex-wrap items-center gap-2">
                {TABS.map((t) => <Button key={t.k} size="sm" variant={status === t.k ? "default" : "outline"} onClick={() => { setStatus(t.k); setPage(1); }}>{t.l}</Button>)}
                <div className="ml-auto flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <select value={school} onChange={(e) => { setSchool(e.target.value); setPage(1); }} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                        <option value="">Semua sekolah</option>
                        {schools?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)
                    : rows.length ? rows.map((p) => <PayCard key={p.id} p={p} onDone={() => qc.invalidateQueries({ queryKey: ["instansi-bayar"] })} />)
                        : <Card className="col-span-full border-2 p-12 text-center text-sm text-muted-foreground">Tidak ada data.</Card>}
            </div>

            {data && data.last_page > 1 && (
                <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Hal. {data.current_page}/{data.last_page} · {data.total}</span>
                    <div className="flex gap-2"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((x) => x - 1)}>Sebelumnya</Button><Button size="sm" variant="outline" disabled={page >= data.last_page} onClick={() => setPage((x) => x + 1)}>Berikutnya</Button></div>
                </div>
            )}
        </InternalShell>
    );
}

function PayCard({ p, onDone }: { p: Payment; onDone: () => void }) {
    const [note, setNote] = useState("");
    const act = useMutation({ mutationFn: async (action: "approve" | "reject") => api.post(`/instansi/pembayaran/${p.id}/verifikasi`, { action, note: note || undefined }), onSuccess: onDone });
    const pending = p.status === "menunggu_verifikasi";
    return (
        <Card className="overflow-hidden border-2">
            <div className="flex items-center justify-between gap-2 border-b p-4">
                <div className="min-w-0">
                    <div className="truncate font-semibold">{p.invoice.student.name}</div>
                    <div className="text-xs text-muted-foreground">{p.invoice.student.school?.name ?? "—"} · <span className="font-mono">{p.invoice.invoice_number}</span></div>
                </div>
                <span className="shrink-0 text-lg font-bold text-primary">{rp(p.invoice.total_amount)}</span>
            </div>
            <div className="p-4">
                <ProofView path={p.proof_file} className="aspect-video w-full" />
                {pending ? (
                    <>
                        <Input className="mt-3" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan (opsional)" />
                        <div className="mt-3 flex gap-2">
                            <Button className="flex-1" disabled={act.isPending} onClick={() => act.mutate("approve")}>{act.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />} Setujui</Button>
                            <Button variant="outline" className="flex-1 text-red-600" disabled={act.isPending} onClick={() => act.mutate("reject")}><XCircle className="mr-1.5 h-4 w-4" /> Tolak</Button>
                        </div>
                    </>
                ) : <div className="mt-3"><Badge variant="outline" className={stCls[p.status]}>{p.status.replace("_", " ")}</Badge></div>}
            </div>
        </Card>
    );
}