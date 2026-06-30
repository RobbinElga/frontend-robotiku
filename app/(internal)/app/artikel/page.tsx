"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, apiError } from "@/lib/api";
import { InternalShell } from "@/components/internal/InternalShell";
import { cn } from "@/lib/utils";

type Article = { id: number; title: string; slug: string; cover_image: string | null; content: string | null; category: string | null; status: "draft" | "publish"; published_at: string | null };
type Paginator = { data: Article[]; current_page: number; last_page: number; total: number };

const coverUrl = (p?: string | null) => (p ? `${process.env.NEXT_PUBLIC_API_URL}/storage/${p}` : null);

function ArtikelInner() {
    const qc = useQueryClient();
    const [search, setSearch] = useState("");
    const [statusF, setStatusF] = useState("semua");
    const [page, setPage] = useState(1);
    const [sheet, setSheet] = useState<{ open: boolean; editing: Article | null }>({ open: false, editing: null });

    const list = useQuery({
        queryKey: ["artikel", { search, statusF, page }],
        queryFn: async () => (await api.get("/admin/artikel", {
            params: { search: search || undefined, status: statusF === "semua" ? undefined : statusF, page },
        })).data.data as Paginator,
        placeholderData: keepPreviousData,
    });

    const remove = useMutation({
        mutationFn: async (id: number) => (await api.delete(`/admin/artikel/${id}`)).data,
        onSuccess: () => qc.invalidateQueries({ queryKey: ["artikel"] }),
    });

    const p = list.data;
    const rows = p?.data ?? [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Artikel</h1>
                    <p className="text-sm text-muted-foreground">Kelola artikel landing page (draft & publish).</p>
                </div>
                <Button onClick={() => setSheet({ open: true, editing: null })}><Plus className="mr-2 h-4 w-4" /> Tulis Artikel</Button>
            </div>

            <Card className="overflow-hidden">
                <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input className="pl-9" placeholder="Cari judul…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                    </div>
                    <Select value={statusF} onValueChange={(v) => { setStatusF(v ?? "semua"); setPage(1); }}>
                        <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="semua">Semua status</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="publish">Publish</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Artikel</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Publish</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {list.isLoading && Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                        ))}
                        {rows.map((a) => (
                            <TableRow key={a.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-14 overflow-hidden rounded-md bg-muted">
                                            {coverUrl(a.cover_image) && <img src={coverUrl(a.cover_image)!} alt="" className="h-full w-full object-cover" />}
                                        </div>
                                        <span className="font-medium">{a.title}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">{a.category ?? "—"}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={cn("capitalize", a.status === "publish" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-muted text-muted-foreground")}>
                                        {a.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">{a.published_at?.slice(0, 10) ?? "—"}</TableCell>
                                <TableCell className="text-right">
                                    <Button size="icon" variant="ghost" onClick={() => setSheet({ open: true, editing: a })}><Pencil className="h-4 w-4" /></Button>
                                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => confirm(`Hapus "${a.title}"?`) && remove.mutate(a.id)}><Trash2 className="h-4 w-4" /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!list.isLoading && rows.length === 0 && (
                            <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Belum ada artikel.</TableCell></TableRow>
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

            <Sheet open={sheet.open} onOpenChange={(o) => setSheet((s) => ({ ...s, open: o }))}>
                <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
                    {sheet.open && <ArtikelForm editing={sheet.editing} onSaved={() => { setSheet({ open: false, editing: null }); qc.invalidateQueries({ queryKey: ["artikel"] }); }} />}
                </SheetContent>
            </Sheet>
        </div>
    );
}

function ArtikelForm({ editing, onSaved }: { editing: Article | null; onSaved: () => void }) {
    const [form, setForm] = useState({
        title: editing?.title ?? "", slug: editing?.slug ?? "", category: editing?.category ?? "",
        status: editing?.status ?? "draft", content: editing?.content ?? "",
    });
    const [file, setFile] = useState<File | null>(null);
    const [err, setErr] = useState<Record<string, string[]> | string | null>(null);
    const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

    const save = useMutation({
        mutationFn: async () => {
            const fd = new FormData();
            fd.append("title", form.title);
            fd.append("status", form.status);
            if (form.slug) fd.append("slug", form.slug);
            if (form.category) fd.append("category", form.category);
            if (form.content) fd.append("content", form.content);
            if (file) fd.append("cover", file);
            if (editing) fd.append("_method", "PUT");
            const url = editing ? `/admin/artikel/${editing.id}` : "/admin/artikel";
            return (await api.post(url, fd)).data;
        },
        onSuccess: onSaved,
        onError: (e: any) => setErr(e?.response?.status === 422 ? (e.response.data.errors ?? null) : apiError(e)),
    });

    const fe = (k: string) => (typeof err === "object" && err && (err as any)[k] ? (err as any)[k][0] : null);

    return (
        <div className="space-y-4 py-2">
            <h3 className="text-lg font-semibold">{editing ? "Edit Artikel" : "Artikel Baru"}</h3>

            <div>
                <Label>Judul *</Label>
                <Input className="mt-1" value={form.title} onChange={(e) => set("title", e.target.value)} />
                {fe("title") && <p className="mt-1 text-xs text-destructive">{fe("title")}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div><Label>Slug (opsional)</Label><Input className="mt-1" value={form.slug} onChange={(e) => set("slug", e.target.value)} /></div>
                <div><Label>Kategori</Label><Input className="mt-1" value={form.category} onChange={(e) => set("category", e.target.value)} /></div>
            </div>
            <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v ?? "draft")}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="publish">Publish</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label>Cover</Label>
                {editing?.cover_image && !file && <img src={coverUrl(editing.cover_image)!} alt="" className="mt-1 h-32 w-full rounded-md object-cover" />}
                <Input type="file" accept=".jpg,.jpeg,.png" className="mt-1" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            <div>
                <Label>Konten (HTML/teks)</Label>
                <Textarea className="mt-1 min-h-[240px] font-mono text-sm" value={form.content} onChange={(e) => set("content", e.target.value)} />
            </div>

            {typeof err === "string" && <p className="text-sm text-destructive">{err}</p>}
            <Button className="w-full" disabled={!form.title || save.isPending} onClick={() => { setErr(null); save.mutate(); }}>
                {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
            </Button>
        </div>
    );
}

export default function Page() {
    return (
        <InternalShell>
            <ArtikelInner />
        </InternalShell>
    );
}