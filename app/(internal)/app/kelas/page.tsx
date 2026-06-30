"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Plus, Eye, ChevronLeft, ChevronRight, Loader2, Trash2, UserPlus, Search, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, apiError, type ApiEnvelope } from "@/lib/api";
import { InternalShell } from "@/components/internal/InternalShell";

const rupiah = (n: number | string | null | undefined) => (n == null ? "—" : "Rp" + Math.round(Number(n)).toLocaleString("id-ID"));
type Trainer = { id: number; name: string };
type Billing = { registration_fee: string; price_per_cycle: string } | null;
type KelasRow = { id: number; name: string; schedule: string | null; capacity: number | null; trainer: Trainer | null; billing_setting: Billing; students_count: number };
type Paginator = { data: KelasRow[]; current_page: number; last_page: number; total: number };
type StudentMini = { id: number; student_code: string; name: string; status: string };
type KelasDetail = { id: number; name: string; schedule: string | null; capacity: number | null; trainer_id: number | null; trainer: Trainer | null; billing_setting: Billing; students: StudentMini[] };

function KelasInner() {
    const qc = useQueryClient();
    const [page, setPage] = useState(1);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const trainers = useQuery({ queryKey: ["trainers"], queryFn: async () => (await api.get<ApiEnvelope<Trainer[]>>("/trainers")).data.data });
    const list = useQuery({
        queryKey: ["kelas", page],
        queryFn: async () => (await api.get("/kelas", { params: { page } })).data.data as Paginator,
        placeholderData: keepPreviousData,
    });

    const detail = useQuery({
        queryKey: ["kelas-detail", selectedId],
        enabled: !!selectedId,
        queryFn: async () => (await api.get<ApiEnvelope<KelasDetail>>(`/kelas/${selectedId}`)).data.data,
    });

    const p = list.data;
    const rows = p?.data ?? [];
    const refreshAll = () => { qc.invalidateQueries({ queryKey: ["kelas"] }); detail.refetch(); };

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Data Kelas</h1>
                    <p className="text-sm text-muted-foreground">Kelola kelas, trainer, harga, dan murid.</p>
                </div>
                <CreateKelas trainers={trainers.data ?? []} onCreated={() => qc.invalidateQueries({ queryKey: ["kelas"] })} />
            </div>

            <Card className="overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Kelas</TableHead>
                            <TableHead>Trainer</TableHead>
                            <TableHead>Jadwal</TableHead>
                            <TableHead className="text-center">Murid</TableHead>
                            <TableHead className="text-right">Harga/siklus</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {list.isLoading && Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-9 w-full" /></TableCell></TableRow>
                        ))}
                        {rows.map((k) => (
                            <TableRow key={k.id} className="cursor-pointer" onClick={() => setSelectedId(k.id)}>
                                <TableCell className="font-medium">{k.name}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{k.trainer?.name ?? "—"}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{k.schedule ?? "—"}</TableCell>
                                <TableCell className="text-center"><Badge variant="secondary">{k.students_count}{k.capacity ? `/${k.capacity}` : ""}</Badge></TableCell>
                                <TableCell className="text-right text-sm">{rupiah(k.billing_setting?.price_per_cycle)}</TableCell>
                                <TableCell className="text-right">
                                    <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedId(k.id); }}><Eye className="h-4 w-4" /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!list.isLoading && rows.length === 0 && (
                            <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Belum ada kelas.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
                {p && (
                    <div className="flex items-center justify-between border-t p-4 text-sm text-muted-foreground">
                        <span>Total {p.total} · Halaman {p.current_page}/{p.last_page}</span>
                        <div className="flex gap-1">
                            <Button size="icon" variant="outline" disabled={p.current_page <= 1} onClick={() => setPage((x) => x - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                            <Button size="icon" variant="outline" disabled={p.current_page >= p.last_page} onClick={() => setPage((x) => x + 1)}><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    </div>
                )}
            </Card>

            <Sheet open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
                <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
                    {detail.isLoading && <div className="grid h-full place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}
                    {detail.data && <Detail kelas={detail.data} trainers={trainers.data ?? []} onChanged={refreshAll} />}
                </SheetContent>
            </Sheet>
        </div>
    );
}

function CreateKelas({ trainers, onCreated }: { trainers: Trainer[]; onCreated: () => void }) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ name: "", schedule: "", capacity: "", trainer_id: "" });
    const [err, setErr] = useState<string | null>(null);
    const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

    const create = useMutation({
        mutationFn: async () => (await api.post("/kelas", {
            name: form.name, schedule: form.schedule || undefined,
            capacity: form.capacity ? Number(form.capacity) : undefined,
            trainer_id: form.trainer_id ? Number(form.trainer_id) : undefined,
        })).data,
        onSuccess: () => { setOpen(false); setForm({ name: "", schedule: "", capacity: "", trainer_id: "" }); onCreated(); },
        onError: (e) => setErr(apiError(e, "Gagal membuat kelas.")),
    });

    return (
        <>
            <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Tambah Kelas</Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Kelas Baru</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div><Label>Nama kelas *</Label><Input className="mt-1" value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
                        <div><Label>Jadwal</Label><Input className="mt-1" placeholder="mis. Sabtu 09:00" value={form.schedule} onChange={(e) => set("schedule", e.target.value)} /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><Label>Kapasitas</Label><Input type="number" className="mt-1" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} /></div>
                            <div>
                                <Label>Trainer</Label>
                                <Select value={form.trainer_id} onValueChange={(v) => set("trainer_id", v ?? "")}>
                                    <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih" /></SelectTrigger>
                                    <SelectContent>{trainers.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        {err && <p className="text-sm text-destructive">{err}</p>}
                        <Button className="w-full" disabled={!form.name || create.isPending} onClick={() => { setErr(null); create.mutate(); }}>
                            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

function Detail({ kelas, trainers, onChanged }: { kelas: KelasDetail; trainers: Trainer[]; onChanged: () => void }) {
    const [edit, setEdit] = useState({ name: kelas.name, schedule: kelas.schedule ?? "", capacity: kelas.capacity?.toString() ?? "", trainer_id: kelas.trainer_id?.toString() ?? "" });
    const [harga, setHarga] = useState({ registration_fee: kelas.billing_setting?.registration_fee ?? "", price_per_cycle: kelas.billing_setting?.price_per_cycle ?? "" });
    const [q, setQ] = useState("");

    const saveKelas = useMutation({
        mutationFn: async () => (await api.put(`/kelas/${kelas.id}`, {
            name: edit.name, schedule: edit.schedule || null,
            capacity: edit.capacity ? Number(edit.capacity) : null,
            trainer_id: edit.trainer_id ? Number(edit.trainer_id) : null,
        })).data,
        onSuccess: onChanged,
    });
    const saveHarga = useMutation({
        mutationFn: async () => (await api.put(`/kelas/${kelas.id}/harga`, { registration_fee: Number(harga.registration_fee || 0), price_per_cycle: Number(harga.price_per_cycle || 0) })).data,
        onSuccess: onChanged,
    });
    const removeMurid = useMutation({
        mutationFn: async (sid: number) => (await api.delete(`/kelas/${kelas.id}/murid/${sid}`)).data,
        onSuccess: onChanged,
    });
    const addMurid = useMutation({
        mutationFn: async (sid: number) => (await api.post(`/kelas/${kelas.id}/murid`, { student_ids: [sid] })).data,
        onSuccess: () => { setQ(""); onChanged(); },
    });

    const found = useQuery({
        queryKey: ["assign-search", q],
        enabled: q.trim().length >= 2,
        queryFn: async () => (await api.get("/siswa", { params: { search: q, per_page: 5 } })).data.data.data as StudentMini[],
    });
    const existingIds = new Set(kelas.students.map((s) => s.id));

    return (
        <div className="space-y-8 py-2">
            <h3 className="text-lg font-semibold">{kelas.name}</h3>

            {/* edit kelas */}
            <div className="space-y-3 rounded-xl border p-4">
                <p className="text-sm font-semibold">Info Kelas</p>
                <div><Label>Nama</Label><Input className="mt-1" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                    <div><Label>Jadwal</Label><Input className="mt-1" value={edit.schedule} onChange={(e) => setEdit({ ...edit, schedule: e.target.value })} /></div>
                    <div><Label>Kapasitas</Label><Input type="number" className="mt-1" value={edit.capacity} onChange={(e) => setEdit({ ...edit, capacity: e.target.value })} /></div>
                </div>
                <div>
                    <Label>Trainer</Label>
                    <Select value={edit.trainer_id} onValueChange={(v) => setEdit({ ...edit, trainer_id: v ?? "" })}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih" /></SelectTrigger>
                        <SelectContent>{trainers.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <Button size="sm" disabled={saveKelas.isPending} onClick={() => saveKelas.mutate()}>
                    {saveKelas.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> Simpan</>}
                </Button>
            </div>

            {/* harga */}
            <div className="space-y-3 rounded-xl border p-4">
                <p className="text-sm font-semibold">Harga Kelas</p>
                <div className="grid grid-cols-2 gap-3">
                    <div><Label>Biaya daftar</Label><Input type="number" className="mt-1" value={harga.registration_fee} onChange={(e) => setHarga({ ...harga, registration_fee: e.target.value })} /></div>
                    <div><Label>Harga / siklus</Label><Input type="number" className="mt-1" value={harga.price_per_cycle} onChange={(e) => setHarga({ ...harga, price_per_cycle: e.target.value })} /></div>
                </div>
                <Button size="sm" disabled={saveHarga.isPending} onClick={() => saveHarga.mutate()}>
                    {saveHarga.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> Simpan harga</>}
                </Button>
            </div>

            {/* murid */}
            <div className="space-y-3 rounded-xl border p-4">
                <p className="text-sm font-semibold">Murid ({kelas.students.length})</p>
                <div className="space-y-2">
                    {kelas.students.map((s) => (
                        <div key={s.id} className="flex items-center justify-between rounded-lg border p-2.5">
                            <div><p className="text-sm font-medium">{s.name}</p><p className="text-xs text-muted-foreground">{s.student_code}</p></div>
                            <Button size="icon" variant="ghost" className="text-destructive" disabled={removeMurid.isPending} onClick={() => removeMurid.mutate(s.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    ))}
                    {kelas.students.length === 0 && <p className="text-sm text-muted-foreground">Belum ada murid.</p>}
                </div>

                {/* tambah murid */}
                <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Cari siswa untuk ditambahkan…" value={q} onChange={(e) => setQ(e.target.value)} />
                </div>
                {found.data && found.data.length > 0 && (
                    <div className="space-y-1 rounded-lg border p-1">
                        {found.data.map((s) => {
                            const already = existingIds.has(s.id);
                            return (
                                <div key={s.id} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                                    <span>{s.name} <span className="text-xs text-muted-foreground">{s.student_code}</span></span>
                                    <Button size="sm" variant="outline" disabled={already || addMurid.isPending} onClick={() => addMurid.mutate(s.id)}>
                                        {already ? "Sudah" : <><UserPlus className="mr-1 h-3.5 w-3.5" /> Tambah</>}
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Page() {
    return (
        <InternalShell>
            <KelasInner />
        </InternalShell>
    );
}