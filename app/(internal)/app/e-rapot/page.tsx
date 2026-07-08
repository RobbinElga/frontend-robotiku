"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Pencil, PlusCircle, PenTool, AlertTriangle, ChevronDown, FileSpreadsheet } from "lucide-react";
import { api, type ApiEnvelope } from "@/lib/api";
import { InternalShell } from "@/components/internal/InternalShell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ERapotImport } from "@/components/internal/erapot-import";

type Ref = { id: number; name: string };
type Row = { id: number; name: string; student_code: string; school_grade: string | null; semester_1: number | null; semester_2: number | null };
type Matrix = { class: { id: number; name: string; program: string | null; school: string | null }; year: number; students: Row[] };

const YEARS = [new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1];

export default function ERapotPage() {
    const qc = useQueryClient();
    const [classId, setClassId] = useState("");
    const [year, setYear] = useState(String(new Date().getFullYear()));

    const { data: classes } = useQuery({ queryKey: ["erapot-kelas"], queryFn: async () => (await api.get<ApiEnvelope<Ref[]>>("/e-rapot/kelas")).data.data });
    const { data: sig } = useQuery({ queryKey: ["my-ttd"], queryFn: async () => (await api.get<ApiEnvelope<{ url: string | null }>>("/profil/tanda-tangan")).data.data });
    const { data, isLoading } = useQuery({
        queryKey: ["erapot-matrix", classId, year],
        enabled: !!classId,
        queryFn: async () => (await api.get<ApiEnvelope<Matrix>>(`/e-rapot/matrix?class_id=${classId}&year=${year}`)).data.data,
    });

    return (
        <InternalShell>
            <PageHeader
                title="E-Rapot"
                subtitle="Isi & kelola rapot per siswa. Pilih kelas dan tahun ajaran."
                action={
                    <div className="flex flex-wrap gap-2">
                        <ERapotImport classId={classId} year={year} onImported={() => qc.invalidateQueries({ queryKey: ["erapot-matrix"] })} />
                        <Link href="/app/e-rapot/tanda-tangan"><Button variant="outline"><PenTool className="mr-1.5 h-4 w-4" /> TTD</Button></Link>
                    </div>
                }
            />

            {sig && !sig.url && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <AlertTriangle className="h-4 w-4 shrink-0" /> Anda belum mengunggah tanda tangan. Rapot akan tercetak tanpa TTD.
                    <Link href="/app/e-rapot/tanda-tangan" className="ml-auto font-medium underline">Unggah sekarang</Link>
                </div>
            )}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Select value={classId} onChange={setClassId} placeholder="— pilih kelas —" options={(classes ?? []).map((c) => ({ value: String(c.id), label: c.name }))} className="sm:w-72" />
                <Select value={year} onChange={setYear} options={YEARS.map((y) => ({ value: String(y), label: `T.A. ${y}/${y + 1}` }))} className="sm:w-48" />
            </div>

            {!classId ? (
                <Card className="mt-5 border-dashed py-16 text-center text-sm text-muted-foreground">Pilih kelas untuk melihat daftar rapot siswa.</Card>
            ) : isLoading || !data ? (
                <Card className="mt-5 space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</Card>
            ) : (
                <Card className="mt-5 overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
                        <div>
                            <div className="font-semibold">{data.class.name}</div>
                            <div className="text-xs text-muted-foreground">{data.class.school ?? "Mandiri"} · {data.class.program} · T.A. {data.year}/{data.year + 1}</div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    <th className="px-4 py-3 font-medium">Siswa</th>
                                    <th className="px-4 py-3 font-medium">Kelas Asal</th>
                                    <th className="px-4 py-3 font-medium">Semester 1</th>
                                    <th className="px-4 py-3 font-medium">Semester 2</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.students.length ? data.students.map((s) => (
                                    <tr key={s.id} className="border-b last:border-0">
                                        <td className="px-4 py-3"><div className="font-medium">{s.name}</div><div className="font-mono text-xs text-muted-foreground">{s.student_code}</div></td>
                                        <td className="px-4 py-3 text-muted-foreground">{s.school_grade ?? "-"}</td>
                                        <td className="px-4 py-3"><SemCell reportId={s.semester_1} student={s.id} classId={classId} semester={1} year={year} /></td>
                                        <td className="px-4 py-3"><SemCell reportId={s.semester_2} student={s.id} classId={classId} semester={2} year={year} /></td>
                                    </tr>
                                )) : <tr><td colSpan={4} className="py-10 text-center text-muted-foreground">Belum ada murid di kelas ini.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </InternalShell>
    );
}

function SemCell({ reportId, student, classId, semester, year }: { reportId: number | null; student: number; classId: string; semester: number; year: string }) {
    const dl = async (fmt: "pdf" | "excel") => {
        const res = await api.get(`/e-rapot/${reportId}/${fmt}`, { responseType: "blob" });
        const url = URL.createObjectURL(res.data as Blob);
        const a = document.createElement("a"); a.href = url; a.download = `e-rapot-${reportId}.${fmt === "excel" ? "xlsx" : "pdf"}`; a.click(); URL.revokeObjectURL(url);
    };
    if (reportId) {
        return (
            <div className="flex items-center gap-1">
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Terisi</Badge>
                <Link href={`/app/e-rapot/${reportId}`}><Button size="icon" variant="ghost" className="h-7 w-7" title="Edit"><Pencil className="h-4 w-4" /></Button></Link>
                <Button size="icon" variant="ghost" className="h-7 w-7" title="PDF" onClick={() => dl("pdf")}><Download className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-700" title="Excel" onClick={() => dl("excel")}><FileSpreadsheet className="h-4 w-4" /></Button>
            </div>
        );
    }
    return (
        <Link href={`/app/e-rapot/baru?student=${student}&class=${classId}&semester=${semester}&year=${year}`}>
            <Button size="sm" variant="outline"><PlusCircle className="mr-1.5 h-4 w-4" /> Isi</Button>
        </Link>
    );
}

function Select({ value, onChange, options, placeholder, className }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string; className?: string }) {
    return (
        <div className={`relative ${className ?? ""}`}>
            <select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-full appearance-none rounded-md border border-input bg-background px-3 pr-9 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                {placeholder !== undefined && <option value="">{placeholder}</option>}
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
    );
}