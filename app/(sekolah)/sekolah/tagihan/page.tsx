"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Search, Wallet, Percent, Landmark, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { api, type ApiEnvelope } from "@/lib/api";
import { SchoolShell } from "@/components/sekolah/SchoolShell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const rp = (n: string | number) => "Rp " + Math.round(Number(n)).toLocaleString("id-ID");
const tgl = (s: string | null) => (s ? new Date(s).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const isLate = (s: string | null) => !!s && new Date(s) < new Date();
const stCls: Record<string, { l: string; c: string }> = {
    belum_bayar: { l: "Belum Bayar", c: "border-amber-200 bg-amber-50 text-amber-700" },
    menunggu_verifikasi: { l: "Menunggu Verifikasi", c: "border-blue-200 bg-blue-50 text-blue-700" },
    lunas: { l: "Lunas", c: "border-emerald-200 bg-emerald-50 text-emerald-700" },
};

export default function SekolahTagihanPage() {
    const [tab, setTab] = useState<"murid" | "setor">("murid");
    return (
        <SchoolShell>
            <PageHeader title="Tagihan" subtitle="Pantau tagihan murid & dana yang harus disetor ke Robotiku." />
            <div className="mt-3 inline-flex rounded-lg border p-1">
                {([["murid", "Tagihan Murid"], ["setor", "Harus Disetor ke Robotiku"]] as const).map(([k, l]) => (
                    <button key={k} onClick={() => setTab(k)}
                        className={cn("rounded-md px-3.5 py-1.5 text-sm font-medium transition", tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
                        {l}
                    </button>
                ))}
            </div>
            <div className="mt-4">{tab === "murid" ? <MuridTab /> : <SetorTab />}</div>
        </SchoolShell>
    );
}

/* ------------------------- Tab 1: Tagihan Murid ------------------------- */
type MInvoice = { id: number; invoice_number: string; total_amount: string; due_date: string | null; status: string; student: { name: string; student_code: string } };
type MData = { summary: { belum_bayar: number; menunggu: number; lunas: number; outstanding: number }; invoices: { data: MInvoice[]; current_page: number; last_page: number; total: number } };

function MuridTab() {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("semua");
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ["sekolah-tagihan-murid", search, status, page],
        placeholderData: keepPreviousData,
        queryFn: async () => (await api.get<ApiEnvelope<MData>>("/sekolah/tagihan", {
            params: { search: search || undefined, status: status === "semua" ? undefined : status, page },
        })).data.data,
    });

    const s = data?.summary;
    const rows = data?.invoices.data ?? [];
    const pg = data?.invoices;

    return (
        <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SumCard icon={<AlertCircle className="h-4 w-4" />} label="Belum Bayar" value={s?.belum_bayar ?? "—"} tint="bg-amber-50 text-amber-600" />
                <SumCard icon={<Clock className="h-4 w-4" />} label="Menunggu Verifikasi" value={s?.menunggu ?? "—"} tint="bg-blue-50 text-blue-600" />
                <SumCard icon={<CheckCircle2 className="h-4 w-4" />} label="Lunas" value={s?.lunas ?? "—"} tint="bg-emerald-50 text-emerald-600" />
                <SumCard icon={<Wallet className="h-4 w-4" />} label="Total Tertunggak" value={s ? rp(s.outstanding) : "—"} tint="bg-rose-50 text-rose-600" small />
            </div>

            <Card className="overflow-hidden border-2">
                <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input className="pl-9" placeholder="Cari nama / kode murid…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                    </div>
                    <Select value={status} onValueChange={(v) => { setStatus(v ?? "semua"); setPage(1); }}>
                        <SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="semua">Semua status</SelectItem>
                            <SelectItem value="belum_bayar">Belum Bayar</SelectItem>
                            <SelectItem value="menunggu_verifikasi">Menunggu Verifikasi</SelectItem>
                            <SelectItem value="lunas">Lunas</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader><TableRow><TableHead>Murid</TableHead><TableHead>Invoice</TableHead><TableHead>Jatuh Tempo</TableHead><TableHead className="text-right">Nominal</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {isLoading && Array.from({ length: 6 }).map((_, i) => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-9 w-full" /></TableCell></TableRow>)}
                            {!isLoading && rows.length === 0 && <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Tidak ada tagihan.</TableCell></TableRow>}
                            {rows.map((inv) => {
                                const st = stCls[inv.status] ?? stCls.belum_bayar;
                                const late = inv.status !== "lunas" && isLate(inv.due_date);
                                return (
                                    <TableRow key={inv.id}>
                                        <TableCell><div className="font-medium">{inv.student.name}</div><div className="font-mono text-xs text-muted-foreground">{inv.student.student_code}</div></TableCell>
                                        <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                                        <TableCell className={late ? "text-sm font-medium text-red-600" : "text-sm text-muted-foreground"}>{tgl(inv.due_date)}{late ? " · lewat" : ""}</TableCell>
                                        <TableCell className="text-right font-semibold">{rp(inv.total_amount)}</TableCell>
                                        <TableCell><Badge variant="outline" className={st.c}>{st.l}</Badge></TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
                {pg && pg.last_page > 1 && (
                    <div className="flex items-center justify-between border-t p-4 text-sm text-muted-foreground">
                        <span>Total {pg.total} · Hal. {pg.current_page}/{pg.last_page}</span>
                        <div className="flex gap-1"><Button size="icon" variant="outline" disabled={page <= 1} onClick={() => setPage((x) => x - 1)}>‹</Button><Button size="icon" variant="outline" disabled={page >= pg.last_page} onClick={() => setPage((x) => x + 1)}>›</Button></div>
                    </div>
                )}
            </Card>
        </div>
    );
}

/* -------------------- Tab 2: Harus Disetor ke Robotiku -------------------- */
type SetorInvoice = { id: number; invoice_number: string; total_amount: string; student: { name: string; student_code: string } };
type SetorData = { invoices: SetorInvoice[]; gross: number; commission_percent: number; commission_amount: number; net: number };

function SetorTab() {
    const router = useRouter();
    const { data, isLoading } = useQuery({
        queryKey: ["sekolah-setoran-tersedia"],
        queryFn: async () => (await api.get<ApiEnvelope<SetorData>>("/sekolah/setoran/tersedia")).data.data,
    });

    if (isLoading || !data) return <Skeleton className="h-64 rounded-xl" />;

    return (
        <div className="space-y-4">
            <Card className="border-2 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="font-semibold">Dana lunas belum disetor</div>
                    <Button disabled={data.invoices.length === 0} onClick={() => router.push("/sekolah/setoran")}>
                        <Landmark className="mr-1.5 h-4 w-4" /> Setor Sekarang
                    </Button>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <SumCard icon={<Wallet className="h-4 w-4" />} label="Total Terkumpul" value={rp(data.gross)} tint="bg-slate-100 text-slate-700" small />
                    <SumCard icon={<Percent className="h-4 w-4" />} label={`Komisi Sekolah (${data.commission_percent}%)`} value={`− ${rp(data.commission_amount)}`} tint="bg-emerald-100 text-emerald-700" small />
                    <SumCard icon={<Landmark className="h-4 w-4" />} label="Harus Disetor ke Robotiku" value={rp(data.net)} tint="bg-primary/10 text-primary" small strong />
                </div>
            </Card>

            <Card className="overflow-hidden border-2">
                <h3 className="border-b p-4 text-sm font-semibold">Rincian Invoice ({data.invoices.length})</h3>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader><TableRow><TableHead>Murid</TableHead><TableHead>Invoice</TableHead><TableHead className="text-right">Nominal</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {data.invoices.length ? data.invoices.map((inv) => (
                                <TableRow key={inv.id}>
                                    <TableCell><div className="font-medium">{inv.student.name}</div><div className="font-mono text-xs text-muted-foreground">{inv.student.student_code}</div></TableCell>
                                    <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                                    <TableCell className="text-right font-medium">{rp(inv.total_amount)}</TableCell>
                                </TableRow>
                            )) : <TableRow><TableCell colSpan={3} className="py-10 text-center text-muted-foreground">Tidak ada dana yang perlu disetor. 🎉</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
}

function SumCard({ icon, label, value, tint, small, strong }: { icon: React.ReactNode; label: string; value: React.ReactNode; tint: string; small?: boolean; strong?: boolean }) {
    return (
        <Card className="border-2 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className={cn("mt-1 font-bold", small ? "text-lg" : "text-2xl", strong && "text-primary")}>{value}</div>
                </div>
                <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", tint)}>{icon}</span>
            </div>
        </Card>
    );
}