"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Plus, X, Save, Download, Loader2, AlertTriangle, FileSpreadsheet } from "lucide-react";
import { api, type ApiEnvelope } from "@/lib/api";
import { InternalShell } from "@/components/internal/InternalShell";
import { AuthImage } from "@/components/ui/auth-image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Topic = { topic: string; activity: string };
type Head = { student: string; student_code: string; school_grade: string | null; school: string | null; group: string | null };
const SKILLS: [string, string][] = [["skill_building", "Building"], ["skill_imagination", "Imagination"], ["skill_creativity", "Creativity"], ["skill_logic", "Logic Thinking"]];
const BEHAV: [string, string][] = [["behavior_punctual", "Attends on Time"], ["behavior_stay", "Don't Leave Class Early"], ["behavior_communication", "Communication"], ["behavior_responsibility", "Responsibility"]];
const GRADES = ["A", "B", "C", "D", "E"];
const GRADE_ACTIVE: Record<string, string> = { A: "bg-emerald-500 text-white border-emerald-500", B: "bg-lime-500 text-white border-lime-500", C: "bg-amber-500 text-white border-amber-500", D: "bg-orange-500 text-white border-orange-500", E: "bg-red-500 text-white border-red-500" };

type Form = Record<string, string> & { comments: string; report_place: string; report_date: string };
const EMPTY: Form = { skill_building: "", skill_imagination: "", skill_creativity: "", skill_logic: "", behavior_punctual: "", behavior_stay: "", behavior_communication: "", behavior_responsibility: "", comments: "", report_place: "Pontianak", report_date: "" };

export default function ERapotEditorPage() {
    const { id } = useParams<{ id: string }>();
    const sp = useSearchParams();
    const router = useRouter();
    const isNew = id === "baru";

    const studentId = isNew ? sp.get("student") : null;
    const classId = isNew ? sp.get("class") : null;
    const semester = Number(isNew ? sp.get("semester") : 1) || 1;
    const yearQ = Number(isNew ? sp.get("year") : new Date().getFullYear());

    const [head, setHead] = useState<Head | null>(null);
    const [ctx, setCtx] = useState<{ student_id: number; class_id: number; semester: number; year: number } | null>(null);
    const [form, setForm] = useState<Form>({ ...EMPTY });
    const [topics, setTopics] = useState<Topic[]>([{ topic: "", activity: "" }]);
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    const { data: sig } = useQuery({ queryKey: ["my-ttd"], queryFn: async () => (await api.get<ApiEnvelope<{ url: string | null }>>("/profil/tanda-tangan")).data.data });
    const sigPath = sig?.url?.replace("/api/v1/media/", "") ?? null;

    const prefill = useQuery({
        queryKey: ["erapot-prefill", studentId, classId],
        enabled: isNew && !!studentId && !!classId,
        queryFn: async () => (await api.get<ApiEnvelope<any>>(`/e-rapot/prefill?student_id=${studentId}&class_id=${classId}`)).data.data,
    });
    const loaded = useQuery({
        queryKey: ["erapot", id],
        enabled: !isNew,
        queryFn: async () => (await api.get<ApiEnvelope<any>>(`/e-rapot/${id}`)).data.data,
    });

    useEffect(() => {
        if (isNew && prefill.data) {
            setHead({ student: prefill.data.student.name, student_code: prefill.data.student.student_code, school_grade: prefill.data.student.school_grade, school: prefill.data.student.school, group: prefill.data.class.name });
            setCtx({ student_id: prefill.data.student.id, class_id: prefill.data.class.id, semester, year: yearQ });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isNew, prefill.data]);

    useEffect(() => {
        if (!isNew && loaded.data) {
            const r = loaded.data;
            setHead({ student: r.student.name, student_code: r.student.student_code, school_grade: r.student.school_grade, school: r.student.school?.name ?? r.student.school_origin, group: r.kelas?.name });
            setCtx({ student_id: r.student_id, class_id: r.class_id, semester: r.semester, year: r.year });
            setForm({ ...EMPTY, ...Object.fromEntries([...SKILLS, ...BEHAV].map(([k]) => [k, r[k] ?? ""])), comments: r.comments ?? "", report_place: r.report_place ?? "Pontianak", report_date: r.report_date ? String(r.report_date).slice(0, 10) : "" });
            setTopics(r.topics?.length ? r.topics : [{ topic: "", activity: "" }]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isNew, loaded.data]);

    const setG = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

    const save = useMutation({
        mutationFn: async () => {
            const payload = { ...ctx, ...form, topics: topics.filter((t) => t.topic || t.activity) };
            return isNew ? api.post("/e-rapot", payload) : api.put(`/e-rapot/${id}`, payload);
        },
        onSuccess: () => router.push("/app/e-rapot"),
        onError: (e: any) => { if (e?.response?.status === 422) setErrors(e.response.data.errors ?? {}); else alert(e?.response?.data?.message ?? "Gagal menyimpan."); },
    });

    const dl = async (fmt: "pdf" | "excel") => {
        const res = await api.get(`/e-rapot/${id}/${fmt}`, { responseType: "blob" });
        const url = URL.createObjectURL(res.data as Blob);
        const a = document.createElement("a"); a.href = url; a.download = `e-rapot-${id}.${fmt === "excel" ? "xlsx" : "pdf"}`; a.click(); URL.revokeObjectURL(url);
    };

    if ((isNew && prefill.isLoading) || (!isNew && loaded.isLoading) || !head) return <InternalShell><Skeleton className="h-96 w-full rounded-xl" /></InternalShell>;

    return (
        <InternalShell>
            <div className="w-full">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <Link href="/app/e-rapot" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Kembali</Link>
                    <div className="flex gap-2">
                        {!isNew && <Button variant="outline" onClick={() => dl("pdf")}><Download className="mr-1.5 h-4 w-4" /> PDF</Button>}
                        {!isNew && <Button variant="outline" onClick={() => dl("excel")}><FileSpreadsheet className="mr-1.5 h-4 w-4" /> Excel</Button>}
                        <Button disabled={save.isPending} onClick={() => save.mutate()}>{save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Simpan</Button>
                    </div>
                </div>

                {sig && !sig.url && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                        <AlertTriangle className="h-4 w-4" /> Belum ada tanda tangan. <Link href="/app/e-rapot/tanda-tangan" className="font-medium underline">Unggah TTD</Link> agar tercetak otomatis.
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* FORM */}
                    <div className="space-y-4">
                        <Card className="p-5">
                            <h3 className="mb-3 text-sm font-semibold">Identitas</h3>
                            <dl className="grid grid-cols-2 gap-3 text-sm">
                                <Info label="School" value={head.school} />
                                <Info label="Class" value={head.school_grade} />
                                <Info label="Student" value={head.student} />
                                <Info label="Group" value={head.group} />
                                <Info label="Semester" value={String(ctx?.semester)} />
                                <Info label="Tahun Ajaran" value={ctx ? `${ctx.year}/${ctx.year + 1}` : ""} />
                            </dl>
                        </Card>

                        <Card className="p-5">
                            <div className="mb-2 flex items-center justify-between">
                                <h3 className="text-sm font-semibold">Topics & Activities</h3>
                                <Button size="sm" variant="outline" onClick={() => setTopics((t) => [...t, { topic: "", activity: "" }])}><Plus className="mr-1 h-3.5 w-3.5" /> Baris</Button>
                            </div>
                            <div className="space-y-2">
                                {topics.map((t, i) => (
                                    <div key={i} className="flex gap-2">
                                        <Input placeholder="Topik (mis. Basic Robot)" value={t.topic} onChange={(e) => setTopics((a) => a.map((x, j) => j === i ? { ...x, topic: e.target.value } : x))} />
                                        <Input placeholder="Aktivitas (mis. Lego Bricks)" value={t.activity} onChange={(e) => setTopics((a) => a.map((x, j) => j === i ? { ...x, activity: e.target.value } : x))} />
                                        <Button size="icon" variant="ghost" className="shrink-0 text-red-600" onClick={() => setTopics((a) => a.filter((_, j) => j !== i))}><X className="h-4 w-4" /></Button>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card className="p-5">
                            <h3 className="mb-2 text-sm font-semibold">Skills</h3>
                            {SKILLS.map(([k, l]) => <GradeRow key={k} label={l} value={form[k]} onChange={(v) => setG(k, v)} error={errors[k]} />)}
                            <h3 className="mb-2 mt-4 text-sm font-semibold">Behaviour</h3>
                            {BEHAV.map(([k, l]) => <GradeRow key={k} label={l} value={form[k]} onChange={(v) => setG(k, v)} error={errors[k]} />)}
                        </Card>

                        <Card className="p-5">
                            <Label className="text-xs">Comments</Label>
                            <textarea value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })} rows={5} className="mt-1 w-full resize-y rounded-md border border-input bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Deskripsi perkembangan ananda…" />
                            <div className="mt-3 grid grid-cols-2 gap-3">
                                <div><Label className="text-xs">Tempat</Label><Input value={form.report_place} onChange={(e) => setForm({ ...form, report_place: e.target.value })} /></div>
                                <div><Label className="text-xs">Tanggal</Label><Input type="date" value={form.report_date} onChange={(e) => setForm({ ...form, report_date: e.target.value })} /></div>
                            </div>
                        </Card>
                    </div>

                    {/* PRATINJAU */}
                    <Card className="h-fit overflow-hidden lg:sticky lg:top-4">
                        <div className="border-b bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">Pratinjau Rapot</div>
                        <div className="space-y-3 p-6 text-[13px]">
                            <div className="text-center">
                                <div className="text-lg font-bold">ROBOTIKU INDONESIA</div>
                                <div className="text-xs font-semibold">TAHUN AJARAN {ctx?.year}/{(ctx?.year ?? 0) + 1} ROBOTIKU CLUB REPORT CARD</div>
                            </div>
                            <table className="w-full"><tbody>
                                <tr><td className="w-28 font-semibold">School</td><td>: {head.school || "-"}</td><td className="w-20 font-semibold">Class</td><td>: {head.school_grade || "-"}</td></tr>
                                <tr><td className="font-semibold">Student</td><td>: {head.student}</td><td className="font-semibold">Semester</td><td>: {ctx?.semester}</td></tr>
                                <tr><td className="font-semibold">Group</td><td>: {head.group || "-"}</td><td /><td /></tr>
                            </tbody></table>
                            <div className="rounded bg-muted px-2 py-1 text-center text-xs font-semibold">A: Very Good · B: Good · C: Average · D: Poor · E: Very Poor</div>
                            {topics.some((t) => t.topic || t.activity) && (
                                <table className="w-full border border-black">
                                    <tbody>
                                        <tr><td className="border border-black bg-muted text-center font-bold" colSpan={2}>Topics and Activities</td></tr>
                                        {topics.filter((t) => t.topic || t.activity).map((t, i) => (
                                            <tr key={i}><td className="w-2/5 border border-black px-1 font-medium">{t.topic}</td><td className="border border-black px-1">{t.activity}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                            <PreviewGrades title="Skills" items={SKILLS} form={form} comments={form.comments} />
                            <PreviewGrades title="Behaviour" items={BEHAV} form={form} />
                            <div className="pt-4 text-center text-xs">
                                RobotiKU<br />{form.report_place}{form.report_date ? `, ${new Date(form.report_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}` : ""}
                                <div className="mt-1 flex justify-center">{sigPath ? <AuthImage path={sigPath} alt="ttd" className="h-14 object-contain" /> : <div className="h-14" />}</div>
                                <div className="mx-auto w-40 border-t border-black pt-0.5 font-medium">Trainer</div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </InternalShell>
    );
}

function Info({ label, value }: { label: string; value: string | null }) {
    return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-medium">{value || "-"}</dd></div>;
}

function GradeRow({ label, value, onChange, error }: { label: string; value: string; onChange: (v: string) => void; error?: string[] }) {
    return (
        <div className="flex items-center justify-between gap-3 border-b py-2 last:border-0">
            <span className="text-sm">{label}{error && <span className="ml-1 text-xs text-red-600">*</span>}</span>
            <div className="flex gap-1">
                {GRADES.map((g) => (
                    <button key={g} type="button" onClick={() => onChange(g)} className={cn("h-8 w-8 rounded-md border text-xs font-bold transition", value === g ? GRADE_ACTIVE[g] : "hover:bg-muted")}>{g}</button>
                ))}
            </div>
        </div>
    );
}

function PreviewGrades({ title, items, form, comments }: { title: string; items: [string, string][]; form: Record<string, string>; comments?: string }) {
    return (
        <table className="w-full border border-black">
            <thead>
                <tr>
                    <td className="border border-black bg-muted text-center font-bold" style={{ width: "45%" }}>{title}</td>
                    <td className="border border-black bg-muted text-center font-bold" colSpan={5}>Grade</td>
                    {comments !== undefined && <td rowSpan={items.length + 2} className="border border-black p-2 align-top text-[11px]" style={{ width: "35%" }}><div className="mb-1 text-center font-bold">Comments</div>{comments}</td>}
                </tr>
                <tr><td className="border border-black" />{GRADES.map((g) => <td key={g} className="border border-black text-center font-bold">{g}</td>)}</tr>
            </thead>
            <tbody>
                {items.map(([k, l]) => <tr key={k}><td className="border border-black text-center">{l}</td>{GRADES.map((g) => <td key={g} className="border border-black text-center">{form[k] === g ? "√" : ""}</td>)}</tr>)}
            </tbody>
        </table>
    );
}