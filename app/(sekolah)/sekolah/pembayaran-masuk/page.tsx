"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Loader2, Clock, Wallet, User, Receipt } from "lucide-react";
import { api, type ApiEnvelope } from "@/lib/api";
import { SchoolShell } from "@/components/sekolah/SchoolShell";
import { PageHeader } from "@/components/ui/page-header";
import { ProofView } from "@/components/ui/proof-view";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type Payment = {
    id: number; proof_file: string | null; created_at: string;
    invoice: {
        invoice_number: string; total_amount: string;
        student: { name: string; student_code: string; parent?: { name: string | null; phone: string | null } | null };
    };
};
const rp = (n: string | number) => "Rp " + Number(n).toLocaleString("id-ID");
const tglJam = (s: string) => new Date(s).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function SekolahPembayaranMasuk() {
    const qc = useQueryClient();
    const { data, isLoading } = useQuery({
        queryKey: ["sekolah-bayar-masuk"],
        queryFn: async () => (await api.get<ApiEnvelope<Payment[]>>("/sekolah/pembayaran-masuk")).data.data,
    });

    const list = data ?? [];
    const totalNominal = list.reduce((s, p) => s + Number(p.invoice.total_amount), 0);

    return (
        <SchoolShell>
            <PageHeader title="Verifikasi Pembayaran" subtitle="Konfirmasi bukti bayar dari orang tua murid." />

            {/* Rekap */}
            <div className="mt-4 mb-5 grid gap-4 sm:grid-cols-2">
                <Card className="flex !flex-row items-center gap-3 border-2 p-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600"><Clock className="h-5 w-5" /></span>
                    <div><div className="text-2xl font-bold leading-none">{list.length}</div><div className="mt-1 text-xs text-muted-foreground">Menunggu verifikasi</div></div>
                </Card>
                <Card className="flex !flex-row items-center gap-3 border-2 p-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Wallet className="h-5 w-5" /></span>
                    <div><div className="text-2xl font-bold leading-none">{rp(totalNominal)}</div><div className="mt-1 text-xs text-muted-foreground">Total nominal tertahan</div></div>
                </Card>
            </div>

            <div className="space-y-4">
                {isLoading ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)
                    : list.length ? list.map((p) => <PayRow key={p.id} p={p} onDone={() => qc.invalidateQueries({ queryKey: ["sekolah-bayar-masuk"] })} />)
                        : (
                            <Card className="border-2 border-dashed p-12 text-center">
                                <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-emerald-500" />
                                <p className="text-sm text-muted-foreground">Tidak ada pembayaran menunggu verifikasi.</p>
                            </Card>
                        )}
            </div>
        </SchoolShell>
    );
}

function PayRow({ p, onDone }: { p: Payment; onDone: () => void }) {
    const [note, setNote] = useState("");
    const act = useMutation({
        mutationFn: async (action: "approve" | "reject") => api.post(`/sekolah/pembayaran/${p.id}/verifikasi`, { action, note: note || undefined }),
        onSuccess: onDone,
    });
    const parent = p.invoice.student.parent;

    return (
        <Card className="overflow-hidden border-2">
            <div className="flex flex-col md:flex-row">
                {/* Bukti */}
                <div className="border-b bg-muted/30 p-4 md:w-72 md:shrink-0 md:border-b-0 md:border-r">
                    <div className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground"><Receipt className="h-3.5 w-3.5" /> Bukti Bayar</div>
                    <ProofView path={p.proof_file} className="aspect-[3/4] w-full" />
                </div>

                {/* Detail + aksi */}
                <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="text-lg font-semibold">{p.invoice.student.name}</div>
                            <div className="font-mono text-xs text-muted-foreground">{p.invoice.student.student_code}</div>
                        </div>
                        <Badge variant="outline" className="shrink-0 gap-1 border-amber-200 bg-amber-50 text-amber-700"><Clock className="h-3.5 w-3.5" /> Menunggu</Badge>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                        <Meta label="Invoice" value={p.invoice.invoice_number} mono />
                        <Meta label="Nominal" value={<span className="font-bold text-primary">{rp(p.invoice.total_amount)}</span>} />
                        {parent?.name && <Meta label="Orang Tua" value={`${parent.name}${parent.phone ? ` · ${parent.phone}` : ""}`} icon={<User className="h-3 w-3" />} />}
                        <Meta label="Diunggah" value={tglJam(p.created_at)} icon={<Clock className="h-3 w-3" />} />
                    </div>

                    <div className="mt-auto pt-4">
                        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan (opsional / wajib jika menolak)" />
                        <div className="mt-3 flex gap-2">
                            <Button className="flex-1" disabled={act.isPending} onClick={() => act.mutate("approve")}>
                                {act.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />} Setujui
                            </Button>
                            <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" disabled={act.isPending} onClick={() => act.mutate("reject")}>
                                <XCircle className="mr-1.5 h-4 w-4" /> Tolak
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}

function Meta({ label, value, icon, mono }: { label: string; value: React.ReactNode; icon?: React.ReactNode; mono?: boolean }) {
    return (
        <div>
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className={`flex items-center gap-1 ${mono ? "font-mono text-xs" : ""}`}>{icon}{value}</div>
        </div>
    );
}