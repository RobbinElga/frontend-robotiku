"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, UserPlus, Users, Loader2, CheckCircle2, Wallet, Building2, ArrowRight } from "lucide-react";
import { api, apiError, type ApiEnvelope } from "@/lib/api";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { ShirtSizeGuide } from "@/components/ui/shirt-size-guide";
import { useInstansiBatch } from "@/lib/instansi-batch-store";

type MouSchool = { id: number; name: string; registration_fee: string; price_per_cycle: string; self_managed?: boolean };
type Program = { id: number; name: string; price_per_cycle: string };
type DaftarResult = { student: { id: number; student_code: string; name: string }; invoice: { id: number; invoice_number: string; total_amount: string } };
const rupiah = (n: number | string) => "Rp" + Math.round(Number(n)).toLocaleString("id-ID");
const inputCls = "w-full rounded-md border-2 border-black bg-white px-3 py-2 font-medium outline-none transition focus:shadow-[3px_3px_0_0_#000]";

export default function DaftarInstansiPage() {
    const router = useRouter();
    const setBatch = useInstansiBatch((s) => s.setBatch);

    const [schoolId, setSchoolId] = useState("");
    const [ortu, setOrtu] = useState({ parent_name: "", greeting: "ayah", phone: "", phone_alt: "" });
    const [form, setForm] = useState({ name: "", birth_date: "", gender: "L", shirt_size: "M", school_grade: "", allergy_notes: "", photo_permission: true, program_id: "" });
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [msg, setMsg] = useState<string | null>(null);
    const [added, setAdded] = useState<{ name: string; code: string; invoiceId: number; invoiceNumber: string; total: number }[]>([]);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [done, setDone] = useState(false);

    const setO = (k: keyof typeof ortu, v: string) => setOrtu((o) => ({ ...o, [k]: v }));
    const setF = (k: keyof typeof form, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

    const { data: schools } = useQuery({ queryKey: ["sekolah-mou"], queryFn: async () => (await api.get<ApiEnvelope<MouSchool[]>>("/sekolah/mou")).data.data });
    const { data: programs } = useQuery({ queryKey: ["programs"], queryFn: async () => (await api.get<ApiEnvelope<Program[]>>("/programs")).data.data });

    const school = schools?.find((s) => String(s.id) === schoolId);
    const selectedProgram = programs?.find((p) => String(p.id) === form.program_id);
    const reg = school ? Number(school.registration_fee) : 0;
    const cycle = school ? Number(school.price_per_cycle) : 0;
    const totalPer = school ? reg + cycle : 0;
    const grandTotal = added.reduce((s, x) => s + x.total, 0);
    const ortuValid = ortu.parent_name.trim() && ortu.phone.trim();

    const submit = useMutation({
        mutationFn: async () => (await api.post<ApiEnvelope<DaftarResult>>("/daftar/instansi", {
            ...form, ...ortu, school_id: Number(schoolId), program_id: Number(form.program_id),
        })).data,
        onSuccess: (res) => {
            const inv = res.data.invoice;
            setAdded((a) => [{ name: res.data.student.name, code: res.data.student.student_code, invoiceId: inv.id, invoiceNumber: inv.invoice_number, total: Number(inv.total_amount) }, ...a]);
            setForm({ name: "", birth_date: "", gender: "L", shirt_size: "M", school_grade: "", allergy_notes: "", photo_permission: true, program_id: form.program_id });
            setErrors({}); setMsg(null);
        },
        onError: (e: any) => {
            if (e?.response?.status === 422) setErrors(e.response.data.errors ?? {});
            setMsg(apiError(e, "Gagal menambah anak."));
        },
    });

    const finalize = () => {
        setBatch({ schoolName: school?.name, items: added.map((a) => ({ name: a.name, student_code: a.code, invoice_id: a.invoiceId, invoice_number: a.invoiceNumber, total: a.total })) });
        setConfirmOpen(false);
        setDone(true);
    };

    // ---------- selesai ----------
    if (done) {
        return (
            <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
                <AnimatedBackground />
                <div className="w-full max-w-md rounded-3xl border-[3px] border-black bg-white p-7 text-center shadow-[6px_6px_0_0_#000]">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-black bg-[#8CC63F] text-white shadow-[2px_2px_0_0_#000]"><CheckCircle2 className="h-7 w-7" strokeWidth={2.5} /></span>
                    <h1 className="mt-4 font-display text-2xl font-extrabold">Pendaftaran Selesai</h1>
                    <p className="mt-1 text-sm font-medium text-[#5f5e5a]">{added.length} anak didaftarkan{school ? ` untuk ${school.name}` : ""}. Total <b>{rupiah(grandTotal)}</b>.</p>
                    <button onClick={() => router.push("/daftar/instansi/bayar")} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border-[3px] border-black bg-[#9b2d9b] py-3 font-display text-sm font-extrabold text-white shadow-[4px_4px_0_0_#000] active:translate-y-[3px] active:shadow-none">
                        <Wallet className="h-5 w-5" strokeWidth={2.5} /> Lanjut ke Pembayaran <ArrowRight className="h-4 w-4" />
                    </button>
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
                    <h1 className="font-display text-3xl font-extrabold tracking-tight">Daftar via Instansi</h1>
                    <p className="mt-1 text-sm font-medium text-[#5f5e5a]">Pilih sekolah, isi data ortu sekali, lalu tambahkan anak.</p>

                    {/* Sekolah */}
                    <div className="mt-5">
                        <span className="mb-1 flex items-center gap-2 font-display text-sm font-bold"><Building2 className="h-4 w-4" strokeWidth={2.5} /> Sekolah Mitra *</span>
                        <select className={inputCls} value={schoolId} onChange={(e) => { setSchoolId(e.target.value); setAdded([]); }}>
                            <option value="">— pilih sekolah ber-MOU —</option>
                            {schools?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    {!schoolId ? (
                        <p className="mt-6 rounded-xl border-2 border-dashed border-black/40 bg-[#F5F5F7] p-4 text-center text-sm font-semibold text-[#5f5e5a]">Pilih sekolah dulu.</p>
                    ) : school?.self_managed ? (
                        /* ---------- Sekolah kelola pendaftaran & pembayaran sendiri ---------- */
                        <div className="mt-6 rounded-2xl border-[3px] border-black bg-[#ffd23f] p-5 shadow-[4px_4px_0_0_#000]">
                            <p className="font-display text-lg font-extrabold">Pendaftaran via Sekolah Langsung</p>
                            <p className="mt-1.5 text-sm font-semibold">
                                <b>{school.name}</b> mengelola pendaftaran dan pembayaran sendiri. Silakan mendaftar langsung melalui pihak sekolah — tidak perlu mengisi formulir di sini.
                            </p>
                            <p className="mt-2 text-sm font-medium">
                                Setelah terdaftar oleh sekolah, Anda tetap bisa memantau progres, kehadiran, dan E-Rapot ananda lewat Portal Orang Tua.
                            </p>
                            <Link href="/murid" className="mt-4 inline-flex items-center gap-2 rounded-md border-2 border-black bg-[#9b2d9b] px-4 py-2 font-display text-sm font-extrabold text-white shadow-[3px_3px_0_0_#000] transition active:translate-y-[2px] active:shadow-none">
                                <Users className="h-4 w-4" strokeWidth={2.5} /> Buka Portal Orang Tua
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* Data Ortu */}
                            <div className="mt-5 rounded-2xl border-2 border-black bg-[#f6edfb] p-4">
                                <p className="mb-2 font-display text-sm font-extrabold">Data Orang Tua</p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <input className={inputCls} placeholder="Nama orang tua *" value={ortu.parent_name} onChange={(e) => setO("parent_name", e.target.value)} />
                                    <div className="flex gap-2">{(["ayah", "bunda"] as const).map((g) => <button key={g} type="button" onClick={() => setO("greeting", g)} className={`flex-1 rounded-md border-2 border-black py-2 font-display text-sm font-extrabold shadow-[2px_2px_0_0_#000] ${ortu.greeting === g ? "bg-[#9b2d9b] text-white" : "bg-white"}`}>{g === "ayah" ? "Ayah" : "Bunda"}</button>)}</div>
                                    <input className={inputCls} placeholder="No. WhatsApp *" value={ortu.phone} onChange={(e) => setO("phone", e.target.value)} inputMode="tel" />
                                    <input className={inputCls} placeholder="No. WhatsApp cadangan (opsional)" value={ortu.phone_alt} onChange={(e) => setO("phone_alt", e.target.value)} inputMode="tel" />
                                </div>
                            </div>

                            {!ortuValid ? (
                                <p className="mt-6 rounded-xl border-2 border-dashed border-black/40 bg-[#F5F5F7] p-4 text-center text-sm font-semibold text-[#5f5e5a]">Lengkapi nama & No. WhatsApp orang tua.</p>
                            ) : (
                                <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
                                    <form onSubmit={(e) => { e.preventDefault(); setErrors({}); submit.mutate(); }}>
                                        <p className="mb-3 font-display text-lg font-extrabold text-[#9b2d9b]">Data Anak</p>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <Field label="Nama anak *" error={errors.name}><input className={inputCls} value={form.name} onChange={(e) => setF("name", e.target.value)} /></Field>
                                            <Field label="Tanggal lahir *" error={errors.birth_date}><input type="date" className={inputCls} value={form.birth_date} onChange={(e) => setF("birth_date", e.target.value)} /></Field>
                                            <Field label="Jenis kelamin *" error={errors.gender}><select className={inputCls} value={form.gender} onChange={(e) => setF("gender", e.target.value)}><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></Field>

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

                                            <Field label="Kelas asal" error={errors.school_grade}><input className={inputCls} placeholder="mis. 2B" value={form.school_grade} onChange={(e) => setF("school_grade", e.target.value)} /></Field>
                                            <Field label="Program *" error={errors.program_id}><select className={inputCls} value={form.program_id} onChange={(e) => setF("program_id", e.target.value)}><option value="">— pilih program —</option>{programs?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
                                            <div className="sm:col-span-2"><Field label="Riwayat alergi (opsional)" error={errors.allergy_notes}><textarea className={inputCls} rows={2} value={form.allergy_notes} onChange={(e) => setF("allergy_notes", e.target.value)} /></Field></div>
                                            <label className="sm:col-span-2 flex items-center gap-3 rounded-md border-2 border-black bg-white p-3 font-medium"><input type="checkbox" checked={form.photo_permission} onChange={(e) => setF("photo_permission", e.target.checked)} className="h-5 w-5 accent-[#9b2d9b]" /> Izin foto/video anak untuk dokumentasi.</label>
                                        </div>

                                        {selectedProgram && (
                                            <div className="mt-4 rounded-xl border-2 border-black bg-[#fff8e1] p-4">
                                                <p className="font-display text-sm font-extrabold">Rincian Biaya</p>
                                                <div className="mt-2 space-y-1.5 text-sm font-semibold">
                                                    <div className="flex justify-between"><span className="text-[#5f5e5a]">Sekolah</span><span>{school?.name}</span></div>
                                                    <div className="flex justify-between"><span className="text-[#5f5e5a]">Program</span><span>{selectedProgram.name}</span></div>
                                                    <div className="flex justify-between"><span className="text-[#5f5e5a]">Biaya daftar</span><span>{rupiah(reg)}</span></div>
                                                    <div className="flex justify-between"><span className="text-[#5f5e5a]">Biaya 1 siklus</span><span>{rupiah(cycle)}</span></div>
                                                    <div className="my-2 border-t-2 border-dashed border-black" />
                                                    <div className="flex justify-between font-display text-base font-extrabold"><span>Total</span><span>{rupiah(totalPer)}</span></div>
                                                </div>
                                                <p className="mt-2 text-xs font-medium text-[#5f5e5a]">Harga mengikuti kesepakatan sekolah. Kode promo tidak berlaku untuk jalur instansi.</p>
                                            </div>
                                        )}

                                        {msg && <p className="mt-3 rounded-md border-2 border-black bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{msg}</p>}

                                        <button type="submit" disabled={submit.isPending} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border-[3px] border-black bg-[#9b2d9b] py-3.5 font-display text-base font-extrabold text-white shadow-[5px_5px_0_0_#000] transition disabled:opacity-60 active:translate-y-[4px] active:shadow-none">{submit.isPending ? <><Loader2 className="h-5 w-5 animate-spin" /> Menyimpan…</> : <><UserPlus className="h-5 w-5" strokeWidth={2.5} /> Tambah Anak</>}</button>
                                    </form>

                                    <aside className="rounded-2xl border-[3px] border-black bg-white p-5 shadow-[4px_4px_0_0_#000] lg:sticky lg:top-6">
                                        <div className="flex items-center justify-between"><p className="flex items-center gap-2 font-display text-sm font-extrabold"><Users className="h-4 w-4" strokeWidth={2.5} /> Anak Terdaftar</p><span className="rounded-md border-2 border-black bg-[#ffd23f] px-2 py-0.5 text-xs font-extrabold">{added.length}</span></div>
                                        {added.length ? (
                                            <>
                                                <ul className="mt-3 max-h-64 space-y-1.5 overflow-y-auto text-sm font-semibold">{added.map((a, i) => <li key={i} className="rounded-md border-2 border-black bg-[#8CC63F]/15 px-2.5 py-1.5"><div className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-700" /><span className="min-w-0 flex-1 truncate">{a.name}</span><span className="shrink-0">{rupiah(a.total)}</span></div></li>)}</ul>
                                                <div className="mt-3 flex justify-between border-t-2 border-dashed border-black pt-3 font-display font-extrabold"><span>Total</span><span>{rupiah(grandTotal)}</span></div>
                                            </>
                                        ) : <p className="mt-3 rounded-md border-2 border-dashed border-black/30 bg-[#F5F5F7] py-6 text-center text-xs font-medium text-[#5f5e5a]">Belum ada anak ditambahkan.</p>}
                                        <button type="button" disabled={added.length === 0} onClick={() => setConfirmOpen(true)} className="mt-4 w-full rounded-full border-[3px] border-black bg-[#ffd23f] py-2.5 font-display text-sm font-extrabold shadow-[4px_4px_0_0_#000] transition disabled:opacity-50 active:translate-y-[3px] active:shadow-none">Selesai</button>
                                    </aside>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {confirmOpen && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
                    <div className="w-full max-w-sm rounded-2xl border-[3px] border-black bg-white p-6 text-center shadow-[6px_6px_0_0_#000]">
                        <h3 className="font-display text-xl font-extrabold">Selesaikan Pendaftaran?</h3>
                        <p className="mt-1 text-sm font-medium text-[#5f5e5a]">{added.length} anak akan didaftarkan{school ? ` untuk ${school.name}` : ""}. Pastikan data sudah benar.</p>
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