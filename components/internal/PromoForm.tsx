"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, apiError } from "@/lib/api";
import { useConfirm } from "@/components/ui/confirm";

export type Promo = { id: number; code: string; type: "nominal" | "percentage"; value: string; quota: number; valid_from: string | null; valid_until: string | null; is_active: boolean };

export function PromoForm({ editing }: { editing: Promo | null }) {
    const router = useRouter();
    const confirm = useConfirm();
    const [form, setForm] = useState({
        code: editing?.code ?? "", type: editing?.type ?? "percentage", value: editing ? String(editing.value) : "",
        quota: editing ? String(editing.quota) : "0", valid_from: editing?.valid_from?.slice(0, 10) ?? "",
        valid_until: editing?.valid_until?.slice(0, 10) ?? "", is_active: editing ? editing.is_active : true,
    });
    const [err, setErr] = useState<Record<string, string[]> | string | null>(null);
    const set = (k: keyof typeof form, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

    const save = useMutation({
        mutationFn: async () => {
            const payload = { code: form.code, type: form.type, value: Number(form.value), quota: Number(form.quota || 0), valid_from: form.valid_from || null, valid_until: form.valid_until || null, is_active: form.is_active };
            return editing ? (await api.put(`/promo/${editing.id}`, payload)).data : (await api.post("/promo", payload)).data;
        },
        onSuccess: () => router.push("/app/promo"),
        onError: (e: any) => setErr(e?.response?.status === 422 ? (e.response.data.errors ?? null) : apiError(e)),
    });
    const fe = (k: string) => (typeof err === "object" && err && (err as any)[k] ? (err as any)[k][0] : null);

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <div className="flex items-center gap-3">
                <Button asChild variant="outline" size="icon"><Link href="/app/promo"><ArrowLeft className="h-4 w-4" /></Link></Button>
                <div><h1 className="text-2xl font-semibold tracking-tight">{editing ? "Edit Promo" : "Promo Baru"}</h1><p className="text-sm text-muted-foreground">Diskon biaya pendaftaran (jalur mandiri).</p></div>
            </div>

            <Card>
                <CardHeader><CardTitle className="text-base">Detail Promo</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div><Label>Kode *</Label><Input className="mt-1 font-mono" value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} />{fe("code") && <p className="mt-1 text-xs text-destructive">{fe("code")}</p>}</div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label>Tipe *</Label>
                            <Select value={form.type} onValueChange={(v) => set("type", v ?? "percentage")}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="percentage">Persentase (%)</SelectItem><SelectItem value="nominal">Nominal (Rp)</SelectItem></SelectContent>
                            </Select>
                        </div>
                        <div><Label>Nilai *</Label><Input type="number" className="mt-1" value={form.value} onChange={(e) => set("value", e.target.value)} />{fe("value") && <p className="mt-1 text-xs text-destructive">{fe("value")}</p>}</div>
                    </div>
                    <div><Label>Kuota (0 = tak terbatas)</Label><Input type="number" className="mt-1" value={form.quota} onChange={(e) => set("quota", e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><Label>Berlaku dari</Label><Input type="date" className="mt-1" value={form.valid_from} onChange={(e) => set("valid_from", e.target.value)} /></div>
                        <div><Label>Sampai</Label><Input type="date" className="mt-1" value={form.valid_until} onChange={(e) => set("valid_until", e.target.value)} /></div>
                    </div>
                    <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} /> Aktif</label>
                    {typeof err === "string" && <p className="text-sm text-destructive">{err}</p>}
                    <Button disabled={!form.code || !form.value || save.isPending} onClick={async () => { setErr(null); if (await confirm({ title: editing ? "Simpan perubahan promo?" : "Buat promo baru?" })) save.mutate(); }}>
                        {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Simpan
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}