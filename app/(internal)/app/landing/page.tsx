"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Loader2, Plus, Trash2, Check, UploadCloud, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { api, apiError, type ApiEnvelope } from "@/lib/api";
import { InternalShell } from "@/components/internal/InternalShell";
import { cn } from "@/lib/utils";

const sections = [
    { key: "navbar", label: "Navbar" }, { key: "hero", label: "Hero" }, { key: "mitra", label: "Mitra" },
    { key: "about", label: "Tentang" }, { key: "programs", label: "Program" }, { key: "achievements", label: "Prestasi" },
    { key: "testimonials", label: "Testimoni" }, { key: "gallery", label: "Galeri" }, { key: "cta", label: "CTA" },
    { key: "contact", label: "Kontak" },
];
const humanize = (k: string) => k.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
const cloneEmpty = (s: any): any => {
    if (Array.isArray(s)) return [];
    if (s && typeof s === "object") { const o: any = {}; for (const k in s) o[k] = cloneEmpty(s[k]); return o; }
    if (typeof s === "boolean") return false;
    if (typeof s === "number") return 0;
    return "";
};
const isComplex = (v: any) => Array.isArray(v) || (v && typeof v === "object") || (typeof v === "string" && v.length > 60);
const LOCKED = new Set(["href", "icon", "id", "type", "slug"]);

/** Section-card ala Filament */
function FSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="mb-4 border-b pb-3 text-base font-semibold">{title}</h3>
            {children}
        </div>
    );
}

function Node({ k, value, onChange }: { k: string; value: any; onChange: (v: any) => void }) {
    // field terkunci → tampil read-only (tidak bisa diubah)
    if (LOCKED.has(k)) {
        return (
            <div className="space-y-1.5">
                <Label className="text-sm font-medium text-muted-foreground">{humanize(k)} <span className="text-xs">· terkunci</span></Label>
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                    {value == null || value === "" ? "—" : String(value)}
                </div>
            </div>
        );
    }

    if (typeof value === "boolean")
        return <label className="flex items-center gap-2 pt-6 text-sm font-medium"><Switch checked={value} onCheckedChange={onChange} /> {humanize(k)}</label>;
    if (Array.isArray(value)) return <Repeater k={k} value={value} onChange={onChange} />;
    if (value && typeof value === "object") return <FSection title={humanize(k)}><Grid value={value} onChange={onChange} /></FSection>;

    const str = value == null ? "" : String(value);
    const long = str.length > 60;
    return (
        <div className="space-y-1.5">
            <Label className="text-sm font-medium">{humanize(k)}</Label>
            {long ? <Textarea rows={3} value={str} onChange={(e) => onChange(e.target.value)} /> : <Input value={str} onChange={(e) => onChange(e.target.value)} />}
        </div>
    );
}

/** Grid 2-kolom: primitif 1 kolom, kompleks full-width */
function Grid({ value, onChange }: { value: any; onChange: (v: any) => void }) {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Object.entries(value).map(([k, v]) => (
                <div key={k} className={cn(isComplex(v) && "md:col-span-2")}>
                    <Node k={k} value={v} onChange={(nv) => onChange({ ...value, [k]: nv })} />
                </div>
            ))}
        </div>
    );
}

/** Repeater ala Filament */
function Repeater({ k, value, onChange }: { k: string; value: any[]; onChange: (v: any[]) => void }) {
    return (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-semibold">{humanize(k)} <span className="font-normal text-muted-foreground">({value.length})</span></h3>
                <Button size="sm" variant="outline" onClick={() => onChange([...value, value.length ? cloneEmpty(value[0]) : ""])}><Plus className="mr-1 h-3.5 w-3.5" /> Tambah</Button>
            </div>
            <div className="space-y-3">
                {value.map((item, i) => (
                    <div key={i} className="rounded-lg border bg-muted/20 p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Item {i + 1}</span>
                            <button type="button" className="rounded p-1 text-destructive hover:bg-destructive/10" onClick={() => onChange(value.filter((_, x) => x !== i))}><Trash2 className="h-4 w-4" /></button>
                        </div>
                        {item && typeof item === "object"
                            ? <Grid value={item} onChange={(nv) => { const a = [...value]; a[i] = nv; onChange(a); }} />
                            : <Node k="Nilai" value={item} onChange={(nv) => { const a = [...value]; a[i] = nv; onChange(a); }} />}
                    </div>
                ))}
                {value.length === 0 && <p className="text-sm text-muted-foreground">Belum ada item.</p>}
            </div>
        </div>
    );
}

function LandingInner() {
    const qc = useQueryClient();
    const [selected, setSelected] = useState("hero");
    const [draft, setDraft] = useState<any>(null);
    const [loaded, setLoaded] = useState<string | null>(null);
    const [ok, setOk] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const all = useQuery({ queryKey: ["landing-all"], queryFn: async () => (await api.get<ApiEnvelope<Record<string, any>>>("/landing")).data.data });
    if (all.data && loaded !== selected) { setLoaded(selected); setDraft(JSON.parse(JSON.stringify(all.data[selected] ?? {}))); setOk(false); setErr(null); }

    const save = useMutation({
        mutationFn: async () => (await api.put(`/landing/${selected}`, { content: draft })).data,
        onSuccess: () => { setOk(true); setErr(null); qc.invalidateQueries({ queryKey: ["landing-all"] }); },
        onError: (e: any) => setErr(e?.response?.status === 422 ? "Ada isian wajib yang belum sesuai." : apiError(e)),
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Landing CMS</h1>
                    <p className="text-sm text-muted-foreground">Kelola konten tiap section landing page.</p>
                </div>
                <div className="flex items-center gap-3">
                    {ok && <span className="flex items-center gap-1 text-sm text-emerald-600"><Check className="h-4 w-4" /> Tersimpan</span>}
                    <ImageUploader />
                    <Button disabled={save.isPending || draft == null} onClick={() => { setErr(null); save.mutate(); }}>
                        {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Simpan
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
                {/* nav section */}
                <div className="h-fit rounded-xl border bg-card p-2 shadow-sm">
                    {sections.map((s) => (
                        <button key={s.key} onClick={() => setSelected(s.key)}
                            className={cn("flex w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors", selected === s.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}>
                            {s.label}
                        </button>
                    ))}
                </div>

                {/* form */}
                <div className="space-y-5">
                    {all.isLoading || draft == null ? <Skeleton className="h-96 w-full rounded-xl" /> : (
                        <>
                            <FSection title={sections.find((s) => s.key === selected)?.label ?? "Section"}>
                                <Grid value={draft} onChange={setDraft} />
                            </FSection>
                            {err && <p className="text-sm text-destructive">{err}</p>}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function ImageUploader() {
    const [url, setUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const upload = useMutation({
        mutationFn: async (file: File) => { const fd = new FormData(); fd.append("image", file); return (await api.post<ApiEnvelope<{ url: string }>>("/landing-upload", fd)).data.data; },
        onSuccess: (d) => { setUrl(d.url); navigator.clipboard.writeText(d.url); setCopied(true); setTimeout(() => setCopied(false), 1500); },
    });
    return (
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted">
            {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : copied ? <Copy className="h-4 w-4 text-emerald-600" /> : <UploadCloud className="h-4 w-4" />}
            {copied ? "URL disalin!" : "Upload gambar"}
            <input type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={(e) => e.target.files?.[0] && upload.mutate(e.target.files[0])} />
        </label>
    );
}

export default function Page() {
    return <InternalShell><LandingInner /></InternalShell>;
}