"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Search, Loader2, Upload, CheckCircle2, Clock, FileWarning } from "lucide-react";
import { api, apiError, type ApiEnvelope } from "@/lib/api";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";

type Parent = { id: number; name: string; phone: string };
type Student = { id: number; student_code: string; name: string; parent: Parent };
type LookupData = { multiple: boolean; students: Student[] };
type Invoice = {
    id: number; invoice_number: string; total_amount: string; discount_amount: string;
    due_date: string | null; status: "belum_bayar" | "menunggu_verifikasi" | "lunas";
};
type TagihanData = { student: { id: number; name: string; student_code: string }; invoices: Invoice[] };

const rupiah = (n: number | string) => "Rp" + Math.round(Number(n)).toLocaleString("id-ID");
const inputCls = "w-full rounded-md border-2 border-black bg-white px-3 py-2 font-medium outline-none transition focus:shadow-[3px_3px_0_0_#000]";

const statusBadge: Record<Invoice["status"], { label: string; cls: string; icon: any }> = {
    belum_bayar: { label: "Belum bayar", cls: "bg-accent text-ink", icon: FileWarning },
    menunggu_verifikasi: { label: "Menunggu verifikasi", cls: "bg-[#f6edfb] text-primary", icon: Clock },
    lunas: { label: "Lunas", cls: "bg-primary text-white", icon: CheckCircle2 },
};

export default function BayarPage() {
    const qc = useQueryClient();
    const [query, setQuery] = useState("");
    const [students, setStudents] = useState<Student[] | null>(null);
    const [selected, setSelected] = useState<Student | null>(null);
    const [msg, setMsg] = useState<string | null>(null);

    const lookup = useMutation({
        mutationFn: async () => {
            const isPhone = /^[\d+\s-]+$/.test(query.trim());
            const body = isPhone ? { phone: query } : { name: query };
            return (await api.post<ApiEnvelope<LookupData>>("/auth/parent/lookup", body)).data;
        },
        onSuccess: (res) => {
            setMsg(null);
            const list = res.data.students;
            setStudents(list);
            if (list.length === 1) setSelected(list[0]); // langsung pilih kalau cuma 1
        },
        onError: (e) => { setStudents(null); setSelected(null); setMsg(apiError(e, "Data tidak ditemukan.")); },
    });

    const tagihan = useQuery({
        queryKey: ["tagihan", selected?.id],
        enabled: !!selected,
        queryFn: async () =>
            (await api.post<ApiEnvelope<TagihanData>>("/bayar/tagihan", { student_id: selected!.id, phone: selected!.parent.phone })).data.data,
    });

    function reset() { setSelected(null); setStudents(null); setQuery(""); setMsg(null); }

    return (
        <main className="relative min-h-screen overflow-hidden px-4 pb-12">
            <AnimatedBackground />

            <div className="mx-auto max-w-3xl pt-6">
                <Link href="/" className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-white px-4 py-2 font-display text-sm font-extrabold shadow-[3px_3px_0_0_#000] active:translate-y-[2px] active:shadow-none">
                    <ArrowLeft className="h-4 w-4" strokeWidth={2.5} /> Kembali
                </Link>

                {/* LOOKUP */}
                {!selected && (
                    <div className="mt-5 rounded-3xl border-[3px] border-black bg-white p-6 shadow-[6px_6px_0_0_#000] md:p-8">
                        <span className="inline-block rounded-md border-2 border-black bg-primary px-3 py-1 font-display text-xs font-extrabold uppercase tracking-wide text-white shadow-[2px_2px_0_0_#000]">
                            Portal Orang Tua
                        </span>
                        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight">Cek tagihan anak</h1>
                        <p className="mt-1 text-sm font-medium text-ink-muted">Masukkan nama anak atau nomor HP yang terdaftar</p>

                        <form onSubmit={(e) => { e.preventDefault(); lookup.mutate(); }} className="mt-5 flex gap-2">
                            <input className={inputCls} placeholder="Nama anak atau 08xxxxxxxxxx" value={query} onChange={(e) => setQuery(e.target.value)} />
                            <button type="submit" disabled={!query || lookup.isPending}
                                className="flex shrink-0 items-center gap-2 rounded-md border-2 border-black bg-accent px-5 font-display text-sm font-extrabold shadow-[3px_3px_0_0_#000] disabled:opacity-50 active:translate-y-[2px] active:shadow-none">
                                {lookup.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" strokeWidth={2.5} />} Cari
                            </button>
                        </form>
                        {msg && <p className="mt-3 text-sm font-semibold text-red-600">{msg}</p>}

                        {/* pilih anak (kalau >1) */}
                        {students && students.length > 1 && (
                            <div className="mt-5">
                                <p className="mb-2 font-display text-sm font-bold">Pilih anak:</p>
                                <div className="grid gap-3">
                                    {students.map((s) => (
                                        <button key={s.id} onClick={() => setSelected(s)}
                                            className="flex items-center justify-between rounded-xl border-[3px] border-black bg-white p-4 text-left font-display font-extrabold shadow-[4px_4px_0_0_#000] transition active:translate-y-[3px] active:shadow-none">
                                            {s.name}<span className="text-xs font-semibold text-ink-muted">{s.student_code}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAGIHAN */}
                {selected && (
                    <div className="mt-5">
                        <div className="rounded-3xl border-[3px] border-black bg-primary p-6 text-white shadow-[6px_6px_0_0_#000]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Tagihan untuk</p>
                                    <h1 className="font-display text-2xl font-extrabold">{selected.name}</h1>
                                    <p className="text-sm font-medium text-white/90">{selected.student_code}</p>
                                </div>
                                <button onClick={reset} className="rounded-full border-2 border-black bg-white px-4 py-2 font-display text-xs font-extrabold text-ink shadow-[3px_3px_0_0_#000] active:translate-y-[2px] active:shadow-none">
                                    Ganti
                                </button>
                            </div>
                        </div>

                        {tagihan.isLoading && <div className="mt-4 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}

                        <div className="mt-4 grid gap-4">
                            {tagihan.data?.invoices.map((inv) => (
                                <InvoiceCard key={inv.id} invoice={inv} phone={selected.parent.phone}
                                    onUploaded={() => qc.invalidateQueries({ queryKey: ["tagihan", selected.id] })} />
                            ))}
                            {tagihan.data && tagihan.data.invoices.length === 0 && (
                                <p className="rounded-xl border-2 border-black bg-white p-5 text-center text-sm font-semibold text-ink-muted">Belum ada tagihan.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

function InvoiceCard({ invoice, phone, onUploaded }: { invoice: Invoice; phone: string; onUploaded: () => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [open, setOpen] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const badge = statusBadge[invoice.status];
    const Icon = badge.icon;

    const upload = useMutation({
        mutationFn: async () => {
            const fd = new FormData();
            fd.append("invoice_id", String(invoice.id));
            fd.append("phone", phone);
            fd.append("file", file!);
            return (await api.post("/bayar/upload", fd)).data;
        },
        onSuccess: () => { setOpen(false); setFile(null); setErr(null); onUploaded(); },
        onError: (e) => setErr(apiError(e, "Gagal mengunggah bukti.")),
    });

    return (
        <div className="rounded-2xl border-[3px] border-black bg-white p-5 shadow-[5px_5px_0_0_#000]">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="font-display text-lg font-extrabold">{rupiah(invoice.total_amount)}</p>
                    <p className="text-xs font-semibold text-ink-muted">{invoice.invoice_number}{invoice.due_date ? ` · jatuh tempo ${invoice.due_date.slice(0, 10)}` : ""}</p>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full border-2 border-black px-3 py-1 font-display text-xs font-extrabold ${badge.cls}`}>
                    <Icon className="h-3.5 w-3.5" strokeWidth={2.5} /> {badge.label}
                </span>
            </div>

            {invoice.status === "belum_bayar" && (
                <div className="mt-4">
                    {!open ? (
                        <button onClick={() => setOpen(true)}
                            className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-accent px-4 py-2 font-display text-sm font-extrabold shadow-[3px_3px_0_0_#000] active:translate-y-[2px] active:shadow-none">
                            <Upload className="h-4 w-4" strokeWidth={2.5} /> Upload Bukti Bayar
                        </button>
                    ) : (
                        <div className="rounded-xl border-2 border-black bg-[#fff8e1] p-3">
                            <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                className="w-full text-sm font-medium file:mr-3 file:rounded-md file:border-2 file:border-black file:bg-white file:px-3 file:py-1 file:font-display file:font-extrabold" />
                            {err && <p className="mt-2 text-xs font-semibold text-red-600">{err}</p>}
                            <div className="mt-3 flex gap-2">
                                <button disabled={!file || upload.isPending} onClick={() => upload.mutate()}
                                    className="flex items-center gap-2 rounded-md border-2 border-black bg-primary px-4 py-2 font-display text-sm font-extrabold text-white shadow-[3px_3px_0_0_#000] disabled:opacity-50 active:translate-y-[2px] active:shadow-none">
                                    {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kirim"}
                                </button>
                                <button onClick={() => { setOpen(false); setFile(null); setErr(null); }}
                                    className="rounded-md border-2 border-black bg-white px-4 py-2 font-display text-sm font-extrabold shadow-[3px_3px_0_0_#000] active:translate-y-[2px] active:shadow-none">
                                    Batal
                                </button>
                            </div>
                            <p className="mt-2 text-xs font-medium text-ink-muted">JPG/PNG/PDF, maks 5MB.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}