"use client";

import { useState } from "react";
import { useMutation, useQuery, keepPreviousData } from "@tanstack/react-query";
import { Search, Send, ExternalLink, Loader2, CheckCircle2, User, Building2, ArrowLeft, ChevronRight, Wallet, Percent } from "lucide-react";
import { api, apiError, type ApiEnvelope } from "@/lib/api";
import { InternalShell } from "@/components/internal/InternalShell";
import { PageHeader } from "@/components/ui/page-header";
import { useConfirm } from "@/components/ui/confirm";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const rp = (n: string | number) => "Rp" + Math.round(Number(n)).toLocaleString("id-ID");
const tgl = (s: string | null) => (s ? new Date(s).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const isLate = (s: string | null) => !!s && new Date(s) < new Date();
const stCls: Record<string, { l: string; c: string }> = {
    belum_bayar: { l: "Belum Bayar", c: "border-amber-200 bg-amber-50 text-amber-700" },
    menunggu_verifikasi: { l: "Menunggu Verifikasi", c: "border-blue-200 bg-blue-50 text-blue-700" },
};

function TagihanPage() {
    const [tab, setTab] = useState<"mandiri" | "instansi">("mandiri");
    return (
        <div className="space-y-6">
            <PageHeader title="Tagihan (WhatsApp)" subtitle="Kirim pengingat tagihan: mandiri ke orang tua, instansi (setoran net) ke admin sekolah." />
            <div className="inline-flex rounded-lg border p-1">
                {([["mandiri", "Mandiri (Orang Tua)"], ["instansi", "Instansi (Sekolah)"]] as const).map(([k, l]) => (
                    <button key={k} onClick={() => setTab(k)} className={cn("rounded-md px-3.5 py-1.5 text-sm font-medium transition", tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>{l}</button>
                ))}
            </div>
            {tab === "mandiri" ? <MandiriTab /> : <InstansiTab />}
        </div>
    );
}

/* ------------------------------- MANDIRI ------------------------------- */
type MInvoice = {
    id: number; invoice_number: string; total_amount: string; due_date: string | null; status: "belum_bayar" | "menunggu_verifikasi";
    student: { name: string; student_code: string; parent: { name: string; phone: string } | null };
};
type MPaginator = { data: MInvoice[]; current_page: number; last_page: number; total: number };

function MandiriTab() {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("semua");
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ["tagihan-mandiri", search, status, page],
        placeholderData: keepPreviousData,
        queryFn: async () => (await api.get<ApiEnvelope<MPaginator>>("/tagihan", {
            params: { type: "mandiri", search: search || undefined, status: status === "semua" ? undefined : status, page },
        })).data.data,
    });
    const rows = data?.data ?? [];

    return (
        <Card className="overflow-hidden">
            <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:w-80">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Cari nama / kode siswa…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                </div>
                <Select value={status} onValueChange={(v) => { setStatus(v ?? "semua"); setPage(1); }}>
                    <SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="semua">Semua status</SelectItem>
                        <SelectItem value="belum_bayar">Belum Bayar</SelectItem>
                        <SelectItem value="menunggu_verifikasi">Menunggu Verifikasi</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader><TableRow><TableHead>Siswa</TableHead><TableHead>Orang Tua</TableHead><TableHead>Jatuh Tempo</TableHead><TableHead className="text-right">Nominal</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Kirim WA</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {isLoading && Array.from({ length: 6 }).map((_, i) => (<TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-9 w-full" /></TableCell></TableRow>))}
                        {!isLoading && rows.length === 0 && (<TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Tidak ada tagihan mandiri. 🎉</TableCell></TableRow>)}
                        {rows.map((inv) => {
                            const st = stCls[inv.status] ?? stCls.belum_bayar; const late = isLate(inv.due_date);
                            return (
                                <TableRow key={inv.id}>
                                    <TableCell><div className="font-medium">{inv.student.name}</div><div className="font-mono text-xs text-muted-foreground">{inv.invoice_number}</div></TableCell>
                                    <TableCell><div className="flex items-center gap-1.5 text-sm"><User className="h-3.5 w-3.5 text-muted-foreground" /> {inv.student.parent?.name ?? "—"} <span className="text-muted-foreground">· {inv.student.parent?.phone ?? "—"}</span></div></TableCell>
                                    <TableCell className={late ? "text-sm font-medium text-red-600" : "text-sm text-muted-foreground"}>{tgl(inv.due_date)}{late ? " · lewat" : ""}</TableCell>
                                    <TableCell className="text-right font-semibold">{rp(inv.total_amount)}</TableCell>
                                    <TableCell><Badge variant="outline" className={st.c}>{st.l}</Badge></TableCell>
                                    <TableCell className="text-right"><WaActions sendUrl={`/tagihan/${inv.id}/kirim`} waUrl={`/tagihan/${inv.id}/wa`} /></TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
            {data && data.last_page > 1 && (
                <div className="flex items-center justify-between border-t p-4 text-sm text-muted-foreground">
                    <span>Total {data.total} · Hal. {data.current_page}/{data.last_page}</span>
                    <div className="flex gap-1"><Button size="icon" variant="outline" disabled={page <= 1} onClick={() => setPage((x) => x - 1)}>‹</Button><Button size="icon" variant="outline" disabled={page >= data.last_page} onClick={() => setPage((x) => x + 1)}>›</Button></div>
                </div>
            )}
        </Card>
    );
}

/* ------------------------------ INSTANSI ------------------------------ */
type SchoolRow = { id: number; name: string; commission_percent: number; invoice_count: number; gross: number; commission_amount: number; net: number };

function InstansiTab() {
    const [schoolId, setSchoolId] = useState<number | null>(null);
    return schoolId ? <InstansiSchool schoolId={schoolId} onBack={() => setSchoolId(null)} /> : <InstansiSchoolList onOpen={setSchoolId} />;
}

function InstansiSchoolList({ onOpen }: { onOpen: (id: number) => void }) {
    const [search, setSearch] = useState("");
    const { data, isLoading } = useQuery({
        queryKey: ["tagihan-sekolah", search],
        queryFn: async () => (await api.get<ApiEnvelope<SchoolRow[]>>("/tagihan/instansi/sekolah", { params: { search: search || undefined } })).data.data,
    });
    const rows = data ?? [];

    return (
        <div className="space-y-4">
            <Card className="p-4">
                <div className="relative w-full sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Cari sekolah…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
            </Card>
            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
            ) : rows.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {rows.map((s) => (
                        <button key={s.id} onClick={() => onOpen(s.id)} className="text-left">
                            <Card className="group border-2 p-5 transition hover:border-primary/40 hover:shadow-sm">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 font-semibold"><Building2 className="h-4 w-4 text-primary" /> {s.name}</div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />
                                </div>
                                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                                    <div><div className="text-xs text-muted-foreground">Terkumpul</div><div className="font-medium">{rp(s.gross)}</div></div>
                                    <div><div className="text-xs text-muted-foreground">Komisi ({s.commission_percent}%)</div><div className="font-medium text-emerald-700">− {rp(s.commission_amount)}</div></div>
                                    <div><div className="text-xs text-muted-foreground">Disetor ke Robotiku</div><div className="font-bold text-primary">{rp(s.net)}</div></div>
                                </div>
                                <div className="mt-2 text-xs text-muted-foreground">{s.invoice_count} tagihan belum disetor</div>
                            </Card>
                        </button>
                    ))}
                </div>
            ) : (
                <Card className="py-16 text-center text-sm text-muted-foreground">Tidak ada sekolah dengan setoran tertunggak. 🎉</Card>
            )}
        </div>
    );
}

type SchoolInvoice = { id: number; invoice_number: string; total_amount: string; due_date: string | null; student: { name: string; student_code: string } };
type SchoolDetail = { school: { id: number; name: string; commission_percent: number }; invoices: SchoolInvoice[]; gross: number; commission_amount: number; net: number };

function InstansiSchool({ schoolId, onBack }: { schoolId: number; onBack: () => void }) {
    const { data, isLoading } = useQuery({
        queryKey: ["tagihan-sekolah-detail", schoolId],
        queryFn: async () => (await api.get<ApiEnvelope<SchoolDetail>>(`/tagihan/instansi/sekolah/${schoolId}`)).data.data,
    });

    return (
        <div className="space-y-4">
            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Kembali ke daftar sekolah</button>

            {isLoading || !data ? <Skeleton className="h-64 rounded-xl" /> : (
                <>
                    {/* ringkasan net */}
                    <Card className="border-2 p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-lg font-semibold"><Building2 className="h-5 w-5 text-primary" /> {data.school.name}</div>
                            <SchoolWaActions schoolId={schoolId} />
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            <Sum icon={<Wallet className="h-4 w-4" />} label="Total Terkumpul" value={rp(data.gross)} tint="bg-slate-100 text-slate-700" />
                            <Sum icon={<Percent className="h-4 w-4" />} label={`Komisi Sekolah (${data.school.commission_percent}%)`} value={`− ${rp(data.commission_amount)}`} tint="bg-emerald-100 text-emerald-700" />
                            <Sum icon={<Wallet className="h-4 w-4" />} label="Harus Disetor ke Robotiku" value={rp(data.net)} tint="bg-primary/10 text-primary" strong />
                        </div>
                    </Card>

                    {/* daftar invoice */}
                    <Card className="overflow-hidden">
                        <h3 className="border-b p-4 text-sm font-semibold">Tagihan Belum Disetor ({data.invoices.length})</h3>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader><TableRow><TableHead>Siswa</TableHead><TableHead>Invoice</TableHead><TableHead>Jatuh Tempo</TableHead><TableHead className="text-right">Nominal</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {data.invoices.length ? data.invoices.map((inv) => (
                                        <TableRow key={inv.id}>
                                            <TableCell><div className="font-medium">{inv.student.name}</div><div className="font-mono text-xs text-muted-foreground">{inv.student.student_code}</div></TableCell>
                                            <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{tgl(inv.due_date)}</TableCell>
                                            <TableCell className="text-right font-medium">{rp(inv.total_amount)}</TableCell>
                                        </TableRow>
                                    )) : <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Tidak ada.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
}

function Sum({ icon, label, value, tint, strong }: { icon: React.ReactNode; label: string; value: string; tint: string; strong?: boolean }) {
    return (
        <div className="rounded-lg border p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground"><span className={`flex h-6 w-6 items-center justify-center rounded ${tint}`}>{icon}</span> {label}</div>
            <div className={strong ? "text-xl font-bold text-primary" : "text-lg font-semibold"}>{value}</div>
        </div>
    );
}

/* --------------------------- Aksi WhatsApp --------------------------- */
function WaActions({ sendUrl, waUrl }: { sendUrl: string; waUrl: string }) {
    const confirm = useConfirm();
    const [sent, setSent] = useState(false);
    const send = useMutation({ mutationFn: async () => api.post(sendUrl), onSuccess: () => setSent(true), onError: (e) => alert(apiError(e, "Gagal mengirim.")) });
    const openWa = useMutation({ mutationFn: async () => (await api.get<ApiEnvelope<{ url: string }>>(waUrl)).data.data, onSuccess: (d) => window.open(d.url, "_blank"), onError: (e) => alert(apiError(e, "Gagal membuat link.")) });
    const onSend = async () => { if (await confirm({ title: "Kirim tagihan via WhatsApp?", description: "Pesan akan dikirim otomatis ke nomor tujuan.", confirmText: "Kirim" })) send.mutate(); };

    return (
        <div className="flex justify-end gap-1.5">
            <Button size="icon" variant="outline" title="Buka WhatsApp (manual)" disabled={openWa.isPending} onClick={() => openWa.mutate()}>{openWa.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}</Button>
            <Button size="sm" disabled={send.isPending || sent} onClick={onSend}>{sent ? <><CheckCircle2 className="mr-1.5 h-4 w-4" /> Terkirim</> : send.isPending ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Mengirim</> : <><Send className="mr-1.5 h-4 w-4" /> Kirim</>}</Button>
        </div>
    );
}

function SchoolWaActions({ schoolId }: { schoolId: number }) {
    return <WaActions sendUrl={`/tagihan/instansi/sekolah/${schoolId}/kirim`} waUrl={`/tagihan/instansi/sekolah/${schoolId}/wa`} />;
}

export default function Page() {
    return <InternalShell><TagihanPage /></InternalShell>;
}