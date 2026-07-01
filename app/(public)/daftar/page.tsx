"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Tag, CheckCircle2, Loader2, PartyPopper } from "lucide-react";
import { api, apiError, type ApiEnvelope } from "@/lib/api";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";

type Program = { id: number; name: string; registration_fee: string; price_per_cycle: string };
type PromoResult = { code: string; discount_amount: number; registration_fee: number; price_per_cycle: number; total_preview: number };
type DaftarResult = {
    student: { id: number; student_code: string; name: string };
    invoice: { invoice_number: string; total_amount: string; discount_amount: string; due_date: string; status: string };
};
const rupiah = (n: number) => "Rp" + Math.round(n).toLocaleString("id-ID");
const inputCls = "w-full rounded-md border-2 border-black bg-white px-3 py-2 font-medium outline-none transition focus:shadow-[3px_3px_0_0_#000]";

function Field({ label, error, children }: { label: string; error?: string[]; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="mb-1 block font-display text-sm font-bold">{label}</span>
            {children}
            {error && <span className="mt-1 block text-xs font-semibold text-red-600">{error[0]}</span>}
        </label>
    );
}

export default function DaftarPage() {
    const [form, setForm] = useState({
        name: "", birth_date: "", gender: "L", shirt_size: "M",
        school_origin: "", school_grade: "", allergy_notes: "",
        photo_permission: true, parent_name: "", phone: "", program_id: "",
    });
    const [promoCode, setPromoCode] = useState("");
    const [promo, setPromo] = useState<PromoResult | null>(null);
    const [promoMsg, setPromoMsg] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [result, setResult] = useState<DaftarResult | null>(null);

    const set = (k: keyof typeof form, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

    const { data: programs } = useQuery({
        queryKey: ["programs"],
        queryFn: async () => (await api.get<ApiEnvelope<Program[]>>("/programs")).data.data,
    });
    const selected = programs?.find((p) => String(p.id) === form.program_id);

    const checkPromo = useMutation({
        mutationFn: async () =>
            (await api.post<ApiEnvelope<PromoResult>>("/promo/check", { code: promoCode, program_id: Number(form.program_id) })).data,
        onSuccess: (res) => { setPromo(res.data); setPromoMsg(res.message); },
        onError: (e) => { setPromo(null); setPromoMsg(apiError(e, "Kode promo tidak valid.")); },
    });

    const submit = useMutation({
        mutationFn: async () => (await api.post<ApiEnvelope<DaftarResult>>("/daftar", {
            ...form, program_id: Number(form.program_id), promo_code: promo ? promoCode : undefined,
        })).data,
        onSuccess: (res) => setResult(res.data),
        onError: (e: any) => { if (e?.response?.status === 422) setErrors(e.response.data.errors ?? {}); },
    });

    const reg = selected ? Number(selected.registration_fee) : 0;
    const cycle = selected ? Number(selected.price_per_cycle) : 0;
    const disc = promo ? promo.discount_amount : 0;
    const total = selected ? Math.max(0, reg - disc) + cycle : 0;

    // ---------- SUKSES ----------
    if (result) {
        return (
            <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
                <AnimatedBackground />
                <div className="w-full max-w-md rounded-3xl border-[3px] border-black bg-white p-8 text-center shadow-[6px_6px_0_0_#000]">
                    <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-black bg-accent shadow-[3px_3px_0_0_#000]">
                        <PartyPopper className="h-8 w-8" strokeWidth={2.5} />
                    </span>
                    <h1 className="mt-5 font-display text-2xl font-extrabold">Pendaftaran berhasil!</h1>
                    <p className="mt-2 text-sm font-medium text-ink-muted">Simpan kode siswa di bawah, lalu lakukan pembayaran sesuai tagihan.</p>

                    <div className="mt-5 space-y-2 rounded-xl border-2 border-black bg-[#fff8e1] p-4 text-left text-sm font-semibold">
                        <div className="flex justify-between"><span className="text-ink-muted">Nama</span><span>{result.student.name}</span></div>
                        <div className="flex justify-between"><span className="text-ink-muted">Kode Siswa</span><span>{result.student.student_code}</span></div>
                        <div className="flex justify-between"><span className="text-ink-muted">No. Invoice</span><span>{result.invoice.invoice_number}</span></div>
                        <div className="flex justify-between"><span className="text-ink-muted">Total</span><span>{rupiah(Number(result.invoice.total_amount))}</span></div>
                        <div className="flex justify-between"><span className="text-ink-muted">Jatuh tempo</span><span>{result.invoice.due_date?.slice(0, 10)}</span></div>
                    </div>

                    <div className="mt-6 flex gap-3">
                        <Link href="/bayar" className="flex-1 rounded-full border-[3px] border-black bg-primary py-3 font-display text-sm font-extrabold text-white shadow-[4px_4px_0_0_#000] active:translate-y-[3px] active:shadow-none">
                            Lihat Tagihan
                        </Link>
                        <Link href="/" className="flex-1 rounded-full border-[3px] border-black bg-white py-3 font-display text-sm font-extrabold shadow-[4px_4px_0_0_#000] active:translate-y-[3px] active:shadow-none">
                            Selesai
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    // ---------- FORM ----------
    return (
        <main className="relative min-h-screen overflow-hidden px-4 pb-12">
            <AnimatedBackground />

            <div className="mx-auto max-w-5xl pt-6">
                <Link href="/" className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-white px-4 py-2 font-display text-sm font-extrabold shadow-[3px_3px_0_0_#000] active:translate-y-[2px] active:shadow-none">
                    <ArrowLeft className="h-4 w-4" strokeWidth={2.5} /> Kembali
                </Link>

                <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
                    {/* FORM */}
                    <form
                        onSubmit={(e) => { e.preventDefault(); submit.mutate(); }}
                        className="rounded-3xl border-[3px] border-black bg-white p-6 shadow-[6px_6px_0_0_#000] md:p-8"
                    >
                        <span className="inline-block rounded-md border-2 border-black bg-primary px-3 py-1 font-display text-xs font-extrabold uppercase tracking-wide text-white shadow-[2px_2px_0_0_#000]">
                            Daftar Mandiri
                        </span>
                        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight">Daftarkan anak Anda</h1>
                        <p className="mt-1 text-sm font-medium text-ink-muted">Isi data berikut. Tanda * wajib diisi.</p>

                        <div className="mt-6 grid gap-5 sm:grid-cols-2">
                            <Field label="Nama anak *" error={errors.name}>
                                <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} />
                            </Field>
                            <Field label="Tanggal lahir *" error={errors.birth_date}>
                                <input type="date" className={inputCls} value={form.birth_date} onChange={(e) => set("birth_date", e.target.value)} />
                            </Field>
                            <Field label="Jenis kelamin *" error={errors.gender}>
                                <select className={inputCls} value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                                    <option value="L">Laki-laki</option>
                                    <option value="P">Perempuan</option>
                                </select>
                            </Field>
                            <Field label="Ukuran kaos" error={errors.shirt_size}>
                                <select className={inputCls} value={form.shirt_size} onChange={(e) => set("shirt_size", e.target.value)}>
                                    {["S", "M", "L", "XL"].map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </Field>
                            <Field label="Asal sekolah" error={errors.school_origin}>
                                <input className={inputCls} value={form.school_origin} onChange={(e) => set("school_origin", e.target.value)} />
                            </Field>
                            <Field label="Kelas asal" error={errors.school_grade}>
                                <input className={inputCls} placeholder="mis. 2B" value={form.school_grade} onChange={(e) => set("school_grade", e.target.value)} />
                            </Field>
                            <Field label="Nama orang tua *" error={errors.parent_name}>
                                <input className={inputCls} value={form.parent_name} onChange={(e) => set("parent_name", e.target.value)} />
                            </Field>
                            <Field label="Nomor HP (WhatsApp) *" error={errors.phone}>
                                <input className={inputCls} placeholder="08xxxxxxxxxx" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                            </Field>
                            <div className="sm:col-span-2">
                                <Field label="Pilih program *" error={errors.program_id}>
                                    <select className={inputCls} value={form.program_id} onChange={(e) => { set("program_id", e.target.value); setPromo(null); setPromoMsg(null); }}>
                                        <option value="">— pilih program —</option>
                                        {programs?.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name} — {rupiah(Number(p.price_per_cycle))}/siklus</option>
                                        ))}
                                    </select>
                                </Field>
                            </div>
                            <div className="sm:col-span-2">
                                <Field label="Riwayat alergi (opsional)" error={errors.allergy_notes}>
                                    <textarea className={inputCls} rows={2} value={form.allergy_notes} onChange={(e) => set("allergy_notes", e.target.value)} />
                                </Field>
                            </div>
                            <label className="sm:col-span-2 flex items-center gap-3 rounded-md border-2 border-black bg-[#f6edfb] p-3 font-medium">
                                <input type="checkbox" checked={form.photo_permission} onChange={(e) => set("photo_permission", e.target.checked)} className="h-5 w-5 accent-[#9b2d9b]" />
                                Saya mengizinkan foto/video anak untuk dokumentasi.
                            </label>
                        </div>

                        {/* PROMO */}
                        <div className="mt-6 rounded-xl border-2 border-black bg-[#fff8e1] p-4">
                            <span className="flex items-center gap-2 font-display text-sm font-extrabold"><Tag className="h-4 w-4" strokeWidth={2.5} /> Kode promo</span>
                            <div className="mt-2 flex gap-2">
                                <input className={inputCls} placeholder="mis. HEMAT50" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} />
                                <button type="button" disabled={!form.program_id || !promoCode || checkPromo.isPending}
                                    onClick={() => checkPromo.mutate()}
                                    className="shrink-0 rounded-md border-2 border-black bg-accent px-4 font-display text-sm font-extrabold shadow-[3px_3px_0_0_#000] disabled:opacity-50 active:translate-y-[2px] active:shadow-none">
                                    {checkPromo.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cek"}
                                </button>
                            </div>
                            {promoMsg && (
                                <p className={`mt-2 text-xs font-semibold ${promo ? "text-green-700" : "text-red-600"}`}>
                                    {promo ? <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> {promoMsg} — potongan {rupiah(disc)}</span> : promoMsg}
                                </p>
                            )}
                            {!form.program_id && <p className="mt-2 text-xs font-medium text-ink-muted">Pilih program dulu untuk memakai kode promo.</p>}
                        </div>

                        <button type="submit" disabled={submit.isPending}
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border-[3px] border-black bg-primary py-3.5 font-display text-base font-extrabold text-white shadow-[5px_5px_0_0_#000] transition disabled:opacity-60 active:translate-y-[4px] active:shadow-none">
                            {submit.isPending ? <><Loader2 className="h-5 w-5 animate-spin" /> Memproses…</> : "Daftar Sekarang"}
                        </button>
                    </form>

                    {/* RINGKASAN BIAYA */}
                    <aside className="rounded-3xl border-[3px] border-black bg-white p-6 shadow-[6px_6px_0_0_#000] lg:sticky lg:top-6">
                        <h2 className="font-display text-lg font-extrabold">Ringkasan Biaya</h2>
                        {selected ? (
                            <div className="mt-4 space-y-2 text-sm font-semibold">
                                <div className="flex justify-between"><span className="text-ink-muted">Program</span><span>{selected.name}</span></div>
                                <div className="flex justify-between"><span className="text-ink-muted">Biaya daftar</span><span>{rupiah(reg)}</span></div>
                                {disc > 0 && <div className="flex justify-between text-green-700"><span>Diskon promo</span><span>− {rupiah(disc)}</span></div>}
                                <div className="flex justify-between"><span className="text-ink-muted">Biaya 1 siklus</span><span>{rupiah(cycle)}</span></div>
                                <div className="my-2 border-t-2 border-dashed border-black" />
                                <div className="flex justify-between font-display text-lg font-extrabold"><span>Total</span><span>{rupiah(total)}</span></div>
                            </div>
                        ) : (
                            <p className="mt-4 text-sm font-medium text-ink-muted">Pilih program untuk melihat rincian biaya.</p>
                        )}
                    </aside>
                </div>
            </div>
        </main>
    );
}