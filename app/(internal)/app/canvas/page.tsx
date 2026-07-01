"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Plus, Eye, Loader2, Search, Save, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, apiError, type ApiEnvelope } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { InternalShell } from "@/components/internal/InternalShell";
import { cn } from "@/lib/utils";

const statuses = ["prospek", "dalam_proses", "sudah_mou", "tidak_lanjut"];
const statusLabel: Record<string, string> = { prospek: "Prospek", dalam_proses: "Dalam Proses", sudah_mou: "Sudah MOU", tidak_lanjut: "Tidak Lanjut" };
const statusCls: Record<string, string> = {
    prospek: "bg-sky-50 text-sky-700 border-sky-200",
    dalam_proses: "bg-amber-50 text-amber-700 border-amber-200",
    sudah_mou: "bg-emerald-50 text-emerald-700 border-emerald-200",
    tidak_lanjut: "bg-rose-50 text-rose-700 border-rose-200",
};

type School = { id: number; name: string; pic_name: string | null; contact: string | null; pipeline_status: string; is_mou: boolean };
type Kpi = { total: number; prospek: number; dalam_proses: number; sudah_mou: number; tidak_lanjut: number };
type ListResp = { kpi: Kpi; schools: { data: School[]; current_page: number; last_page: number; total: number } };

function CanvasInner() {
    const qc = useQueryClient();
    const [search, setSearch] = useState("");
    const [statusF, setStatusF] = useState("semua");
    const [page, setPage] = useState(1);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [addOpen, setAddOpen] = useState(false);

    const list = useQuery({
        queryKey: ["canvas", { search, statusF, page }],
        queryFn: async () => (await api.get<ApiEnvelope<ListResp>>("/canvas/schools", {
            params: { search: search || undefined, status: statusF === "semua" ? undefined : statusF, page },
        })).data.data,
        placeholderData: keepPreviousData,
    });

    const kpi = list.data?.kpi;
    const p = list.data?.schools;
    const rows = p?.data ?? [];
    const refresh = () => qc.invalidateQueries({ queryKey: ["canvas"] });

    const kpiCards = [
        { l: "Total", v: kpi?.total }, { l: "Prospek", v: kpi?.prospek }, { l: "Dalam Proses", v: kpi?.dalam_proses },
        { l: "Sudah MOU", v: kpi?.sudah_mou }, { l: "Tidak Lanjut", v: kpi?.tidak_lanjut },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Canvas — CRM Sekolah</h1>
                    <p className="text-sm text-muted-foreground">Pipeline sekolah mitra. Status “Sudah MOU” membuka pendaftaran via instansi.</p>
                </div>
                <Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Tambah Sekolah</Button>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {kpiCards.map((c) => (
                    <Card key={c.l}><CardHeader className="pb-1"><CardTitle className="text-xs font-medium text-muted-foreground">{c.l}</CardTitle></CardHeader>
                        <CardContent>{list.isLoading ? <Skeleton className="h-7 w-10" /> : <div className="text-xl font-semibold">{c.v ?? 0}</div>}</CardContent></Card>
                ))}
            </div>

            <Card className="overflow-hidden">
                <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input className="pl-9" placeholder="Cari nama sekolah…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                    </div>
                    <Select value={statusF} onValueChange={(v) => { setStatusF(v ?? "semua"); setPage(1); }}>
                        <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="semua">Semua status</SelectItem>
                            {statuses.map((s) => <SelectItem key={s} value={s}>{statusLabel[s]}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow><TableHead>Sekolah</TableHead><TableHead>PIC</TableHead><TableHead>Kontak</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                        {list.isLoading && Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-9 w-full" /></TableCell></TableRow>
                        ))}
                        {rows.map((s) => (
                            <TableRow key={s.id} className="cursor-pointer" onClick={() => setSelectedId(s.id)}>
                                <TableCell className="font-medium">
                                    {s.name} {s.is_mou && <Badge variant="outline" className="ml-1 border-emerald-200 bg-emerald-50 text-emerald-700">MOU</Badge>}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">{s.pic_name ?? "—"}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{s.contact ?? "—"}</TableCell>
                                <TableCell><Badge variant="outline" className={cn(statusCls[s.pipeline_status])}>{statusLabel[s.pipeline_status]}</Badge></TableCell>
                                <TableCell className="text-right"><Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedId(s.id); }}><Eye className="h-4 w-4" /></Button></TableCell>
                            </TableRow>
                        ))}
                        {!list.isLoading && rows.length === 0 && <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Belum ada sekolah.</TableCell></TableRow>}
                    </TableBody>
                </Table>
                {p && (
                    <div className="flex items-center justify-between border-t p-4 text-sm text-muted-foreground">
                        <span>Total {p.total} · Halaman {p.current_page}/{p.last_page}</span>
                        <div className="flex gap-1">
                            <Button size="icon" variant="outline" disabled={p.current_page <= 1} onClick={() => setPage((x) => x - 1)}>‹</Button>
                            <Button size="icon" variant="outline" disabled={p.current_page >= p.last_page} onClick={() => setPage((x) => x + 1)}>›</Button>
                        </div>
                    </div>
                )}
            </Card>

            <AddSchool open={addOpen} onOpenChange={setAddOpen} onSaved={() => { setAddOpen(false); refresh(); }} />

            <Sheet open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
                <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
                    {selectedId && <Detail id={selectedId} onChanged={refresh} />}
                </SheetContent>
            </Sheet>
        </div>
    );
}

function AddSchool({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; onSaved: () => void }) {
    const [form, setForm] = useState({ name: "", address: "", pic_name: "", contact: "", bank_account: "", pipeline_status: "prospek" });
    const [err, setErr] = useState<string | null>(null);
    const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
    const create = useMutation({
        mutationFn: async () => (await api.post("/canvas/schools", form)).data,
        onSuccess: onSaved,
        onError: (e) => setErr(apiError(e, "Gagal menyimpan.")),
    });
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader><DialogTitle>Sekolah Baru</DialogTitle></DialogHeader>
                <div className="space-y-3">
                    <div><Label>Nama sekolah *</Label><Input className="mt-1" value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
                    <div><Label>Alamat</Label><Input className="mt-1" value={form.address} onChange={(e) => set("address", e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><Label>PIC</Label><Input className="mt-1" value={form.pic_name} onChange={(e) => set("pic_name", e.target.value)} /></div>
                        <div><Label>Kontak</Label><Input className="mt-1" value={form.contact} onChange={(e) => set("contact", e.target.value)} /></div>
                    </div>
                    <div><Label>No. Rekening</Label><Input className="mt-1" value={form.bank_account} onChange={(e) => set("bank_account", e.target.value)} /></div>
                    <div>
                        <Label>Status</Label>
                        <Select value={form.pipeline_status} onValueChange={(v) => set("pipeline_status", v ?? "prospek")}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{statusLabel[s]}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    {err && <p className="text-sm text-destructive">{err}</p>}
                    <Button className="w-full" disabled={!form.name || create.isPending} onClick={() => { setErr(null); create.mutate(); }}>
                        {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function Detail({ id, onChanged }: { id: number; onChanged: () => void }) {
    const qc = useQueryClient();
    const role = useAuth((s) => (s.actor?.kind === "user" ? s.actor.role : ""));
    const canEditData = role === "admin" || role === "super_admin";

    const q = useQuery({ queryKey: ["canvas-detail", id], queryFn: async () => (await api.get(`/canvas/schools/${id}`)).data.data });
    const school = q.data;

    const [status, setStatus] = useState(""); const [statusNote, setStatusNote] = useState("");
    const [note, setNote] = useState("");
    if (school && status === "") setStatus(school.pipeline_status);

    const invalidate = () => { q.refetch(); onChanged(); };

    const changeStatus = useMutation({
        mutationFn: async () => (await api.patch(`/canvas/schools/${id}/status`, { pipeline_status: status, note: statusNote || undefined })).data,
        onSuccess: () => { setStatusNote(""); invalidate(); },
    });
    const addNote = useMutation({
        mutationFn: async () => (await api.post(`/canvas/schools/${id}/notes`, { note })).data,
        onSuccess: () => { setNote(""); invalidate(); },
    });
    const saveData = useMutation({
        mutationFn: async (data: any) => (await api.put(`/canvas/schools/${id}`, data)).data,
        onSuccess: invalidate,
    });

    if (q.isLoading || !school) return <div className="grid h-full place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

    return (
        <div className="space-y-7 py-2">
            <div>
                <h3 className="text-lg font-semibold">{school.name}</h3>
                <Badge variant="outline" className={cn("mt-1", statusCls[school.pipeline_status])}>{statusLabel[school.pipeline_status]}</Badge>
                {school.is_mou && <Badge variant="outline" className="ml-2 border-emerald-200 bg-emerald-50 text-emerald-700"><ShieldCheck className="mr-1 h-3.5 w-3.5" /> MOU aktif</Badge>}
            </div>

            {/* data sekolah */}
            <div className="space-y-3 rounded-xl border p-4">
                <p className="text-sm font-semibold">Data Sekolah</p>
                {canEditData ? (
                    <EditData school={school} onSave={(d) => saveData.mutate(d)} saving={saveData.isPending} />
                ) : (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <Info l="Alamat" v={school.address} /><Info l="PIC" v={school.pic_name} />
                        <Info l="Kontak" v={school.contact} /><Info l="Rekening" v={school.bank_account} />
                    </div>
                )}
            </div>

            {/* status pipeline */}
            <div className="space-y-3 rounded-xl border p-4">
                <p className="text-sm font-semibold">Ubah Status Pipeline</p>
                <Select value={status} onValueChange={(v) => setStatus(v ?? school.pipeline_status)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{statusLabel[s]}</SelectItem>)}</SelectContent>
                </Select>
                {status === "sudah_mou" && <p className="text-xs text-emerald-700">Sekolah ini akan bisa mendaftarkan murid via instansi.</p>}
                <Textarea rows={2} placeholder="Catatan perubahan (opsional)" value={statusNote} onChange={(e) => setStatusNote(e.target.value)} />
                <Button size="sm" disabled={status === school.pipeline_status || changeStatus.isPending} onClick={() => changeStatus.mutate()}>
                    {changeStatus.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Status"}
                </Button>
            </div>

            {/* catatan */}
            <div className="space-y-3 rounded-xl border p-4">
                <p className="text-sm font-semibold">Catatan Audit</p>
                <div className="flex gap-2">
                    <Input placeholder="Tambah catatan…" value={note} onChange={(e) => setNote(e.target.value)} />
                    <Button size="sm" disabled={!note || addNote.isPending} onClick={() => addNote.mutate()}>Tambah</Button>
                </div>
                <div className="space-y-2">
                    {school.notes?.map((n: any) => (
                        <div key={n.id} className="rounded-md border bg-muted/30 p-2 text-sm">
                            <p>{n.note}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{n.creator?.name ?? "Staf"} • {n.created_at?.slice(0, 16).replace("T", " ")}</p>
                        </div>
                    ))}
                    {(!school.notes || school.notes.length === 0) && <p className="text-sm text-muted-foreground">Belum ada catatan.</p>}
                </div>
            </div>

            {/* log status (immutable) */}
            <div>
                <p className="mb-4 text-sm font-semibold">Riwayat Status (Immutable)</p>
                <div className="relative space-y-5 pl-4 before:absolute before:inset-y-0 before:left-[5px] before:w-px before:bg-border">
                    {school.status_logs?.map?.((log: any) => (
                        <div key={log.id} className="relative">
                            <span className={cn("absolute -left-[14px] top-1 h-3 w-3 rounded-full border-2 border-background", statusCls[log.new_status]?.includes("emerald") ? "bg-emerald-500" : "bg-primary")} />
                            <p className="text-sm font-medium">{log.old_status ? `${statusLabel[log.old_status]} → ${statusLabel[log.new_status]}` : `Dibuat (${statusLabel[log.new_status]})`}</p>
                            <p className="text-xs text-muted-foreground">{log.created_at?.slice(0, 16).replace("T", " ")}</p>
                            {log.note && <p className="mt-1 inline-block rounded bg-muted/40 p-2 text-sm">{log.note}</p>}
                        </div>
                    ))}
                    {(!school.status_logs || school.status_logs.length === 0) && <p className="text-sm text-muted-foreground">Belum ada perubahan.</p>}
                </div>
            </div>
        </div>
    );
}

function Info({ l, v }: { l: string; v: string | null }) {
    return <div><p className="text-xs uppercase tracking-wide text-muted-foreground">{l}</p><p className="mt-0.5 font-medium">{v ?? "—"}</p></div>;
}

function EditData({ school, onSave, saving }: { school: any; onSave: (d: any) => void; saving: boolean }) {
    const [d, setD] = useState({ name: school.name, address: school.address ?? "", pic_name: school.pic_name ?? "", contact: school.contact ?? "", bank_account: school.bank_account ?? "" });
    const set = (k: string, v: string) => setD((s) => ({ ...s, [k]: v }));
    return (
        <div className="space-y-2">
            <Input value={d.name} onChange={(e) => set("name", e.target.value)} placeholder="Nama" />
            <Input value={d.address} onChange={(e) => set("address", e.target.value)} placeholder="Alamat" />
            <div className="grid grid-cols-2 gap-2">
                <Input value={d.pic_name} onChange={(e) => set("pic_name", e.target.value)} placeholder="PIC" />
                <Input value={d.contact} onChange={(e) => set("contact", e.target.value)} placeholder="Kontak" />
            </div>
            <Input value={d.bank_account} onChange={(e) => set("bank_account", e.target.value)} placeholder="No. Rekening" />
            <Button size="sm" disabled={saving} onClick={() => onSave(d)}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> Simpan data</>}</Button>
        </div>
    );
}

export default function Page() {
    return <InternalShell><CanvasInner /></InternalShell>;
}