"use client";

import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Download, Upload, Loader2, FileSpreadsheet, CheckCircle2, AlertTriangle } from "lucide-react";
import { api, apiError, type ApiEnvelope } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Parsed = {
    header: { school: string; class_grade: string; student_name: string; group: string };
    matched_student_id: number | null;
    students: { id: number; name: string }[];
    payload: Record<string, any>;
};
const SKILLS: [string, string][] = [["skill_building", "Building"], ["skill_imagination", "Imagination"], ["skill_creativity", "Creativity"], ["skill_logic", "Logic Thinking"]];
const BEHAV: [string, string][] = [["behavior_punctual", "Attends on Time"], ["behavior_stay", "Don't Leave Early"], ["behavior_communication", "Communication"], ["behavior_responsibility", "Responsibility"]];

export function ERapotImport({ classId, year, onImported }: { classId: string; year: string; onImported: () => void }) {
    const [open, setOpen] = useState(false);
    const [parsed, setParsed] = useState<Parsed | null>(null);
    const [studentId, setStudentId] = useState("");
    const [semester, setSemester] = useState("1");
    const [err, setErr] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const downloadTemplate = async () => {
        const res = await api.get("/e-rapot/template", { responseType: "blob" });
        const url = URL.createObjectURL(res.data as Blob);
        const a = document.createElement("a"); a.href = url; a.download = "template-e-rapot.xlsx"; a.click(); URL.revokeObjectURL(url);
    };

    const parse = useMutation({
        mutationFn: async (file: File) => {
            const fd = new FormData(); fd.append("file", file); fd.append("class_id", classId);
            return (await api.post<ApiEnvelope<Parsed>>("/e-rapot/import-parse", fd)).data.data;
        },
        onSuccess: (d) => { setParsed(d); setStudentId(d.matched_student_id ? String(d.matched_student_id) : ""); setErr(null); },
        onError: (e) => setErr(apiError(e, "Gagal membaca Excel.")),
    });

    const commit = useMutation({
        mutationFn: async () => api.post("/e-rapot", { student_id: Number(studentId), class_id: Number(classId), semester: Number(semester), year: Number(year), ...parsed!.payload }),
        onSuccess: () => { setOpen(false); setParsed(null); onImported(); },
        onError: (e) => setErr(apiError(e, "Gagal menyimpan.")),
    });

    return (
        <>
            <Button variant="outline" onClick={downloadTemplate}><Download className="mr-1.5 h-4 w-4" /> Template</Button>
            <Button variant="outline" disabled={!classId} onClick={() => { setOpen(true); setParsed(null); setErr(null); }}><Upload className="mr-1.5 h-4 w-4" /> Import Excel</Button>

            <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-primary" /> Import E-Rapot dari Excel</DialogTitle></DialogHeader>

                    {!parsed ? (
                        <div className="space-y-3 py-2">
                            <p className="text-sm text-muted-foreground">Unggah file berformat sama seperti template. Data akan dicocokkan ke siswa di kelas terpilih.</p>
                            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => e.target.files?.[0] && parse.mutate(e.target.files[0])} />
                            <Button disabled={parse.isPending} onClick={() => fileRef.current?.click()}>{parse.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />} Pilih File Excel</Button>
                            {err && <p className="text-sm text-red-600">{err}</p>}
                        </div>
                    ) : (
                        <div className="space-y-4 py-2">
                            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                                <div className="font-medium">Terbaca: {parsed.header.student_name || "—"}</div>
                                <div className="text-xs text-muted-foreground">{parsed.header.school} · Kelas {parsed.header.class_grade} · Group {parsed.header.group}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-medium">Cocokkan ke siswa</label>
                                    <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                                        <option value="">— pilih siswa —</option>
                                        {parsed.students.map((s) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                                    </select>
                                    {parsed.matched_student_id ? <p className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600"><CheckCircle2 className="h-3 w-3" /> Cocok otomatis</p>
                                        : <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-600"><AlertTriangle className="h-3 w-3" /> Nama tak cocok, pilih manual</p>}
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium">Semester</label>
                                    <select value={semester} onChange={(e) => setSemester(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                                        <option value="1">Semester 1</option><option value="2">Semester 2</option>
                                    </select>
                                </div>
                            </div>

                            <div className="rounded-lg border p-3 text-xs">
                                <div className="mb-1 font-medium">Nilai terbaca</div>
                                <div className="flex flex-wrap gap-x-3 gap-y-1">
                                    {[...SKILLS, ...BEHAV].map(([k, l]) => <span key={k}>{l}: <b>{parsed.payload[k] ?? "-"}</b></span>)}
                                </div>
                                {!!parsed.payload.topics?.length && <div className="mt-1 text-muted-foreground">Topik: {parsed.payload.topics.map((t: any) => t.topic).filter(Boolean).join(", ")}</div>}
                            </div>

                            {err && <p className="text-sm text-red-600">{err}</p>}
                        </div>
                    )}

                    {parsed && (
                        <DialogFooter className="gap-2">
                            <Button variant="ghost" onClick={() => setParsed(null)}>Ganti File</Button>
                            <Button disabled={!studentId || commit.isPending} onClick={() => commit.mutate()}>{commit.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Simpan Rapot</Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}