"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Plus, Pencil, KeyRound, Loader2, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, apiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { InternalShell } from "@/components/internal/InternalShell";

type User = { id: number; name: string; email: string; role: string; is_active: boolean };
type Paginator = { data: User[]; current_page: number; last_page: number; total: number };

const roles = ["super_admin", "admin", "marketing", "trainer", "admin_keuangan"];
const roleLabel: Record<string, string> = { super_admin: "Super Admin", admin: "Admin", marketing: "Marketing", trainer: "Trainer", admin_keuangan: "Admin Keuangan" };

function AkunInner() {
    const qc = useQueryClient();
    const me = useAuth((s) => (s.actor?.kind === "user" ? s.actor : null));
    const [search, setSearch] = useState("");
    const [roleF, setRoleF] = useState("semua");
    const [page, setPage] = useState(1);
    const [userDialog, setUserDialog] = useState<{ open: boolean; editing: User | null }>({ open: false, editing: null });
    const [resetUser, setResetUser] = useState<User | null>(null);

    const list = useQuery({
        queryKey: ["akun", { search, roleF, page }],
        queryFn: async () => (await api.get("/akun", { params: { search: search || undefined, role: roleF === "semua" ? undefined : roleF, page } })).data.data as Paginator,
        placeholderData: keepPreviousData,
    });

    const toggle = useMutation({
        mutationFn: async (u: User) => (await api.patch(`/akun/${u.id}/status`, { is_active: !u.is_active })).data,
        onSuccess: () => qc.invalidateQueries({ queryKey: ["akun"] }),
        onError: (e) => alert(apiError(e, "Gagal mengubah status.")),
    });

    if (me && me.role !== "super_admin") {
        return <div className="grid h-64 place-items-center text-muted-foreground">Halaman ini khusus Super Admin.</div>;
    }

    const p = list.data;
    const rows = p?.data ?? [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Manajemen Akun</h1>
                    <p className="text-sm text-muted-foreground">Kelola akun staf internal & hak akses.</p>
                </div>
                <Button onClick={() => setUserDialog({ open: true, editing: null })}><Plus className="mr-2 h-4 w-4" /> Akun Baru</Button>
            </div>

            <Card className="overflow-hidden">
                <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input className="pl-9" placeholder="Cari nama/email…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                    </div>
                    <Select value={roleF} onValueChange={(v) => { setRoleF(v ?? "semua"); setPage(1); }}>
                        <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="semua">Semua role</SelectItem>
                            {roles.map((r) => <SelectItem key={r} value={r}>{roleLabel[r]}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Aktif</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {list.isLoading && Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-9 w-full" /></TableCell></TableRow>
                        ))}
                        {rows.map((u) => (
                            <TableRow key={u.id}>
                                <TableCell className="font-medium">{u.name}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                                <TableCell><Badge variant="secondary">{roleLabel[u.role] ?? u.role}</Badge></TableCell>
                                <TableCell><Switch checked={u.is_active} onCheckedChange={() => toggle.mutate(u)} disabled={u.id === me?.id} /></TableCell>
                                <TableCell className="text-right">
                                    <Button size="icon" variant="ghost" onClick={() => setUserDialog({ open: true, editing: u })}><Pencil className="h-4 w-4" /></Button>
                                    <Button size="icon" variant="ghost" onClick={() => setResetUser(u)}><KeyRound className="h-4 w-4" /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!list.isLoading && rows.length === 0 && (
                            <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Tidak ada akun.</TableCell></TableRow>
                        )}
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

            <UserDialog open={userDialog.open} editing={userDialog.editing} onOpenChange={(o) => setUserDialog((d) => ({ ...d, open: o }))}
                onSaved={() => { setUserDialog({ open: false, editing: null }); qc.invalidateQueries({ queryKey: ["akun"] }); }} />
            <ResetDialog user={resetUser} onClose={() => setResetUser(null)} />
        </div>
    );
}

function UserDialog({ open, editing, onOpenChange, onSaved }: { open: boolean; editing: User | null; onOpenChange: (o: boolean) => void; onSaved: () => void }) {
    const [form, setForm] = useState({ name: "", email: "", password: "", role: "admin" });
    const [err, setErr] = useState<Record<string, string[]> | string | null>(null);
    const [lastId, setLastId] = useState<number | null>(null);
    const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

    if (open && editing && editing.id !== lastId) { setLastId(editing.id); setForm({ name: editing.name, email: editing.email, password: "", role: editing.role }); }
    if (open && !editing && lastId !== null) { setLastId(null); setForm({ name: "", email: "", password: "", role: "admin" }); }

    const save = useMutation({
        mutationFn: async () => {
            if (editing) return (await api.put(`/akun/${editing.id}`, { name: form.name, email: form.email, role: form.role })).data;
            return (await api.post("/akun", { name: form.name, email: form.email, password: form.password, role: form.role })).data;
        },
        onSuccess: onSaved,
        onError: (e: any) => setErr(e?.response?.status === 422 ? (e.response.data.errors ?? null) : apiError(e)),
    });
    const fe = (k: string) => (typeof err === "object" && err && (err as any)[k] ? (err as any)[k][0] : null);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader><DialogTitle>{editing ? "Edit Akun" : "Akun Baru"}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                    <div><Label>Nama *</Label><Input className="mt-1" value={form.name} onChange={(e) => set("name", e.target.value)} />{fe("name") && <p className="mt-1 text-xs text-destructive">{fe("name")}</p>}</div>
                    <div><Label>Email *</Label><Input type="email" className="mt-1" value={form.email} onChange={(e) => set("email", e.target.value)} />{fe("email") && <p className="mt-1 text-xs text-destructive">{fe("email")}</p>}</div>
                    {!editing && <div><Label>Kata sandi *</Label><Input type="password" className="mt-1" value={form.password} onChange={(e) => set("password", e.target.value)} />{fe("password") && <p className="mt-1 text-xs text-destructive">{fe("password")}</p>}</div>}
                    <div>
                        <Label>Role *</Label>
                        <Select value={form.role} onValueChange={(v) => set("role", v ?? "admin")}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>{roles.map((r) => <SelectItem key={r} value={r}>{roleLabel[r]}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    {typeof err === "string" && <p className="text-sm text-destructive">{err}</p>}
                    <Button className="w-full" disabled={save.isPending} onClick={() => { setErr(null); save.mutate(); }}>
                        {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ResetDialog({ user, onClose }: { user: User | null; onClose: () => void }) {
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
                    <Button className="w-full" disabled={password.length < 8 || reset.isPending} onClick={() => { setErr(null); reset.mutate(); }}>
                        {reset.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset Password"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function Page() {
    return (
        <InternalShell>
            <AkunInner />
        </InternalShell>
    );
}