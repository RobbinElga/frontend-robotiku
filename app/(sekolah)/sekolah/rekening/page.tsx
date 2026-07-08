"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Landmark, QrCode, Loader2, Save, Upload, CheckCircle2 } from "lucide-react";
import { api, type ApiEnvelope } from "@/lib/api";
import { SchoolShell } from "@/components/sekolah/SchoolShell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type Rekening = { bank_account: string | null; qris_path: string | null; qris_url: string | null };

export default function SekolahRekening() {
    const qc = useQueryClient();
    const { data, isLoading } = useQuery({
        queryKey: ["sekolah-rekening"],
        queryFn: async () => (await api.get<ApiEnvelope<Rekening>>("/sekolah/rekening")).data.data,
    });

    const [bank, setBank] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => { if (data) setBank(data.bank_account ?? ""); }, [data]);
    useEffect(() => {
        if (!file) { setPreview(null); return; }
        const url = URL.createObjectURL(file); setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const save = useMutation({
        mutationFn: async () => {
            let qrisPath = data?.qris_path ?? undefined;
            if (file) {
                const fd = new FormData(); fd.append("image", file);
                qrisPath = (await api.post<ApiEnvelope<{ path: string }>>("/sekolah/rekening/qris", fd)).data.data.path;
            }
            return api.put("/sekolah/rekening", { bank_account: bank || null, qris_image: qrisPath ?? null });
        },
        onSuccess: () => { setFile(null); setSaved(true); setTimeout(() => setSaved(false), 2500); qc.invalidateQueries({ queryKey: ["sekolah-rekening"] }); },
    });

    const currentQris = preview ?? (data?.qris_path ? `/api/v1/public-media/${data.qris_path}` : null);

    return (
        <SchoolShell>
            <PageHeader title="Rekening & QRIS" subtitle="Data pembayaran ini ditampilkan ke orang tua murid saat menyetor." />

            {isLoading ? (
                <div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-64 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>
            ) : (
                <div className="mt-4 grid gap-6 lg:grid-cols-2">
                    {/* Rekening bank */}
                    <Card className="border-2 p-6">
                        <div className="mb-4 flex items-center gap-2">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Landmark className="h-5 w-5" /></span>
                            <div><h3 className="font-semibold">Rekening Bank</h3><p className="text-xs text-muted-foreground">Nama bank, nomor & atas nama.</p></div>
                        </div>
                        <label className="mb-1 block text-sm font-medium">Rekening</label>
                        <Input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Contoh: BCA 1234567890 a.n. SD IT Bawamai" />
                        <p className="mt-2 text-xs text-muted-foreground">Tulis lengkap agar orang tua tidak salah transfer.</p>
                    </Card>

                    {/* QRIS */}
                    <Card className="border-2 p-6">
                        <div className="mb-4 flex items-center gap-2">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><QrCode className="h-5 w-5" /></span>
                            <div><h3 className="font-semibold">QRIS</h3><p className="text-xs text-muted-foreground">Unggah gambar QRIS (JPG/PNG, maks 5MB).</p></div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-muted/40">
                                {currentQris ? <img src={currentQris} alt="QRIS" className="h-full w-full object-contain" /> : <QrCode className="h-8 w-8 text-muted-foreground" />}
                            </div>
                            <div className="flex-1">
                                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm hover:bg-muted">
                                    <Upload className="h-4 w-4" /> {currentQris ? "Ganti gambar" : "Pilih gambar"}
                                    <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                                </label>
                                {file && <p className="mt-2 truncate text-xs text-muted-foreground">{file.name}</p>}
                            </div>
                        </div>
                    </Card>

                    {/* Simpan */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-3">
                            <Button disabled={save.isPending} onClick={() => save.mutate()}>
                                {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Simpan Perubahan
                            </Button>
                            {saved && <span className="inline-flex items-center gap-1 text-sm text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Tersimpan</span>}
                        </div>
                    </div>
                </div>
            )}
        </SchoolShell>
    );
}