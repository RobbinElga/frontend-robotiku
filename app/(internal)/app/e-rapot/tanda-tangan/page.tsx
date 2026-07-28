"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Upload, Loader2, Save, CheckCircle2, PenTool } from "lucide-react";
import { api, apiError, type ApiEnvelope } from "@/lib/api";
import { InternalShell } from "@/components/internal/InternalShell";
import { AuthImage } from "@/components/ui/auth-image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TandaTanganPage() {
    const qc = useQueryClient();
    const { data } = useQuery({
        queryKey: ["my-ttd"],
        queryFn: async () => (await api.get<ApiEnvelope<{ signature_image: string | null }>>("/profil/tanda-tangan")).data.data,
    });
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => { if (!file) { setPreview(null); return; } const u = URL.createObjectURL(file); setPreview(u); return () => URL.revokeObjectURL(u); }, [file]);

    const save = useMutation({
        mutationFn: async () => {
            const fd = new FormData();
            fd.append("signature", file!);                       // ← field 'signature', bukan 'image'
            return api.post("/profil/tanda-tangan", fd);
        },
        onSuccess: () => { setFile(null); setErr(null); setSaved(true); setTimeout(() => setSaved(false), 2500); qc.invalidateQueries({ queryKey: ["my-ttd"] }); },
        onError: (e) => setErr(apiError(e, "Gagal menyimpan TTD.")),
    });

    const currentPath = data?.signature_image ?? null;            // ← path mentah dari backend

    return (
        <InternalShell>
            <Link href="/app/e-rapot" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Kembali ke E-Rapot</Link>
            <Card className="max-w-2xl p-6">
                <div className="mb-4 flex items-center gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><PenTool className="h-5 w-5" /></span>
                    <div><h1 className="font-semibold">Tanda Tangan Saya</h1><p className="text-xs text-muted-foreground">Dipakai otomatis di setiap E-Rapot yang Anda isi.</p></div>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="flex h-32 w-56 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-white">
                        {preview ? <img src={preview} alt="ttd" className="h-full w-full object-contain p-2" />
                            : currentPath ? <AuthImage path={currentPath} alt="ttd" className="h-full w-full object-contain p-2" />
                                : <span className="text-xs text-muted-foreground">Belum ada TTD</span>}
                    </div>
                    <div className="flex-1">
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm hover:bg-muted">
                            <Upload className="h-4 w-4" /> {currentPath || preview ? "Ganti gambar" : "Pilih gambar"}
                            <input type="file" accept="image/jpeg,image/png" className="hidden"
                                onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
                                onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                        </label>
                        <p className="mt-2 text-xs text-muted-foreground">JPG/PNG, latar transparan/putih, maks 2MB.</p>
                        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
                        <div className="mt-4 flex items-center gap-3">
                            <Button disabled={!file || save.isPending} onClick={() => save.mutate()}>{save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Simpan</Button>
                            {saved && <span className="inline-flex items-center gap-1 text-sm text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Tersimpan</span>}
                        </div>
                    </div>
                </div>
            </Card>
        </InternalShell>
    );
}