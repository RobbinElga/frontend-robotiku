"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, BookMarked, Loader2, Eye, EyeOff } from "lucide-react";
import { api, type ApiEnvelope } from "@/lib/api";
import { InternalShell } from "@/components/internal/InternalShell";
import { PageHeader } from "@/components/ui/page-header";
import { useConfirm } from "@/components/ui/confirm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Program = { id: number; name: string; registration_fee: string | number; price_per_cycle: string | number; is_visible: boolean };
const rupiah = (n: string | number) => "Rp" + Number(n || 0).toLocaleString("id-ID");

export default function ProgramPage() {
    const qc = useQueryClient();
    const confirm = useConfirm();
    const [editing, setEditing] = useState<Program | null>(null);
    const [creating, setCreating] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ["program-admin"],
        queryFn: async () => {
            const raw = (await api.get<ApiEnvelope<any>>("/program")).data.data;
            return (Array.isArray(raw) ? raw : raw?.data ?? []) as Program[];
        },
    });

    const del = useMutation({
        mutationFn: async (id: number) => api.delete(`/program/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["program-admin"] }),
        onError: (e: any) => alert(e?.response?.data?.message ?? "Gagal menghapus program."),
    });
    const onDelete = async (p: Program) => {
        if (await confirm({ title: "Hapus program?", description: `"${p.name}" akan dihapus. Kelas/siswa yang memakai program ini bisa terpengaruh.`, confirmText: "Hapus", variant: "destructive" })) del.mutate(p.id);
    };

    return (
        <InternalShell>
            <PageHeader
                title="Program"
                subtitle="Kelola program & harga. Program yang disembunyikan tidak muncul di form pendaftaran."
                action={<Button onClick={() => setCreating(true)}><Plus className="mr-1.5 h-4 w-4" /> Tambah Program</Button>}
            />

            <Card className="mt-5 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Program</TableHead>
                            <TableHead>Biaya Daftar</TableHead>
                            <TableHead>Biaya / Siklus</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? Array.from({ length: 4 }).map((_, i) => (
                            <TableRow key={i}>{Array.from({ length: 5 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>
                        )) : data?.length ? data.map((p) => (
                            <TableRow key={p.id}>
                                <TableCell>
                                    <div className="flex items-center gap-2.5">
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><BookMarked className="h-4 w-4" /></span>
                                        <span className="font-medium">{p.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{rupiah(p.registration_fee)}</TableCell>
                                <TableCell>{rupiah(p.price_per_cycle)}</TableCell>
                                <TableCell>
                                    {p.is_visible
                                        ? <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700"><Eye className="h-3 w-3" /> Tampil</Badge>
                                        : <Badge variant="outline" className="gap-1 border-slate-200 bg-slate-100 text-slate-600"><EyeOff className="h-3 w-3" /> Disembunyikan</Badge>}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button size="icon" variant="ghost" onClick={() => setEditing(p)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                                        <Button size="icon" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => onDelete(p)} title="Hapus"><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Belum ada program.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            <ProgramDialog open={creating} program={null} onClose={() => setCreating(false)} />
            <ProgramDialog open={!!editing} program={editing} onClose={() => setEditing(null)} />
        </InternalShell>
    );
}

type FormState = { name: string; registration_fee: string; price_per_cycle: string; is_visible: boolean };

function ProgramDialog({ open, program, onClose }: { open: boolean; program: Program | null; onClose: () => void }) {
    const qc = useQueryClient();
    const isEdit = !!program;
    const [form, setForm] = useState<FormState>({ name: "", registration_fee: "", price_per_cycle: "", is_visible: true });
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    useEffect(() => {
        if (!open) return;
        setForm({
            name: program?.name ?? "",
            registration_fee: program ? String(program.registration_fee ?? "") : "",
            price_per_cycle: program ? String(program.price_per_cycle ?? "") : "",
            is_visible: program?.is_visible ?? true,
        });
        setErrors({});
    }, [open, program]);

    const save = useMutation({
        mutationFn: async () => {
            const payload = {
                name: form.name,
                registration_fee: Number(form.registration_fee || 0),
                price_per_cycle: Number(form.price_per_cycle || 0),
                is_visible: form.is_visible,
            };
            return isEdit ? api.put(`/program/${program!.id}`, payload) : api.post("/program", payload);
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["program-admin"] }); onClose(); },
        onError: (e: any) => { if (e?.response?.status === 422) setErrors(e.response.data.errors ?? {}); },
    });

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><BookMarked className="h-4 w-4" /></span>
                        {isEdit ? "Edit Program" : "Tambah Program"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
                    <Field label="Nama program" error={errors.name}>
                        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="mis. Robotik Dasar" />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Biaya daftar (Rp)" error={errors.registration_fee}>
                            <Input type="number" min={0} value={form.registration_fee} onChange={(e) => setForm({ ...form, registration_fee: e.target.value })} placeholder="150000" />
                        </Field>
                        <Field label="Biaya / siklus (Rp)" error={errors.price_per_cycle}>
                            <Input type="number" min={0} value={form.price_per_cycle} onChange={(e) => setForm({ ...form, price_per_cycle: e.target.value })} placeholder="200000" />
                        </Field>
                    </div>

                    {/* Toggle tampil/tidak */}
                    <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                        <div className="min-w-0">
                            <div className="text-sm font-medium">Tampilkan di form pendaftaran</div>
                            <div className="text-xs text-muted-foreground">Jika dimatikan, program ini tidak muncul saat orang tua mendaftar mandiri.</div>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={form.is_visible}
                            onClick={() => setForm((f) => ({ ...f, is_visible: !f.is_visible }))}
                            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${form.is_visible ? "bg-primary" : "bg-muted-foreground/30"}`}
                        >
                            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${form.is_visible ? "left-[22px]" : "left-0.5"}`} />
                        </button>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button type="button" variant="ghost" onClick={onClose}>Batal</Button>
                        <Button type="submit" disabled={save.isPending}>
                            {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isEdit ? "Simpan Perubahan" : "Buat Program"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function Field({ label, error, children }: { label: string; error?: string[]; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs">{label}</Label>
            {children}
            {error && <p className="text-xs text-red-600">{error[0]}</p>}
        </div>
    );
}