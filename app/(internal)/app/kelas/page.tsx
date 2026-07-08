"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Plus, Search, Eye, Pencil, Trash2 } from "lucide-react";
import { api, type ApiEnvelope } from "@/lib/api";
import { InternalShell } from "@/components/internal/InternalShell";
import { PageHeader } from "@/components/ui/page-header";
import { useConfirm } from "@/components/ui/confirm";
import { KelasDialog, type KelasForDialog } from "@/components/internal/kelas-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Ref = { id: number; name: string };
type Trainer = { id: number; name: string; pivot?: { role: "utama" | "pengganti" } };
type Kelas = {
    id: number; name: string; schedule: string | null; capacity: number;
    program_id: number | null; program: Ref | null; school_id: number | null; school: Ref | null;
    trainers?: Trainer[]; students_count: number;
};
type Paginated = { data: Kelas[]; current_page: number; last_page: number; total: number };

export default function KelasPage() {
    const router = useRouter();
    const qc = useQueryClient();
    const confirm = useConfirm();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [edit, setEdit] = useState<KelasForDialog | null>(null);
    const [creating, setCreating] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ["kelas", search, page],
        queryFn: async () => (await api.get<ApiEnvelope<Paginated>>("/kelas", { params: { search: search || undefined, page } })).data.data,
        placeholderData: keepPreviousData,
    });

    const del = useMutation({
        mutationFn: async (id: number) => api.delete(`/kelas/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["kelas"] }),
        onError: (e: any) => alert(e?.response?.data?.message ?? "Gagal menghapus."),
    });
    const onDelete = async (k: Kelas) => {
        if (await confirm({ title: "Hapus kelas?", description: `"${k.name}" akan dihapus. Keluarkan murid dulu bila ada.`, confirmText: "Hapus", variant: "destructive" })) del.mutate(k.id);
    };
    const utamaOf = (k: Kelas) => k.trainers?.find((t) => t.pivot?.role === "utama") ?? k.trainers?.[0];

    return (
        <InternalShell>
            <PageHeader title="Data Kelas" subtitle="Rombongan belajar sekolah, program, trainer, murid."
                action={<Button onClick={() => setCreating(true)}><Plus className="mr-1.5 h-4 w-4" /> <span className="hidden sm:inline">Tambah Kelas</span><span className="sm:hidden">Tambah</span></Button>} />

            <div className="mt-5 mb-4 relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Cari nama kelas…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
            </div>

            <Card className="hidden overflow-hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Kelas</TableHead><TableHead>Sekolah</TableHead><TableHead>Program</TableHead>
                            <TableHead>Trainer</TableHead><TableHead>Kapasitas</TableHead><TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => (<TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>))}</TableRow>))
                            : data?.data.length ? data.data.map((k) => {
                                const full = k.students_count >= k.capacity;
                                return (
                                    <TableRow key={k.id} className="cursor-pointer" onClick={() => router.push(`/app/kelas/${k.id}`)}>
                                        <TableCell className="font-medium">{k.name}</TableCell>
                                        <TableCell>{k.school?.name ?? <span className="text-muted-foreground">Mandiri</span>}</TableCell>
                                        <TableCell>{k.program?.name ?? "—"}</TableCell>
                                        <TableCell>{utamaOf(k)?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                                        <TableCell><Badge variant="outline" className={full ? "border-amber-200 bg-amber-50 text-amber-700" : ""}>{k.students_count}/{k.capacity}</Badge></TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-end gap-1">
                                                <Button size="icon" variant="ghost" onClick={() => router.push(`/app/kelas/${k.id}`)} title="Detail"><Eye className="h-4 w-4" /></Button>
                                                <Button size="icon" variant="ghost" onClick={() => setEdit(k)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                                                <Button size="icon" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => onDelete(k)} title="Hapus"><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            }) : <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Belum ada kelas.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </Card>

            <div className="space-y-3 md:hidden">
                {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
                    : data?.data.length ? data.data.map((k) => (
                        <Card key={k.id} className="p-4">
                            <div className="flex items-start justify-between gap-2" onClick={() => router.push(`/app/kelas/${k.id}`)}>
                                <div className="min-w-0">
                                    <div className="truncate font-semibold">{k.name}</div>
                                    <div className="mt-0.5 text-xs text-muted-foreground">{k.school?.name ?? "Mandiri"} · {k.program?.name ?? "—"}</div>
                                </div>
                                <Badge variant="outline">{k.students_count}/{k.capacity}</Badge>
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">Trainer: {utamaOf(k)?.name ?? "—"}</div>
                            <div className="mt-3 flex gap-2">
                                <Button size="sm" variant="outline" className="flex-1" onClick={() => router.push(`/app/kelas/${k.id}`)}><Eye className="mr-1 h-4 w-4" /> Detail</Button>
                                <Button size="sm" variant="outline" onClick={() => setEdit(k)}><Pencil className="h-4 w-4" /></Button>
                                <Button size="sm" variant="outline" className="text-red-600" onClick={() => onDelete(k)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </Card>
                    )) : <p className="py-10 text-center text-sm text-muted-foreground">Belum ada kelas.</p>}
            </div>

            {data && data.last_page > 1 && (
                <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Halaman {data.current_page} dari {data.last_page} · {data.total} kelas</span>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Sebelumnya</Button>
                        <Button size="sm" variant="outline" disabled={page >= data.last_page} onClick={() => setPage((p) => p + 1)}>Berikutnya</Button>
                    </div>
                </div>
            )}

            <KelasDialog open={creating} kelas={null} onClose={() => setCreating(false)} />
            <KelasDialog open={!!edit} kelas={edit} onClose={() => setEdit(null)} />
        </InternalShell>
    );
}