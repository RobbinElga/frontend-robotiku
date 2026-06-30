"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, Search } from "lucide-react";
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
import { InternalShell } from "@/components/internal/InternalShell";

const rupiah = (n: number | string) => "Rp" + Math.round(Number(n)).toLocaleString("id-ID");

type Promo = {
    id: number; code: string; type: "nominal" | "percentage"; value: string;
    quota: number; used_count: number; valid_from: string | null; valid_until: string | null; is_active: boolean;
};
type Paginator = { data: Promo[]; current_page: number; last_page: number; total: number };

const emptyForm = { code: "", type: "percentage", value: "", quota: "0", valid_from: "", valid_until: "", is_active: true };

function PromoInner() {
    const qc = useQueryClient();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [dialog, setDialog] = useState<{ open: boolean; editing: Promo | null }>({ open: false, editing: null });

    const list = useQuery({
        queryKey: ["promo", { search, page }],
        queryFn: async () => (await api.get("/promo", { params: { search: search || undefined, page } })).data.data as Paginator,
        placeholderData: keepPreviousData,
    });

    const toggle = useMutation({
        mutationFn: async (p: Promo) => (await api.put(`/promo/${p.id}`, { is_active: !p.is_active })).data,
        onSuccess: () => qc.invalidateQueries({ queryKey: ["promo"] }),
    });
    const remove = useMutation({
        mutationFn: async (id: number) => (await api.delete(`/promo/${id}`)).data,
        onSuccess: () => qc.invalidateQueries({ queryKey: ["promo"] }),
        onError: (e) => alert(apiError(e, "Gagal menghapus.")),
    });

    const p = list.data;
    const rows = p?.data ?? [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Kode Promo</h1>
                    <p className="text-sm text-muted-foreground">Kelola diskon biaya pendaftaran (jalur mandiri).</p>
                </div>
                <Button onClick={() => setDialog({ open: true, editing: null })}><Plus className="mr-2 h-4 w-4" /> Tambah Promo</Button>
            </div>

            <Card className="overflow-hidden">
                <div className="border-b p-4">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input className="pl-9" placeholder="Cari kode…" value={search} onChange={(e) => { setSearch(e.target.value.toUpperCase()); setPage(1); }} />
                    </div>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Kode</TableHead>
                            <TableHead>Tipe</TableHead>
                            <TableHead>Nilai</TableHead>
                            <TableHead>Kuota</TableHead>
                            <TableHead>Berlaku</TableHead>
                            <TableHead>Aktif</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {list.isLoading && Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-9 w-full" /></TableCell></TableRow>
                        ))}
                        {rows.map((promo) => (
                            <TableRow key={promo.id}>
                                <TableCell className="font-mono font-medium">{promo.code}</TableCell>
                                <TableCell><Badge variant="secondary" className="capitalize">{promo.type}</Badge></TableCell>
                                <TableCell>{promo.type === "percentage" ? `${Number(promo.value)}%` : rupiah(promo.value)}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{promo.used_count}/{promo.quota === 0 ? "∞" : promo.quota}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                    {promo.valid_from?.slice(0, 10) ?? "—"} s/d {promo.valid_until?.slice(0, 10) ?? "—"}
                                </TableCell>
                                <TableCell><Switch checked={promo.is_active} onCheckedChange={() => toggle.mutate(promo)} /></TableCell>
                                <TableCell className="text-right">
                                    <Button size="icon" variant="ghost" onClick={() => setDialog({ open: true, editing: promo })}><Pencil className="h-4 w-4" /></Button>
                                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => confirm(`Hapus ${promo.code}?`) && remove.mutate(promo.id)}><Trash2 className="h-4 w-4" /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!list.isLoading && rows.length === 0 && (
                            <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Belum ada promo.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            <PromoDialog
                open={dialog.open}
                editing={dialog.editing}
                onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))}
                onSaved={() => { setDialog({ open: false, editing: null }); qc.invalidateQueries({ queryKey: ["promo"] }); }}
            />
        </div>
    );
}

function PromoDialog({ open, editing, onOpenChange, onSaved }: { open: boolean; editing: Promo | null; onOpenChange: (o: boolean) => void; onSaved: () => void }) {
    const [form, setForm] = useState(emptyForm);
    const [err, setErr] = useState<Record<string, string[]> | string | null>(null);
    const set = (k: keyof typeof form, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

    // sinkron saat dialog dibuka
    const [lastId, setLastId] = useState<number | null>(null);
    if (open && editing && editing.id !== lastId) {
        setLastId(editing.id);
        setForm({
            code: editing.code, type: editing.type, value: String(editing.value),
            quota: String(editing.quota), valid_from: editing.valid_from?.slice(0, 10) ?? "",
            valid_until: editing.valid_until?.slice(0, 10) ?? "", is_active: editing.is_active,
        });
    }
    if (open && !editing && lastId !== null) { setLastId(null); setForm(emptyForm); }

    const save = useMutation({
        mutationFn: async () => {
            const payload = {
                code: form.code, type: form.type, value: Number(form.value), quota: Number(form.quota || 0),
                valid_from: form.valid_from || null, valid_until: form.valid_until || null, is_active: form.is_active,
            };
            return editing ? (await api.put(`/promo/${editing.id}`, payload)).data : (await api.post("/promo", payload)).data;
        },
        onSuccess: onSaved,
        onError: (e: any) => setErr(e?.response?.status === 422 ? (e.response.data.errors ?? null) : apiError(e)),
    });

    const fieldErr = (k: string) => (typeof err === "object" && err && (err as any)[k] ? (err as any)[k][0] : null);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader><DialogTitle>{editing ? "Edit Promo" : "Promo Baru"}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label>Kode *</Label>
                        <Input className="mt-1 font-mono" value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} />
                        {fieldErr("code") && <p className="mt-1 text-xs text-destructive">{fieldErr("code")}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label>Tipe *</Label>
                            <Select value={form.type} onValueChange={(v) => set("type", v ?? "percentage")}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">Persentase (%)</SelectItem>
                                    <SelectItem value="nominal">Nominal (Rp)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Nilai *</Label>
                            <Input type="number" className="mt-1" value={form.value} onChange={(e) => set("value", e.target.value)} />
                            {fieldErr("value") && <p className="mt-1 text-xs text-destructive">{fieldErr("value")}</p>}
                        </div>
                    </div>
                    <div>
                        <Label>Kuota (0 = tak terbatas)</Label>
                        <Input type="number" className="mt-1" value={form.quota} onChange={(e) => set("quota", e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><Label>Berlaku dari</Label><Input type="date" className="mt-1" value={form.valid_from} onChange={(e) => set("valid_from", e.target.value)} /></div>
                        <div><Label>Sampai</Label><Input type="date" className="mt-1" value={form.valid_until} onChange={(e) => set("valid_until", e.target.value)} /></div>
                    </div>
                    <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} /> Aktif</label>
                    {typeof err === "string" && <p className="text-sm text-destructive">{err}</p>}
                    <Button className="w-full" disabled={!form.code || !form.value || save.isPending} onClick={() => { setErr(null); save.mutate(); }}>
                        {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function Page() {
    return (
        <InternalShell>
            <PromoInner />
        </InternalShell>
    );
}