"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Upload, Loader2, CheckCircle2, Building2, FileText, X } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { useInstansiBatch } from "@/lib/instansi-batch-store";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";

const rupiah = (n: number) => "Rp" + Math.round(n).toLocaleString("id-ID");

export default function InstansiBayarPage() {
    const batch = useInstansiBatch((s) => s.batch);
    const clear = useInstansiBatch((s) => s.clear);
    const [file, setFile] = useState<File | null>(null);
    const [msg, setMsg] = useState<string | null>(null);
    const [sent, setSent] = useState(false);

    const total = batch?.items.reduce((s, x) => s + x.total, 0) ?? 0;

    const upload = useMutation({
        mutationFn: async () => {
            const fd = new FormData();
            fd.append("proof", file!);
            batch!.items.forEach((i) => fd.append("invoice_ids[]", String(i.invoice_id)));
            return (await api.post("/daftar/instansi/bayar", fd)).data;
        },
        onSuccess: () => { setSent(true); clear(); },
        onError: (e) => setMsg(apiError(e, "Gagal mengunggah bukti.")),
    });

    // sukses
    if (sent) {
        return (
            <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
                <AnimatedBackground />
                <div className="w-full max-w-md rounded-3xl border-[3px] border-black bg-white p-8 text-center shadow-[6px_6px_0_0_#000]">
                    <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-black bg-[#8CC63F] text-white shadow-[3px_3px_0_0_#000]">
                        <CheckCircle2 className="h-8 w-8" strokeWidth={2.5} />
                    </span>
                    <h1 className="mt-5 font-display text-2xl font-extrabold">Bukti Terkirim</h1>
                    <p className="mt-2 text-sm font-medium text-[#5f5e5a]">Pembayaran akan diverifikasi admin. Terima kasih.</p>
                    <Link href="/" className="mt-6 inline-block w-full rounded-full border-[3px] border-black bg-[#9b2d9b] py-3 font-display text-sm font-extrabold text-white shadow-[4px_4px_0_0_#000] active:translate-y-[3px] active:shadow-none">
                        Beranda
                    </Link>
                </div>
            </main>
        );
    }

    // tidak ada batch
    if (!batch || batch.items.length === 0) {
        return (
            <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
                <AnimatedBackground />
                <div className="w-full max-w-md rounded-3xl border-[3px] border-black bg-white p-8 text-center shadow-[6px_6px_0_0_#000]">
                    <h1 className="font-display text-xl font-extrabold">Tidak ada tagihan</h1>
                    <p className="mt-2 text-sm font-medium text-[#5f5e5a]">Daftarkan murid dulu untuk membuat tagihan.</p>
                    <Link href="/daftar/instansi" className="mt-5 inline-block rounded-full border-[3px] border-black bg-[#9b2d9b] px-6 py-3 font-display text-sm font-extrabold text-white shadow-[4px_4px_0_0_#000] active:translate-y-[3px] active:shadow-none">
                        Ke Daftar Instansi
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="relative min-h-screen overflow-hidden px-4 pb-12">
            <AnimatedBackground />
            <div className="mx-auto max-w-2xl pt-6">
                <Link href="/daftar/instansi" className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-white px-4 py-2 font-display text-sm font-extrabold shadow-[3px_3px_0_0_#000] active:translate-y-[2px] active:shadow-none">
                    <ArrowLeft className="h-4 w-4" strokeWidth={2.5} /> Kembali
                </Link>

                <div className="mt-5 rounded-3xl border-[3px] border-black bg-white p-6 shadow-[6px_6px_0_0_#000] md:p-8">
                    <h1 className="font-display text-2xl font-extrabold tracking-tight">Pembayaran Instansi</h1>
                    {batch.schoolName && (
                        <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-[#5f5e5a]"><Building2 className="h-4 w-4" /> {batch.schoolName}</p>
                    )}

                    {/* rincian tagihan */}
                    <div className="mt-5 overflow-hidden rounded-xl border-2 border-black">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[#F5F5F7] font-display">
                                <tr><th className="px-3 py-2">Murid</th><th className="px-3 py-2">No. Tagihan</th><th className="px-3 py-2 text-right">Jumlah</th></tr>
                            </thead>
                            <tbody>
                                {batch.items.map((it) => (
                                    <tr key={it.invoice_id} className="border-t border-black/10">
                                        <td className="px-3 py-2 font-semibold">{it.name}<div className="font-mono text-xs text-[#5f5e5a]">{it.student_code}</div></td>
                                        <td className="px-3 py-2 font-mono text-xs">{it.invoice_number}</td>
                                        <td className="px-3 py-2 text-right font-semibold">{rupiah(it.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-black bg-[#fff8e1] font-display font-extrabold">
                                    <td className="px-3 py-2" colSpan={2}>Total ({batch.items.length} murid)</td>
                                    <td className="px-3 py-2 text-right">{rupiah(total)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* info rekening (placeholder — sesuaikan) */}
                    <div className="mt-4 rounded-xl border-2 border-dashed border-black/40 bg-[#f6edfb] p-4 text-sm font-semibold">
                        <p className="font-display font-extrabold">Transfer ke:</p>
                        <p className="mt-1">BCA 1234567890 a.n. Yayasan Tadika Cikal Mulia</p>
                        <p className="text-xs font-medium text-[#5f5e5a]">Lalu unggah bukti transfer di bawah.</p>
                    </div>

                    {/* upload bukti */}
                    <div className="mt-4">
                        {file ? (
                            <div className="flex items-center justify-between rounded-md border-2 border-black bg-white px-3 py-2 text-sm font-semibold">
                                <span className="flex items-center gap-2 truncate"><FileText className="h-4 w-4 shrink-0" /> {file.name}</span>
                                <button onClick={() => setFile(null)}><X className="h-4 w-4" /></button>
                            </div>
                        ) : (
                            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-black bg-[#F5F5F7] py-8 text-center font-medium text-[#5f5e5a] hover:bg-white">
                                <Upload className="h-7 w-7" strokeWidth={2} />
                                <span>Unggah bukti transfer (JPG/PNG/PDF, maks 5MB)</span>
                                <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                            </label>
                        )}
                    </div>

                    {msg && <p className="mt-3 text-sm font-semibold text-red-600">{msg}</p>}

                    <button disabled={!file || upload.isPending} onClick={() => { setMsg(null); upload.mutate(); }}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border-[3px] border-black bg-[#9b2d9b] py-3.5 font-display text-base font-extrabold text-white shadow-[5px_5px_0_0_#000] transition disabled:opacity-60 active:translate-y-[4px] active:shadow-none">
                        {upload.isPending ? <><Loader2 className="h-5 w-5 animate-spin" /> Mengirim…</> : <>Kirim Bukti Pembayaran</>}
                    </button>
                </div>
            </div>
        </main>
    );
}