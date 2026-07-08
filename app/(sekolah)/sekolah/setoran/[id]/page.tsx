"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Landmark, Receipt } from "lucide-react";
import { api, type ApiEnvelope } from "@/lib/api";
import { SchoolShell } from "@/components/sekolah/SchoolShell";
import { ProofView } from "@/components/ui/proof-view";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type Inv = { id: number; invoice_number: string; total_amount: string; student: { name: string; student_code: string } };
type Settlement = {
    id: number; gross_amount: number; commission_percent: number; commission_amount: number; net_amount: number;
    status: string; notes?: string | null; proof_file: string | null; created_at: string; verified_at?: string | null;
    invoices: Inv[];
};
const rp = (n: string | number) => "Rp " + Number(n).toLocaleString("id-ID");
const tgl = (s?: string | null) => (s ? new Date(s).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) : "-");
const STCLS: Record<string, string> = { menunggu_verifikasi: "border-amber-200 bg-amber-50 text-amber-700", diverifikasi: "border-emerald-200 bg-emerald-50 text-emerald-700", ditolak: "border-red-200 bg-red-50 text-red-700" };

export default function DetailSetoran({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data, isLoading } = useQuery({
        queryKey: ["setoran-detail", id],
        queryFn: async () => (await api.get<ApiEnvelope<Settlement>>(`/sekolah/setoran/${id}`)).data.data,
    });

    return (
        <SchoolShell>
            <Link href="/sekolah/setoran" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> Kembali ke Setoran
            </Link>

            {isLoading || !data ? (
                <div className="space-y-4"><Skeleton className="h-40 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>
            ) : (
                <div className="space-y-6">
                    <Card className="overflow-hidden border-2">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-primary/5 p-5">
                            <div className="flex items-center gap-3">
                                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Landmark className="h-5 w-5" /></span>
                                <div>
                                    <div className="text-lg font-bold text-primary">{rp(data.net_amount)}</div>
                                    <div className="text-xs text-muted-foreground">Setoran #{data.id} · {tgl(data.created_at)}</div>
                                </div>
                            </div>
                            <Badge variant="outline" className={STCLS[data.status]}>{data.status.replace(/_/g, " ")}</Badge>
                        </div>
                        <div className="space-y-2 p-5 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">Bruto ({data.invoices.length} invoice)</span><span className="font-semibold">{rp(data.gross_amount)}</span></div>
                            <div className="flex justify-between text-emerald-700"><span>Komisi sekolah ({data.commission_percent}%)</span><span>− {rp(data.commission_amount)}</span></div>
                            <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
                                {data.gross_amount > 0 && <><div className="bg-primary" style={{ width: `${(data.net_amount / data.gross_amount) * 100}%` }} /><div className="bg-emerald-500" style={{ width: `${(data.commission_amount / data.gross_amount) * 100}%` }} /></>}
                            </div>
                            <div className="mt-1 flex justify-between border-t pt-2"><span className="font-medium">Neto disetor</span><span className="text-lg font-extrabold">{rp(data.net_amount)}</span></div>
                            {data.verified_at && <div className="flex justify-between"><span className="text-muted-foreground">Diverifikasi</span><span>{tgl(data.verified_at)}</span></div>}
                            {data.status === "ditolak" && data.notes && <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">Alasan ditolak: {data.notes}</p>}
                        </div>
                    </Card>

                    {/* Invoice yang disetor */}
                    <Card className="border-2 p-5">
                        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold"><Receipt className="h-4 w-4" /> Invoice dalam Setoran</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                                        <th className="py-2 pr-3 font-medium">Invoice</th>
                                        <th className="py-2 pr-3 font-medium">Murid</th>
                                        <th className="py-2 text-right font-medium">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.invoices.map((i) => (
                                        <tr key={i.id} className="border-b last:border-0">
                                            <td className="py-2 pr-3 font-mono text-xs">{i.invoice_number}</td>
                                            <td className="py-2 pr-3">{i.student.name}</td>
                                            <td className="py-2 text-right">{rp(i.total_amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Bukti transfer */}
                    <Card className="border-2 p-5">
                        <h3 className="mb-3 text-sm font-semibold">Bukti Transfer</h3>
                        <ProofView path={data.proof_file} className="max-w-md" />
                    </Card>
                </div>
            )}
        </SchoolShell>
    );
}