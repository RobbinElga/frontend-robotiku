"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Program = {
    id: number; name: string; level: string | null;
    registration_fee: number; price_per_cycle: number; is_active: boolean;
    students_count: number; classes_count: number;
};
type Paginated = { data: Program[]; current_page: number; last_page: number; total: number };
const rp = (n: number) => "Rp " + Number(n).toLocaleString("id-ID");

export default function ProgramPage() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [edit, setEdit] = useState<Program | null>(null);
    const [creating, setCreating] = useState(false);

    const qc = useQueryClient();
    const confirm = useConfirm();

    const { data, isLoading } = useQuery({
        queryKey: ["program", search, page],
        queryFn: async () =>
            (await api.get<ApiEnvelope<Paginated>>("/program", { params: { search: search || undefined, page } })).data.data,
        placeholderData: keepPreviousData,
    });

    const del = useMutation({
        mutationFn: async (id: number) => api.delete(`/program/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["program"] }),
        onError: (e: any) => alert(e?.response?.data?.message ?? "Gagal menghapus."),
    });

    const onDelete = async (p: Program) => {
        const ok = await confirm({
            title: "Hapus program?",
            description: `Program "${p.name}" akan dihapus. Tidak bisa jika masih dipakai siswa/kelas.`,
            confirmText: "Hapus", variant: "destructive",
        });
        if (ok) del.mutate(p.id);
    };

    return (
        <InternalShell>
            <PageHeader
                title="Program"
                subtitle="Paket berjenjang beserta harga — dipilih saat pendaftaran."
                action={<Button onClick={() => setCreating(true)}><Plus className="mr-1.5 h-4 w-4" /> Tambah Program</Button>}
            />

            <div className="mb-4 relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Cari program…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
            </div>

            <Card className="overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>Jenjang</TableHead>
                            <TableHead className="text-right">Biaya Daftar</TableHead>
                            <TableHead className="text-right">Per Siklus</TableHead>
                            <TableHead>Siswa</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => (
                                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>))}</TableRow>))
                        ) : data?.data.length ? (
                            data.data.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium">{p.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{p.level || "—"}</TableCell>
                                    <TableCell className="text-right">{rp(p.registration_fee)}</TableCell>
                                    <TableCell className="text-right">{rp(p.price_per_cycle)}</TableCell>
                                    <TableCell>{p.students_count}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={p.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-muted bg-muted text-muted-foreground"}>
                                            {p.is_active ? "Aktif" : "Nonaktif"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            <Button size="icon" variant="ghost" onClick={() => setEdit(p)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                                            <Button size="icon" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => onDelete(p)} title="Hapus"><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Belum ada program.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            {data && data.last_page > 1 && (
                <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Halaman {data.current_page} dari {data.last_page} · {data.total} program</span>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Sebelumnya</Button>
                        <Button size="sm" variant="outline" disabled={page >= data.last_page} onClick={() => setPage((p) => p + 1)}>Berikutnya</Button>
                    </div>
                </div>
            )}

            <ProgramDialog open={!!edit} program={edit} onClose={() => setEdit(null)} />
            <ProgramDialog open={creating} program={null} onClose={() => setCreating(false)} />
        </InternalShell>
    );
}

type FormState = { name: string; level: string; registration_fee: string; price_per_cycle: string; is_active: boolean };

function ProgramDialog({ open, program, onClose }: { open: boolean; program: Program | null; onClose: () => void }) {
    const qc = useQueryClient();
    const isEdit = !!program;
    const [form, setForm] = useState<FormState>({ name: "", level: "", registration_fee: "", price_per_cycle: "", is_active: true });
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [seededFor, setSeededFor] = useState<number | "new" | null>(null);

    const key = program ? program.id : "new";
    if (open && seededFor !== key) {
        setForm({
            name: program?.name ?? "",
            level: program?.level ?? "",
            registration_fee: program ? String(program.registration_fee) : "",
            price_per_cycle: program ? String(program.price_per_cycle) : "",
            is_active: program?.is_active ?? true,
        });
        setErrors({});
        setSeededFor(key);
    }
    if (!open && seededFor !== null) setSeededFor(null);

    const save = useMutation({
        mutationFn: async () => {
            const payload = {
                name: form.name, level: form.level || null,
                registration_fee: Number(form.registration_fee || 0),
                price_per_cycle: Number(form.price_per_cycle || 0),
                is_active: form.is_active,
            };
            return isEdit ? api.put(`/program/${program!.id}`, payload) : api.post("/program", payload);
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["program"] }); onClose(); },
        onError: (e: any) => { if (e?.response?.status === 422) setErrors(e.response.data.errors ?? {}); },
    });

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>{isEdit ? "Edit Program" : "Tambah Program"}</DialogTitle></DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
                    <Field label="Nama Program" error={errors.name}>
                        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Robo Kids" />
                    </Field>
                    <Field label="Jenjang (opsional)" error={errors.level}>
                        <Input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} placeholder="Usia 5-7 Tahun" />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Biaya Daftar" error={errors.registration_fee}>
                            <Input type="number" min={0} value={form.registration_fee} onChange={(e) => setForm({ ...form, registration_fee: e.target.value })} placeholder="150000" />
                        </Field>
                        <Field label="Harga / Siklus" error={errors.price_per_cycle}>
                            <Input type="number" min={0} value={form.price_per_cycle} onChange={(e) => setForm({ ...form, price_per_cycle: e.target.value })} placeholder="200000" />
                        </Field>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4" />
                        Program aktif (bisa dipilih saat pendaftaran)
                    </label>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose}>Batal</Button>
                        <Button type="submit" disabled={save.isPending}>{save.isPending ? "Menyimpan…" : isEdit ? "Simpan" : "Buat Program"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function Field({ label, error, children }: { label: string; error?: string[]; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            {children}
            {error && <p className="text-xs text-red-600">{error[0]}</p>}
        </div>
    );
}