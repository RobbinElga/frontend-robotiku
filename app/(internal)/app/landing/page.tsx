"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Loader2, UploadCloud, Copy, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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

function LandingInner() {
    const qc = useQueryClient();
    const [selected, setSelected] = useState("hero");
    const [draft, setDraft] = useState<string>("");
    const [loaded, setLoaded] = useState<string | null>(null);
    const [parseErr, setParseErr] = useState<string | null>(null);
    const [saveErr, setSaveErr] = useState<string | null>(null);
    const [ok, setOk] = useState(false);

    const all = useQuery({
        queryKey: ["landing-all"],
        queryFn: async () => (await api.get<ApiEnvelope<Record<string, unknown>>>("/landing")).data.data,
    });

    // muat draft saat pindah section / data datang
    if (all.data && loaded !== selected) {
        setLoaded(selected);
        setDraft(JSON.stringify(all.data[selected] ?? {}, null, 2));
        setParseErr(null); setSaveErr(null); setOk(false);
    }

    const onChange = (v: string) => {
        setDraft(v); setOk(false);
        try { JSON.parse(v); setParseErr(null); } catch (e: any) { setParseErr("JSON tidak valid: " + e.message); }
    };

    const save = useMutation({
        mutationFn: async () => (await api.put(`/landing/${selected}`, { content: JSON.parse(draft) })).data,
        onSuccess: () => { setOk(true); setSaveErr(null); qc.invalidateQueries({ queryKey: ["landing-all"] }); },
        onError: (e: any) => setSaveErr(e?.response?.status === 422 ? JSON.stringify(e.response.data.errors, null, 2) : apiError(e)),
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Landing CMS</h1>
                <p className="text-sm text-muted-foreground">Ubah konten tiap section landing page. Konten dipakai tim frontend untuk render.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
                {/* daftar section */}
                <Card className="h-fit p-2">
                    {sections.map((s) => (
                        <button key={s.key} onClick={() => setSelected(s.key)}
                            className={cn("flex w-full items-center rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
                                selected === s.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}>
                            {s.label}
                        </button>
                    ))}
                </Card>

                {/* editor */}
                <Card className="p-5">
                    {all.isLoading ? <Skeleton className="h-72 w-full" /> : (
                        <>
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="font-semibold capitalize">{sections.find((s) => s.key === selected)?.label}</h2>
                                <ImageUploader />
                            </div>
                            <Textarea value={draft} onChange={(e) => onChange(e.target.value)} className="min-h-[360px] font-mono text-xs" spellCheck={false} />
                            {parseErr && <p className="mt-2 text-sm text-destructive">{parseErr}</p>}
                            {saveErr && <pre className="mt-2 overflow-x-auto rounded-md bg-destructive/10 p-3 text-xs text-destructive">{saveErr}</pre>}
                            <div className="mt-4 flex items-center gap-3">
                                <Button disabled={!!parseErr || save.isPending} onClick={() => { setSaveErr(null); save.mutate(); }}>
                                    {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Simpan
                                </Button>
                                {ok && <span className="flex items-center gap-1 text-sm text-emerald-600"><Check className="h-4 w-4" /> Tersimpan</span>}
                            </div>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
}

function ImageUploader() {
    const [url, setUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const upload = useMutation({
        mutationFn: async (file: File) => {
            const fd = new FormData(); fd.append("image", file);
            return (await api.post<ApiEnvelope<{ url: string }>>("/landing-upload", fd)).data.data;
        },
        onSuccess: (d) => setUrl(d.url),
    });

    return (
        <div className="flex items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
                {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />} Upload gambar
                <input type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={(e) => e.target.files?.[0] && upload.mutate(e.target.files[0])} />
            </label>
            {url && (
                <button onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                    className="flex max-w-[220px] items-center gap-1 truncate rounded-md bg-muted px-2 py-1.5 text-xs">
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span className="truncate">{url}</span>
                </button>
            )}
        </div>
    );
}

export default function Page() {
    return (
        <InternalShell>
            <LandingInner />
        </InternalShell>
    );
}