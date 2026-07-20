"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Search, Plus, KeyRound, Power, Pencil, Loader2, Building2, Mail, Phone as PhoneIcon } from "lucide-react";
import { api, apiError, type ApiEnvelope } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConfirm } from "@/components/ui/confirm";

type SA = { id: number; name: string; email: string | null; phone: string | null; is_active: boolean; school: { id: number; name: string } | null; created_at: string };
type Paginator = { data: SA[]; current_page: number; last_page: number; total: number };
type MouSchool = { id: number; name: string };

export function AdminSekolahTab() {
    const qc = useQueryClient();
    const confirm = useConfirm();
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("semua");
    const [page, setPage] = useState(1);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<SA | null>(null);
    const [resetFor, setResetFor] = useState<SA | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ["akun-sekolah", search, status, page],
        placeholderData: keepPreviousData,
        queryFn: async () => (await api.get<ApiEnvelope<Paginator>>("/akun/sekolah", {
            params: { search: search || undefined, status: status === "semua" ? undefined : status, page },
        })).data.data,
    });
    const rows = data?.data ?? [];

    const toggle = useMutation({
        mutationFn: async (id: number) => api.post(`/akun/sekolah/${id}/toggle-active`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["akun-sekolah"] }),
        onError: (e) => alert(apiError(e, "Gagal mengubah status.")),
    });

    const onToggle = async (r: SA) => {
        const off = r.is_active;
        if (await confirm({
            title: off ? "Nonaktifkan akun?" : "Aktifkan akun?",
            description: off ? `${r.name} tidak akan bisa login dan sesinya dicabut.` : `${r.name} dapat login kembali.`,
            confirmText: off ? "Nonaktifkan" : "Aktifkan",
            variant: off ? "destructive" : "default",
        })) toggle.mutate(r.id);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                    <div className="relative sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input className="pl-9" placeholder="Cari nama / email / HP…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                    </div>
                    <Select value={status} onValueChange={(v) => { setStatus(v ?? "semua"); setPage(1); }}>
                        <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="semua">Semua status</SelectItem>
                            <SelectItem value="aktif">Aktif</SelectItem>
                            <SelectItem value="nonaktif">Nonaktif</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="mr-1.5 h-4 w-4" /> Buat Akun</Button>
            </div>

            <Card className="overflow-hidden border-2">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader><TableRow><TableHead>Nama</TableHead><TableHead>Sekolah</TableHead><TableHead>Kontak</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {isLoading && Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-9 w-full" /></TableCell></TableRow>)}
                            {!isLoading && rows.length === 0 && <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Belum ada akun admin sekolah.</TableCell></TableRow>}
                            {rows.map((r) => (
                                <TableRow key={r.id}>
                                    <TableCell className="font-medium">{r.name}</TableCell>
                                    <TableCell><span className="inline-flex items-center gap-1.5 text-sm"><Building2 className="h-3.5 w-3.5 text-muted-foreground" /> {r.school?.name ?? "—"}</span></TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {r.email && <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {r.email}</div>}
                                        {r.phone && <div className="flex items-center gap-1.5"><PhoneIcon className="h-3.5 w-3.5" /> {r.phone}</div>}
                                    </TableCell>
                                    <TableCell><Badge variant="outline" className={r.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}>{r.is_active ? "Aktif" : "Nonaktif"}</Badge></TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1.5">
                                            <Button size="icon" variant="outline" title="Edit" onClick={() => { setEditing(r); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                                            <Button size="icon" variant="outline" title="Reset password" onClick={() => setResetFor(r)}><KeyRound className="h-4 w-4" /></Button>
                                            <Button size="icon" variant="outline" title={r.is_active ? "Nonaktifkan" : "Aktifkan"} className={r.is_active ? "text-red-600" : "text-emerald-600"} onClick={() => onToggle(r)}><Power className="h-4 w-4" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                {data && data.last_page > 1 && (
                    <div className="flex items-center justify-between border-t p-4 text-sm text-muted-foreground">
                        <span>Total {data.total} · Hal. {data.current_page}/{data.last_page}</span>
                        <div className="flex gap-1"><Button size="icon" variant="outline" disabled={page <= 1} onClick={() => setPage((x) => x - 1)}>‹</Button><Button size="icon" variant="outline" disabled={page >= data.last_page} onClick={() => setPage((x) => x + 1)}>›</Button></div>
                    </div>
                )}
            </Card>

            {formOpen && <AdminForm editing={editing} onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); qc.invalidateQueries({ queryKey: ["akun-sekolah"] }); }} />}
            {resetFor && <ResetDialog admin={resetFor} onClose={() => setResetFor(null)} />}
        </div>
    );
}

function AdminForm({ editing, onClose, onSaved }: { editing: SA | null; onClose: () => void; onSaved: () => void }) {
    const isEdit = !!editing;
    const [schoolId, setSchoolId] = useState<string>(editing?.school?.id ? String(editing.school.id) : "");
    const [name, setName] = useState(editing?.name ?? "");
    const [email, setEmail] = useState(editing?.email ?? "");
    const [phone, setPhone] = useState(editing?.phone ?? "");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");

    const { data: schools } = useQuery({
        queryKey: ["mou-schools"],
        queryFn: async () => {
            const rows = (await api.get<ApiEnvelope<any[]>>("/sekolah/mou")).data.data;
            return rows.map((s: any) => ({ id: s.id, name: s.name })) as MouSchool[];
        },
    });

    const save = useMutation({
        mutationFn: async () => {
            const body: Record<string, unknown> = { school_id: Number(schoolId), name, email, phone };
            if (!isEdit) body.password = password;
            return isEdit ? api.put(`/akun/sekolah/${editing!.id}`, body) : api.post("/akun/sekolah", body);
        },
        onSuccess: onSaved,
        onError: (e) => setErr(apiError(e, "Gagal menyimpan.")),
    });

    const valid = schoolId && name.trim() && email.trim() && phone.trim() && (isEdit || password.length >= 8);

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Akun Admin Sekolah" : "Buat Akun Admin Sekolah"}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-1">
                    {err && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

                    <div className="space-y-1.5">
                        <Label>Sekolah <span className="text-muted-foreground">(harus MoU)</span> <span className="text-red-500">*</span></Label>
                        <Select value={schoolId} onValueChange={(v) => setSchoolId(v ?? "")}>
                            <SelectTrigger className="w-full"><SelectValue placeholder="Pilih sekolah…" /></SelectTrigger>
                            <SelectContent>
                                {(schools ?? []).map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                {schools && schools.length === 0 && <div className="px-3 py-2 text-sm text-muted-foreground">Belum ada sekolah MoU.</div>}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Nama PIC <span className="text-red-500">*</span></Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama penanggung jawab" />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label>Email <span className="text-red-500">*</span></Label>
                            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@sekolah.sch.id" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>No. HP <span className="text-red-500">*</span></Label>
                            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" />
                        </div>
                    </div>

                    {!isEdit && (
                        <div className="space-y-1.5">
                            <Label>Password awal <span className="text-red-500">*</span></Label>
                            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 karakter" />
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground">Admin sekolah bisa login memakai email atau No. HP; keduanya wajib diisi saat pembuatan akun.</p>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose}>Batal</Button>
                    <Button disabled={save.isPending || !valid} onClick={() => { setErr(""); save.mutate(); }}>
                        {save.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null} Simpan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ResetDialog({ admin, onClose }: { admin: SA; onClose: () => void }) {
    const [pw, setPw] = useState("");
    const [done, setDone] = useState(false);
    const [err, setErr] = useState("");
    const reset = useMutation({
        mutationFn: async () => api.post(`/akun/sekolah/${admin.id}/reset-password`, { password: pw }),
        onSuccess: () => setDone(true),
        onError: (e) => setErr(apiError(e, "Gagal reset.")),
    });

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-sm">
                <DialogHeader><DialogTitle>Reset Password — {admin.name}</DialogTitle></DialogHeader>
                {done ? (
                    <p className="text-sm text-emerald-700">Password berhasil direset. Beritahu admin sekolah untuk login dengan password baru.</p>
                ) : (
                    <div className="space-y-3">
                        {err && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
                        <div className="space-y-1.5"><Label>Password baru</Label><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Min. 8 karakter" /></div>
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>{done ? "Tutup" : "Batal"}</Button>
                    {!done && <Button disabled={reset.isPending || pw.length < 8} onClick={() => { setErr(""); reset.mutate(); }}>{reset.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null} Reset</Button>}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}