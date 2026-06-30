"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, Loader2, CheckCircle2, Clock, FileWarning } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api, apiError, type ApiEnvelope } from "@/lib/api";
import { useParent } from "@/lib/parent-store";
import { ParentShell } from "@/components/ortu/ParentShell";
import { cn } from "@/lib/utils";

const rupiah = (n: number | string) => "Rp" + Math.round(Number(n)).toLocaleString("id-ID");
type Invoice = { id: number; invoice_number: string; total_amount: string; due_date: string | null; status: "belum_bayar" | "menunggu_verifikasi" | "lunas" };
const badge: Record<string, { label: string; cls: string; icon: any }> = {
    belum_bayar: { label: "Belum bayar", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: FileWarning },
    menunggu_verifikasi: { label: "Menunggu verifikasi", cls: "bg-sky-50 text-sky-700 border-sky-200", icon: Clock },
    lunas: { label: "Lunas", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
};

function TagihanInner() {
    const qc = useQueryClient();
    const parent = useParent((s) => s.parent)!;

    const q = useQuery({
        queryKey: ["ortu-tagihan", parent.studentId],
        queryFn: async () => (await api.post<ApiEnvelope<{ invoices: Invoice[] }>>("/bayar/tagihan", { student_id: parent.studentId, phone: parent.phone })).data.data.invoices,
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Tagihan</h1>
                <p className="text-sm text-muted-foreground">Tagihan untuk {parent.name}.</p>
            </div>

            {q.isLoading && <Skeleton className="h-28 w-full" />}
            <div className="grid gap-4">
                {q.data?.map((inv) => (
                    <InvoiceRow key={inv.id} invoice={inv} phone={parent.phone} onUploaded={() => qc.invalidateQueries({ queryKey: ["ortu-tagihan", parent.studentId] })} />
                ))}
                {q.data && q.data.length === 0 && <p className="rounded-lg border bg-background p-6 text-center text-sm text-muted-foreground">Belum ada tagihan.</p>}
            </div>
        </div>
    );
}

function InvoiceRow({ invoice, phone, onUploaded }: { invoice: Invoice; phone: string; onUploaded: () => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const b = badge[invoice.status];
    const Icon = b.icon;

    const upload = useMutation({
        mutationFn: async () => {
            const fd = new FormData();
            fd.append("invoice_id", String(invoice.id));
            fd.append("phone", phone);
            fd.append("file", file!);
            return (await api.post("/bayar/upload", fd)).data;
        },
        onSuccess: () => { setFile(null); setErr(null); onUploaded(); },
        onError: (e) => setErr(apiError(e, "Gagal unggah bukti.")),
    });

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle className="text-lg">{rupiah(invoice.total_amount)}</CardTitle>
                    <p className="text-xs text-muted-foreground">{invoice.invoice_number}{invoice.due_date ? ` · jatuh tempo ${invoice.due_date.slice(0, 10)}` : ""}</p>
                </div>
                <Badge variant="outline" className={cn("gap-1", b.cls)}><Icon className="h-3.5 w-3.5" /> {b.label}</Badge>
            </CardHeader>
            {invoice.status === "belum_bayar" && (
                <CardContent>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                            className="text-sm file:mr-3 file:rounded-md file:border file:bg-muted file:px-3 file:py-1.5 file:text-sm" />
                        <Button size="sm" disabled={!file || upload.isPending} onClick={() => upload.mutate()}>
                            {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="mr-2 h-4 w-4" /> Kirim bukti</>}
                        </Button>
                    </div>
                    {err && <p className="mt-2 text-sm text-destructive">{err}</p>}
                </CardContent>
            )}
        </Card>
    );
}

export default function Page() {
    return <ParentShell><TagihanInner /></ParentShell>;
}