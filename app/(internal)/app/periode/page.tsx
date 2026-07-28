"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ChevronDown } from "lucide-react";
import { api, type ApiEnvelope } from "@/lib/api";
import { InternalShell } from "@/components/internal/InternalShell";
import { PageHeader } from "@/components/ui/page-header";
import { useConfirm } from "@/components/ui/confirm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Ref = { id: number; name: string };
type Period = { id: number; name: string; scope: "sekolah" | "mandiri"; number: number; is_active: boolean; school: Ref | null; school_id: number | null };

const selectCls = "h-10 w-full appearance-none rounded-md border border-input bg-background px-3 pr-9 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function PeriodePage() {
    const qc = useQueryClient();
    const confirm = useConfirm();
    const [scope, setScope] = useState<"" | "sekolah" | "mandiri">("");
    const [edit, setEdit] = useState<Period | null>(null);
    const [creating, setCreating] = useState(false);

    const { data } = useQuery({ queryKey: ["periode", scope], queryFn: async () => (await api.get<ApiEnvelope<Period[]>>("/periode", { params: { scope: scope || undefined } })).data.data });
    const del = useMutation({ mutationFn: async (id: number) => api.delete(`/periode/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["periode"] }) });
    const onDelete = async (p: Period) => { if (await confirm({ title: "Hapus periode?", description: p.name, confirmText: "Hapus", variant: "destructive" })) del.mutate(p.id); };

    return (
        <InternalShell>
            <PageHeader title="Master Periode" subtitle="Periode pembelajaran (4 pekan) untuk sekolah & mandiri."
                action={<Button onClick={() => setCreating(true)}><Plus className="mr-1.5 h-4 w-4" /> Tambah</Button>} />

            <div className="mb-4 flex gap-2">
                {[["", "Semua"], ["sekolah", "Sekolah"], ["mandiri", "Mandiri"]].map(([v, l]) => (
                    <Button key={v} size="sm" variant={scope === v ? "default" : "outline"} onClick={() => setScope(v as any)}>{l}</Button>
                ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(data ?? []).map((p) => (
                    <Card key={p.id} className="border-2 p-4">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <div className="truncate font-semibold">{p.name}</div>
                                <div className="mt-0.5 text-xs text-muted-foreground">Periode #{p.number} · {p.scope === "sekolah" ? (p.school?.name ?? "Sekolah") : "Mandiri"}</div>
                            </div>
                            <Badge variant="outline" className={p.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"}>{p.is_active ? "Aktif" : "Nonaktif"}</Badge>
                        </div>
                        <div className="mt-3 flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => setEdit(p)}><Pencil className="mr-1 h-3.5 w-3.5" /> Edit</Button>
                            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => onDelete(p)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                    </Card>
                ))}
                {!data?.length && <Card className="col-span-full border-2 p-8 text-center text-sm text-muted-foreground">Belum ada periode.</Card>}
            </div>

            <PeriodDialog open={!!edit} period={edit} onClose={() => setEdit(null)} />
            <PeriodDialog open={creating} period={null} onClose={() => setCreating(false)} />
        </InternalShell>
    );
}

function PeriodDialog({ open, period, onClose }: { open: boolean; period: Period | null; onClose: () => void }) {
    const qc = useQueryClient();
    const isEdit = !!period;
    const [form, setForm] = useState({ name: "", scope: "sekolah" as "sekolah" | "mandiri", school_id: "", number: "1", is_active: true });
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [seeded, setSeeded] = useState<number | "new" | null>(null);

    const key = period ? period.id : "new";
    if (open && seeded !== key) {
        setForm({ name: period?.name ?? "", scope: period?.scope ?? "sekolah", school_id: period?.school_id ? String(period.school_id) : "", number: period ? String(period.number) : "1", is_active: period?.is_active ?? true });
        setErrors({}); setSeeded(key);
    }
    if (!open && seeded !== null) setSeeded(null);

    const { data: schools } = useQuery({ queryKey: ["sekolah-mou"], enabled: open, queryFn: async () => (await api.get<ApiEnvelope<Ref[]>>("/sekolah/mou")).data.data });

    const save = useMutation({
        mutationFn: async () => {
            const payload = { name: form.name, scope: form.scope, school_id: form.scope === "sekolah" ? Number(form.school_id) : null, number: Number(form.number), is_active: form.is_active };
            return isEdit ? api.put(`/periode/${period!.id}`, payload) : api.post("/periode", payload);
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["periode"] }); onClose(); },
        onError: (e: any) => { if (e?.response?.status === 422) setErrors(e.response.data.errors ?? {}); },
    });

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>{isEdit ? "Edit Periode" : "Tambah Periode"}</DialogTitle></DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
                    <div className="space-y-1.5"><Label>Nama periode</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Periode 1 (Jan–Feb)" />{errors.name && <p className="text-xs text-red-600">{errors.name[0]}</p>}</div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5"><Label>Jenis</Label>
                            <div className="relative">
                                <select className={selectCls} value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value as any })}>
                                    <option value="sekolah">Sekolah</option><option value="mandiri">Mandiri</option>
                                </select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            </div>
                        </div>
                        <div className="space-y-1.5"><Label>Priode ke-</Label><Input type="number" min={1} value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} /></div>
                    </div>
                    {form.scope === "sekolah" && (
                        <div className="space-y-1.5"><Label>Sekolah</Label>
                            <div className="relative">
                                <select className={selectCls} value={form.school_id} onChange={(e) => setForm({ ...form, school_id: e.target.value })}>
                                    <option value="">— pilih sekolah —</option>{schools?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            </div>{errors.school_id && <p className="text-xs text-red-600">{errors.school_id[0]}</p>}
                        </div>
                    )}
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4" /> Aktif</label>
                    <DialogFooter><Button type="button" variant="ghost" onClick={onClose}>Batal</Button><Button type="submit" disabled={save.isPending}>{save.isPending ? "Menyimpan…" : "Simpan"}</Button></DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}