"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MessageCircle, Save, Send, Loader2, CheckCircle2, KeyRound } from "lucide-react";
import { api, apiError, type ApiEnvelope } from "@/lib/api";
import { InternalShell } from "@/components/internal/InternalShell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type WaSettings = Record<string, string>;

const TEMPLATES: { key: string; label: string; vars: string[] }[] = [
    { key: "wa_tpl_session_start", label: "Sesi Dimulai", vars: ["sapaan", "nama_anak"] },
    { key: "wa_tpl_hadir", label: "Kehadiran — Hadir", vars: ["sapaan", "nama_anak"] },
    { key: "wa_tpl_izin", label: "Kehadiran — Izin", vars: ["sapaan", "nama_anak"] },
    { key: "wa_tpl_sakit", label: "Kehadiran — Sakit", vars: ["sapaan", "nama_anak"] },
    { key: "wa_tpl_alpha", label: "Kehadiran — Alpa", vars: ["sapaan", "nama_anak"] },
    { key: "wa_tpl_session_end", label: "Sesi Selesai", vars: ["sapaan", "nama_anak", "nama_trainer", "nomor_trainer"] },
    { key: "wa_tpl_spp_reminder", label: "Reminder SPP", vars: ["sapaan", "nama_anak"] },
    { key: "wa_tpl_payment_received", label: "Bukti Bayar Diterima", vars: ["sapaan", "nama_anak"] },
    { key: "wa_tpl_payment_confirmed", label: "Pembayaran Dikonfirmasi", vars: ["sapaan", "nama_anak"] },
];

export default function PengaturanWaPage() {
    const { data } = useQuery({ queryKey: ["wa-settings"], queryFn: async () => (await api.get<ApiEnvelope<WaSettings>>("/pengaturan/wa")).data.data });
    const [form, setForm] = useState<WaSettings>({});
    const [seeded, setSeeded] = useState(false);
    const [testPhone, setTestPhone] = useState("");
    const [testMsg, setTestMsg] = useState<string | null>(null);

    useEffect(() => { if (data && !seeded) { setForm(data); setSeeded(true); } }, [data, seeded]);
    const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

    const save = useMutation({ mutationFn: async () => api.put("/pengaturan/wa", form) });
    const test = useMutation({ mutationFn: async () => (await api.post<ApiEnvelope<{ sent: boolean }>>("/pengaturan/wa/test", { phone: testPhone })).data, onSuccess: (r) => setTestMsg(r.message), onError: (e) => setTestMsg(apiError(e, "Gagal.")) });

    const ta = "min-h-[80px] w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary";

    return (
        <InternalShell>
            <PageHeader title="Pengaturan WhatsApp" subtitle="Provider, token, dan template pesan notifikasi." />

            <div className="space-y-6">
                {/* Provider & token */}
                <Card className="border-2 p-5">
                    <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold"><KeyRound className="h-4 w-4" /> Koneksi</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5"><Label>Provider</Label>
                            <select value={form.wa_provider ?? "fonnte"} onChange={(e) => set("wa_provider", e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                                <option value="fonnte">Fonnte</option>
                                <option value="wablas">Wablas</option>
                            </select>
                        </div>
                        <div className="space-y-1.5"><Label>Token API</Label><Input value={form.wa_token ?? ""} onChange={(e) => set("wa_token", e.target.value)} placeholder="Tempel token dari provider" /></div>
                    </div>

                    <div className="mt-4 rounded-lg border bg-muted/30 p-3">
                        <div className="flex items-center gap-2"><Label className="text-xs">Kirim tes ke nomor</Label></div>
                        <div className="mt-1.5 flex gap-2">
                            <Input value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="08xxxxxxxxxx" className="max-w-xs" />
                            <Button variant="outline" disabled={!testPhone || test.isPending} onClick={() => { setTestMsg(null); test.mutate(); }}>{test.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />} Kirim Tes</Button>
                        </div>
                        {testMsg && <p className="mt-2 text-xs font-medium text-emerald-700">{testMsg}</p>}
                        <p className="mt-1 text-xs text-muted-foreground">Token kosong → pesan hanya dicatat di log (mode aman).</p>
                    </div>
                </Card>

                {/* Templates */}
                <Card className="border-2 p-5">
                    <h3 className="mb-1 flex items-center gap-1.5 text-sm font-semibold"><MessageCircle className="h-4 w-4" /> Template Pesan</h3>
                    <p className="mb-4 text-xs text-muted-foreground">Gunakan variabel dalam kurung kurawal, mis. <code>{"{nama_anak}"}</code>.</p>
                    <div className="space-y-4">
                        {TEMPLATES.map((t) => (
                            <div key={t.key}>
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                    <Label>{t.label}</Label>
                                    {t.vars.map((v) => <span key={v} className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-mono text-primary">{`{${v}}`}</span>)}
                                </div>
                                <textarea className={ta} value={form[t.key] ?? ""} onChange={(e) => set(t.key, e.target.value)} />
                            </div>
                        ))}
                    </div>
                </Card>

                <div className="flex items-center gap-3">
                    <Button disabled={save.isPending} onClick={() => save.mutate()}>{save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Simpan Pengaturan</Button>
                    {save.isSuccess && <span className="flex items-center gap-1 text-sm text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Tersimpan</span>}
                </div>
            </div>
        </InternalShell>
    );
}