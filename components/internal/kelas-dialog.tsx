"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Star, School as SchoolIcon, Users2, GraduationCap, Info, ChevronDown, CalendarDays, Loader2 } from "lucide-react";
import { api, type ApiEnvelope } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type Ref = { id: number; name: string };
export type KelasForDialog = {
    id: number; name: string; schedule: string | null; capacity: number;
    program_id: number | null; school_id: number | null;
    meetings_per_period?: number | null; total_periods?: number | null;
    trainers?: { id: number; name: string; pivot?: { role: "utama" | "pengganti" } }[];
};

type TrainerRow = { trainer_id: string; role: "utama" | "pengganti" };
type FormState = { name: string; schedule: string; capacity: string; program_id: string; school_id: string; meetings_per_period: string; total_periods: string; trainers: TrainerRow[] };

const selectCls =
    "h-10 w-full appearance-none rounded-md border border-input bg-background px-3 pr-9 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50";

function Dropdown({ value, onChange, placeholder, options, className }: {
    value: string; onChange: (v: string) => void; placeholder?: string; options: { value: string; label: string }[]; className?: string;
}) {
    return (
        <div className={`relative ${className ?? ""}`}>
            <select value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>
                {placeholder !== undefined && <option value="">{placeholder}</option>}
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
    );
}

export function KelasDialog({ open, kelas, onClose }: { open: boolean; kelas: KelasForDialog | null; onClose: () => void }) {
    const qc = useQueryClient();
    const isEdit = !!kelas;
    const [form, setForm] = useState<FormState>({ name: "", schedule: "", capacity: "", program_id: "", school_id: "", meetings_per_period: "4", total_periods: "", trainers: [] });
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [seededFor, setSeededFor] = useState<number | "new" | null>(null);

    const key = kelas ? kelas.id : "new";
    if (open && seededFor !== key) {
        setForm({
            name: kelas?.name ?? "", schedule: kelas?.schedule ?? "",
            capacity: kelas ? String(kelas.capacity) : "",
            program_id: kelas?.program_id ? String(kelas.program_id) : "",
            school_id: kelas?.school_id ? String(kelas.school_id) : "",
            meetings_per_period: kelas?.meetings_per_period ? String(kelas.meetings_per_period) : "4",
            total_periods: kelas?.total_periods ? String(kelas.total_periods) : "",
            trainers: (kelas?.trainers ?? []).map((t) => ({ trainer_id: String(t.id), role: t.pivot?.role ?? "pengganti" })),
        });
        setErrors({}); setSeededFor(key);
    }
    if (!open && seededFor !== null) setSeededFor(null);

    const { data: trainers } = useQuery({ queryKey: ["trainers"], enabled: open, queryFn: async () => (await api.get<ApiEnvelope<Ref[]>>("/trainers")).data.data });
    const { data: programs } = useQuery({ queryKey: ["programs"], enabled: open, queryFn: async () => (await api.get<ApiEnvelope<Ref[]>>("/programs")).data.data });
    const { data: schools } = useQuery({ queryKey: ["sekolah-mou"], enabled: open, queryFn: async () => (await api.get<ApiEnvelope<Ref[]>>("/sekolah/mou")).data.data });
    const { data: mouPeriode, isFetching: mouLoading } = useQuery({
        queryKey: ["mou-periode", form.school_id],
        enabled: open && !!form.school_id,
        queryFn: async () => (await api.get<ApiEnvelope<{ periods: number | null }>>("/mou/periode", { params: { school_id: form.school_id } })).data.data,
    });

    const isMandiri = !form.school_id;

    const addTrainer = () => setForm((f) => ({ ...f, trainers: [...f.trainers, { trainer_id: "", role: f.trainers.some((t) => t.role === "utama") ? "pengganti" : "utama" }] }));
    const setTrainer = (i: number, patch: Partial<TrainerRow>) => setForm((f) => ({ ...f, trainers: f.trainers.map((t, idx) => (idx === i ? { ...t, ...patch } : t)) }));
    const delTrainer = (i: number) => setForm((f) => ({ ...f, trainers: f.trainers.filter((_, idx) => idx !== i) }));
    const setUtama = (i: number) => setForm((f) => ({ ...f, trainers: f.trainers.map((t, idx) => ({ ...t, role: idx === i ? "utama" : "pengganti" })) }));

    const usedTrainerIds = form.trainers.map((t) => t.trainer_id).filter(Boolean);

    const save = useMutation({
        mutationFn: async () => {
            const payload = {
                name: form.name, schedule: form.schedule || null, capacity: Number(form.capacity),
                program_id: form.program_id ? Number(form.program_id) : null,
                school_id: form.school_id ? Number(form.school_id) : null,
                meetings_per_period: form.meetings_per_period ? Number(form.meetings_per_period) : null,
                total_periods: isMandiri ? (form.total_periods ? Number(form.total_periods) : null) : null, // instansi → otomatis dari MoU
                trainers: form.trainers.filter((t) => t.trainer_id).map((t) => ({ trainer_id: Number(t.trainer_id), role: t.role })),
            };
            return isEdit ? api.put(`/kelas/${kelas!.id}`, payload) : api.post("/kelas", payload);
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["kelas"] }); onClose(); },
        onError: (e: any) => { if (e?.response?.status === 422) setErrors(e.response.data.errors ?? {}); },
    });

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto p-0 sm:max-w-lg">
                <DialogHeader className="border-b px-6 py-4">
                    <DialogTitle className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><GraduationCap className="h-4 w-4" /></span>
                        {isEdit ? "Edit Kelas" : "Buat Kelas Baru"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-5 p-6">
                    <Section title="Identitas Kelas" icon={<Info className="h-4 w-4" />}>
                        <Field label="Nama kelas" error={errors.name}>
                            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="mis. Kelas A2" />
                        </Field>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Field label="Jadwal" error={errors.schedule}>
                                <Input value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="Sabtu, 09.00" />
                            </Field>
                            <Field label="Kapasitas" error={errors.capacity}>
                                <Input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="15" />
                            </Field>
                        </div>
                    </Section>

                    <Section title="Penempatan" icon={<SchoolIcon className="h-4 w-4" />}>
                        <Field label="Sekolah" error={errors.school_id} hint="Pilih Mandiri untuk kelas tanpa sekolah.">
                            <Dropdown value={form.school_id} onChange={(v) => setForm({ ...form, school_id: v })}
                                options={[{ value: "", label: "Mandiri (tanpa sekolah)" }, ...(schools ?? []).map((s) => ({ value: String(s.id), label: s.name }))]} />
                        </Field>
                        <Field label="Program" error={errors.program_id} hint="Hanya murid program ini yang bisa ditempatkan.">
                            <Dropdown value={form.program_id} onChange={(v) => setForm({ ...form, program_id: v })}
                                placeholder="Pilih program" options={(programs ?? []).map((p) => ({ value: String(p.id), label: p.name }))} />
                        </Field>
                    </Section>

                    <Section title="Periode & Tagihan" icon={<CalendarDays className="h-4 w-4" />}>
                        <Field label="Pertemuan per periode" error={errors.meetings_per_period} hint="Jumlah 'hadir' yang memicu 1 tagihan periode berikutnya.">
                            <Input type="number" min={1} value={form.meetings_per_period} onChange={(e) => setForm({ ...form, meetings_per_period: e.target.value })} placeholder="4" />
                        </Field>
                        {isMandiri ? (
                            <Field label="Jumlah periode" error={errors.total_periods} hint="Kelas selesai setelah sejumlah periode ini; murid otomatis nonaktif.">
                                <Input type="number" min={1} value={form.total_periods} onChange={(e) => setForm({ ...form, total_periods: e.target.value })} placeholder="mis. 6" />
                            </Field>
                        ) : (
                            <div className="space-y-1.5">
                                <Label className="text-xs">Jumlah periode (dari MoU)</Label>
                                {mouLoading ? (
                                    <div className="flex h-10 items-center gap-2 rounded-md border bg-muted/30 px-3 text-sm text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" /> Memuat periode MoU…
                                    </div>
                                ) : mouPeriode?.periods ? (
                                    <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm">
                                        <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
                                        <span className="font-semibold text-primary">{mouPeriode.periods} periode</span>
                                        <span className="text-xs text-muted-foreground">— otomatis dari MoU sekolah</span>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                        Sekolah ini belum punya MoU dengan jumlah periode. Lengkapi MoU dulu di Canvas sebelum membuat kelas.
                                    </div>
                                )}
                            </div>
                        )}
                    </Section>

                    <Section title="Trainer" icon={<Users2 className="h-4 w-4" />}
                        action={<Button type="button" size="sm" variant="outline" onClick={addTrainer}><Plus className="mr-1 h-3.5 w-3.5" /> Tambah</Button>}>
                        {form.trainers.length === 0 ? (
                            <div className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">Belum ada trainer — klik "Tambah".</div>
                        ) : (
                            <div className="space-y-2">
                                {form.trainers.map((t, i) => {
                                    const isUtama = t.role === "utama";
                                    const options = (trainers ?? [])
                                        .filter((tr) => String(tr.id) === t.trainer_id || !usedTrainerIds.includes(String(tr.id)))
                                        .map((tr) => ({ value: String(tr.id), label: tr.name }));
                                    return (
                                        <div key={i} className={`flex items-center gap-2 rounded-lg border p-2 ${isUtama ? "border-primary/40 bg-primary/5" : "bg-muted/30"}`}>
                                            <button type="button" onClick={() => setUtama(i)} title="Jadikan trainer utama"
                                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${isUtama ? "border-primary bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`}>
                                                <Star className={`h-4 w-4 ${isUtama ? "fill-white" : ""}`} />
                                            </button>
                                            <Dropdown className="min-w-0 flex-1" value={t.trainer_id} onChange={(v) => setTrainer(i, { trainer_id: v })} placeholder="Pilih trainer" options={options} />
                                            <span className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-bold ${isUtama ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                                                {isUtama ? "UTAMA" : "PENGGANTI"}
                                            </span>
                                            <Button type="button" size="icon" variant="ghost" className="h-9 w-9 shrink-0 text-red-600" onClick={() => delTrainer(i)}><X className="h-4 w-4" /></Button>
                                        </div>
                                    );
                                })}
                                <p className="text-xs text-muted-foreground">⭐ = Trainer Utama. Sisanya otomatis Pengganti.</p>
                            </div>
                        )}
                    </Section>

                    <DialogFooter className="gap-2">
                        <Button type="button" variant="ghost" onClick={onClose}>Batal</Button>
                        <Button type="submit" disabled={save.isPending}>{save.isPending ? "Menyimpan…" : isEdit ? "Simpan Perubahan" : "Buat Kelas"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function Section({ title, icon, action, children }: { title: string; icon: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border p-4">
            <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">{icon} {title}</span>
                {action}
            </div>
            <div className="space-y-3">{children}</div>
        </div>
    );
}

function Field({ label, error, hint, children }: { label: string; error?: string[]; hint?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs">{label}</Label>
            {children}
            {hint && !error && <p className="text-[11px] text-muted-foreground">{hint}</p>}
            {error && <p className="text-xs text-red-600">{error[0]}</p>}
        </div>
    );
}