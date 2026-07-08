"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft, Pencil, Clock, UsersRound, Building2, BookMarked, Star, UserPlus, X, Users, GraduationCap, Search, CheckCircle2, School as SchoolIcon,
} from "lucide-react";
import { api, type ApiEnvelope } from "@/lib/api";
import { InternalShell } from "@/components/internal/InternalShell";
import { useConfirm } from "@/components/ui/confirm";
import { KelasDialog, type KelasForDialog } from "@/components/internal/kelas-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Ref = { id: number; name: string };
type Trainer = { id: number; name: string; pivot?: { role: "utama" | "pengganti" } };
type ClassStudent = { id: number; name: string; student_code: string };
type Candidate = { id: number; name: string; student_code: string; school?: Ref | null };
type Kelas = {
    id: number; name: string; schedule: string | null; capacity: number;
    program_id: number | null; program: Ref | null; school_id: number | null; school: Ref | null;
    trainers?: Trainer[]; students?: ClassStudent[]; created_at: string;
};
const tgl = (s: string) => new Date(s).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
const initials = (n: string) => n.split(" ").slice(0, 2).map((x) => x[0]).join("").toUpperCase();

export default function KelasDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [editOpen, setEditOpen] = useState(false);

    const { data: kelas, isLoading } = useQuery({
        queryKey: ["kelas", Number(id)],
        queryFn: async () => (await api.get<ApiEnvelope<Kelas>>(`/kelas/${id}`)).data.data,
    });

    const students = kelas?.students ?? [];
    const filled = students.length;
    const pct = kelas ? Math.min(100, Math.round((filled / kelas.capacity) * 100)) : 0;
    const full = kelas ? filled >= kelas.capacity : false;

    return (
        <InternalShell>
            <div className="w-full">
                <Link href="/app/kelas" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" /> Kembali ke Data Kelas
                </Link>

                {isLoading || !kelas ? (
                    <div className="space-y-4"><Skeleton className="h-40 w-full rounded-xl" /><Skeleton className="h-72 w-full rounded-xl" /></div>
                ) : (
                    <div className="space-y-6">
                        {/* Header */}
                        <Card className="overflow-hidden">
                            <div className="flex flex-wrap items-start justify-between gap-4 border-b bg-gradient-to-r from-primary/5 to-transparent p-5 sm:p-6">
                                <div className="flex items-start gap-3">
                                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><GraduationCap className="h-6 w-6" /></span>
                                    <div className="min-w-0">
                                        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{kelas.name}</h1>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            <Badge variant="outline" className="gap-1"><Building2 className="h-3 w-3" /> {kelas.school?.name ?? "Mandiri"}</Badge>
                                            <Badge variant="outline" className="gap-1"><BookMarked className="h-3 w-3" /> {kelas.program?.name ?? "Belum ada program"}</Badge>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="outline" onClick={() => setEditOpen(true)}><Pencil className="mr-1.5 h-4 w-4" /> Edit Kelas</Button>
                            </div>

                            <div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
                                <InfoTile icon={<Clock className="h-4 w-4" />} label="Jadwal" value={kelas.schedule || "—"} />
                                <InfoTile icon={<Clock className="h-4 w-4" />} label="Dibuat" value={tgl(kelas.created_at)} />
                                <div className="rounded-lg border bg-muted/30 p-3">
                                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1.5"><UsersRound className="h-4 w-4" /> Kapasitas</span>
                                        <span className={full ? "font-semibold text-amber-600" : "font-medium"}>{filled}/{kelas.capacity}</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                                        <div className={`h-full rounded-full ${full ? "bg-amber-500" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="grid gap-6 lg:grid-cols-3">
                            {/* Trainer */}
                            <Card className="p-5 lg:col-span-1">
                                <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold"><Users className="h-4 w-4" /> Trainer</h3>
                                {kelas.trainers?.length ? (
                                    <ul className="space-y-2">
                                        {[...kelas.trainers].sort((a, b) => (a.pivot?.role === "utama" ? -1 : 1)).map((t) => {
                                            const utama = t.pivot?.role === "utama";
                                            return (
                                                <li key={t.id} className={`flex items-center gap-2.5 rounded-lg border p-2.5 ${utama ? "border-primary/40 bg-primary/5" : ""}`}>
                                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">{initials(t.name)}</span>
                                                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.name}</span>
                                                    {utama && <Star className="h-3.5 w-3.5 shrink-0 fill-primary text-primary" />}
                                                    <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold ${utama ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{utama ? "UTAMA" : "PENGGANTI"}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">Belum ada trainer. Klik <b>Edit Kelas</b>.</p>}
                            </Card>

                            {/* Murid */}
                            <Card className="p-5 lg:col-span-2">
                                <StudentManager kelas={kelas} />
                            </Card>
                        </div>
                    </div>
                )}
            </div>

            <KelasDialog open={editOpen} kelas={kelas as KelasForDialog} onClose={() => setEditOpen(false)} />
        </InternalShell>
    );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="rounded-lg border bg-muted/30 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">{icon} {label}</div>
            <div className="truncate text-sm font-medium">{value}</div>
        </div>
    );
}

function StudentManager({ kelas }: { kelas: Kelas }) {
    const qc = useQueryClient();
    const confirm = useConfirm();
    const [addOpen, setAddOpen] = useState(false);
    const students = kelas.students ?? [];

    const remove = useMutation({
        mutationFn: async (studentId: number) => api.delete(`/kelas/${kelas.id}/murid/${studentId}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["kelas"] }),
    });
    const onRemove = async (s: ClassStudent) => {
        if (await confirm({ title: "Keluarkan murid?", description: `${s.name} keluar dari ${kelas.name}.`, confirmText: "Keluarkan", variant: "destructive" })) remove.mutate(s.id);
    };

    return (
        <>
            <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold"><Users className="h-4 w-4" /> Daftar Murid <span className="text-muted-foreground">({students.length})</span></h3>
                {kelas.program_id && <Button size="sm" onClick={() => setAddOpen(true)}><UserPlus className="mr-1.5 h-4 w-4" /> Tambah Murid</Button>}
            </div>

            {!kelas.program_id ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">Set <b>program</b> lewat Edit Kelas dulu agar bisa menambahkan murid.</div>
            ) : students.length ? (
                <ul className="grid gap-2 sm:grid-cols-2">
                    {students.map((s) => (
                        <li key={s.id} className="flex items-center gap-2.5 rounded-lg border px-3 py-2">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">{initials(s.name)}</span>
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-medium">{s.name}</div>
                                <div className="font-mono text-xs text-muted-foreground">{s.student_code}</div>
                            </div>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:text-red-700" onClick={() => onRemove(s)}><X className="h-4 w-4" /></Button>
                        </li>
                    ))}
                </ul>
            ) : <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">Belum ada murid. Klik <b>Tambah Murid</b>.</div>}

            {addOpen && <AddStudentsModal kelas={kelas} existingIds={students.map((s) => s.id)} onClose={() => setAddOpen(false)} />}
        </>
    );
}

function AddStudentsModal({ kelas, existingIds, onClose }: { kelas: Kelas; existingIds: number[]; onClose: () => void }) {
    const qc = useQueryClient();
    const isInstansi = !!kelas.school_id;
    const [schoolId, setSchoolId] = useState(kelas.school_id ? String(kelas.school_id) : "");
    const [search, setSearch] = useState("");
    const [onlyUnassigned, setOnlyUnassigned] = useState(true);
    const [picked, setPicked] = useState<Set<number>>(new Set());
    const [result, setResult] = useState<string | null>(null);

    const { data: schools } = useQuery({
        queryKey: ["sekolah-mou"], enabled: isInstansi,
        queryFn: async () => (await api.get<ApiEnvelope<Ref[]>>("/sekolah/mou")).data.data,
    });

    const { data, isLoading } = useQuery({
        queryKey: ["kelas-kandidat", kelas.id, schoolId, search, onlyUnassigned],
        queryFn: async () => (await api.get<ApiEnvelope<{ data: Candidate[] }>>("/siswa", {
            params: {
                program_id: kelas.program_id, status: "aktif",
                ...(isInstansi ? { school_id: schoolId || kelas.school_id } : { registration_type: "mandiri" }),
                search: search || undefined, unassigned: onlyUnassigned ? 1 : undefined, per_page: 50,
            },
        })).data.data.data,
    });

    const list = (data ?? []).filter((s) => !existingIds.includes(s.id));
    const allPicked = list.length > 0 && list.every((s) => picked.has(s.id));
    const toggle = (id: number) => setPicked((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const toggleAll = () => setPicked((p) => { const n = new Set(p); allPicked ? list.forEach((s) => n.delete(s.id)) : list.forEach((s) => n.add(s.id)); return n; });

    const assign = useMutation({
        mutationFn: async () => api.post<ApiEnvelope<{ assigned: number[]; rejected: number[] }>>(`/kelas/${kelas.id}/murid`, { student_ids: [...picked] }),
        onSuccess: (res) => {
            qc.invalidateQueries({ queryKey: ["kelas"] });
            setPicked(new Set());
            const d: any = res.data.data;
            setResult(res.data.message + (d?.rejected?.length ? ` · ${d.rejected.length} dilewati (beda program/sekolah)` : ""));
        },
    });

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="flex max-h-[88vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
                {/* Header */}
                <DialogHeader className="border-b px-6 py-4">
                    <DialogTitle className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><UserPlus className="h-5 w-5" /></span>
                        <span>
                            <span className="block text-base font-semibold">Tambah Murid</span>
                            <span className="block text-xs font-normal text-muted-foreground">{kelas.name} · {kelas.program?.name ?? "—"}</span>
                        </span>
                    </DialogTitle>
                </DialogHeader>

                {/* Body */}
                <div className="flex-1 space-y-4 overflow-y-auto p-6">
                    {/* Filter */}
                    <div className="grid gap-3 rounded-xl border bg-muted/30 p-4 sm:grid-cols-2">
                        {isInstansi && (
                            <div className="sm:col-span-2">
                                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><SchoolIcon className="h-3.5 w-3.5" /> Sekolah</label>
                                <div className="relative">
                                    <select value={schoolId} onChange={(e) => { setSchoolId(e.target.value); setPicked(new Set()); }}
                                        className="h-10 w-full appearance-none rounded-md border border-input bg-background px-3 pr-9 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                                        {(schools ?? []).map((s) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                                    </select>
                                    <BookMarked className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                </div>
                            </div>
                        )}
                        <div className={isInstansi ? "sm:col-span-1" : "sm:col-span-2"}>
                            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Search className="h-3.5 w-3.5" /> Cari</label>
                            <Input placeholder="Nama murid…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-10" />
                        </div>
                        <div className="flex items-end">
                            <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border bg-background px-3 text-sm">
                                <input type="checkbox" checked={onlyUnassigned} onChange={(e) => setOnlyUnassigned(e.target.checked)} className="h-4 w-4" />
                                Hanya yang belum berkelas
                            </label>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="flex items-center justify-between px-1 text-sm">
                        <button type="button" onClick={toggleAll} disabled={list.length === 0} className="font-medium text-primary hover:underline disabled:opacity-40">
                            {allPicked ? "Batal pilih semua" : "Pilih semua"} <span className="text-muted-foreground">({list.length})</span>
                        </button>
                        {picked.size > 0 && <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{picked.size} terpilih</span>}
                    </div>

                    {/* List */}
                    {isLoading ? (
                        <div className="grid gap-2 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
                    ) : list.length ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                            {list.map((s) => {
                                const on = picked.has(s.id);
                                return (
                                    <label key={s.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${on ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
                                        <input type="checkbox" checked={on} onChange={() => toggle(s.id)} className="h-4 w-4" />
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">{initials(s.name)}</span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-medium">{s.name}</span>
                                            <span className="block font-mono text-xs text-muted-foreground">{s.student_code}{s.school?.name ? ` · ${s.school.name}` : ""}</span>
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-12 text-center">
                            <Users className="h-8 w-8 text-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground">Tidak ada murid sesuai filter.</p>
                            <p className="text-xs text-muted-foreground">Pastikan ada murid <b>{kelas.program?.name}</b>{isInstansi ? " di sekolah ini" : " (mandiri)"} yang belum masuk kelas.</p>
                        </div>
                    )}

                    {result && <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4 shrink-0" /> {result}</div>}
                </div>

                {/* Footer */}
                <DialogFooter className="items-center justify-between gap-2 border-t px-6 py-4 sm:justify-between">
                    <span className="text-xs text-muted-foreground">{picked.size > 0 ? `${picked.size} murid akan ditambahkan` : "Pilih murid untuk ditambahkan"}</span>
                    <div className="flex gap-2">
                        <Button type="button" variant="ghost" onClick={onClose}>Tutup</Button>
                        <Button disabled={picked.size === 0 || assign.isPending} onClick={() => assign.mutate()}>
                            {assign.isPending ? "Menambah…" : `Tambah ${picked.size || ""}`.trim()}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}