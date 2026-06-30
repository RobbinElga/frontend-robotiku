"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, apiError, type ApiEnvelope } from "@/lib/api";
import { SchoolShell } from "@/components/sekolah/SchoolShell";

type Program = { id: number; name: string; price_per_cycle: string };
type Result = { student: { student_code: string; name: string }; invoice: { invoice_number: string; total_amount: string; due_date: string; status: string } };
const rupiah = (n: number | string) => "Rp" + Math.round(Number(n)).toLocaleString("id-ID");

function FieldErr({ e }: { e?: string[] }) {
    return e ? <p className="mt-1 text-xs font-medium text-destructive">{e[0]}</p> : null;
}

function DaftarInstansiInner() {
    const [form, setForm] = useState({
        name: "", birth_date: "", gender: "L", shirt_size: "M",
        school_grade: "", allergy_notes: "", photo_permission: true, class_id: "",
    });
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [result, setResult] = useState<Result | null>(null);
    const set = (k: keyof typeof form, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

    const { data: programs } = useQuery({ queryKey: ["programs"], queryFn: async () => (await api.get<ApiEnvelope<Program[]>>("/programs")).data.data });

    const submit = useMutation({
        mutationFn: async () => (await api.post<ApiEnvelope<Result>>("/sekolah/murid", { ...form, class_id: Number(form.class_id) })).data,
        onSuccess: (res) => { setErrors({}); setResult(res.data); },
        onError: (e: any) => { if (e?.response?.status === 422) setErrors(e.response.data.errors ?? {}); },
    });

    if (result) {
        return (
            <div className="mx-auto max-w-lg">
                <Card>
                    <CardContent className="pt-6 text-center">
                        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
                        <h2 className="mt-3 text-xl font-semibold">Murid berhasil didaftarkan</h2>
                        <div className="mt-4 space-y-2 rounded-lg border bg-muted/30 p-4 text-left text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">Nama</span><span className="font-medium">{result.student.name}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Kode siswa</span><span className="font-medium">{result.student.student_code}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Invoice</span><span className="font-medium">{result.invoice.invoice_number}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-medium">{rupiah(result.invoice.total_amount)}</span></div>
                        </div>
                        <div className="mt-5 flex gap-3">
                            <Button className="flex-1" onClick={() => { setResult(null); setForm({ ...form, name: "", birth_date: "", school_grade: "", allergy_notes: "" }); }}>Daftarkan lagi</Button>
                            <Button asChild variant="outline" className="flex-1"><Link href="/sekolah/dashboard">Ke Dashboard</Link></Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight">Daftarkan Murid</h1>
                <p className="text-sm text-muted-foreground">Tambahkan satu murid dari sekolah Anda ke program Robotiku.</p>
            </div>

            <Card>
                <CardHeader><CardTitle className="text-base">Data Murid</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={(e) => { e.preventDefault(); submit.mutate(); }} className="grid gap-5 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <Label>Nama murid *</Label>
                            <Input className="mt-1" value={form.name} onChange={(e) => set("name", e.target.value)} />
                            <FieldErr e={errors.name} />
                        </div>

                        <div>
                            <Label>Tanggal lahir *</Label>
                            <Input type="date" className="mt-1" value={form.birth_date} onChange={(e) => set("birth_date", e.target.value)} />
                            <FieldErr e={errors.birth_date} />
                        </div>

                        <div>
                            <Label>Jenis kelamin *</Label>
                            <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="L">Laki-laki</SelectItem>
                                    <SelectItem value="P">Perempuan</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Ukuran kaos</Label>
                            <Select value={form.shirt_size} onValueChange={(v) => set("shirt_size", v)}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {["S", "M", "L", "XL"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Kelas asal</Label>
                            <Input className="mt-1" placeholder="mis. 4A" value={form.school_grade} onChange={(e) => set("school_grade", e.target.value)} />
                        </div>

                        <div className="sm:col-span-2">
                            <Label>Program *</Label>
                            <Select value={form.class_id} onValueChange={(v) => set("class_id", v)}>
                                <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih program" /></SelectTrigger>
                                <SelectContent>
                                    {programs?.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name} — {rupiah(p.price_per_cycle)}/siklus</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FieldErr e={errors.class_id} />
                        </div>

                        <div className="sm:col-span-2">
                            <Label>Riwayat alergi (opsional)</Label>
                            <Textarea className="mt-1" rows={2} value={form.allergy_notes} onChange={(e) => set("allergy_notes", e.target.value)} />
                        </div>

                        <label className="sm:col-span-2 flex items-center gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
                            <Checkbox checked={form.photo_permission} onCheckedChange={(v) => set("photo_permission", Boolean(v))} />
                            Izinkan foto/video murid untuk dokumentasi.
                        </label>

                        <div className="sm:col-span-2">
                            <Button type="submit" disabled={submit.isPending} className="w-full sm:w-auto">
                                {submit.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan…</> : "Daftarkan Murid"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default function Page() {
    return <SchoolShell><DaftarInstansiInner /></SchoolShell>;
}