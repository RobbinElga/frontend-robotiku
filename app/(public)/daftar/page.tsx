    "use client";

    import { useState } from "react";
    import Link from "next/link";
    import { useRouter } from "next/navigation";
    import { useQuery, useMutation } from "@tanstack/react-query";
    import { ArrowLeft, UserPlus, Users, Tag, Loader2, CheckCircle2, Wallet, ArrowRight } from "lucide-react";
    import { api, apiError, type ApiEnvelope } from "@/lib/api";
    import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
    import { ShirtSizeGuide } from "@/components/ui/shirt-size-guide";
    import { useMandiriBatch } from "@/lib/mandiri-batch-store";

    type Program = { id: number; name: string; registration_fee: string; price_per_cycle: string };
    type PromoResult = { code: string; discount_amount: number };
    type DaftarResult = { student: { id: number; student_code: string; name: string }; invoice: { id: number; invoice_number: string; total_amount: string } };
    const rupiah = (n: number | string) => "Rp" + Math.round(Number(n)).toLocaleString("id-ID");
    const inputCls = "w-full rounded-md border-2 border-black bg-white px-3 py-2 font-medium outline-none transition focus:shadow-[3px_3px_0_0_#000]";

    export default function DaftarMandiriPage() {
        const router = useRouter();
        const setBatch = useMandiriBatch((s) => s.setBatch);

        const [ortu, setOrtu] = useState({ parent_name: "", greeting: "ayah", phone: "", phone_alt: "" });
        const [form, setForm] = useState({ name: "", birth_date: "", gender: "L", shirt_size: "M", school_origin: "", school_grade: "", allergy_notes: "", photo_permission: true, program_id: "" });
        const [promoCode, setPromoCode] = useState("");
        const [promo, setPromo] = useState<PromoResult | null>(null);
        const [promoMsg, setPromoMsg] = useState<string | null>(null);
        const [errors, setErrors] = useState<Record<string, string[]>>({});
        const [msg, setMsg] = useState<string | null>(null);
        const [added, setAdded] = useState<{ name: string; code: string; invoiceId: number; invoiceNumber: string; total: number }[]>([]);
        const [confirmOpen, setConfirmOpen] = useState(false);
        const [done, setDone] = useState(false);

        const setO = (k: keyof typeof ortu, v: string) => setOrtu((o) => ({ ...o, [k]: v }));
        const setF = (k: keyof typeof form, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

        const { data: programs } = useQuery({ queryKey: ["programs"], queryFn: async () => (await api.get<ApiEnvelope<Program[]>>("/programs")).data.data });
        const selected = programs?.find((p) => String(p.id) === form.program_id);
        const reg = selected ? Number(selected.registration_fee) : 0;
        const cycle = selected ? Number(selected.price_per_cycle) : 0;
        const disc = promo ? promo.discount_amount : 0;
        const totalPer = selected ? Math.max(0, reg - disc) + cycle : 0;
        const grandTotal = added.reduce((s, x) => s + x.total, 0);
        const ortuValid = ortu.parent_name.trim() && ortu.phone.trim();

        const cek = useMutation({
            mutationFn: async () => (await api.post<ApiEnvelope<PromoResult>>("/promo/check", { code: promoCode, program_id: Number(form.program_id) })).data,
            onSuccess: (r) => { setPromo(r.data); setPromoMsg(r.message); },
            onError: (e) => { setPromo(null); setPromoMsg(apiError(e, "Kode promo tidak valid.")); },
        });

        const submit = useMutation({
            mutationFn: async () => (await api.post<ApiEnvelope<DaftarResult>>("/daftar", {
                ...form, ...ortu, program_id: Number(form.program_id), promo_code: promo ? promoCode : undefined,
            })).data,
            onSuccess: (res) => {
                const inv = res.data.invoice;
                setAdded((a) => [{ name: res.data.student.name, code: res.data.student.student_code, invoiceId: inv.id, invoiceNumber: inv.invoice_number, total: Number(inv.total_amount) }, ...a]);
                setForm({ name: "", birth_date: "", gender: "L", shirt_size: "M", school_origin: "", school_grade: "", allergy_notes: "", photo_permission: true, program_id: form.program_id });
                setPromo(null); setPromoCode(""); setPromoMsg(null); setErrors({}); setMsg(null);
            },
            onError: (e: any) => {
                if (e?.response?.status === 422) setErrors(e.response.data.errors ?? {});
                setMsg(apiError(e, "Gagal menambah anak."));
            },
        });

        const finalize = () => {
            setBatch({ items: added.map((a) => ({ name: a.name, student_code: a.code, invoice_id: a.invoiceId, invoice_number: a.invoiceNumber, total: a.total })) });
            setConfirmOpen(false);
            setDone(true);
        };

        // ---------- berhasil ----------
        if (done) {
            return (
                <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
                    <AnimatedBackground />
                    <div className="w-full max-w-md rounded-3xl border-[3px] border-black bg-white p-7 text-center shadow-[6px_6px_0_0_#000]">
                        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-black bg-[#8CC63F] text-white shadow-[2px_2px_0_0_#000]"><CheckCircle2 className="h-7 w-7" strokeWidth={2.5} /></span>
                        <h1 className="mt-4 font-display text-2xl font-extrabold">Pendaftaran Berhasil!</h1>
                        <p className="mt-1 text-sm font-medium text-[#5f5e5a]">{added.length} anak terdaftar. Total tagihan <b>{rupiah(grandTotal)}</b>.</p>
                        <div className="mt-4 rounded-xl border-2 border-dashed border-black/40 bg-[#ffd23f]/25 p-3 text-xs font-semibold text-[#5f5e5a]">Selesaikan pembayaran lalu tunggu verifikasi. Portal Orang Tua aktif setelah pembayaran terverifikasi.</div>
                        <button onClick={() => router.push("/daftar/bayar")} className="mt-5 flex w-full items-center justify-center gap-2 rounded-md border-2 border-black bg-[#9b2d9b] px-5 py-3 font-display font-extrabold text-white shadow-[4px_4px_0_0_#000] transition active:translate-y-[3px] active:shadow-none">
                            <Wallet className="h-5 w-5" strokeWidth={2.5} /> Lanjut ke Pembayaran <ArrowRight className="h-4 w-4" />
                        </button>
                        <Link href="/" className="mt-2 block text-center text-sm font-semibold text-[#5f5e5a] underline">Kembali ke Beranda</Link>
                    </div>
                </main>
            );
        }

        // ---------- form ----------
        return (
            <main className="relative min-h-screen overflow-hidden px-4 pb-12">
                <AnimatedBackground />
                <div className="mx-auto max-w-5xl pt-6">
                    <Link href="/" className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-white px-4 py-2 font-display text-sm font-extrabold shadow-[3px_3px_0_0_#000] active:translate-y-[2px] active:shadow-none"><ArrowLeft className="h-4 w-4" strokeWidth={2.5} /> Kembali</Link>

                    <div className="mt-5 rounded-3xl border-[3px] border-black bg-white p-6 shadow-[6px_6px_0_0_#000] md:p-8">
                        <h1 className="font-display text-3xl font-extrabold tracking-tight">Daftar Mandiri</h1>
                        <p className="mt-1 text-sm font-medium text-[#5f5e5a]">Isi data orang tua sekali, lalu tambahkan anak satu per satu.</p>

                        {/* Data Ortu */}
                        <div className="mt-5 rounded-2xl border-2 border-black bg-[#f6edfb] p-4">
                            <p className="mb-2 font-display text-sm font-extrabold">Data Orang Tua</p>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <input className={inputCls} placeholder="Nama orang tua *" value={ortu.parent_name} onChange={(e) => setO("parent_name", e.target.value)} />
                                <div className="flex gap-2">
                                    {(["ayah", "bunda"] as const).map((g) => (
                                        <button key={g} type="button" onClick={() => setO("greeting", g)} className={`flex-1 rounded-md border-2 border-black py-2 font-display text-sm font-extrabold shadow-[2px_2px_0_0_#000] ${ortu.greeting === g ? "bg-[#9b2d9b] text-white" : "bg-white"}`}>{g === "ayah" ? "Ayah" : "Bunda"}</button>
                                    ))}
                                </div>
                                <input className={inputCls} placeholder="No. WhatsApp *" value={ortu.phone} onChange={(e) => setO("phone", e.target.value)} inputMode="tel" />
                                <input className={inputCls} placeholder="No. WhatsApp cadangan (opsional)" value={ortu.phone_alt} onChange={(e) => setO("phone_alt", e.target.value)} inputMode="tel" />
                            </div>
                        </div>

                        {!ortuValid ? (
                            <p className="mt-6 rounded-xl border-2 border-dashed border-black/40 bg-[#F5F5F7] p-4 text-center text-sm font-semibold text-[#5f5e5a]">Lengkapi nama & No. WhatsApp orang tua untuk mulai menambah anak.</p>
                        ) : (
                            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
                                {/* Form anak */}
                                <form onSubmit={(e) => { e.preventDefault(); setErrors({}); submit.mutate(); }}>
                                    <p className="mb-3 font-display text-lg font-extrabold text-[#9b2d9b]">Data Anak</p>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field label="Nama anak *" error={errors.name}><input className={inputCls} value={form.name} onChange={(e) => setF("name", e.target.value)} /></Field>
                                        <Field label="Tanggal lahir *" error={errors.birth_date}><input type="date" className={inputCls} value={form.birth_date} onChange={(e) => setF("birth_date", e.target.value)} /></Field>
                                        <Field label="Jenis kelamin *" error={errors.gender}><select className={inputCls} value={form.gender} onChange={(e) => setF("gender", e.target.value)}><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></Field>

                                        {/* Ukuran kaos + panduan */}
                                        <div>
                                            <div className="mb-1 flex items-center justify-between gap-2">
                                                <span className="font-display text-sm font-bold">Ukuran kaos</span>
                                                <ShirtSizeGuide />
                                            </div>
                                            <select className={inputCls} value={form.shirt_size} onChange={(e) => setF("shirt_size", e.target.value)}>
                                                {["S", "M", "L", "XL"].map((s) => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                            {errors.shirt_size && <span className="mt-1 block text-xs font-semibold text-red-600">{errors.shirt_size[0]}</span>}
                                        </div>

                                        <Field label="Asal sekolah" error={errors.school_origin}><input className={inputCls} value={form.school_origin} onChange={(e) => setF("school_origin", e.target.value)} /></Field>
                                        <Field label="Kelas asal" error={errors.school_grade}><input className={inputCls} placeholder="mis. 2B" value={form.school_grade} onChange={(e) => setF("school_grade", e.target.value)} /></Field>
                                        <div className="sm:col-span-2">
                                            <Field label="Program *" error={errors.program_id}>
                                                <select className={inputCls} value={form.program_id} onChange={(e) => { setF("program_id", e.target.value); setPromo(null); setPromoMsg(null); }}>
                                                    <option value="">— pilih program —</option>
                                                    {programs?.map((p) => <option key={p.id} value={p.id}>{p.name} — {rupiah(p.price_per_cycle)}/siklus</option>)}
                                                </select>
                                            </Field>
                                        </div>
                                        <div className="sm:col-span-2"><Field label="Riwayat alergi (opsional)" error={errors.allergy_notes}><textarea className={inputCls} rows={2} value={form.allergy_notes} onChange={(e) => setF("allergy_notes", e.target.value)} /></Field></div>
                                        <label className="sm:col-span-2 flex items-center gap-3 rounded-md border-2 border-black bg-white p-3 font-medium"><input type="checkbox" checked={form.photo_permission} onChange={(e) => setF("photo_permission", e.target.checked)} className="h-5 w-5 accent-[#9b2d9b]" /> Izin foto/video anak untuk dokumentasi.</label>
                                    </div>

                                    {/* Promo */}
                                    <div className="mt-4 rounded-xl border-2 border-black bg-[#fff8e1] p-4">
                                        <span className="flex items-center gap-2 font-display text-sm font-extrabold"><Tag className="h-4 w-4" strokeWidth={2.5} /> Kode promo (opsional)</span>
                                        <div className="mt-2 flex gap-2">
                                            <input className={inputCls} placeholder="mis. HEMAT50" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} />
                                            <button type="button" disabled={!form.program_id || !promoCode || cek.isPending} onClick={() => cek.mutate()} className="shrink-0 rounded-md border-2 border-black bg-[#ffd23f] px-4 font-display text-sm font-extrabold shadow-[3px_3px_0_0_#000] disabled:opacity-50 active:translate-y-[2px] active:shadow-none">{cek.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cek"}</button>
                                        </div>
                                        {promoMsg && <p className={`mt-2 text-xs font-semibold ${promo ? "text-green-700" : "text-red-600"}`}>{promo ? `${promoMsg} — potongan ${rupiah(disc)}` : promoMsg}</p>}
                                    </div>

                                    {/* Rincian Biaya */}
                                    {selected && (
                                        <div className="mt-4 rounded-xl border-2 border-black bg-[#fff8e1] p-4">
                                            <p className="font-display text-sm font-extrabold">Rincian Biaya</p>
                                            <div className="mt-2 space-y-1.5 text-sm font-semibold">
                                                <div className="flex justify-between"><span className="text-[#5f5e5a]">Program</span><span>{selected.name}</span></div>
                                                <div className="flex justify-between"><span className="text-[#5f5e5a]">Biaya daftar</span><span>{rupiah(reg)}</span></div>
                                                {disc > 0 && <div className="flex justify-between text-green-700"><span>Diskon promo</span><span>− {rupiah(disc)}</span></div>}
                                                <div className="flex justify-between"><span className="text-[#5f5e5a]">Biaya 1 siklus</span><span>{rupiah(cycle)}</span></div>
                                                <div className="my-2 border-t-2 border-dashed border-black" />
                                                <div className="flex justify-between font-display text-base font-extrabold"><span>Total</span><span>{rupiah(totalPer)}</span></div>
                                            </div>
                                        </div>
                                    )}

                                    {msg && <p className="mt-3 rounded-md border-2 border-black bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{msg}</p>}

                                    <button type="submit" disabled={submit.isPending} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border-[3px] border-black bg-[#9b2d9b] py-3.5 font-display text-base font-extrabold text-white shadow-[5px_5px_0_0_#000] transition disabled:opacity-60 active:translate-y-[4px] active:shadow-none">
                                        {submit.isPending ? <><Loader2 className="h-5 w-5 animate-spin" /> Menyimpan…</> : <><UserPlus className="h-5 w-5" strokeWidth={2.5} /> Tambah Anak</>}
                                    </button>
                                </form>

                                {/* Aside daftar anak */}
                                <aside className="rounded-2xl border-[3px] border-black bg-white p-5 shadow-[4px_4px_0_0_#000] lg:sticky lg:top-6">
                                    <div className="flex items-center justify-between">
                                        <p className="flex items-center gap-2 font-display text-sm font-extrabold"><Users className="h-4 w-4" strokeWidth={2.5} /> Anak Terdaftar</p>
                                        <span className="rounded-md border-2 border-black bg-[#ffd23f] px-2 py-0.5 text-xs font-extrabold">{added.length}</span>
                                    </div>
                                    {added.length ? (
                                        <>
                                            <ul className="mt-3 max-h-64 space-y-1.5 overflow-y-auto text-sm font-semibold">
                                                {added.map((a, i) => (
                                                    <li key={i} className="rounded-md border-2 border-black bg-[#8CC63F]/15 px-2.5 py-1.5"><div className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-700" /><span className="min-w-0 flex-1 truncate">{a.name}</span><span className="shrink-0">{rupiah(a.total)}</span></div></li>
                                                ))}
                                            </ul>
                                            <div className="mt-3 flex justify-between border-t-2 border-dashed border-black pt-3 font-display font-extrabold"><span>Total</span><span>{rupiah(grandTotal)}</span></div>
                                        </>
                                    ) : <p className="mt-3 rounded-md border-2 border-dashed border-black/30 bg-[#F5F5F7] py-6 text-center text-xs font-medium text-[#5f5e5a]">Belum ada anak ditambahkan.</p>}
                                    <button type="button" disabled={added.length === 0} onClick={() => setConfirmOpen(true)} className="mt-4 w-full rounded-full border-[3px] border-black bg-[#ffd23f] py-2.5 font-display text-sm font-extrabold shadow-[4px_4px_0_0_#000] transition disabled:opacity-50 active:translate-y-[3px] active:shadow-none">Selesai</button>
                                </aside>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal konfirmasi selesai */}
                {confirmOpen && (
                    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
                        <div className="w-full max-w-sm rounded-2xl border-[3px] border-black bg-white p-6 text-center shadow-[6px_6px_0_0_#000]">
                            <h3 className="font-display text-xl font-extrabold">Selesaikan Pendaftaran?</h3>
                            <p className="mt-1 text-sm font-medium text-[#5f5e5a]">{added.length} anak akan didaftarkan. Pastikan data sudah benar.</p>
                            <div className="mt-5 flex gap-3">
                                <button onClick={() => setConfirmOpen(false)} className="flex-1 rounded-full border-[3px] border-black bg-white py-2.5 font-display text-sm font-extrabold shadow-[4px_4px_0_0_#000] active:translate-y-[3px] active:shadow-none">Batal</button>
                                <button onClick={finalize} className="flex-1 rounded-full border-[3px] border-black bg-[#9b2d9b] py-2.5 font-display text-sm font-extrabold text-white shadow-[4px_4px_0_0_#000] active:translate-y-[3px] active:shadow-none">Ya, Selesai</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        );
    }

    function Field({ label, error, children }: { label: string; error?: string[]; children: React.ReactNode }) {
        return (
            <label className="block">
                <span className="mb-1 block font-display text-sm font-bold">{label}</span>
                {children}
                {error && <span className="mt-1 block text-xs font-semibold text-red-600">{error[0]}</span>}
            </label>
        );
    }