"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Plus, Eye, Pencil, Trash2, Search, Loader2, Save, Ticket } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, apiError } from "@/lib/api";
import { useConfirm } from "@/components/ui/confirm";
import { InternalShell } from "@/components/internal/InternalShell";
import { PageHeader } from "@/components/ui/page-header";
import { DrawerHeader } from "@/components/ui/drawer-header";

const rupiah = (n: number | string) => "Rp" + Math.round(Number(n)).toLocaleString("id-ID");
type Promo = { id: number; code: string; type: "nominal" | "percentage"; value: string; quota: number; used_count?: number; valid_from: string | null; valid_until: string | null; is_active: boolean };

function PromoInner() {
    const qc = useQueryClient();
    const confirm = useConfirm();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [detail, setDetail] = useState<Promo | null>(null);
    const [dialog, setDialog] = useState<{ open: boolean; editing: Promo | null }>({ open: false, editing: null });

    const list = useQuery({
        queryKey: ["promo", { search, page }],
        queryFn: async () => (await api.get("/promo", { params: { search: search || undefined, page } })).data.data as { data: Promo[]; current_page: number; last_page: number; total: number },
        placeholderData: keepPreviousData,
    });
    const toggle = useMutation({ mutationFn: async (p: Promo) => (await api.put(`/promo/${p.id}`, { is_active: !p.is_active })).data, onSuccess: () => qc.invalidateQueries({ queryKey: ["promo"] }) });
    const remove = useMutation({ mutationFn: async (id: number) => (await api.delete(`/promo/${id}`)).data, onSuccess: () => qc.invalidateQueries({ queryKey: ["promo"] }), onError: (e) => alert(apiError(e, "Gagal menghapus.")) });

    const p = list.data;
    const rows = p?.data ?? [];

    return (
        <div className="space-y-6">
            <PageHeader title="Kode Promo" subtitle="Kelola diskon biaya pendaftaran." action={<Button onClick={() => setDialog({ open: true, editing: null })}><Plus className="mr-2 h-4 w-4" /> Tambah Promo</Button>} />

            <Card className="overflow-hidden">
                <div className="border-b p-4">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input className="pl-9" placeholder="Cari kode…" value={search} onChange={(e) => { setSearch(e.target.value.toUpperCase()); setPage(1); }} />
                    </div>
                </div>
                <Table>
                    <TableHeader><TableRow><TableHead>Kode</TableHead><TableHead>Tipe</TableHead><TableHead>Nilai</TableHead><TableHead>Kuota</TableHead><TableHead>Aktif</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {list.isLoading && Array.from({ length: 5 }).map((_, i) => (<TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-9 w-full" /></TableCell></TableRow>))}
                        {rows.map((promo) => (
                            <TableRow key={promo.id}>
                                <TableCell className="font-mono font-medium">{promo.code}</TableCell>
                                <TableCell><Badge variant="secondary" className="capitalize">{promo.type}</Badge></TableCell>
                                <TableCell>{promo.type === "percentage" ? `${Number(promo.value)}%` : rupiah(promo.value)}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{promo.used_count ?? 0}/{promo.quota === 0 ? "∞" : promo.quota}</TableCell>
                                <TableCell><Switch checked={promo.is_active} onCheckedChange={() => toggle.mutate(promo)} /></TableCell>
                                <TableCell className="text-right">
                                    <Button size="icon" variant="ghost" title="Detail" onClick={() => setDetail(promo)}><Eye className="h-4 w-4" /></Button>
                                    <Button size="icon" variant="ghost" title="Edit" onClick={() => setDialog({ open: true, editing: promo })}><Pencil className="h-4 w-4" /></Button>
                                    <Button size="icon" variant="ghost" className="text-destructive" title="Hapus" onClick={async () => { if (await confirm({ title: `Hapus promo ${promo.code}?`, variant: "destructive", confirmText: "Hapus" })) remove.mutate(promo.id); }}><Trash2 className="h-4 w-4" /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!list.isLoading && rows.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Belum ada promo.</TableCell></TableRow>}
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
                            <DrawerHeader title={detail.code} subtitle="Kode promo"
                                badge={<Badge variant="outline" className={detail.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"}>{detail.is_active ? "Aktif" : "Nonaktif"}</Badge>} />
                            {/* highlight nilai */}
                            <div className="mb-4 flex items-center gap-3 rounded-xl border bg-primary/5 p-4">
                                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary"><Ticket className="h-6 w-6" /></div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Potongan</p>
                                    <p className="text-2xl font-semibold">{detail.type === "percentage" ? `${Number(detail.value)}%` : rupiah(detail.value)}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { l: "Tipe", v: detail.type }, { l: "Kuota", v: detail.quota === 0 ? "Tak terbatas" : String(detail.quota) },
                                    { l: "Terpakai", v: String(detail.used_count ?? 0) }, { l: "Sisa", v: detail.quota === 0 ? "∞" : String(detail.quota - (detail.used_count ?? 0)) },
                                    { l: "Berlaku dari", v: detail.valid_from?.slice(0, 10) ?? "—" }, { l: "Sampai", v: detail.valid_until?.slice(0, 10) ?? "—" },
                                ].map((i) => (
                                    <div key={i.l} className="rounded-lg border bg-muted/30 p-3"><p className="text-xs uppercase tracking-wide text-muted-foreground">{i.l}</p><p className="mt-1 text-sm font-medium capitalize">{i.v}</p></div>
                                ))}
                            </div>
                            <Button className="mt-4 w-full" onClick={() => { const e = detail; setDetail(null); setDialog({ open: true, editing: e }); }}><Pencil className="mr-2 h-4 w-4" /> Edit Promo</Button>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            <PromoDialog open={dialog.open} editing={dialog.editing} onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))} onSaved={() => { setDialog({ open: false, editing: null }); qc.invalidateQueries({ queryKey: ["promo"] }); }} />
        </div>
    );
}

function PromoDialog({ open, editing, onOpenChange, onSaved }: { open: boolean; editing: Promo | null; onOpenChange: (o: boolean) => void; onSaved: () => void }) {
    const confirm = useConfirm();
    const empty = { code: "", type: "percentage", value: "", quota: "0", valid_from: "", valid_until: "", is_active: true };
    const [form, setForm] = useState<any>(empty);
    const [err, setErr] = useState<any>(null);
    const [lastId, setLastId] = useState<number | null>(null);
    const set = (k: string, v: unknown) => setForm((f: any) => ({ ...f, [k]: v }));

    if (open && editing && editing.id !== lastId) { setLastId(editing.id); setForm({ code: editing.code, type: editing.type, value: String(editing.value), quota: String(editing.quota), valid_from: editing.valid_from?.slice(0, 10) ?? "", valid_until: editing.valid_until?.slice(0, 10) ?? "", is_active: editing.is_active }); }
    if (open && !editing && lastId !== null) { setLastId(null); setForm(empty); }

    const save = useMutation({
        mutationFn: async () => {
            const payload = { code: form.code, type: form.type, value: Number(form.value), quota: Number(form.quota || 0), valid_from: form.valid_from || null, valid_until: form.valid_until || null, is_active: form.is_active };
            return editing ? (await api.put(`/promo/${editing.id}`, payload)).data : (await api.post("/promo", payload)).data;
        },
        onSuccess: onSaved,
        onError: (e: any) => setErr(e?.response?.status === 422 ? (e.response.data.errors ?? null) : apiError(e)),
    });
    const fe = (k: string) => (err && typeof err === "object" && err[k] ? err[k][0] : null);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader><DialogTitle>{editing ? "Edit Promo" : "Promo Baru"}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                    <div><Label>Kode *</Label><Input className="mt-1 font-mono" value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} />{fe("code") && <p className="mt-1 text-xs text-destructive">{fe("code")}</p>}</div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><Label>Tipe *</Label><Select value={form.type} onValueChange={(v) => set("type", v ?? "percentage")}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percentage">Persentase (%)</SelectItem><SelectItem value="nominal">Nominal (Rp)</SelectItem></SelectContent></Select></div>
                        <div><Label>Nilai *</Label><Input type="number" className="mt-1" value={form.value} onChange={(e) => set("value", e.target.value)} />{fe("value") && <p className="mt-1 text-xs text-destructive">{fe("value")}</p>}</div>
                    </div>
                    <div><Label>Kuota (0 = tak terbatas)</Label><Input type="number" className="mt-1" value={form.quota} onChange={(e) => set("quota", e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><Label>Berlaku dari</Label><Input type="date" className="mt-1" value={form.valid_from} onChange={(e) => set("valid_from", e.target.value)} /></div>
                        <div><Label>Sampai</Label><Input type="date" className="mt-1" value={form.valid_until} onChange={(e) => set("valid_until", e.target.value)} /></div>
                    </div>
                    <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} /> Aktif</label>
                    {typeof err === "string" && <p className="text-sm text-destructive">{err}</p>}
                    <Button className="w-full" disabled={!form.code || !form.value || save.isPending} onClick={async () => { setErr(null); if (await confirm({ title: editing ? "Simpan perubahan promo?" : "Buat promo baru?" })) save.mutate(); }}>
                        {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Simpan
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function Page() { return <InternalShell><PromoInner /></InternalShell>; }