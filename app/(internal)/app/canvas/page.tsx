"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Eye, Pencil, Trash2 } from "lucide-react";
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

type School = {
    id: number; name: string; address: string | null; pic_name: string | null; contact: string | null;
    commission_percent: number; pipeline_status: string; is_mou: boolean;
};
type Kpi = { total: number; prospek: number; dalam_proses: number; sudah_mou: number; tidak_lanjut: number };

const STATUS: Record<string, { label: string; cls: string }> = {
    prospek: { label: "Prospek", cls: "border-slate-200 bg-slate-50 text-slate-700" },
    dalam_proses: { label: "Dalam Proses", cls: "border-amber-200 bg-amber-50 text-amber-700" },
    sudah_mou: { label: "MoU", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    tidak_lanjut: { label: "Tidak Lanjut", cls: "border-red-200 bg-red-50 text-red-700" },
};
const ORDER = ["prospek", "dalam_proses", "sudah_mou", "tidak_lanjut"];

export default function CanvasPage() {
    const router = useRouter();
    const qc = useQueryClient();
    const confirm = useConfirm();
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("");
    const [creating, setCreating] = useState(false);
    const [edit, setEdit] = useState<School | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ["canvas", search, filter],
        staleTime: 0,
        refetchOnMount: "always",
        queryFn: async () => {
            const env = (await api.get<ApiEnvelope<{ kpi: Kpi; schools: { data: School[] } }>>("/canvas/schools", {
                params: { per_page: 200, search: search || undefined, status: filter || undefined },
            })).data.data;
            return { kpi: env.kpi, rows: env.schools?.data ?? [] };
        },
    });

    const rows = data?.rows ?? [];
    const kpi = data?.kpi;
    const count = (st: string) => (kpi ? (kpi as any)[st] ?? 0 : 0);

    const del = useMutation({
        mutationFn: async (id: number) => api.delete(`/canvas/schools/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["canvas"] }),
        onError: (e: any) => alert(e?.response?.data?.message ?? "Gagal menghapus."),
    });
    const onDelete = async (s: School) => {
        if (await confirm({ title: "Hapus sekolah?", description: `"${s.name}" akan dihapus permanen.`, confirmText: "Hapus", variant: "destructive" }))
            del.mutate(s.id);
    };

    return (
        <InternalShell>
            <PageHeader
                title="Canvas Robotiku"
                subtitle="Pipeline CRM sekolah mitra."
                action={<Button onClick={() => setCreating(true)}><Plus className="mr-1.5 h-4 w-4" /> <span className="hidden sm:inline">Tambah Sekolah</span><span className="sm:hidden">Tambah</span></Button>}
            />

            {/* KPI */}
            <div className="mt-5 mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
                {ORDER.map((st) => (
                    <button key={st} onClick={() => setFilter(filter === st ? "" : st)}
                        className={`rounded-xl border p-3 text-left transition sm:p-4 ${filter === st ? "ring-2 ring-primary" : ""} ${STATUS[st].cls}`}>
                        <div className="text-xl font-bold sm:text-2xl">{count(st)}</div>
                        <div className="text-[11px] font-medium sm:text-xs">{STATUS[st].label}</div>
                    </button>
                ))}
            </div>

            <div className="mb-4 relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Cari sekolah…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>

            {/* DESKTOP: tabel */}
            <Card className="hidden overflow-hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Sekolah</TableHead>
                            <TableHead>PIC</TableHead>
                            <TableHead>Kontak</TableHead>
                            <TableHead>Komisi</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => (
                                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>))}</TableRow>))
                        ) : rows.length ? (
                            rows.map((s) => (
                                <TableRow key={s.id}>
                                    <TableCell className="font-medium">{s.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{s.pic_name ?? "—"}</TableCell>
                                    <TableCell className="text-muted-foreground">{s.contact ?? "—"}</TableCell>
                                    <TableCell>{Number(s.commission_percent)}%</TableCell>
                                    <TableCell><Badge variant="outline" className={STATUS[s.pipeline_status]?.cls}>{STATUS[s.pipeline_status]?.label}</Badge></TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            <Button size="icon" variant="ghost" onClick={() => router.push(`/app/canvas/${s.id}`)} title="Detail"><Eye className="h-4 w-4" /></Button>
                                            <Button size="icon" variant="ghost" onClick={() => setEdit(s)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                                            <Button size="icon" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => onDelete(s)} title="Hapus"><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Tidak ada sekolah.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* MOBILE: card list */}
            <div className="space-y-3 md:hidden">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
                ) : rows.length ? (
                    rows.map((s) => (
                        <Card key={s.id} className="p-4">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="truncate font-semibold">{s.name}</div>
                                    <div className="mt-0.5 text-xs text-muted-foreground">{s.pic_name || "—"} · {s.contact || "—"}</div>
                                </div>
                                <Badge variant="outline" className={STATUS[s.pipeline_status]?.cls}>{STATUS[s.pipeline_status]?.label}</Badge>
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">Komisi {Number(s.commission_percent)}%</div>
                            <div className="mt-3 flex gap-2">
                                <Button size="sm" variant="outline" className="flex-1" onClick={() => router.push(`/app/canvas/${s.id}`)}><Eye className="mr-1 h-4 w-4" /> Detail</Button>
                                <Button size="sm" variant="outline" onClick={() => setEdit(s)}><Pencil className="h-4 w-4" /></Button>
                                <Button size="sm" variant="outline" className="text-red-600" onClick={() => onDelete(s)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </Card>
                    ))
                ) : (
                    <p className="py-10 text-center text-sm text-muted-foreground">Tidak ada sekolah.</p>
                )}
            </div>

            <SchoolDialog open={creating} school={null} onClose={() => setCreating(false)} />
            <SchoolDialog open={!!edit} school={edit} onClose={() => setEdit(null)} />
        </InternalShell>
    );
}

function SchoolDialog({ open, school, onClose }: { open: boolean; school: School | null; onClose: () => void }) {
    const qc = useQueryClient();
    const router = useRouter();
    const isEdit = !!school;
    const [form, setForm] = useState({ name: "", address: "", pic_name: "", contact: "", commission_percent: "10" });
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [seeded, setSeeded] = useState<number | "new" | null>(null);

    const key = school ? school.id : "new";
    if (open && seeded !== key) {
        setForm({
            name: school?.name ?? "", address: school?.address ?? "", pic_name: school?.pic_name ?? "",
            contact: school?.contact ?? "", commission_percent: school ? String(school.commission_percent) : "10",
        });
        setErrors({}); setSeeded(key);
    }
    if (!open && seeded !== null) setSeeded(null);

    const save = useMutation({
        mutationFn: async () => {
            const payload = { ...form, commission_percent: Number(form.commission_percent || 0) };
            return isEdit
                ? (await api.put<ApiEnvelope<{ id: number }>>(`/canvas/schools/${school!.id}`, payload)).data
                : (await api.post<ApiEnvelope<{ id: number }>>("/canvas/schools", payload)).data;
        },
        onSuccess: (res) => {
            qc.invalidateQueries({ queryKey: ["canvas"] });
            onClose();
            if (!isEdit && res?.data?.id) router.push(`/app/canvas/${res.data.id}`);
        },
        onError: (e: any) => { if (e?.response?.status === 422) setErrors(e.response.data.errors ?? {}); },
    });

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>{isEdit ? "Edit Sekolah" : "Tambah Sekolah"}</DialogTitle></DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); setErrors({}); save.mutate(); }} className="space-y-4">
                    <Field label="Nama Sekolah" error={errors.name}>
                        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </Field>
                    <Field label="Alamat" error={errors.address}>
                        <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                    </Field>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Field label="PIC" error={errors.pic_name}>
                            <Input value={form.pic_name} onChange={(e) => setForm({ ...form, pic_name: e.target.value })} />
                        </Field>
                        <Field label="No. WA" error={errors.contact}>
                            <Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
                        </Field>
                    </div>
                    <Field label="Komisi (%)" error={errors.commission_percent}>
                        <Input type="number" min={0} max={100} value={form.commission_percent} onChange={(e) => setForm({ ...form, commission_percent: e.target.value })} />
                    </Field>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose}>Batal</Button>
                        <Button type="submit" disabled={save.isPending}>{save.isPending ? "Menyimpan…" : isEdit ? "Simpan" : "Buat"}</Button>
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