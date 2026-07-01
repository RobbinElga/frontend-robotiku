"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
    Plus, Search, Eye, Pencil, Trash2, Users, UsersRound, Clock, GraduationCap, X, UserPlus, BookMarked,
} from "lucide-react";
import { api, type ApiEnvelope } from "@/lib/api";
import { InternalShell } from "@/components/internal/InternalShell";
import { PageHeader } from "@/components/ui/page-header";
import { DrawerHeader } from "@/components/ui/drawer-header";
import { useConfirm } from "@/components/ui/confirm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Trainer = { id: number; name: string };
type ProgramRef = { id: number; name: string };
type ClassStudent = { id: number; name: string; student_code: string };
type Kelas = {
    id: number; name: string; schedule: string | null; capacity: number;
    trainer_id: number | null; trainer: Trainer | null;
    program_id: number | null; program: ProgramRef | null;
    students_count: number; students?: ClassStudent[]; created_at: string;
};
type Paginated = { data: Kelas[]; current_page: number; last_page: number; total: number };
const tgl = (s: string) => new Date(s).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

export default function KelasPage() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [detailId, setDetailId] = useState<number | null>(null);
    const [edit, setEdit] = useState<Kelas | null>(null);
    const [creating, setCreating] = useState(false);

    const qc = useQueryClient();
    const confirm = useConfirm();

    const { data, isLoading } = useQuery({
        queryKey: ["kelas", search, page],
        queryFn: async () =>
            (await api.get<ApiEnvelope<Paginated>>("/kelas", { params: { search: search || undefined, page } })).data.data,
        placeholderData: keepPreviousData,
    });

    const del = useMutation({
        mutationFn: async (id: number) => api.delete(`/kelas/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["kelas"] }),
        onError: (e: any) => alert(e?.response?.data?.message ?? "Gagal menghapus."),
    });

    const onDelete = async (k: Kelas) => {
        const ok = await confirm({
            title: "Hapus kelas?",
            description: `Kelas "${k.name}" akan dihapus. Keluarkan semua murid dulu bila masih ada.`,
            confirmText: "Hapus", variant: "destructive",
        });
        if (ok) del.mutate(k.id);
    };

    return (
        <InternalShell>
            <PageHeader
                title="Data Kelas"
                subtitle="Rombongan belajar Robotiku — tempatkan murid sesuai program."
                action={<Button onClick={() => setCreating(true)}><Plus className="mr-1.5 h-4 w-4" /> Tambah Kelas</Button>}
            />

            <div className="mb-4 relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Cari nama kelas…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
            </div>

            <Card className="overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Kelas</TableHead>
                            <TableHead>Program</TableHead>
                            <TableHead>Jadwal</TableHead>
                            <TableHead>Trainer</TableHead>
                            <TableHead>Kapasitas</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => (
                                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>))}</TableRow>))
                        ) : data?.data.length ? (
                            data.data.map((k) => {
                                const filled = k.students_count;
                                const full = filled >= k.capacity;
                                return (
                                    <TableRow key={k.id}>
                                        <TableCell className="font-medium">{k.name}</TableCell>
                                        <TableCell>{k.program?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                                        <TableCell className="text-muted-foreground">{k.schedule || "—"}</TableCell>
                                        <TableCell>{k.trainer?.name ?? <span className="text-muted-foreground">Belum ada</span>}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={full ? "border-amber-200 bg-amber-50 text-amber-700" : ""}>{filled} / {k.capacity}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-1">
                                                <Button size="icon" variant="ghost" onClick={() => setDetailId(k.id)} title="Detail"><Eye className="h-4 w-4" /></Button>
                                                <Button size="icon" variant="ghost" onClick={() => setEdit(k)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                                                <Button size="icon" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => onDelete(k)} title="Hapus"><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Belum ada kelas.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            {data && data.last_page > 1 && (
                <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Halaman {data.current_page} dari {data.last_page} · {data.total} kelas</span>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Sebelumnya</Button>
                        <Button size="sm" variant="outline" disabled={page >= data.last_page} onClick={() => setPage((p) => p + 1)}>Berikutnya</Button>
                    </div>
                </div>
            )}

            <Sheet open={detailId !== null} onOpenChange={(o) => !o && setDetailId(null)}>
                <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-6 sm:max-w-lg">
                    {detailId !== null && <DetailKelas id={detailId} />}
                </SheetContent>
            </Sheet>

            <KelasDialog open={!!edit} kelas={edit} onClose={() => setEdit(null)} />
            <KelasDialog open={creating} kelas={null} onClose={() => setCreating(false)} />
        </InternalShell>
    );
}

function DetailKelas({ id }: { id: number }) {
    const { data: kelas, isLoading } = useQuery({
        queryKey: ["kelas", id],
        queryFn: async () => (await api.get<ApiEnvelope<Kelas>>(`/kelas/${id}`)).data.data,
    });

    if (isLoading || !kelas) return <div className="grid flex-1 place-items-center py-16 text-sm text-muted-foreground">Memuat…</div>;

    const students = kelas.students ?? [];
    const filled = students.length;

    return (
        <>
            <DrawerHeader title={kelas.name} subtitle={kelas.schedule || "Jadwal belum diatur"}
                badge={<Badge variant="outline">{filled} / {kelas.capacity} murid</Badge>} />

            <div className="grid grid-cols-2 gap-3">
                <InfoTile icon={<BookMarked className="h-4 w-4" />} label="Program" value={kelas.program?.name ?? "—"} />
                <InfoTile icon={<GraduationCap className="h-4 w-4" />} label="Trainer" value={kelas.trainer?.name ?? "Belum ada"} />
                <InfoTile icon={<Clock className="h-4 w-4" />} label="Jadwal" value={kelas.schedule || "—"} />
                <InfoTile icon={<UsersRound className="h-4 w-4" />} label="Kapasitas" value={`${kelas.capacity} murid`} />
            </div>

            <div className="mt-6">
                <h3 className="mb-2 text-sm font-semibold">Daftar Murid</h3>
                <MuridSection kelas={kelas} />
            </div>

            <p className="mt-6 text-xs text-muted-foreground">Dibuat {tgl(kelas.created_at)}</p>
        </>
    );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="rounded-lg border bg-muted/30 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">{icon} {label}</div>
            <div className="text-sm font-medium">{value}</div>
        </div>
    );
}

function MuridSection({ kelas }: { kelas: Kelas }) {
    const qc = useQueryClient();
    const confirm = useConfirm();
    const students = kelas.students ?? [];
    const existingIds = students.map((s) => s.id);

    const remove = useMutation({
        mutationFn: async (studentId: number) => api.delete(`/kelas/${kelas.id}/murid/${studentId}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["kelas"] }),
    });

    const onRemove = async (s: ClassStudent) => {
        const ok = await confirm({
            title: "Keluarkan murid?", description: `${s.name} akan dikeluarkan dari kelas ${kelas.name}.`,
            confirmText: "Keluarkan", variant: "destructive",
        });
        if (ok) remove.mutate(s.id);
    };

    return (
        <div className="space-y-3">
            {students.length ? (
                <ul className="space-y-1">
                    {students.map((s) => (
                        <li key={s.id} className="flex items-center gap-2 rounded-md border px-3 py-2">
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-medium">{s.name}</div>
                                <div className="font-mono text-xs text-muted-foreground">{s.student_code}</div>
                            </div>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:text-red-700" onClick={() => onRemove(s)} title="Keluarkan"><X className="h-4 w-4" /></Button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="rounded-md border border-dashed py-4 text-center text-xs text-muted-foreground">Belum ada murid di kelas ini.</p>
            )}

            {kelas.program_id ? (
                <>
                    <AddSingle classId={kelas.id} programId={kelas.program_id} existingIds={existingIds} />
                    <BulkAssign classId={kelas.id} programId={kelas.program_id} existingIds={existingIds} />
                </>
            ) : (
                <p className="text-xs text-amber-600">Kelas belum punya program — set program dulu lewat Edit.</p>
            )}
        </div>
    );
}

function AddSingle({ classId, programId, existingIds }: { classId: number; programId: number; existingIds: number[] }) {
    const qc = useQueryClient();
    const [q, setQ] = useState("");

    const { data } = useQuery({
        queryKey: ["siswa-cari", q, programId],
        enabled: q.length >= 2,
        queryFn: async () =>
            (await api.get<ApiEnvelope<{ data: ClassStudent[] }>>("/siswa", {
                params: { search: q, status: "aktif", program_id: programId, per_page: 8 },
            })).data.data.data,
    });

    const add = useMutation({
        mutationFn: async (studentId: number) => api.post(`/kelas/${classId}/murid`, { student_ids: [studentId] }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["kelas"] }); setQ(""); },
    });

    const hits = (data ?? []).filter((s) => !existingIds.includes(s.id));

    return (
        <div className="relative">
            <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Tambah murid (se-program) — ketik nama…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
            </div>
            {q.length >= 2 && hits.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-md">
                    {hits.map((s) => (
                        <button key={s.id} type="button" disabled={add.isPending} onClick={() => add.mutate(s.id)}
                            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted">
                            <span>{s.name}</span><span className="font-mono text-xs text-muted-foreground">{s.student_code}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function BulkAssign({ classId, programId, existingIds }: { classId: number; programId: number; existingIds: number[] }) {
    const qc = useQueryClient();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [onlyUnassigned, setOnlyUnassigned] = useState(true);
    const [picked, setPicked] = useState<Set<number>>(new Set());

    const { data, isLoading } = useQuery({
        queryKey: ["bulk-siswa", search, onlyUnassigned, open, programId],
        enabled: open,
        queryFn: async () =>
            (await api.get<ApiEnvelope<{ data: ClassStudent[] }>>("/siswa", {
                params: { search: search || undefined, unassigned: onlyUnassigned ? 1 : undefined, status: "aktif", program_id: programId, per_page: 50 },
            })).data.data.data,
    });

    const list = (data ?? []).filter((s) => !existingIds.includes(s.id));
    const allPicked = list.length > 0 && list.every((s) => picked.has(s.id));

    const toggle = (id: number) => setPicked((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const toggleAll = () => setPicked((p) => { const n = new Set(p); allPicked ? list.forEach((s) => n.delete(s.id)) : list.forEach((s) => n.add(s.id)); return n; });

    const assign = useMutation({
        mutationFn: async () => api.post(`/kelas/${classId}/murid`, { student_ids: [...picked] }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["kelas"] }); setPicked(new Set()); setOpen(false); },
    });

    if (!open)
        return <Button size="sm" variant="outline" className="w-full" onClick={() => setOpen(true)}><UsersRound className="mr-1.5 h-4 w-4" /> Tambah Massal</Button>;

    return (
        <div className="rounded-lg border bg-muted/30 p-3">
            <div className="mb-2 flex items-center gap-2">
                <Input placeholder="Cari nama / kode…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8" />
                <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                    <input type="checkbox" checked={onlyUnassigned} onChange={(e) => setOnlyUnassigned(e.target.checked)} /> Belum berkelas
                </label>
            </div>
            <div className="mb-2 flex items-center justify-between">
                <button type="button" onClick={toggleAll} className="text-xs font-medium text-primary hover:underline">
                    {allPicked ? "Batal pilih semua" : "Pilih semua"} ({list.length})
                </button>
                {picked.size > 0 && <span className="text-xs text-muted-foreground">{picked.size} terpilih</span>}
            </div>
            <div className="max-h-56 space-y-1 overflow-y-auto">
                {isLoading ? <p className="py-4 text-center text-xs text-muted-foreground">Memuat…</p>
                    : list.length ? list.map((s) => (
                        <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-background">
                            <input type="checkbox" checked={picked.has(s.id)} onChange={() => toggle(s.id)} />
                            <span className="text-sm">{s.name}</span>
                            <span className="ml-auto font-mono text-xs text-muted-foreground">{s.student_code}</span>
                        </label>))
                        : <p className="py-4 text-center text-xs text-muted-foreground">Tidak ada siswa se-program.</p>}
            </div>
            <div className="mt-2 flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => { setOpen(false); setPicked(new Set()); }}>Tutup</Button>
                <Button size="sm" disabled={picked.size === 0 || assign.isPending} onClick={() => assign.mutate()}>
                    {assign.isPending ? "Menambah…" : `Tambah ${picked.size || ""}`.trim()}
                </Button>
            </div>
        </div>
    );
}

type FormState = { name: string; schedule: string; capacity: string; trainer_id: string; program_id: string };

function KelasDialog({ open, kelas, onClose }: { open: boolean; kelas: Kelas | null; onClose: () => void }) {
    const qc = useQueryClient();
    const isEdit = !!kelas;
    const [form, setForm] = useState<FormState>({ name: "", schedule: "", capacity: "", trainer_id: "", program_id: "" });
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [seededFor, setSeededFor] = useState<number | "new" | null>(null);

    const key = kelas ? kelas.id : "new";
    if (open && seededFor !== key) {
        setForm({
            name: kelas?.name ?? "", schedule: kelas?.schedule ?? "",
            capacity: kelas ? String(kelas.capacity) : "",
            trainer_id: kelas?.trainer_id ? String(kelas.trainer_id) : "",
            program_id: kelas?.program_id ? String(kelas.program_id) : "",
        });
        setErrors({}); setSeededFor(key);
    }
    if (!open && seededFor !== null) setSeededFor(null);

    const { data: trainers } = useQuery({
        queryKey: ["kelas-trainers"], enabled: open,
        queryFn: async () => (await api.get<ApiEnvelope<Trainer[]>>("/trainers")).data.data,
    });
    const { data: programs } = useQuery({
        queryKey: ["programs"], enabled: open,
        queryFn: async () => (await api.get<ApiEnvelope<ProgramRef[]>>("/programs")).data.data,
    });

    const save = useMutation({
        mutationFn: async () => {
            const payload = {
                name: form.name, schedule: form.schedule || null,
                capacity: Number(form.capacity),
                trainer_id: form.trainer_id ? Number(form.trainer_id) : null,
                program_id: form.program_id ? Number(form.program_id) : null,
            };
            return isEdit ? api.put(`/kelas/${kelas!.id}`, payload) : api.post("/kelas", payload);
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["kelas"] }); onClose(); },
        onError: (e: any) => { if (e?.response?.status === 422) setErrors(e.response.data.errors ?? {}); },
    });

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>{isEdit ? "Edit Kelas" : "Tambah Kelas"}</DialogTitle></DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
                    <Field label="Nama Kelas" error={errors.name}>
                        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Kelas A2" />
                    </Field>

                    <Field label="Program" error={errors.program_id}>
                        <Select value={form.program_id || ""} onValueChange={(v) => setForm({ ...form, program_id: v ?? "" })}>
                            <SelectTrigger><SelectValue placeholder="Pilih program" /></SelectTrigger>
                            <SelectContent>
                                {programs?.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field label="Jadwal" error={errors.schedule}>
                        <Input value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="Sabtu, 09.00–10.30" />
                    </Field>

                    <Field label="Kapasitas" error={errors.capacity}>
                        <Input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="15" />
                    </Field>

                    <Field label="Trainer" error={errors.trainer_id}>
                        <Select value={form.trainer_id || "none"} onValueChange={(v) => setForm({ ...form, trainer_id: v && v !== "none" ? v : "" })}>
                            <SelectTrigger><SelectValue placeholder="Pilih trainer" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Belum ada</SelectItem>
                                {trainers?.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </Field>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose}>Batal</Button>
                        <Button type="submit" disabled={save.isPending}>{save.isPending ? "Menyimpan…" : isEdit ? "Simpan" : "Buat Kelas"}</Button>
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