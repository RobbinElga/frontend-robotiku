"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Plus, Pencil, KeyRound, Eye, Search, Loader2, ShieldCheck, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, apiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useConfirm } from "@/components/ui/confirm";
import { InternalShell } from "@/components/internal/InternalShell";
import { PageHeader } from "@/components/ui/page-header";
import { DrawerHeader } from "@/components/ui/drawer-header";

type User = { id: number; name: string; email: string; role: string; is_active: boolean };
const roles = ["super_admin", "admin", "marketing", "trainer", "admin_keuangan"];
const roleLabel: Record<string, string> = { super_admin: "Super Admin", admin: "Admin", marketing: "Marketing", trainer: "Trainer", admin_keuangan: "Admin Keuangan" };
const roleCls: Record<string, string> = {
    super_admin: "bg-violet-50 text-violet-700 border-violet-200",
    admin: "bg-sky-50 text-sky-700 border-sky-200",
    marketing: "bg-amber-50 text-amber-700 border-amber-200",
    trainer: "bg-emerald-50 text-emerald-700 border-emerald-200",
    admin_keuangan: "bg-rose-50 text-rose-700 border-rose-200",
};

function AkunInner() {
    const qc = useQueryClient();
    const confirm = useConfirm();
    const me = useAuth((s) => (s.actor?.kind === "user" ? s.actor : null));
    const [search, setSearch] = useState("");
    const [roleF, setRoleF] = useState("semua");
    const [page, setPage] = useState(1);
    const [detail, setDetail] = useState<User | null>(null);
    const [dialog, setDialog] = useState<{ open: boolean; editing: User | null }>({ open: false, editing: null });
    const [resetUser, setResetUser] = useState<User | null>(null);

    const list = useQuery({
        queryKey: ["akun", { search, roleF, page }],
        queryFn: async () => (await api.get("/akun", { params: { search: search || undefined, role: roleF === "semua" ? undefined : roleF, page } })).data.data as { data: User[]; current_page: number; last_page: number; total: number },
        placeholderData: keepPreviousData,
    });
    const toggle = useMutation({
        mutationFn: async (u: User) => (await api.patch(`/akun/${u.id}/status`, { is_active: !u.is_active })).data,
        onSuccess: () => qc.invalidateQueries({ queryKey: ["akun"] }),
        onError: (e) => alert(apiError(e, "Gagal mengubah status.")),
    });
    const doToggle = async (u: User) => {
        if (u.is_active && !(await confirm({ title: `Nonaktifkan akun ${u.name}?`, variant: "destructive", confirmText: "Nonaktifkan" }))) return;
        toggle.mutate(u);
    };

    if (me && me.role !== "super_admin") return <div className="grid h-64 place-items-center text-muted-foreground">Halaman ini khusus Super Admin.</div>;

    const p = list.data;
    const rows = p?.data ?? [];

    return (
        <div className="space-y-6">
            <PageHeader title="Manajemen Akun" subtitle="Kelola akun staf internal & hak akses."
                action={<Button onClick={() => setDialog({ open: true, editing: null })}><Plus className="mr-2 h-4 w-4" /> Akun Baru</Button>} />

            <Card className="overflow-hidden">
                <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input className="pl-9" placeholder="Cari nama/email…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                    </div>
                    <Select value={roleF} onValueChange={(v) => { setRoleF(v ?? "semua"); setPage(1); }}>
                        <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="semua">Semua role</SelectItem>{roles.map((r) => <SelectItem key={r} value={r}>{roleLabel[r]}</SelectItem>)}</SelectContent>
                    </Select>
                </div>

                <Table>
                    <TableHeader><TableRow><TableHead>Nama</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Aktif</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {list.isLoading && Array.from({ length: 5 }).map((_, i) => (<TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-9 w-full" /></TableCell></TableRow>))}
                        {rows.map((u) => (
                            <TableRow key={u.id} className="cursor-pointer" onClick={() => setDetail(u)}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9"><AvatarFallback>{u.name[0]}</AvatarFallback></Avatar>
                                        <span className="font-medium">{u.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                                <TableCell><Badge variant="outline" className={roleCls[u.role]}>{roleLabel[u.role] ?? u.role}</Badge></TableCell>
                                <TableCell onClick={(e) => e.stopPropagation()}><Switch checked={u.is_active} onCheckedChange={() => doToggle(u)} disabled={u.id === me?.id} /></TableCell>
                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                    <Button size="icon" variant="ghost" title="Detail" onClick={() => setDetail(u)}><Eye className="h-4 w-4" /></Button>
                                    <Button size="icon" variant="ghost" title="Edit" onClick={() => setDialog({ open: true, editing: u })}><Pencil className="h-4 w-4" /></Button>
                                    <Button size="icon" variant="ghost" title="Reset password" onClick={() => setResetUser(u)}><KeyRound className="h-4 w-4" /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!list.isLoading && rows.length === 0 && <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Tidak ada akun.</TableCell></TableRow>}
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

            {/* DETAIL drawer (menarik) */}
            <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
                <SheetContent className="w-full overflow-y-auto p-6 sm:max-w-md">
                    {detail && (
                        <div>
                            <DrawerHeader title={detail.name} subtitle={detail.email}
                                badge={<Badge variant="outline" className={detail.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"}>{detail.is_active ? "Aktif" : "Nonaktif"}</Badge>} />
                            <div className="mb-4 flex items-center gap-4 rounded-xl border bg-primary/5 p-4">
                                <Avatar className="h-14 w-14"><AvatarFallback className="text-lg">{detail.name[0]}</AvatarFallback></Avatar>
                                <div>
                                    <Badge variant="outline" className={roleCls[detail.role]}><ShieldCheck className="mr-1 h-3.5 w-3.5" />{roleLabel[detail.role] ?? detail.role}</Badge>
                                    <p className="mt-1.5 flex items-center gap-1 text-sm text-muted-foreground"><Mail className="h-3.5 w-3.5" /> {detail.email}</p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Button onClick={() => { const u = detail; setDetail(null); setDialog({ open: true, editing: u }); }}><Pencil className="mr-2 h-4 w-4" /> Edit akun</Button>
                                <Button variant="outline" onClick={() => { const u = detail; setDetail(null); setResetUser(u); }}><KeyRound className="mr-2 h-4 w-4" /> Reset password</Button>
                                {detail.id !== me?.id && (
                                    <Button variant={detail.is_active ? "destructive" : "default"} onClick={() => { const u = detail; setDetail(null); doToggle(u); }}>
                                        {detail.is_active ? "Nonaktifkan akun" : "Aktifkan akun"}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            <UserDialog open={dialog.open} editing={dialog.editing} onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))} onSaved={() => { setDialog({ open: false, editing: null }); qc.invalidateQueries({ queryKey: ["akun"] }); }} />
            <ResetDialog user={resetUser} onClose={() => setResetUser(null)} />
        </div>
    );
}

function UserDialog({ open, editing, onOpenChange, onSaved }: { open: boolean; editing: User | null; onOpenChange: (o: boolean) => void; onSaved: () => void }) {
    const confirm = useConfirm();
    const [form, setForm] = useState({ name: "", email: "", password: "", role: "admin" });
    const [err, setErr] = useState<any>(null);
    const [lastId, setLastId] = useState<number | null>(null);
    const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
    if (open && editing && editing.id !== lastId) { setLastId(editing.id); setForm({ name: editing.name, email: editing.email, password: "", role: editing.role }); }
    if (open && !editing && lastId !== null) { setLastId(null); setForm({ name: "", email: "", password: "", role: "admin" }); }

    const save = useMutation({
        mutationFn: async () => editing ? (await api.put(`/akun/${editing.id}`, { name: form.name, email: form.email, role: form.role })).data : (await api.post("/akun", { name: form.name, email: form.email, password: form.password, role: form.role })).data,
        onSuccess: onSaved,
        onError: (e: any) => setErr(e?.response?.status === 422 ? (e.response.data.errors ?? null) : apiError(e)),
    });
    const fe = (k: string) => (err && typeof err === "object" && err[k] ? err[k][0] : null);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader><DialogTitle>{editing ? "Edit Akun" : "Akun Baru"}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                    <div><Label>Nama *</Label><Input className="mt-1" value={form.name} onChange={(e) => set("name", e.target.value)} />{fe("name") && <p className="mt-1 text-xs text-destructive">{fe("name")}</p>}</div>
                    <div><Label>Email *</Label><Input type="email" className="mt-1" value={form.email} onChange={(e) => set("email", e.target.value)} />{fe("email") && <p className="mt-1 text-xs text-destructive">{fe("email")}</p>}</div>
                    {!editing && <div><Label>Kata sandi *</Label><Input type="password" className="mt-1" value={form.password} onChange={(e) => set("password", e.target.value)} />{fe("password") && <p className="mt-1 text-xs text-destructive">{fe("password")}</p>}</div>}
                    <div><Label>Role *</Label>
                        <Select value={form.role} onValueChange={(v) => set("role", v ?? "admin")}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>{roles.map((r) => <SelectItem key={r} value={r}>{roleLabel[r]}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    {typeof err === "string" && <p className="text-sm text-destructive">{err}</p>}
                    <Button className="w-full" disabled={save.isPending} onClick={async () => { setErr(null); if (await confirm({ title: editing ? "Simpan perubahan akun?" : "Buat akun baru?" })) save.mutate(); }}>
                        {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ResetDialog({ user, onClose }: { user: User | null; onClose: () => void }) {
    const confirm = useConfirm();
    const [password, setPassword] = useState("");
    const [err, setErr] = useState<string | null>(null);
    const reset = useMutation({
        mutationFn: async () => (await api.patch(`/akun/${user!.id}/password`, { password })).data,
        onSuccess: () => { setPassword(""); onClose(); },
        onError: (e) => setErr(apiError(e, "Gagal reset.")),
    });
    return (
        <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <DialogHeader><DialogTitle>Reset Password — {user?.name}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                    <div><Label>Kata sandi baru *</Label><Input type="password" className="mt-1" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                    {err && <p className="text-sm text-destructive">{err}</p>}
                    <Button className="w-full" disabled={password.length < 8 || reset.isPending} onClick={async () => { setErr(null); if (await confirm({ title: "Reset password akun ini?" })) reset.mutate(); }}>
                        {reset.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset Password"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function Page() { return <InternalShell><AkunInner /></InternalShell>; }