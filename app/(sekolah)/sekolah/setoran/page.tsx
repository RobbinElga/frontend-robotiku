"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Landmark, Loader2, ChevronRight, Coins, Percent, Wallet } from "lucide-react";
import { api, apiError, type ApiEnvelope } from "@/lib/api";
import { SchoolShell } from "@/components/sekolah/SchoolShell";
import { PageHeader } from "@/components/ui/page-header";
import { FileDrop } from "@/components/ui/file-drop";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type Inv = { id: number; invoice_number: string; total_amount: string; student: { name: string } };
type Avail = { invoices: Inv[]; gross: number; commission_percent: number; commission_amount: number; net: number };
type Bank = { id: number; bank_name: string; account_number: string; account_holder: string };
type Settle = { id: number; gross_amount: number; commission_amount: number; net_amount: number; status: string; created_at: string };
const rp = (n: string | number) => "Rp " + Number(n).toLocaleString("id-ID");
const STCLS: Record<string, string> = { menunggu_verifikasi: "border-amber-200 bg-amber-50 text-amber-700", diverifikasi: "border-emerald-200 bg-emerald-50 text-emerald-700", ditolak: "border-red-200 bg-red-50 text-red-700" };

export default function SekolahSetoran() {
    const qc = useQueryClient();
    const { data, isLoading } = useQuery({ queryKey: ["setoran-tersedia"], queryFn: async () => (await api.get<ApiEnvelope<Avail>>("/sekolah/setoran/tersedia")).data.data });
    const { data: banks } = useQuery({ queryKey: ["bank-robotiku"], queryFn: async () => (await api.get<ApiEnvelope<Bank[]>>("/bank-robotiku")).data.data });
    const { data: history } = useQuery({ queryKey: ["setoran-history"], queryFn: async () => (await api.get<ApiEnvelope<{ data: Settle[] }>>("/sekolah/setoran")).data.data });

    const [picked, setPicked] = useState<Set<number>>(new Set());
    const [bankId, setBankId] = useState("");
    const [proof, setProof] = useState<File | null>(null);
    const [msg, setMsg] = useState<string | null>(null);

    const invoices = data?.invoices ?? [];
    const pct = data?.commission_percent ?? 0;
    const sel = invoices.filter((i) => picked.has(i.id));
    const gross = sel.reduce((s, i) => s + Number(i.total_amount), 0);
    const commission = Math.round((gross * pct) / 100);
    const net = gross - commission;
    const allPicked = invoices.length > 0 && invoices.every((i) => picked.has(i.id));

    const toggle = (id: number) => setPicked((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const toggleAll = () => setPicked((p) => { const n = new Set(p); allPicked ? invoices.forEach((i) => n.delete(i.id)) : invoices.forEach((i) => n.add(i.id)); return n; });

    const submit = useMutation({
        mutationFn: async () => { const fd = new FormData();[...picked].forEach((id) => fd.append("invoice_ids[]", String(id))); if (bankId) fd.append("bank_account_id", bankId); fd.append("proof", proof!); return api.post("/sekolah/setoran", fd); },
        onSuccess: () => { ["setoran-tersedia", "setoran-history"].forEach((k) => qc.invalidateQueries({ queryKey: [k] })); setPicked(new Set()); setProof(null); setBankId(""); setMsg(null); },
        onError: (e) => setMsg(apiError(e, "Gagal mengirim setoran.")),
    });

    return (
        <SchoolShell>
            <PageHeader title="Setoran ke Robotiku" subtitle="Setor pembayaran murid yang sudah lunas (dipotong komisi sekolah)." />

            {/* KPI ringkas dari seluruh invoice siap setor */}
            <div className="mt-4 mb-5 grid gap-4 sm:grid-cols-3">
                <MiniKpi icon={<Coins className="h-5 w-5" />} tint="bg-slate-100 text-slate-700" label="Bruto siap setor" value={rp(data?.gross ?? 0)} />
                <MiniKpi icon={<Percent className="h-5 w-5" />} tint="bg-emerald-100 text-emerald-700" label={`Komisi (${pct}%)`} value={rp(data?.commission_amount ?? 0)} />
                <MiniKpi icon={<Wallet className="h-5 w-5" />} tint="bg-blue-100 text-blue-700" label="Neto ke Robotiku" value={rp(data?.net ?? 0)} />
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                <Card className="border-2 p-5">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Invoice Lunas Belum Disetor</h3>
                        {invoices.length > 0 && <button onClick={toggleAll} className="text-xs font-medium text-primary hover:underline">{allPicked ? "Batal semua" : "Pilih semua"}</button>}
                    </div>
                    {isLoading ? <Skeleton className="h-40" /> : invoices.length ? (
                        <ul className="space-y-2">
                            {invoices.map((i) => (
                                <li key={i.id} className={`flex items-center gap-3 rounded-lg border p-3 transition ${picked.has(i.id) ? "border-primary/40 bg-primary/5" : ""}`}>
                                    <input type="checkbox" checked={picked.has(i.id)} onChange={() => toggle(i.id)} className="h-4 w-4" />
                                    <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{i.student.name}</div><div className="font-mono text-xs text-muted-foreground">{i.invoice_number}</div></div>
                                    <span className="font-semibold">{rp(i.total_amount)}</span>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="py-10 text-center text-sm text-muted-foreground">Tidak ada invoice lunas yang belum disetor.</p>}
                </Card>

                <Card className="h-fit border-2 p-5">
                    <h3 className="mb-3 text-sm font-semibold">Ringkasan Setoran</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Total ({sel.length} invoice)</span><span className="font-semibold">{rp(gross)}</span></div>
                        <div className="flex justify-between text-emerald-700"><span>Komisi sekolah ({pct}%)</span><span>− {rp(commission)}</span></div>
                        <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
                            {gross > 0 && <><div className="bg-primary" style={{ width: `${(net / gross) * 100}%` }} /><div className="bg-emerald-500" style={{ width: `${(commission / gross) * 100}%` }} /></>}
                        </div>
                        <div className="mt-1 border-t pt-2 flex justify-between"><span className="font-medium">Disetor ke Robotiku</span><span className="text-lg font-extrabold">{rp(net)}</span></div>
                    </div>

                    <div className="mt-4">
                        <span className="mb-1 block text-xs font-medium">Rekening Robotiku</span>
                        <select value={bankId} onChange={(e) => setBankId(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                            <option value="">— pilih rekening —</option>
                            {banks?.map((b) => <option key={b.id} value={b.id}>{b.bank_name} · {b.account_number}</option>)}
                        </select>
                    </div>
                    <div className="mt-3"><FileDrop accept="image/*,.pdf" label="Bukti transfer" value={proof} onPick={setProof} /></div>
                    {msg && <p className="mt-2 text-sm text-red-600">{msg}</p>}
                    <Button className="mt-3 w-full" disabled={picked.size === 0 || !proof || submit.isPending} onClick={() => submit.mutate()}>
                        {submit.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Landmark className="mr-2 h-4 w-4" />} Kirim Setoran
                    </Button>
                </Card>
            </div>

            <Card className="mt-6 border-2 p-5">
                <h3 className="mb-3 text-sm font-semibold">Riwayat Setoran</h3>
                {history?.data?.length ? (
                    <ul className="space-y-2">
                        {history.data.map((s) => (
                            <li key={s.id}>
                                <Link href={`/sekolah/setoran/${s.id}`} className="group flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm transition hover:border-primary/40 hover:bg-muted/30">
                                    <div>
                                        <div className="font-medium">{rp(s.net_amount)} <span className="text-xs text-muted-foreground">(bruto {rp(s.gross_amount)} − komisi {rp(s.commission_amount)})</span></div>
                                        <div className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={STCLS[s.status]}>{s.status.replace(/_/g, " ")}</Badge>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-sm text-muted-foreground">Belum ada setoran.</p>}
            </Card>
        </SchoolShell>
    );
}

function MiniKpi({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: React.ReactNode; tint: string }) {
    return (
        <Card className="border-2 p-4">
            <div className="flex items-center gap-3">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tint}`}>{icon}</span>
                <div><div className="text-lg font-bold leading-none">{value}</div><div className="mt-1 text-xs text-muted-foreground">{label}</div></div>
            </div>
        </Card>
    );
}