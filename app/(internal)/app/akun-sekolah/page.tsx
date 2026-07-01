"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Plus, Search, Pencil, KeyRound, Power } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type MouSchool = { id: number; name: string };
type SchoolAdmin = {
    id: number; name: string; email: string | null; phone: string | null;
    is_active: boolean; school: { id: number; name: string } | null;
};
type Paginated = { data: SchoolAdmin[]; current_page: number; last_page: number; total: number };

export default function AkunSekolahPage() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [edit, setEdit] = useState<SchoolAdmin | null>(null);
    const [creating, setCreating] = useState(false);
    const [resetFor, setResetFor] = useState<SchoolAdmin | null>(null);

    const qc = useQueryClient();
    const confirm = useConfirm();

    const { data, isLoading } = useQuery({
        queryKey: ["akun-sekolah", search, page],
        queryFn: async () =>
            (await api.get<ApiEnvelope<Paginated>>("/akun-sekolah", { params: { search: search || undefined, page } })).data.data,
        placeholderData: keepPreviousData,
    });

    const toggle = useMutation({
        mutationFn: async (id: number) => api.patch(`/akun-sekolah/${id}/status`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["akun-sekolah"] }),
    });

    const onToggle = async (a: SchoolAdmin) => {
        const ok = await confirm({
            title: a.is_active ? "Nonaktifkan akun?" : "Aktifkan akun?",
            description: `Akun "${a.name}" akan ${a.is_active ? "dinonaktifkan (tidak bisa login)" : "diaktifkan kembali"}.`,
            confirmText: a.is_active ? "Nonaktifkan" : "Aktifkan",
            variant: a.is_active ? "destructive" : "default",
        });
        if (ok) toggle.mutate(a.id);
    };

    return (
        <InternalShell>
            <PageHeader
                title="Akun Sekolah"
                subtitle="Kelola akun login Admin Sekolah (mitra ber-MOU)."
                action={<Button onClick={() => setCreating(true)}><Plus className="mr-1.5 h-4 w-4" /> Tambah Akun</Button>}
            />

            <div className="mb-4 relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Cari nama / email / HP…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
            </div>

            <Card className="overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>Sekolah</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>No. HP</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => (
                                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>))}</TableRow>))
                        ) : data?.data.length ? (
                            data.data.map((a) => (
                                <TableRow key={a.id}>
                                    <TableCell className="font-medium">{a.name}</TableCell>
                                    <TableCell>{a.school?.name ?? "—"}</TableCell>
                                    <TableCell className="text-muted-foreground">{a.email ?? "—"}</TableCell>
                                    <TableCell className="text-muted-foreground">{a.phone ?? "—"}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={a.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-muted bg-muted text-muted-foreground"}>
                                            {a.is_active ? "Aktif" : "Nonaktif"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            <Button size="icon" variant="ghost" onClick={() => setEdit(a)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                                            <Button size="icon" variant="ghost" onClick={() => setResetFor(a)} title="Reset kata sandi"><KeyRound className="h-4 w-4" /></Button>
                                            <Button size="icon" variant="ghost" className={a.is_active ? "text-red-600 hover:text-red-700" : "text-emerald-600 hover:text-emerald-700"} onClick={() => onToggle(a)} title={a.is_active ? "Nonaktifkan" : "Aktifkan"}>
                                                <Power className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Belum ada akun sekolah.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            {data && data.last_page > 1 && (
                <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Halaman {data.current_page} dari {data.last_page} · {data.total} akun</span>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Sebelumnya</Button>
                        <Button size="sm" variant="outline" disabled={page >= data.last_page} onClick={() => setPage((p) => p + 1)}>Berikutnya</Button>
                    </div>
                </div>
            )}

            <AkunDialog open={!!edit} admin={edit} onClose={() => setEdit(null)} />
            <AkunDialog open={creating} admin={null} onClose={() => setCreating(false)} />
            <ResetDialog admin={resetFor} onClose={() => setResetFor(null)} />
        </InternalShell>
    );
}

type FormState = { school_id: string; name: string; email: string; phone: string; password: string; is_active: boolean };

function AkunDialog({ open, admin, onClose }: { open: boolean; admin: SchoolAdmin | null; onClose: () => void }) {
    const qc = useQueryClient();
    const isEdit = !!admin;
    const [form, setForm] = useState<FormState>({ school_id: "", name: "", email: "", phone: "", password: "", is_active: true });
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [seededFor, setSeededFor] = useState<number | "new" | null>(null);

    const key = admin ? admin.id : "new";
    if (open && seededFor !== key) {
        setForm({
            school_id: admin?.school?.id ? String(admin.school.id) : "",
            name: admin?.name ?? "", email: admin?.email ?? "", phone: admin?.phone ?? "",
            password: "", is_active: admin?.is_active ?? true,
        });
        setErrors({}); setSeededFor(key);
    }
    if (!open && seededFor !== null) setSeededFor(null);

    const { data: schools } = useQuery({
        queryKey: ["sekolah-mou"], enabled: open,
        queryFn: async () => (await api.get<ApiEnvelope<MouSchool[]>>("/sekolah/mou")).data.data,
    });

    const save = useMutation({
        mutationFn: async () => {
            const payload: any = {
                school_id: Number(form.school_id), name: form.name,
                email: form.email || null, phone: form.phone || null, is_active: form.is_active,
            };
            if (!isEdit) payload.password = form.password;
            return isEdit ? api.put(`/akun-sekolah/${admin!.id}`, payload) : api.post("/akun-sekolah", payload);
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["akun-sekolah"] }); onClose(); },
        onError: (e: any) => { if (e?.response?.status === 422) setErrors(e.response.data.errors ?? {}); },
    });

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>{isEdit ? "Edit Akun Sekolah" : "Tambah Akun Sekolah"}</DialogTitle></DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
                    <Field label="Sekolah Mitra" error={errors.school_id}>
                        <Select value={form.school_id || ""} onValueChange={(v) => setForm({ ...form, school_id: v ?? "" })}>
                            <SelectTrigger><SelectValue placeholder="Pilih sekolah ber-MOU" /></SelectTrigger>
                            <SelectContent>
                                {schools?.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field label="Nama" error={errors.name}>
                        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </Field>
                    <Field label="Email (opsional)" error={errors.email}>
                        <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@sekolah.sch.id" />
                    </Field>
                    <Field label="No. HP (opsional)" error={errors.phone}>
                        <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08xxxxxxxxxx" />
                    </Field>
                    {!isEdit && (
                        <Field label="Kata sandi" error={errors.password}>
                            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="min. 6 karakter" />
                        </Field>
                    )}
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4" />
                        Akun aktif
                    </label>
                    <p className="text-xs text-muted-foreground">Isi minimal salah satu: email atau nomor HP untuk login.</p>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose}>Batal</Button>
                        <Button type="submit" disabled={save.isPending}>{save.isPending ? "Menyimpan…" : isEdit ? "Simpan" : "Buat Akun"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function ResetDialog({ admin, onClose }: { admin: SchoolAdmin | null; onClose: () => void }) {
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const reset = useMutation({
        mutationFn: async () => api.patch(`/akun-sekolah/${admin!.id}/password`, { password }),
        onSuccess: () => { setPassword(""); onClose(); },
        onError: (e: any) => setError(e?.response?.data?.errors?.password?.[0] ?? "Gagal mereset."),
    });

    return (
        <Dialog open={!!admin} onOpenChange={(o) => { if (!o) { setPassword(""); setError(null); onClose(); } }}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader><DialogTitle>Reset Kata Sandi</DialogTitle></DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); setError(null); reset.mutate(); }} className="space-y-4">
                    <p className="text-sm text-muted-foreground">Kata sandi baru untuk <b>{admin?.name}</b>.</p>
                    <div className="space-y-1.5">
                        <Label>Kata sandi baru</Label>
                        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="min. 6 karakter" />
                        {error && <p className="text-xs text-red-600">{error}</p>}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose}>Batal</Button>
                        <Button type="submit" disabled={password.length < 6 || reset.isPending}>{reset.isPending ? "Menyimpan…" : "Reset"}</Button>
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