"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Plus, Pencil, Download, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, apiError, type ApiEnvelope } from "@/lib/api";
import { InternalShell } from "@/components/internal/InternalShell";

const grades = ["A", "B", "C", "D", "E"];
const skillFields = [["skill_building", "Building"], ["skill_imagination", "Imagination"], ["skill_creativity", "Creativity"], ["skill_logic", "Logic"]] as const;
const behaviourFields = [["behavior_punctual", "Tepat waktu"], ["behavior_stay", "Tidak pulang awal"], ["behavior_communication", "Komunikasi"], ["behavior_responsibility", "Tanggung jawab"]] as const;

type Row = { id: number; semester: string; year: number; student: { name: string; student_code: string } };
type Kelas = { id: number; name: string; students: { id: number; name: string; student_code: string }[] };

function ERapotInner() {
    const qc = useQueryClient();
    const [page, setPage] = useState(1);
    const [sheet, setSheet] = useState<{ open: boolean; editId: number | null }>({ open: false, editId: null });

    const list = useQuery({
        queryKey: ["erapot", page],
        queryFn: async () => (await api.get("/e-rapot", { params: { page } })).data.data,
        placeholderData: keepPreviousData,
    });

    const downloadPdf = useMutation({
        mutationFn: async (id: number) => {
            const res = await api.get(`/e-rapot/${id}/pdf`, { responseType: "blob" });
            const url = URL.createObjectURL(res.data as Blob);
            const a = document.createElement("a"); a.href = url; a.download = `e-rapot-${id}.pdf`; a.click(); URL.revokeObjectURL(url);
        },
    });

    const rows: Row[] = list.data?.data ?? [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">E-Rapot</h1>
                    <p className="text-sm text-muted-foreground">Input nilai perkembangan murid & cetak PDF.</p>
                </div>
                <Button onClick={() => setSheet({ open: true, editId: null })}><Plus className="mr-2 h-4 w-4" /> Buat E-Rapot</Button>
            </div>

            <Card className="overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow><TableHead>Siswa</TableHead><TableHead>Semester</TableHead><TableHead>Tahun</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                        {list.isLoading && Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-9 w-full" /></TableCell></TableRow>
                        ))}
                        {rows.map((r) => (
                            <TableRow key={r.id}>
                                <TableCell><p className="font-medium leading-none">{r.student.name}</p><p className="mt-1 text-xs text-muted-foreground">{r.student.student_code}</p></TableCell>
                                <TableCell>{r.semester}</TableCell>
                                <TableCell>{r.year}</TableCell>
                                <TableCell className="text-right">
                                    <Button size="icon" variant="ghost" onClick={() => setSheet({ open: true, editId: r.id })}><Pencil className="h-4 w-4" /></Button>
                                    <Button size="icon" variant="ghost" disabled={downloadPdf.isPending} onClick={() => downloadPdf.mutate(r.id)}><Download className="h-4 w-4" /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!list.isLoading && rows.length === 0 && <TableRow><TableCell colSpan={4} className="py-10 text-center text-muted-foreground">Belum ada E-Rapot.</TableCell></TableRow>}
                    </TableBody>
                </Table>
                {list.data && (
                    <div className="flex items-center justify-between border-t p-4 text-sm text-muted-foreground">
                        <span>Total {list.data.total} · Halaman {list.data.current_page}/{list.data.last_page}</span>
                        <div className="flex gap-1">
                            <Button size="icon" variant="outline" disabled={list.data.current_page <= 1} onClick={() => setPage((x) => x - 1)}>‹</Button>
                            <Button size="icon" variant="outline" disabled={list.data.current_page >= list.data.last_page} onClick={() => setPage((x) => x + 1)}>›</Button>
                        </div>
                    </div>
                )}
            </Card>

            <Sheet open={sheet.open} onOpenChange={(o) => setSheet((s) => ({ ...s, open: o }))}>
                <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
                    {sheet.open && <Form editId={sheet.editId} onSaved={() => { setSheet({ open: false, editId: null }); qc.invalidateQueries({ queryKey: ["erapot"] }); }} />}
                </SheetContent>
            </Sheet>
        </div>
    );
}

function Grade({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div className="flex items-center justify-between gap-2">
            <span className="text-sm">{label}</span>
            <Select value={value} onValueChange={(v) => onChange(v ?? "A")}>
                <SelectTrigger className="h-8 w-16"><SelectValue /></SelectTrigger>
                <SelectContent>{grades.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
        </div>
    );
}

function Form({ editId, onSaved }: { editId: number | null; onSaved: () => void }) {
    const editing = useQuery({ queryKey: ["erapot-detail", editId], enabled: !!editId, queryFn: async () => (await api.get(`/e-rapot/${editId}`)).data.data });
    const classes = useQuery({ queryKey: ["trainer-kelas"], enabled: !editId, queryFn: async () => (await api.get<ApiEnvelope<Kelas[]>>("/trainer/kelas")).data.data });

    const defaults = {
        class_id: "", student_id: "", semester: "1", year: String(new Date().getFullYear()),
        skill_building: "A", skill_imagination: "A", skill_creativity: "A", skill_logic: "A",
        behavior_punctual: "A", behavior_stay: "A", behavior_communication: "A", behavior_responsibility: "A",
        comments: "",
    };
    const [form, setForm] = useState<Record<string, string>>(defaults);
    const [signature, setSignature] = useState<File | null>(null);
    const [err, setErr] = useState<Record<string, string[]> | string | null>(null);
    const [loaded, setLoaded] = useState(false);
    const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

    // prefill saat edit
    if (editId && editing.data && !loaded) {
        setLoaded(true);
        const e = editing.data;
        setForm({
            class_id: String(e.class_id), student_id: String(e.student_id), semester: String(e.semester), year: String(e.year),
            skill_building: e.skill_building, skill_imagination: e.skill_imagination, skill_creativity: e.skill_creativity, skill_logic: e.skill_logic,
            behavior_punctual: e.behavior_punctual, behavior_stay: e.behavior_stay, behavior_communication: e.behavior_communication, behavior_responsibility: e.behavior_responsibility,
            comments: e.comments ?? "",
        });
    }

    const selectedClass = classes.data?.find((c) => String(c.id) === form.class_id);

    const save = useMutation({
        mutationFn: async () => {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => v !== "" && fd.append(k, v));
            if (signature) fd.append("signature", signature);
            if (editId) fd.append("_method", "PUT");
            const url = editId ? `/e-rapot/${editId}` : "/e-rapot";
            return (await api.post(url, fd)).data;
        },
        onSuccess: onSaved,
        onError: (e: any) => setErr(e?.response?.status === 422 ? (e.response.data.errors ?? e.response.data.message) : apiError(e)),
    });

    const fe = (k: string) => (typeof err === "object" && err && (err as any)[k] ? (err as any)[k][0] : null);

    return (
        <div className="space-y-5 py-2">
            <h3 className="text-lg font-semibold">{editId ? "Edit E-Rapot" : "E-Rapot Baru"}</h3>

            {!editId ? (
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label>Kelas</Label>
                        <Select value={form.class_id} onValueChange={(v) => { set("class_id", v ?? ""); set("student_id", ""); }}>
                            <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih" /></SelectTrigger>
                            <SelectContent>{classes.data?.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Murid</Label>
                        <Select value={form.student_id} onValueChange={(v) => set("student_id", v ?? "")}>
                            <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih" /></SelectTrigger>
                            <SelectContent>{selectedClass?.students.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </div>
            ) : (
                <p className="text-sm">Siswa: <b>{editing.data?.student?.name}</b></p>
            )}

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <Label>Semester</Label>
                    <Select value={form.semester} onValueChange={(v) => set("semester", v ?? "1")}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="1">1</SelectItem><SelectItem value="2">2</SelectItem></SelectContent>
                    </Select>
                </div>
                <div><Label>Tahun</Label><Input type="number" className="mt-1" value={form.year} onChange={(e) => set("year", e.target.value)} /></div>
            </div>

            <div className="rounded-lg border p-4">
                <p className="mb-3 text-sm font-semibold">Skill (A–E)</p>
                <div className="grid grid-cols-2 gap-3">
                    {skillFields.map(([k, l]) => <Grade key={k} label={l} value={form[k]} onChange={(v) => set(k, v)} />)}
                </div>
            </div>
            <div className="rounded-lg border p-4">
                <p className="mb-3 text-sm font-semibold">Behaviour (A–E)</p>
                <div className="grid grid-cols-2 gap-3">
                    {behaviourFields.map(([k, l]) => <Grade key={k} label={l} value={form[k]} onChange={(v) => set(k, v)} />)}
                </div>
            </div>

            <div><Label>Komentar</Label><Textarea className="mt-1" rows={3} value={form.comments} onChange={(e) => set("comments", e.target.value)} /></div>
            <div><Label>Tanda tangan (gambar)</Label><Input type="file" accept=".jpg,.jpeg,.png" className="mt-1" onChange={(e) => setSignature(e.target.files?.[0] ?? null)} /></div>

            {fe("student_id") && <p className="text-sm text-destructive">{fe("student_id")}</p>}
            {typeof err === "string" && <p className="text-sm text-destructive">{err}</p>}
            <Button className="w-full" disabled={save.isPending || (!editId && (!form.class_id || !form.student_id))} onClick={() => { setErr(null); save.mutate(); }}>
                {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan E-Rapot"}
            </Button>
        </div>
    );
}

export default function Page() {
    return <InternalShell><ERapotInner /></InternalShell>;
}