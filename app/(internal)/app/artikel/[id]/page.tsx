"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, ImagePlus, Loader2, Save, Bold, Heading2, Link2, Pilcrow, Eye, PenLine, ImageOff } from "lucide-react";
import { api, type ApiEnvelope } from "@/lib/api";
import { InternalShell } from "@/components/internal/InternalShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Article = { id: number; title: string; slug: string; category: string | null; status: "draft" | "publish"; cover_image: string | null; content: string | null };
const mediaUrl = (p?: string | null) => (!p ? null : /^https?:\/\/|^\//.test(p) ? p : `/api/v1/public-media/${p}`);
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

type Form = { title: string; slug: string; category: string; status: "draft" | "publish"; content: string; cover_image: string };

export default function ArtikelEditorPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const isNew = id === "baru";

    const [form, setForm] = useState<Form>({ title: "", slug: "", category: "", status: "draft", content: "", cover_image: "" });
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [slugTouched, setSlugTouched] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [tab, setTab] = useState<"write" | "preview">("write");
    const [uploading, setUploading] = useState(false);
    const taRef = useRef<HTMLTextAreaElement>(null);

    const { data: loaded, isLoading } = useQuery({
        queryKey: ["artikel", id],
        enabled: !isNew,
        queryFn: async () => (await api.get<ApiEnvelope<Article>>(`/admin/artikel/${id}`)).data.data,
    });

    useEffect(() => {
        if (loaded) {
            setForm({
                title: loaded.title ?? "", slug: loaded.slug ?? "", category: loaded.category ?? "",
                status: loaded.status ?? "draft", content: loaded.content ?? "", cover_image: loaded.cover_image ?? "",
            });
            setCoverPreview(mediaUrl(loaded.cover_image));
            setSlugTouched(true);
        }
    }, [loaded]);

    // ---- editor helpers ----
    const insert = (text: string) => {
        const ta = taRef.current;
        if (!ta) { setForm((f) => ({ ...f, content: f.content + text })); return; }
        const s = ta.selectionStart, e = ta.selectionEnd;
        const next = form.content.slice(0, s) + text + form.content.slice(e);
        setForm((f) => ({ ...f, content: next }));
        requestAnimationFrame(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = s + text.length; });
    };
    const wrap = (b: string, a: string) => {
        const ta = taRef.current;
        if (!ta) { insert(b + a); return; }
        const s = ta.selectionStart, e = ta.selectionEnd;
        const sel = form.content.slice(s, e) || "teks";
        setForm((f) => ({ ...f, content: f.content.slice(0, s) + b + sel + a + f.content.slice(e) }));
    };

    const uploadImage = async (file: File, asCover: boolean) => {
        setUploading(true);
        try {
            const fd = new FormData(); fd.append("image", file);
            const res = (await api.post<ApiEnvelope<{ path: string; url: string }>>("/admin/artikel/upload", fd)).data.data;
            if (asCover) { setForm((f) => ({ ...f, cover_image: res.path })); setCoverPreview(res.url); }
            else insert(`\n<img src="${res.url}" alt="" />\n`);
        } finally { setUploading(false); }
    };

    const save = useMutation({
        mutationFn: async () => {
            const payload = { title: form.title, slug: form.slug || slugify(form.title), category: form.category || null, status: form.status, content: form.content, cover_image: form.cover_image || null };
            return isNew ? api.post("/admin/artikel", payload) : api.put(`/admin/artikel/${id}`, payload);
        },
        onSuccess: () => router.push("/app/artikel"),
        onError: (e: any) => {
            if (e?.response?.status === 422) setErrors(e.response.data.errors ?? {});
            else alert(e?.response?.data?.message ?? "Gagal menyimpan artikel.");
        },
    });

    if (!isNew && isLoading) return <InternalShell><Skeleton className="h-96 w-full rounded-xl" /></InternalShell>;

    return (
        <InternalShell>
            <div className="w-full">
                {/* Top bar */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <Link href="/app/artikel" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" /> Kembali
                    </Link>
                    <div className="flex items-center gap-2">
                        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Form["status"] })}
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary">
                            <option value="draft">Draft</option>
                            <option value="publish">Terbit</option>
                        </select>
                        <Button disabled={save.isPending || !form.title.trim()} onClick={() => save.mutate()}>
                            {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Simpan
                        </Button>
                    </div>
                </div>

                {/* Tab kecil (mobile) */}
                <div className="mb-4 flex gap-1 rounded-lg border p-1 lg:hidden">
                    <button onClick={() => setTab("write")} className={cn("flex-1 rounded-md py-1.5 text-sm font-medium", tab === "write" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}><PenLine className="mr-1 inline h-4 w-4" /> Tulis</button>
                    <button onClick={() => setTab("preview")} className={cn("flex-1 rounded-md py-1.5 text-sm font-medium", tab === "preview" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}><Eye className="mr-1 inline h-4 w-4" /> Pratinjau</button>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Editor */}
                    <div className={cn("space-y-4", tab === "preview" && "hidden lg:block")}>
                        <Card className="space-y-4 p-5">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Judul</Label>
                                <Input value={form.title} onChange={(e) => { const v = e.target.value; setForm((f) => ({ ...f, title: v, slug: slugTouched ? f.slug : slugify(v) })); }} placeholder="Judul artikel" className="text-base font-medium" />
                                {errors.title && <p className="text-xs text-red-600">{errors.title[0]}</p>}
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Slug (URL)</Label>
                                    <Input value={form.slug} onChange={(e) => { setSlugTouched(true); setForm({ ...form, slug: slugify(e.target.value) }); }} placeholder="judul-artikel" />
                                    {errors.slug && <p className="text-xs text-red-600">{errors.slug[0]}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Kategori</Label>
                                    <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="mis. Tips, Kegiatan" />
                                </div>
                            </div>

                            {/* Cover */}
                            <div className="space-y-1.5">
                                <Label className="text-xs">Gambar Sampul</Label>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                                        {coverPreview ? <img src={coverPreview} alt="cover" className="h-full w-full object-cover" /> : <ImageOff className="h-5 w-5 text-muted-foreground" />}
                                    </div>
                                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm hover:bg-muted">
                                        <ImagePlus className="h-4 w-4" /> {coverPreview ? "Ganti" : "Unggah"}
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], true)} />
                                    </label>
                                </div>
                            </div>
                        </Card>

                        {/* Konten HTML */}
                        <Card className="p-5">
                            <div className="mb-2 flex items-center justify-between">
                                <Label className="text-xs">Konten (HTML)</Label>
                                {uploading && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Mengunggah…</span>}
                            </div>
                            {/* Toolbar */}
                            <div className="mb-2 flex flex-wrap gap-1 rounded-md border bg-muted/40 p-1">
                                <ToolBtn onClick={() => wrap("<strong>", "</strong>")} title="Tebal"><Bold className="h-4 w-4" /></ToolBtn>
                                <ToolBtn onClick={() => insert("\n<h2>Sub Judul</h2>\n")} title="Sub judul"><Heading2 className="h-4 w-4" /></ToolBtn>
                                <ToolBtn onClick={() => insert("\n<p>Tulis paragraf di sini…</p>\n")} title="Paragraf"><Pilcrow className="h-4 w-4" /></ToolBtn>
                                <ToolBtn onClick={() => wrap('<a href="https://">', "</a>")} title="Tautan"><Link2 className="h-4 w-4" /></ToolBtn>
                                <label className="flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-xs font-medium hover:bg-background" title="Sisipkan gambar">
                                    <ImagePlus className="h-4 w-4" /> Gambar
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], false)} />
                                </label>
                            </div>
                            <textarea ref={taRef} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                                rows={18} placeholder="<p>Tulis konten dalam HTML…</p>" className="w-full resize-y rounded-md border border-input bg-background p-3 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                            {errors.content && <p className="mt-1 text-xs text-red-600">{errors.content[0]}</p>}
                        </Card>
                    </div>

                    {/* Pratinjau */}
                    <div className={cn(tab === "write" && "hidden lg:block")}>
                        <Card className="overflow-hidden lg:sticky lg:top-4">
                            <div className="flex items-center gap-1.5 border-b bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground"><Eye className="h-3.5 w-3.5" /> Pratinjau</div>
                            <article className="max-h-[75vh] overflow-y-auto">
                                {coverPreview && <img src={coverPreview} alt="" className="aspect-video w-full object-cover" />}
                                <div className="p-6">
                                    {form.category && <span className="text-xs font-semibold uppercase tracking-wide text-primary">{form.category}</span>}
                                    <h1 className="mt-1 text-2xl font-bold tracking-tight">{form.title || "Judul artikel"}</h1>
                                    <div className="prose prose-sm mt-4 max-w-none" dangerouslySetInnerHTML={{ __html: form.content || "<p class='text-muted-foreground'>Konten akan tampil di sini…</p>" }} />
                                </div>
                            </article>
                        </Card>
                    </div>
                </div>
            </div>
        </InternalShell>
    );
}

function ToolBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
    return <button type="button" onClick={onClick} title={title} className="flex items-center justify-center rounded px-2 py-1 hover:bg-background">{children}</button>;
}