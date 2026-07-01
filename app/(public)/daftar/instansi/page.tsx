"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
    ArrowLeft, UserPlus, FileSpreadsheet, Upload, Loader2, CheckCircle2,
    AlertTriangle, Download, Users, Building2, Wallet,
} from "lucide-react";
import { api, apiError, type ApiEnvelope } from "@/lib/api";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { useInstansiBatch } from "@/lib/instansi-batch-store";

type MouSchool = { id: number; name: string };
type Program = { id: number; name: string; registration_fee: string; price_per_cycle: string };
type PreviewRow = { row: number; name?: string; valid: boolean; errors: string[] };
type PreviewResult = { rows: PreviewRow[]; valid_count: number; error_count: number };

const inputCls =
    "w-full rounded-md border-2 border-black bg-white px-3 py-2 font-medium outline-none transition focus:shadow-[3px_3px_0_0_#000]";
const rupiah = (n: number) => "Rp" + Math.round(n).toLocaleString("id-ID");

export default function DaftarInstansiPage() {
    const [schoolId, setSchoolId] = useState("");
    const [tab, setTab] = useState<"single" | "excel">("single");

    const { data: schools } = useQuery({
        queryKey: ["sekolah-mou"],
        queryFn: async () => (await api.get<ApiEnvelope<MouSchool[]>>("/sekolah/mou")).data.data,
    });

    const schoolName = schools?.find((s) => String(s.id) === schoolId)?.name;

    return (
        <main className="relative min-h-screen overflow-hidden px-4 pb-12">
            <AnimatedBackground />
            <div className="mx-auto max-w-5xl pt-6">
                <Link href="/" className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-white px-4 py-2 font-display text-sm font-extrabold shadow-[3px_3px_0_0_#000] active:translate-y-[2px] active:shadow-none">
                    <ArrowLeft className="h-4 w-4" strokeWidth={2.5} /> Kembali
                </Link>

                <div className="mt-5 rounded-3xl border-[3px] border-black bg-white p-6 shadow-[6px_6px_0_0_#000] md:p-8">
                    <h1 className="font-display text-3xl font-extrabold tracking-tight">Daftar Murid via Instansi</h1>
                    <p className="mt-1 text-sm font-medium text-[#5f5e5a]">Pilih sekolah mitra, lalu tambahkan murid satu per satu atau unggah Excel.</p>

                    <div className="mt-5">
                        <span className="mb-1 flex items-center gap-2 font-display text-sm font-bold"><Building2 className="h-4 w-4" strokeWidth={2.5} /> Sekolah Mitra *</span>
                        <select className={inputCls} value={schoolId} onChange={(e) => setSchoolId(e.target.value)}>
                            <option value="">— pilih sekolah ber-MOU —</option>
                            {schools?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    {!schoolId ? (
                        <p className="mt-6 rounded-xl border-2 border-dashed border-black/40 bg-[#F5F5F7] p-4 text-center text-sm font-semibold text-[#5f5e5a]">
                            Pilih sekolah dulu untuk mulai mendaftarkan murid.
                        </p>
                    ) : (
                        <>
                            <div className="mt-5 flex gap-2">
                                <TabBtn active={tab === "single"} onClick={() => setTab("single")} icon={<UserPlus className="h-4 w-4" strokeWidth={2.5} />}>Satu per Satu</TabBtn>
                                <TabBtn active={tab === "excel"} onClick={() => setTab("excel")} icon={<FileSpreadsheet className="h-4 w-4" strokeWidth={2.5} />}>Upload Excel</TabBtn>
                            </div>
                            <div className="mt-6">
                                {tab === "single"
                                    ? <SingleForm schoolId={schoolId} schoolName={schoolName} />
                                    : <ExcelUpload schoolId={schoolId} />}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}

function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <button onClick={onClick}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md border-2 border-black py-2.5 font-display text-sm font-extrabold shadow-[3px_3px_0_0_#000] transition active:translate-y-[2px] active:shadow-none ${active ? "bg-[#ffd23f]" : "bg-white"}`}>
            {icon} {children}
        </button>
    );
}

// ---------------------------------------------------------------- mode 1: satu per satu
function SingleForm({ schoolId, schoolName }: { schoolId: string; schoolName?: string }) {
    const router = useRouter();
    const setBatch = useInstansiBatch((s) => s.setBatch);

    const [form, setForm] = useState({
        name: "", birth_date: "", gender: "L", shirt_size: "M",
        school_grade: "", allergy_notes: "", photo_permission: true, program_id: "",
    });
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [added, setAdded] = useState<{ name: string; code: string; invoiceId: number; invoiceNumber: string; total: number }[]>([]);
    const [done, setDone] = useState(false);
    const set = (k: keyof typeof form, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

    const { data: programs } = useQuery({
        queryKey: ["programs"],
        queryFn: async () => (await api.get<ApiEnvelope<Program[]>>("/programs")).data.data,
    });

    const selected = programs?.find((p) => String(p.id) === form.program_id);
    const reg = selected ? Number(selected.registration_fee) : 0;
    const cycle = selected ? Number(selected.price_per_cycle) : 0;
    const totalPer = reg + cycle;
    const grandTotal = added.reduce((s, x) => s + x.total, 0);

    const submit = useMutation({
        mutationFn: async () =>
            (await api.post<ApiEnvelope<{
                student: { name: string; student_code: string };
                invoice: { id: number; invoice_number: string; total_amount: string };
            }>>("/daftar/instansi", { ...form, program_id: Number(form.program_id), school_id: Number(schoolId) })).data,
        onSuccess: (res) => {
            const inv = res.data.invoice;
            setAdded((a) => [{
                name: res.data.student.name, code: res.data.student.student_code,
                invoiceId: inv.id, invoiceNumber: inv.invoice_number, total: Number(inv.total_amount),
            }, ...a]);
            setForm({ name: "", birth_date: "", gender: "L", shirt_size: "M", school_grade: "", allergy_notes: "", photo_permission: true, program_id: form.program_id });
            setErrors({});
        },
        onError: (e: any) => { if (e?.response?.status === 422) setErrors(e.response.data.errors ?? {}); },
    });

    const lanjutBayar = () => {
        setBatch({
            schoolName,
            items: added.map((a) => ({ name: a.name, student_code: a.code, invoice_id: a.invoiceId, invoice_number: a.invoiceNumber, total: a.total })),
        });
        router.push("/daftar/instansi/bayar");
    };

    if (done) {
        return (
            <div className="mx-auto max-w-md rounded-2xl border-[3px] border-black bg-white p-7 text-center shadow-[5px_5px_0_0_#000]">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-black bg-[#8CC63F] text-white shadow-[2px_2px_0_0_#000]">
                    <CheckCircle2 className="h-7 w-7" strokeWidth={2.5} />
                </span>
                <h2 className="mt-4 font-display text-2xl font-extrabold">Pendaftaran Selesai</h2>
                <p className="mt-1 text-sm font-medium text-[#5f5e5a]">
                    {added.length} murid didaftarkan{schoolName ? ` untuk ${schoolName}` : ""}. Total tagihan <b>{rupiah(grandTotal)}</b>.
                </p>
                <div className="mt-5 space-y-2.5">
                    <button onClick={lanjutBayar}
                        className="flex w-full items-center justify-center gap-2 rounded-full border-[3px] border-black bg-[#9b2d9b] py-3 font-display text-sm font-extrabold text-white shadow-[4px_4px_0_0_#000] active:translate-y-[3px] active:shadow-none">
                        <Wallet className="h-5 w-5" strokeWidth={2.5} /> Lanjut ke Pembayaran
                    </button>
                    <div className="flex gap-2.5">
                        <button onClick={() => setDone(false)}
                            className="flex-1 rounded-full border-[3px] border-black bg-white py-2.5 font-display text-sm font-extrabold shadow-[4px_4px_0_0_#000] active:translate-y-[3px] active:shadow-none">
                            Tambah Lagi
                        </button>
                        <Link href="/" className="flex-1 rounded-full border-[3px] border-black bg-white py-2.5 font-display text-sm font-extrabold shadow-[4px_4px_0_0_#000] active:translate-y-[3px] active:shadow-none">
                            Beranda
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
            <form onSubmit={(e) => { e.preventDefault(); setErrors({}); submit.mutate(); }}>
                <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Nama murid *" error={errors.name}>
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
                    <Field label="Kelas asal" error={errors.school_grade}>
                        <input className={inputCls} placeholder="mis. 2B" value={form.school_grade} onChange={(e) => set("school_grade", e.target.value)} />
                    </Field>
                    <Field label="Program *" error={errors.program_id}>
                        <select className={inputCls} value={form.program_id} onChange={(e) => set("program_id", e.target.value)}>
                            <option value="">— pilih program —</option>
                            {programs?.map((p) => <option key={p.id} value={p.id}>{p.name} — {rupiah(Number(p.price_per_cycle))}/siklus</option>)}
                        </select>
                    </Field>
                    <div className="sm:col-span-2">
                        <Field label="Riwayat alergi (opsional)" error={errors.allergy_notes}>
                            <textarea className={inputCls} rows={2} value={form.allergy_notes} onChange={(e) => set("allergy_notes", e.target.value)} />
                        </Field>
                    </div>
                    <label className="sm:col-span-2 flex items-center gap-3 rounded-md border-2 border-black bg-[#f6edfb] p-3 font-medium">
                        <input type="checkbox" checked={form.photo_permission} onChange={(e) => set("photo_permission", e.target.checked)} className="h-5 w-5 accent-[#9b2d9b]" />
                        Izin foto/video anak untuk dokumentasi.
                    </label>
                </div>

                {selected && (
                    <div className="mt-6 rounded-xl border-2 border-black bg-[#fff8e1] p-4">
                        <p className="font-display text-sm font-extrabold">Biaya Murid Ini</p>
                        <div className="mt-2 space-y-1.5 text-sm font-semibold">
                            <div className="flex justify-between"><span className="text-[#5f5e5a]">Biaya daftar</span><span>{rupiah(reg)}</span></div>
                            <div className="flex justify-between"><span className="text-[#5f5e5a]">Biaya 1 siklus</span><span>{rupiah(cycle)}</span></div>
                            <div className="my-2 border-t-2 border-dashed border-black" />
                            <div className="flex justify-between font-display text-base font-extrabold"><span>Total / murid</span><span>{rupiah(totalPer)}</span></div>
                        </div>
                        <p className="mt-2 text-xs font-medium text-[#5f5e5a]">Kode promo tidak berlaku untuk jalur instansi.</p>
                    </div>
                )}

                <button type="submit" disabled={submit.isPending}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border-[3px] border-black bg-[#9b2d9b] py-3.5 font-display text-base font-extrabold text-white shadow-[5px_5px_0_0_#000] transition disabled:opacity-60 active:translate-y-[4px] active:shadow-none">
                    {submit.isPending ? <><Loader2 className="h-5 w-5 animate-spin" /> Menyimpan…</> : <><UserPlus className="h-5 w-5" strokeWidth={2.5} /> Tambah Murid</>}
                </button>
            </form>

            <aside className="rounded-2xl border-[3px] border-black bg-white p-5 shadow-[4px_4px_0_0_#000] lg:sticky lg:top-6">
                <div className="flex items-center justify-between">
                    <p className="flex items-center gap-2 font-display text-sm font-extrabold"><Users className="h-4 w-4" strokeWidth={2.5} /> Ditambahkan</p>
                    <span className="rounded-md border-2 border-black bg-[#ffd23f] px-2 py-0.5 text-xs font-extrabold">{added.length}</span>
                </div>

                {added.length ? (
                    <>
                        <ul className="mt-3 max-h-64 space-y-1.5 overflow-y-auto text-sm font-semibold">
                            {added.map((a, i) => (
                                <li key={i} className="rounded-md border-2 border-black bg-[#8CC63F]/15 px-2.5 py-1.5">
                                    <div className="flex items-start gap-2">
                                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-700" />
                                        <span className="min-w-0 flex-1 truncate">{a.name}</span>
                                        <span className="shrink-0">{rupiah(a.total)}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-3 flex justify-between border-t-2 border-dashed border-black pt-3 font-display font-extrabold">
                            <span>Total</span><span>{rupiah(grandTotal)}</span>
                        </div>
                    </>
                ) : (
                    <p className="mt-3 rounded-md border-2 border-dashed border-black/30 bg-[#F5F5F7] py-6 text-center text-xs font-medium text-[#5f5e5a]">
                        Belum ada murid ditambahkan.
                    </p>
                )}

                <button type="button" disabled={added.length === 0} onClick={() => setDone(true)}
                    className="mt-4 w-full rounded-full border-[3px] border-black bg-[#ffd23f] py-2.5 font-display text-sm font-extrabold shadow-[4px_4px_0_0_#000] transition disabled:opacity-50 active:translate-y-[3px] active:shadow-none">
                    Selesai
                </button>
            </aside>
        </div>
    );
}

// ---------------------------------------------------------------- mode 2: upload Excel
function ExcelUpload({ schoolId }: { schoolId: string }) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [programId, setProgramId] = useState("");
    const [preview, setPreview] = useState<PreviewResult | null>(null);
    const [imported, setImported] = useState<number | null>(null);
    const [msg, setMsg] = useState<string | null>(null);

    const { data: programs } = useQuery({
        queryKey: ["programs"],
        queryFn: async () => (await api.get<ApiEnvelope<Program[]>>("/programs")).data.data,
    });

    const doPreview = useMutation({
        mutationFn: async () => {
            const fd = new FormData(); fd.append("file", file!); fd.append("school_id", schoolId);
            return (await api.post<ApiEnvelope<PreviewResult>>("/daftar/instansi/preview", fd)).data.data;
        },
        onSuccess: (d) => { setPreview(d); setImported(null); setMsg(null); },
        onError: (e) => { setPreview(null); setMsg(apiError(e, "Gagal membaca file.")); },
    });

    const doImport = useMutation({
        mutationFn: async () => {
            const fd = new FormData();
            fd.append("file", file!); fd.append("school_id", schoolId); fd.append("program_id", programId);
            return (await api.post<ApiEnvelope<{ imported: number }>>("/daftar/instansi/import", fd)).data.data;
        },
        onSuccess: (d) => { setImported(d.imported); setPreview(null); setFile(null); if (fileRef.current) fileRef.current.value = ""; },
        onError: (e) => setMsg(apiError(e, "Gagal mengimpor.")),
    });

    const downloadTemplate = () => window.open("/templates/template-murid-instansi.xlsx", "_blank");

    return (
        <div className="space-y-4">
            <button onClick={downloadTemplate}
                className="inline-flex items-center gap-2 rounded-md border-2 border-black bg-white px-4 py-2 font-display text-sm font-extrabold shadow-[3px_3px_0_0_#000] active:translate-y-[2px] active:shadow-none">
                <Download className="h-4 w-4" strokeWidth={2.5} /> Unduh Template Excel
            </button>

            <div>
                <span className="mb-1 block font-display text-sm font-bold">Program untuk semua murid *</span>
                <select className={inputCls} value={programId} onChange={(e) => setProgramId(e.target.value)}>
                    <option value="">— pilih program —</option>
                    {programs?.map((p) => <option key={p.id} value={p.id}>{p.name} — {rupiah(Number(p.price_per_cycle))}/siklus</option>)}
                </select>
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-black bg-[#F5F5F7] py-8 text-center font-medium text-[#5f5e5a] hover:bg-white">
                <FileSpreadsheet className="h-8 w-8" strokeWidth={2} />
                {file ? <span className="font-display font-extrabold text-black">{file.name}</span> : <span>Ketuk untuk pilih file .xlsx</span>}
                <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
                    onChange={(e) => { setFile(e.target.files?.[0] ?? null); setPreview(null); setImported(null); setMsg(null); }} />
            </label>

            {msg && <p className="text-sm font-semibold text-red-600">{msg}</p>}

            <button disabled={!file || doPreview.isPending} onClick={() => doPreview.mutate()}
                className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-black bg-[#ffd23f] py-2.5 font-display text-sm font-extrabold shadow-[3px_3px_0_0_#000] transition disabled:opacity-50 active:translate-y-[2px] active:shadow-none">
                {doPreview.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" strokeWidth={2.5} />} Preview
            </button>

            {preview && (
                <div className="rounded-xl border-2 border-black bg-white p-4">
                    <div className="flex flex-wrap gap-2 text-sm font-extrabold">
                        <span className="rounded-md border-2 border-black bg-[#8CC63F]/30 px-2.5 py-1">{preview.valid_count} valid</span>
                        {preview.error_count > 0 && <span className="rounded-md border-2 border-black bg-red-100 px-2.5 py-1 text-red-700">{preview.error_count} error</span>}
                    </div>

                    <div className="mt-3 max-h-72 overflow-y-auto rounded-md border-2 border-black">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[#F5F5F7] font-display">
                                <tr><th className="px-3 py-2">Baris</th><th className="px-3 py-2">Nama</th><th className="px-3 py-2">Status</th></tr>
                            </thead>
                            <tbody>
                                {preview.rows.map((r) => (
                                    <tr key={r.row} className={`border-t border-black/10 ${!r.valid ? "bg-red-50" : ""}`}>
                                        <td className="px-3 py-2 font-mono">{r.row}</td>
                                        <td className="px-3 py-2">{r.name ?? "—"}</td>
                                        <td className="px-3 py-2">
                                            {r.valid
                                                ? <span className="inline-flex items-center gap-1 font-semibold text-green-700"><CheckCircle2 className="h-3.5 w-3.5" /> Valid</span>
                                                : <span className="inline-flex items-start gap-1 font-semibold text-red-700"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {r.errors.join(", ")}</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <button disabled={preview.valid_count === 0 || !programId || doImport.isPending} onClick={() => doImport.mutate()}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border-[3px] border-black bg-[#9b2d9b] py-3 font-display text-sm font-extrabold text-white shadow-[4px_4px_0_0_#000] transition disabled:opacity-50 active:translate-y-[3px] active:shadow-none">
                        {doImport.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Mengimpor…</> : <>Import {preview.valid_count} Baris Valid</>}
                    </button>
                    {!programId && <p className="mt-2 text-center text-xs font-semibold text-red-600">Pilih program dulu sebelum import.</p>}
                    {preview.error_count > 0 && <p className="mt-2 text-center text-xs font-medium text-[#5f5e5a]">Baris error dilewati; perbaiki lalu unggah ulang.</p>}
                </div>
            )}

            {imported !== null && (
                <div className="flex items-center gap-2 rounded-xl border-[3px] border-black bg-[#8CC63F]/20 p-4 font-display font-extrabold shadow-[4px_4px_0_0_#000]">
                    <CheckCircle2 className="h-5 w-5 text-green-700" /> {imported} murid berhasil diimpor.
                </div>
            )}
        </div>
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