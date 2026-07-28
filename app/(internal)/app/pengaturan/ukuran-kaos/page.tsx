"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, UploadCloud, Save, CheckCircle2, Ruler, ImageOff, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api, apiError, type ApiEnvelope } from "@/lib/api";
import { InternalShell } from "@/components/internal/InternalShell";

const MAX_MB = 5;

function ShirtSizeSetting() {
    const qc = useQueryClient();
    const { data, isLoading } = useQuery({
        queryKey: ["ukuran-kaos"],
        queryFn: async () => (await api.get<ApiEnvelope<{ url: string | null }>>("/ukuran-kaos")).data.data,
    });

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!file) { setPreview(null); return; }
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const pick = (f: File | null) => {
        setErr(null); setSaved(false);
        if (!f) { setFile(null); return; }
        if (!["image/jpeg", "image/png"].includes(f.type)) { setErr("Format harus JPG atau PNG."); return; }
        if (f.size > MAX_MB * 1024 * 1024) { setErr(`Ukuran gambar maksimal ${MAX_MB}MB.`); return; }
        setFile(f);
    };

    const save = useMutation({
        mutationFn: async () => {
            const fd = new FormData();
            fd.append("image", file!);
            return api.post("/pengaturan/ukuran-kaos", fd);
        },
        onSuccess: () => {
            setFile(null);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
            qc.invalidateQueries({ queryKey: ["ukuran-kaos"] });
        },
        onError: (e) => setErr(apiError(e, "Gagal menyimpan gambar.")),
    });

    const current = preview ?? data?.url ?? null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Panduan Ukuran Kaos</h1>
                <p className="text-sm text-muted-foreground">Gambar ini muncul sebagai tombol panduan di form pendaftaran (mandiri &amp; instansi).</p>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Ruler className="h-5 w-5" /></span>
                    <CardTitle className="text-base">Gambar Panduan</CardTitle>
                </CardHeader>

                <CardContent>
                    {isLoading ? (
                        <div className="grid gap-6 md:grid-cols-2">
                            <Skeleton className="aspect-square w-full rounded-xl" />
                            <Skeleton className="h-40 w-full rounded-xl" />
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Preview */}
                            <div>
                                <p className="mb-2 text-sm font-medium">Pratinjau</p>
                                <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border bg-muted/30">
                                    {current ? (
                                        <img src={current} alt="Panduan ukuran kaos" className="h-full w-full object-contain" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <ImageOff className="h-8 w-8" />
                                            <span className="text-xs">Belum ada gambar</span>
                                        </div>
                                    )}
                                </div>
                                {preview && <p className="mt-2 text-xs text-amber-600">Pratinjau baru — klik “Simpan” untuk menerapkan.</p>}
                            </div>

                            {/* Upload + aksi */}
                            <div className="flex flex-col">
                                <p className="mb-2 text-sm font-medium">Unggah Gambar</p>

                                <label className="group flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition hover:border-primary/50 hover:bg-muted/40">
                                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition group-hover:scale-105">
                                        <UploadCloud className="h-6 w-6" />
                                    </span>
                                    <span className="text-sm font-medium">{file ? file.name : "Klik untuk memilih gambar"}</span>
                                    <span className="text-xs text-muted-foreground">JPG atau PNG · maks {MAX_MB}MB</span>
                                    <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
                                </label>

                                <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    <span>Gunakan gambar tabel ukuran yang jelas (mis. lingkar dada &amp; panjang baju per ukuran S–XL) agar orang tua mudah memilih.</span>
                                </div>

                                {err && <p className="mt-3 text-sm text-destructive">{err}</p>}

                                <div className="mt-4 flex items-center gap-3">
                                    <Button disabled={!file || save.isPending} onClick={() => save.mutate()}>
                                        {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        Simpan
                                    </Button>
                                    {file && <Button variant="ghost" onClick={() => { setFile(null); setErr(null); }}>Batal</Button>}
                                    {saved && <span className="inline-flex items-center gap-1 text-sm text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Tersimpan</span>}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function Page() {
    return (
        <InternalShell>
            <ShirtSizeSetting />
        </InternalShell>
    );
}