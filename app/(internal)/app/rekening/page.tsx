"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Landmark } from "lucide-react";
import { api, type ApiEnvelope } from "@/lib/api";
import { InternalShell } from "@/components/internal/InternalShell";
import { PageHeader } from "@/components/ui/page-header";
import { useConfirm } from "@/components/ui/confirm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Bank = { id: number; bank_name: string; account_number: string; account_holder: string; is_active: boolean };

export default function RekeningPage() {
    const qc = useQueryClient();
    const confirm = useConfirm();
    const [edit, setEdit] = useState<Bank | null>(null);
    const [creating, setCreating] = useState(false);

    const { data } = useQuery({ queryKey: ["bank"], queryFn: async () => (await api.get<ApiEnvelope<Bank[]>>("/bank-accounts")).data.data });
    const del = useMutation({ mutationFn: async (id: number) => api.delete(`/bank-accounts/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["bank"] }) });

    const onDelete = async (b: Bank) => {
        if (await confirm({ title: "Hapus rekening?", description: `${b.bank_name} — ${b.account_number}`, confirmText: "Hapus", variant: "destructive" })) del.mutate(b.id);
    };

    return (
        <InternalShell>
            <PageHeader title="Rekening Robotiku" subtitle="Tujuan transfer setoran dari sekolah mitra."
                action={<Button onClick={() => setCreating(true)}><Plus className="mr-1.5 h-4 w-4" /> Tambah</Button>} />

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(data ?? []).map((b) => (
                    <Card key={b.id} className="p-5">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="flex items-center gap-2 font-semibold"><Landmark className="h-4 w-4" /> {b.bank_name}</span>
                            <Badge variant="outline" className={b.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"}>{b.is_active ? "Aktif" : "Nonaktif"}</Badge>
                        </div>
                        <div className="font-mono text-lg">{b.account_number}</div>
                        <div className="text-sm text-muted-foreground">a.n. {b.account_holder}</div>
                        <div className="mt-3 flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => setEdit(b)}><Pencil className="mr-1 h-3.5 w-3.5" /> Edit</Button>
                            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => onDelete(b)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                    </Card>
                ))}
                {!data?.length && <p className="text-sm text-muted-foreground">Belum ada rekening.</p>}
            </div>

            <BankDialog open={!!edit} bank={edit} onClose={() => setEdit(null)} />
            <BankDialog open={creating} bank={null} onClose={() => setCreating(false)} />
        </InternalShell>
    );
}

function BankDialog({ open, bank, onClose }: { open: boolean; bank: Bank | null; onClose: () => void }) {
    const qc = useQueryClient();
    const isEdit = !!bank;
    const [form, setForm] = useState({ bank_name: "", account_number: "", account_holder: "", is_active: true });
    const [seeded, setSeeded] = useState<number | "new" | null>(null);
    const key = bank ? bank.id : "new";
    if (open && seeded !== key) { setForm({ bank_name: bank?.bank_name ?? "", account_number: bank?.account_number ?? "", account_holder: bank?.account_holder ?? "", is_active: bank?.is_active ?? true }); setSeeded(key); }
    if (!open && seeded !== null) setSeeded(null);

    const save = useMutation({
        mutationFn: async () => isEdit ? api.put(`/bank-accounts/${bank!.id}`, form) : api.post("/bank-accounts", form),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["bank"] }); onClose(); },
    });

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>{isEdit ? "Edit Rekening" : "Tambah Rekening"}</DialogTitle></DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
                    <div className="space-y-1.5"><Label>Bank</Label><Input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} placeholder="BCA" /></div>
                    <div className="space-y-1.5"><Label>No. Rekening</Label><Input value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} /></div>
                    <div className="space-y-1.5"><Label>Atas Nama</Label><Input value={form.account_holder} onChange={(e) => setForm({ ...form, account_holder: e.target.value })} /></div>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4" /> Aktif</label>
                    <DialogFooter><Button type="button" variant="ghost" onClick={onClose}>Batal</Button><Button type="submit" disabled={save.isPending}>{save.isPending ? "Menyimpan…" : "Simpan"}</Button></DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}